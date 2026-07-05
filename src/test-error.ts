import { VoiceConfig } from "@google/genai";
type PrebuiltVoiceConfigKeys = keyof NonNullable<VoiceConfig['prebuiltVoiceConfig']>;
const test: PrebuiltVoiceConfigKeys = "invalid_key_to_see_error";
