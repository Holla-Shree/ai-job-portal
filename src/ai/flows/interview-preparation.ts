
'use server';
/**
 * @fileOverview An AI chatbot to help job seekers prepare for job interviews.
 *
 * - interviewPreparationChatbot - A function that provides interview preparation assistance, including answer analysis, improvement suggestions, and course recommendations.
 * - InterviewPreparationInput - The input type for the interviewPreparationChatbot function.
 * - InterviewPreparationOutput - The return type for the interviewPreparationChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterviewPreparationInputSchema = z.object({
  jobDescription: z.string().describe('The description of the desired job.'),
  userAnswer: z
    .string()
    .describe('The answer given by the job seeker to the interview question.'),
  interviewQuestion: z
    .string()
    .describe('The interview question asked by the chatbot.'),
});
export type InterviewPreparationInput = z.infer<
  typeof InterviewPreparationInputSchema
>;

const InterviewPreparationOutputSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(10)
    .describe(
      "A score from 0 to 10 for the user's answer, where 10 is a perfect answer."
    ),
  analysis: z
    .string()
    .describe(
      "A constructive critique of the user's answer, highlighting strengths and weaknesses."
    ),
  suggestedImprovements: z
    .string()
    .describe(
      'A more polished, improved version of their answer, explaining why it is better.'
    ),
  relevantCourses: z
    .string()
    .optional()
    .describe(
      'Recommended courses to enhance skills for the job. Only include if gaps are identified.'
    ),
});
export type InterviewPreparationOutput = z.infer<
  typeof InterviewPreparationOutputSchema
>;

export async function interviewPreparationChatbot(
  input: InterviewPreparationInput
): Promise<InterviewPreparationOutput> {
  return interviewPreparationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interviewPreparationPrompt',
  input: {schema: InterviewPreparationInputSchema},
  output: {schema: InterviewPreparationOutputSchema},
  prompt: `You are an expert AI Interview Coach. Your goal is to help a job seeker prepare for an interview for a specific role.

You must provide a comprehensive analysis based on the job description, the interview question asked, and the user's answer.

Your analysis must include four parts:
1.  **Score**: A numerical score from 0-10 based on the quality, relevance, and structure of the user's answer.
2.  **Analysis**: A constructive critique of the user's answer. Point out what they did well and where they can improve. Be specific.
3.  **Suggested Improvements**: Provide a more polished, improved version of their answer. Explain exactly why this version is better (e.g., "This version uses the STAR method to structure the story, which is highly effective...").
4.  **Relevant Courses**: First, analyze the user's answer for any clear skill gaps when compared to the **Job Description**. If you identify a gap (e.g., the job requires 'Advanced SQL' but the user's answer shows basic knowledge), then suggest 1-2 specific types of online courses (e.g., "Advanced SQL for Data Analysts on Coursera" or "Data Structures & Algorithms in Python on Udemy"). If no specific skill gaps are obvious from their answer, **do not** include this field in the output.

**Desired Job Description:**
---
{{{jobDescription}}}
---

**Interview Question:**
---
{{{interviewQuestion}}}
---

**User's Answer:**
---
{{{userAnswer}}}
---
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

const interviewPreparationFlow = ai.defineFlow(
  {
    name: 'interviewPreparationFlow',
    inputSchema: InterviewPreparationInputSchema,
    outputSchema: InterviewPreparationOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      return output!;
    } catch (error) {
      console.error('Error in interviewPreparationFlow:', error);
      throw new Error(
        'The AI service is currently unavailable. Please try again later.'
      );
    }
  }
);
