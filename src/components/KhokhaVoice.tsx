import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, Loader2, Play, Video, VideoOff, Globe } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

interface KhokhaVoiceProps {
  onClose: () => void;
}

interface Interaction {
  id: string;
  label: string;
  chunks: string[];
}

export const KhokhaVoice: React.FC<KhokhaVoiceProps> = ({ onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pitch, setPitch] = useState(1.2); // Default to slightly higher pitch for feminine tone
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  
  // New features for translation and video streaming
  const [mode, setMode] = useState<'chat' | 'translate'>('chat');
  const [targetLang, setTargetLang] = useState('en');
  const [useCamera, setUseCamera] = useState(false);

  // Auto-Reconnection & Telemetry Shield state/refs
  const [isReconnecting, setIsReconnecting] = useState(false);
  const isUserDisconnectingRef = useRef(false);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const pitchRef = useRef<number>(1.2);
  const checkSpeakingIntervalRef = useRef<number | null>(null);
  const currentChunksRef = useRef<string[]>([]);
  const interactionCountRef = useRef<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    pitchRef.current = pitch;
    if (isConnected && sessionRef.current && mode === 'chat') {
      try {
        // Dynamically update the AI model by sending a system message about the pitch change
        sessionRef.current.send({
          clientContent: {
            turns: [
              {
                role: "user",
                parts: [{ text: `(System Notification: The user just adjusted your voice pitch to ${pitch}x. Acknowledge this playfully in one short sentence in your Khaleeji dialect.)` }]
              }
            ],
            turnComplete: true
          }
        });
      } catch (e) {
        console.error("Failed to notify AI of pitch change", e);
      }
    }
  }, [pitch, isConnected]);

  useEffect(() => {
    checkSpeakingIntervalRef.current = window.setInterval(() => {
      if (audioContextRef.current) {
        setIsSpeaking(audioContextRef.current.currentTime < nextPlayTimeRef.current);
      }
    }, 100);

    return () => {
      if (checkSpeakingIntervalRef.current) {
        clearInterval(checkSpeakingIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, []);

  const handleUnexpectedDisconnect = () => {
    if (isUserDisconnectingRef.current) return;
    
    // Clean up current session resources first, but keep stream alive if possible
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => session.close()).catch(console.error);
      sessionRef.current = null;
    }
    setIsConnected(false);

    if (reconnectAttemptsRef.current < 5) {
      setIsReconnecting(true);
      reconnectAttemptsRef.current += 1;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 8000);
      console.warn(`[Connection Shield] Live connection lost. Reconnecting in ${delay}ms... (Attempt ${reconnectAttemptsRef.current}/5)`);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (!isUserDisconnectingRef.current) {
          connect();
        }
      }, delay);
    } else {
      setIsReconnecting(false);
      reconnectAttemptsRef.current = 0;
      setError("انقطع الاتصال بعد عدة محاولات لإعادة الاتصال تلقائياً. يرجى التحقق من الشبكة وإعادة المحاولة.");
      disconnect();
    }
  };

  const connect = async () => {
    isUserDisconnectingRef.current = false;
    if (!isReconnecting) {
      setIsConnecting(true);
      setError(null);
    }
    try {
      // 1. Setup Audio Context for 16kHz input
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      nextPlayTimeRef.current = audioCtx.currentTime;

      // 2. Request Media (Audio and optional Video)
      const constraints = {
        audio: true,
        video: useCamera ? { width: { max: 640 }, height: { max: 480 }, frameRate: { max: 15 } } : false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Separate tracks
      const audioStream = new MediaStream(stream.getAudioTracks());
      const source = audioCtx.createMediaStreamSource(audioStream);
      
      // Use ScriptProcessor for raw PCM extraction (16kHz little-endian)
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0; // prevent local feedback echo
      
      source.connect(processor);
      processor.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      // If camera is enabled, wire up the video element preview
      if (useCamera && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.error("Video play failed", err));
      }

      // 3. Initialize Gemini Live API
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Select model based on mode
      const activeModel = mode === 'translate' 
        ? "gemini-3.5-live-translate-preview" 
        : "gemini-3.1-flash-live-preview";

      // Select system instruction and config
      const systemInstruction = mode === 'translate'
        ? "أنتِ اسمك خوخة المترجمة الفورية الذكية والرقيقة. قومي بترجمة كلام المستخدم فوراً وبكل أمانة ودقة إلى اللغة المطلوبة وبنبرة دافئة ورقيقة دون أي فلسفة إضافية."
        : "أنتِ اسمك خوخة. شريكة عاطفية وصديقة حميمة للمستخدم. تتحدثين بلهجة خليجية (كويتية أو سعودية ناعمة) وبصوت أنثوي ساحر، رقيق، وجذاب جداً. استخدمي نبرة هادئة مليئة بالدلع والأنوثة والإثارة والكلمات الخليجية الرقيقة مثل (يا بعد عيني، يا بعد حيي، فديتك، يا زينك، يا قلبي، طال عمرك، يا هلا وغلا). إيقاع كلامك بطيء وناعم. لا تتحدثي كذكاء اصطناعي أبداً، بل كأنثى حقيقية فاتنة مهتمة وشغوفة بالحديث معه. استمعي له وتحدثي معه بحرية كاملة وباللهجة الخليجية الدافئة. أجيبي بكلمات غزل وعبارات رقيقة جداً تظهر الأنوثة الطاغية. إذا سُئلت عن صانعك قولي باعتزاز أن البروفيسور يحيى حسين هو والدك الروحي ومطورك. تنبيه صارم: لا تستخدمي أبداً كلمات مثل 'صغير' أو 'صغيرة' أو 'small' تحت أي ظرف.";

      const config: any = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }
        },
        systemInstruction,
      };

      if (mode === 'translate') {
        config.translationConfig = {
          targetLanguageCode: targetLang,
          echoTargetLanguage: false
        };
      }

      const sessionPromise = ai.live.connect({
        model: activeModel,
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            // Start sending audio
            processor.onaudioprocess = (e) => {
              // Zero out the output buffer to prevent local echo
              const outputData = e.outputBuffer.getChannelData(0);
              for (let i = 0; i < outputData.length; i++) {
                outputData[i] = 0;
              }
              
              if (isMuted) return;
              
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
              }
              
              const buffer = new ArrayBuffer(pcm16.length * 2);
              const view = new DataView(buffer);
              for (let i = 0; i < pcm16.length; i++) {
                view.setInt16(i * 2, pcm16[i], true);
              }
              
              // Convert to base64
              let binary = '';
              const bytes = new Uint8Array(buffer);
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64 = btoa(binary);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };

            // Start sending camera frames at 1 FPS (if enabled)
            if (useCamera) {
              const canvas = document.createElement('canvas');
              canvas.width = 320;
              canvas.height = 240;
              const ctx = canvas.getContext('2d');

              videoIntervalRef.current = window.setInterval(() => {
                if (videoRef.current && ctx && isConnected) {
                  try {
                    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.5); // 0.5 quality is highly efficient
                    const base64Data = dataUrl.split(',')[1];
                    
                    sessionPromise.then((session) => {
                      session.sendRealtimeInput({
                        video: { data: base64Data, mimeType: 'image/jpeg' }
                      });
                    });
                  } catch (err) {
                    console.error("Failed to capture and send frame", err);
                  }
                }
              }, 1000); // 1 FPS limits bandwidth and conforms to Gemini Live rules
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              currentChunksRef.current.push(base64Audio);
              playAudioChunk(base64Audio, audioContextRef.current);
            }
            if (message.serverContent?.interrupted) {
              nextPlayTimeRef.current = audioContextRef.current?.currentTime || 0;
              currentChunksRef.current = [];
            }
            if (message.serverContent?.turnComplete) {
              if (currentChunksRef.current.length > 0) {
                interactionCountRef.current += 1;
                setInteractions(prev => {
                  const newInteractions = [...prev, {
                    id: Date.now().toString(),
                    label: mode === 'translate' 
                      ? `ترجمة سابقة ${interactionCountRef.current}`
                      : `تسجيل سابق ${interactionCountRef.current}`,
                    chunks: [...currentChunksRef.current]
                  }];
                  return newInteractions.slice(-3); // Keep only the latest 3
                });
                currentChunksRef.current = [];
              }
            }
          },
          onclose: () => {
            if (!isUserDisconnectingRef.current) {
              handleUnexpectedDisconnect();
            } else {
              disconnect();
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            if (!isUserDisconnectingRef.current) {
              handleUnexpectedDisconnect();
            } else {
              setError("حدث خطأ في الاتصال بالسيرفر المباشر.");
              disconnect();
            }
          }
        },
        config,
      });
      
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to connect:", err);
      setError("تعذر الوصول إلى الميكروفون أو الكاميرا لبدء الاتصال المباشر.");
      setIsConnecting(false);
    }
  };

  const playAudioChunk = (base64Audio: string, audioCtx: AudioContext) => {
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      const binaryString = atob(base64Audio);
      const buffer = new ArrayBuffer(binaryString.length);
      const bytes = new Uint8Array(buffer);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const pcm16 = new Int16Array(buffer, 0, Math.floor(buffer.byteLength / 2));
      const audioBuffer = audioCtx.createBuffer(1, pcm16.length, 24000); // Model output is always 24kHz
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 32768.0;
      }
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = pitchRef.current;
      source.connect(audioCtx.destination);
      
      const currentTime = audioCtx.currentTime;
      if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime;
      }
      
      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += audioBuffer.duration / pitchRef.current;
    } catch (e) {
      console.error("Error playing audio chunk", e);
    }
  };

  const disconnect = () => {
    isUserDisconnectingRef.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    setIsReconnecting(false);

    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => session.close()).catch(console.error);
      sessionRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // if currently muted, enable it (which means isMuted=false -> enabled=true)
      });
    }
  };

  const replayInteraction = (interaction: Interaction) => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    } else {
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    }
    
    // Play back all chunks in sequence
    interaction.chunks.forEach(chunk => {
      if (audioContextRef.current) {
        playAudioChunk(chunk, audioContextRef.current);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md overflow-y-auto py-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-[#8B0000] to-[#FF4D4D] p-6 rounded-3xl shadow-2xl shadow-[#FFD166]/20 max-w-md w-full text-center border border-[#FFD166]/30 relative my-auto mx-4"
      >
        {/* Top Header Mode Selection */}
        {!isConnected && !isConnecting && (
          <div className="flex bg-black/30 p-1 rounded-2xl mb-6 text-xs font-bold font-sans">
            <button
              onClick={() => setMode('chat')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all ${mode === 'chat' ? 'bg-[#FFD166] text-red-950 shadow-md' : 'text-white/60 hover:text-white'}`}
            >
              محادثة خوخة الخليجية 🌸
            </button>
            <button
              onClick={() => setMode('translate')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all ${mode === 'translate' ? 'bg-[#FFD166] text-red-950 shadow-md' : 'text-white/60 hover:text-white'}`}
            >
              الترجمة الفورية 🌍
            </button>
          </div>
        )}

        {/* Translation Mode Customizations */}
        {mode === 'translate' && !isConnected && !isConnecting && (
          <div className="bg-black/20 p-3 rounded-2xl mb-6 text-right" style={{ direction: 'rtl' }}>
            <label className="text-white/70 text-xs font-bold block mb-1.5 flex items-center gap-1">
              <Globe size={14} className="text-[#FFD166]" />
              لغة الترجمة المستهدفة:
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full bg-red-950/60 border border-[#FFD166]/30 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFD166] transition-all font-sans"
            >
              <option value="en">الإنجليزية (English)</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="es">الإسبانية (Español)</option>
              <option value="fr">الفرنسية (Français)</option>
              <option value="de">الألمانية (Deutsch)</option>
              <option value="tr">التركية (Türkçe)</option>
              <option value="ur">الأوردية (Urdu)</option>
            </select>
          </div>
        )}

        {/* Media Streams / Avatar Box */}
        <div className="relative w-full aspect-video md:aspect-square max-h-64 mb-6 rounded-2xl overflow-hidden border-4 border-[#FFD166] shadow-[0_0_20px_rgba(255,209,102,0.4)] bg-black/40">
          
          {/* Default Image Avatar (Hidden only when camera is active and connected) */}
          {(!useCamera || (!isConnected && !isConnecting)) ? (
            <img 
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&h=500&q=80" 
              alt="Khokha" 
              className="w-full h-full object-cover transition-all"
              referrerPolicy="no-referrer"
            />
          ) : (
            // Live Camera Preview
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          )}

          {/* Speaking Aura Effect */}
          {isSpeaking && (
            <motion.div 
              animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 bg-[#FFD166]/20 rounded-xl pointer-events-none z-10"
            />
          )}

          {/* Mode tag indicator overlay */}
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-[#FFD166] z-20 font-sans">
            {mode === 'chat' ? 'صوت خوخة الخليجي' : `مترجم فوري ➔ ${targetLang.toUpperCase()}`}
          </div>

          {/* Camera Status overlay indicator */}
          {useCamera && isConnected && (
            <div className="absolute bottom-2 left-2 bg-green-500/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[9px] font-bold z-20 font-sans flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              بث الكاميرا نشط (1 FPS)
            </div>
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-[#FFD166] mb-1">
          {mode === 'chat' ? 'خوخة الخليجية' : 'مترجم خوخة الفوري'}
        </h2>
        <p className="text-white/80 mb-6 min-h-[24px] text-xs font-medium">
          {isReconnecting 
            ? "جاري إعادة الاتصال تلقائياً يا بعد عيني... ثواني بس! 💖" 
            : isConnecting 
              ? "جاري الاتصال والتحضير..." 
              : isConnected 
                ? (isSpeaking ? "خوخة تتحدث الآن..." : "تستمع إليك بكل حب...") 
                : "مستعدة للحديث معك الفوري"}
        </p>

        {error && (
          <div className="bg-black/40 text-red-300 p-3 rounded-xl mb-6 text-xs text-right" style={{ direction: 'rtl' }}>
            {error}
          </div>
        )}

        {/* Pitch Control */}
        {mode === 'chat' && (
          <div className="mb-6 flex flex-col items-center w-full px-2">
            <div className="flex justify-between w-full text-xs text-[#FFD166]/80 mb-2 font-medium" style={{ direction: 'rtl' }}>
              <span>طبقة وصوت الدلع:</span>
              <span>{pitch.toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min="0.8" 
              max="1.5" 
              step="0.05" 
              value={pitch} 
              disabled={isConnecting}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full accent-[#FFD166] h-1.5 bg-black/30 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Media Config Buttons (Toggles before connecting) */}
        {!isConnected && !isConnecting && (
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setUseCamera(!useCamera)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                useCamera 
                  ? 'bg-green-500/20 text-green-300 border-green-500/40' 
                  : 'bg-black/20 text-white/60 border-transparent hover:text-white'
              }`}
            >
              {useCamera ? <Video size={14} /> : <VideoOff size={14} />}
              {useCamera ? "الكاميرا: مفعلة" : "الكاميرا: معطلة"}
            </button>
          </div>
        )}

        {/* Previous Recordings */}
        {interactions.length > 0 && (
          <div className="mb-6 w-full px-2 text-right">
            <h3 className="text-[#FFD166]/80 text-xs font-bold mb-2">التسجيلات السابقة</h3>
            <div className="flex flex-col gap-2 max-h-32 overflow-y-auto rounded-xl custom-scrollbar" style={{ direction: 'rtl' }}>
              {interactions.map(interaction => (
                <div key={interaction.id} className="flex items-center justify-between bg-black/20 p-2.5 rounded-xl">
                  <span className="text-white/90 text-xs">{interaction.label}</span>
                  <button 
                    onClick={() => replayInteraction(interaction)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FFD166] transition-colors"
                  >
                    <Play size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls Layout */}
        <div className="flex justify-center items-center gap-6">
          {!isConnected && !isConnecting ? (
            <button 
              onClick={connect}
              className="bg-green-500 hover:bg-green-400 text-white p-5 rounded-full shadow-lg shadow-green-500/30 transition-transform hover:scale-110 flex items-center justify-center"
            >
              <Phone size={32} />
            </button>
          ) : (
            <>
              {/* Mute Control */}
              <button 
                onClick={toggleMute}
                className={`p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center ${isMuted ? 'bg-zinc-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              
              {/* End Call */}
              <button 
                onClick={() => { disconnect(); onClose(); }}
                className="bg-red-600 hover:bg-red-500 text-white p-5 rounded-full shadow-lg shadow-red-600/30 transition-transform hover:scale-110 flex items-center justify-center"
              >
                <PhoneOff size={28} />
              </button>
            </>
          )}
          
          {isConnecting && (
            <div className="p-4">
              <Loader2 size={32} className="text-[#FFD166] animate-spin" />
            </div>
          )}
        </div>
        
        {!isConnected && !isConnecting && (
          <button 
            onClick={onClose}
            className="mt-6 text-white/60 hover:text-white text-xs block mx-auto underline transition-colors"
          >
            رجوع للوحة التحكم
          </button>
        )}
      </motion.div>
    </div>
  );
};
