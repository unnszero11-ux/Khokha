import { VoiceConfig } from "@google/genai";
type PrebuiltVoiceConfigKeys = keyof NonNullable<VoiceConfig['prebuiltVoiceConfig']>;
const test: PrebuiltVoiceConfigKeys = "voiceName"; // Only a type check
console.log(test);
