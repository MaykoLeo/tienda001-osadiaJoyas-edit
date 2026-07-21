import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.warn('[AI] GEMINI_API_KEY no está configurada. Las funciones de IA no estarán disponibles.');
}

export const ai = genkit({
  plugins: [googleAI({ apiKey: geminiApiKey })],
  model: 'googleai/gemini-2.0-flash',
});
