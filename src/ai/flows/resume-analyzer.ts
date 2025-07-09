'use server';

/**
 * @fileOverview Resume analysis flow to extract relevant information from resumes.
 *
 * - analyzeResume - A function that handles the resume analysis process.
 * - AnalyzeResumeInput - The input type for the analyzeResume function.
 * - AnalyzeResumeOutput - The return type for the analyzeResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeResumeInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "A resume file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeResumeInput = z.infer<typeof AnalyzeResumeInputSchema>;

const AnalyzeResumeOutputSchema = z.object({
  skills: z
    .array(z.string())
    .describe('A list of skills extracted from the resume.'),
  experience: z
    .array(z.string())
    .describe('A list of job experiences extracted from the resume.'),
  education: z
    .array(z.string())
    .describe('A list of educations extracted from the resume.'),
  summary: z
    .string()
    .describe(
      'A concise, professional summary of the candidate profile, excluding all personal identifiable information (PII) like name, email, phone number, or address.'
    ),
});
export type AnalyzeResumeOutput = z.infer<typeof AnalyzeResumeOutputSchema>;

export async function analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
  return analyzeResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeResumePrompt',
  input: {schema: AnalyzeResumeInputSchema},
  output: {schema: AnalyzeResumeOutputSchema},
  prompt: `You are an expert resume analyzer with a strong focus on privacy and bias reduction. Your job is to extract key professional information from the resume provided and create an anonymized summary.

  When analyzing the resume, you MUST:
  1. Extract the candidate's skills, professional experience, and education history.
  2. Create a concise, professional summary of the candidate's profile.
  3. **Crucially, you MUST OMIT all Personally Identifiable Information (PII).** This includes, but is not limited to: the candidate's name, phone number, email address, physical address, and links to personal profiles (like LinkedIn or GitHub). The goal is to create a profile that can be evaluated purely on merit.

  Analyze the following resume: {{media url=resumeDataUri}}
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

const analyzeResumeFlow = ai.defineFlow(
  {
    name: 'analyzeResumeFlow',
    inputSchema: AnalyzeResumeInputSchema,
    outputSchema: AnalyzeResumeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
