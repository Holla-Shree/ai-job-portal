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
  analysis: z.string().describe("Analysis of the job seeker's answer."),
  suggestedImprovements: z
    .string()
    .describe('Suggestions for improving the answer.'),
  relevantCourses: z
    .string()
    .describe('Recommended courses to enhance skills for the job.'),
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

Based on the job description, the interview question asked, and the user's answer, you will provide a comprehensive analysis.

Your analysis must include three parts:
1.  **Analysis**: A constructive critique of the user's answer. Point out strengths and weaknesses.
2.  **Suggested Improvements**: Provide a more polished, improved version of their answer. Explain why it's better.
3.  **Relevant Courses**: Based on the job description and any gaps identified in the user's answer, suggest 2-3 specific types of online courses or certifications that would help them become a stronger candidate (e.g., "Advanced Python for Data Science on Coursera", "Certified ScrumMaster (CSM)").

**Desired Job Description:**
{{{jobDescription}}}

**Interview Question:**
{{{interviewQuestion}}}

**User's Answer:**
{{{userAnswer}}}
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
