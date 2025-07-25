
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
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';


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
  score: z
    .number()
    .min(0)
    .max(100)
    .describe(
      'A numerical score from 0 to 100 representing the candidate-job fit. 100 is a perfect match.'
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
  prompt: `You are an expert, unbiased Senior Technical Recruiter. Your task is to perform a deep, semantic evaluation of a candidate's profile against a given job description. Go beyond simple keyword matching and analyze the underlying skills, experience level, and responsibilities.

Based on your semantic evaluation, you will provide:
1.  **Match Strength**: A clear assessment (Strong Match, Good Match, Weak Match, or Not a Fit).
2.  **Score**: A numerical score from 0 to 100, where 100 is a perfect match. A "Strong Match" should be > 85, "Good Match" between 70-85, "Weak Match" between 50-69, and "Not a Fit" < 50.
3.  **Rationale**: A detailed, balanced explanation for your assessment. Mention specific skills or experiences from the candidate's profile that align with the job description, and also areas where they might be lacking.
4.  **Missing Qualifications**: A list of key qualifications from the job description that are not clearly present in the candidate's profile.

**Job Description:**
---
{{{jobDescription}}}
---

**Candidate's Profile / Resume:**
---
{{{candidateProfile}}}
---

Perform the semantic evaluation now.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
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
    try {
      const {output} = await prompt(input);
      return output!;
    } catch (error) {
      console.error('Error in screenCandidateFlow:', error);
      // Fallback for when the AI fails, to avoid breaking the whole loop
      return {
        matchStrength: 'Not a Fit',
        score: 0,
        rationale: 'The AI was unable to process this candidate profile. This may be due to formatting issues or network errors.',
        missingQualifications: ['Unable to determine due to processing error.'],
      };
    }
  }
);
