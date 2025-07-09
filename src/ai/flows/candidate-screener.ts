'use server';
/**
 * @fileOverview An AI agent to help recruiters screen candidates.
 *
 * - screenCandidate - A function that evaluates a candidate's profile against a job description.
 * - ScreenCandidateInput - The input type for the screenCandidate function.
 * - ScreenCandidateOutput - The return type for the screenCandidate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScreenCandidateInputSchema = z.object({
  jobDescription: z.string().describe('The full text of the job description.'),
  candidateProfile: z
    .string()
    .describe("The candidate's resume or anonymized profile text."),
});
export type ScreenCandidateInput = z.infer<typeof ScreenCandidateInputSchema>;

const ScreenCandidateOutputSchema = z.object({
  matchStrength: z
    .enum(['Strong Match', 'Good Match', 'Weak Match', 'Not a Fit'])
    .describe(
      'An assessment of how well the candidate matches the job requirements.'
    ),
  rationale: z
    .string()
    .describe(
      "A detailed, point-by-point explanation for the match assessment, highlighting the candidate's strengths and weaknesses relative to the role."
    ),
  missingQualifications: z
    .array(z.string())
    .describe(
      'A list of key qualifications from the job description that appear to be missing from the candidate profile.'
    ),
});
export type ScreenCandidateOutput = z.infer<typeof ScreenCandidateOutputSchema>;

export async function screenCandidate(
  input: ScreenCandidateInput
): Promise<ScreenCandidateOutput> {
  return screenCandidateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'screenCandidatePrompt',
  input: {schema: ScreenCandidateInputSchema},
  output: {schema: ScreenCandidateOutputSchema},
  prompt: `You are an expert, unbiased Senior Technical Recruiter. Your task is to objectively evaluate a candidate's profile against a given job description. Your analysis must be based solely on the provided texts.

You will provide:
1.  **Match Strength**: A clear assessment (Strong Match, Good Match, Weak Match, or Not a Fit).
2.  **Rationale**: A detailed, balanced explanation for your assessment. Mention specific skills or experiences from the candidate's profile that align with the job description, and also areas where they might be lacking.
3.  **Missing Qualifications**: A list of key qualifications or requirements from the job description that are not clearly present in the candidate's profile.

**Job Description:**
---
{{{jobDescription}}}
---

**Candidate's Profile / Resume:**
---
{{{candidateProfile}}}
---

Perform the evaluation now.`,
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

const screenCandidateFlow = ai.defineFlow(
  {
    name: 'screenCandidateFlow',
    inputSchema: ScreenCandidateInputSchema,
    outputSchema: ScreenCandidateOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
