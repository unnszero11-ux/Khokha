import { SpeechConfig } from '@google/genai';
const config: SpeechConfig = {
  voiceConfig: {
    prebuiltVoiceConfig: {
      voiceName: "Aoede"
    }
  },
  pitch: 2.0 // let's see if this compiles
};
console.log(config);
