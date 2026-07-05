import { SpeechConfig } from "@google/genai";
type Mapped = { [K in keyof SpeechConfig]: K };
const test: Mapped = { invalid: "invalid" };
