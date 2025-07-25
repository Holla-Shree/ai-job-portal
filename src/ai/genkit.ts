
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import "firebase-admin";


if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
