
'use server';
/**
 * @fileOverview An AI agent to help recruiters generate job descriptions.
 *
 * - generateJobDescription - A function that generates a job description based on a title and notes.
 * - GenerateJobDescriptionInput - The input type for the generateJobDescription function.
 * - GenerateJobDescriptionOutput - The return type for the generateJobDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateJobDescriptionInputSchema = z.object({
  jobTitle: z.string().describe('The job title for the position.'),
  notes: z
    .string()
    .optional()
    .describe(
      'Optional notes, keywords, or key responsibilities to include in the description.'
    ),
});
export type GenerateJobDescriptionInput = z.infer<
  typeof GenerateJobDescriptionInputSchema
>;

const GenerateJobDescriptionOutputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The full, professionally written job description.'),
});
export type GenerateJobDescriptionOutput = z.infer<
  typeof GenerateJobDescriptionOutputSchema
>;

export async function generateJobDescription(
  input: GenerateJobDescriptionInput
): Promise<GenerateJobDescriptionOutput> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('The GEMINI_API_KEY environment variable is not set. Please add it to your .env file.');
  }
  return generateJobDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJobDescriptionPrompt',
  input: {schema: GenerateJobDescriptionInputSchema},
  output: {schema: GenerateJobDescriptionOutputSchema},
  prompt: `You are an expert Senior Recruiter and Hiring Manager. Your task is to write a clear, concise, and compelling job description based on a job title and optional notes.

The job description should be well-structured and include the following sections:
- A brief, engaging introduction to the role and company.
- A "Key Responsibilities" section with a bulleted list.
- A "Qualifications" section with a bulleted list of required and preferred skills.
- A concluding paragraph about the company culture or benefits.

Use inclusive language to attract a diverse range of qualified candidates. Avoid jargon where possible.

**Job Title:**
{{{jobTitle}}}

{{#if notes}}
**Additional Notes/Keywords:**
{{{notes}}}
{{/if}}

Generate the full job description.
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
});

const generateJobDescriptionFlow = ai.defineFlow(
  {
    name: 'generateJobDescriptionFlow',
    inputSchema: GenerateJobDescriptionInputSchema,
    outputSchema: GenerateJobDescriptionOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      return output!;
    } catch (error) {
      console.error('Error in generateJobDescriptionFlow:', error);
      throw new Error(
        'The AI service is currently unavailable. Please try again later.'
      );
    }
  }
);
