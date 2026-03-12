import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({apiKey: 'YOUR_GEMINI_API_KEY'})],
  model: 'googleai/gemini-2.0-flash',
});
