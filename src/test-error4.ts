import { VoiceConfig } from "@google/genai";
type Check<T> = T extends any ? keyof T : never;
const test: Check<VoiceConfig> = "invalid";
