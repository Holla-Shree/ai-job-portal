// 'use server';
/**
 * @fileOverview An AI chatbot to help job seekers prepare for job interviews.
 *
 * - interviewPreparationChatbot - A function that provides interview preparation assistance.
 * - InterviewPreparationInput - The input type for the interviewPreparationChatbot function.
 * - InterviewPreparationOutput - The return type for the interviewPreparationChatbot function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterviewPreparationInputSchema = z.object({
  jobDescription: z.string().describe('The description of the desired job.'),
  userAnswer: z.string().describe('The answer given by the job seeker to the interview question.'),
  interviewQuestion: z.string().describe('The interview question asked by the chatbot.'),
});
export type InterviewPreparationInput = z.infer<typeof InterviewPreparationInputSchema>;

const InterviewPreparationOutputSchema = z.object({
  analysis: z.string().describe('Analysis of the job seeker\'s answer.'),
  suggestedImprovements: z.string().describe('Suggestions for improving the answer.'),
  relevantCourses: z.string().describe('Recommended courses to enhance skills for the job.'),
});
export type InterviewPreparationOutput = z.infer<typeof InterviewPreparationOutputSchema>;

export async function interviewPreparationChatbot(
  input: InterviewPreparationInput
): Promise<InterviewPreparationOutput> {
  return interviewPreparationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interviewPreparationPrompt',
  input: {schema: InterviewPreparationInputSchema},
  output: {schema: InterviewPreparationOutputSchema},
  prompt: `You are an AI chatbot helping job seekers prepare for interviews.

You will ask the job seeker one question at a time, analyze their answer, suggest improvements, and recommend relevant courses to enhance their skills.

Desired Job Description: {{{jobDescription}}}

User's Answer: {{{userAnswer}}}

Interview Question: {{{interviewQuestion}}}

Analysis and Suggestions:`, // Removed course suggestions since they are not feasible without tools/DB
});

const interviewPreparationFlow = ai.defineFlow(
  {
    name: 'interviewPreparationFlow',
    inputSchema: InterviewPreparationInputSchema,
    outputSchema: InterviewPreparationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
