
'use server';
/**
 * @fileOverview An AI agent to generate relevant interview questions.
 *
 * - generateInterviewQuestions - A function that creates interview questions based on a job description.
 * - GenerateInterviewQuestionsInput - The input type for the generateInterviewQuestions function.
 * - GenerateInterviewQuestionsOutput - The return type for the generateInterviewQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInterviewQuestionsInputSchema = z.object({
  jobDescription: z.string().describe('The full text of the job description.'),
});
export type GenerateInterviewQuestionsInput = z.infer<
  typeof GenerateInterviewQuestionsInputSchema
>;

const GenerateInterviewQuestionsOutputSchema = z.object({
  questions: z
    .array(z.string())
    .describe(
      'A list of 5-7 relevant interview questions based on the job description.'
    ),
});
export type GenerateInterviewQuestionsOutput = z.infer<
  typeof GenerateInterviewQuestionsOutputSchema
>;

export async function generateInterviewQuestions(
  input: GenerateInterviewQuestionsInput
): Promise<GenerateInterviewQuestionsOutput> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('The GEMINI_API_KEY environment variable is not set. Please add it to your .env file.');
  }
  return generateInterviewQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInterviewQuestionsPrompt',
  input: {schema: GenerateInterviewQuestionsInputSchema},
  output: {schema: GenerateInterviewQuestionsOutputSchema},
  prompt: `You are an expert Hiring Manager and Interviewer. Your task is to generate a list of 5-7 insightful interview questions based on the provided job description.

The questions should cover a range of topics, including:
- Technical skills and experience relevant to the role.
- Behavioral questions to assess soft skills and cultural fit.
- Situational questions ("Tell me about a time when...") to gauge problem-solving abilities.

**Job Description:**
---
{{{jobDescription}}}
---

Generate the list of questions now.`,
});

const generateInterviewQuestionsFlow = ai.defineFlow(
  {
    name: 'generateInterviewQuestionsFlow',
    inputSchema: GenerateInterviewQuestionsInputSchema,
    outputSchema: GenerateInterviewQuestionsOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      return output!;
    } catch (error) {
      console.error('Error in generateInterviewQuestionsFlow:', error);
      throw new Error(
        'The AI service is currently unavailable. Please try again later.'
      );
    }
  }
);
