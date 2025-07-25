
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
  anonymizedSummary: z
    .string()
    .describe(
      'A concise, professional summary of the candidate profile, excluding all personal identifiable information (PII) like name, email, phone number, or address.'
    ),
  skills: z
    .array(z.string())
    .describe('A list of all skills (programming languages, frameworks, tools, soft skills) extracted from the resume.'),
  experience: z
    .array(z.object({
      jobTitle: z.string(),
      company: z.string(),
      duration: z.string(),
      responsibilities: z.array(z.string()),
    }))
    .describe('A list of job experiences extracted from the resume.'),
  education: z
    .array(z.object({
      degree: z.string(),
      fieldOfStudy: z.string(),
      institution: z.string(),
      graduationYear: z.string().optional(),
    }))
    .describe('A list of educations extracted from the resume.'),
  projects: z
    .array(z.object({
      title: z.string(),
      description: z.string(),
      technologies: z.array(z.string()),
    }))
    .describe('A list of projects extracted from the resume.'),
  certifications: z.array(z.string()).describe('A list of certifications extracted from the resume.'),
});
export type AnalyzeResumeOutput = z.infer<typeof AnalyzeResumeOutputSchema>;

export async function analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('The GEMINI_API_KEY environment variable is not set. Please add it to your .env file.');
  }
  return analyzeResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeResumePrompt',
  input: {schema: AnalyzeResumeInputSchema},
  output: {schema: AnalyzeResumeOutputSchema},
  prompt: `You are an expert resume analyzer with an extremely strong focus on privacy and bias reduction. Your job is to extract key professional information from the resume provided and create a detailed, structured, and anonymized profile.

  **CRITICAL Anonymization Rules:**
  You MUST OMIT ALL of the following Personally Identifiable Information (PII). This is a strict requirement.
  - Full Name
  - Contact details (Phone number, Email address)
  - Granular address or location details (City/State is acceptable if relevant, but not street addresses)
  - Date of Birth
  - Links to personal profiles (LinkedIn, GitHub, personal websites, etc.)
  - Photographs
  - Names of references or their contact information

  **Extraction Task:**
  From the resume, you must extract the following information into the specified structured format.

  - **Anonymized Summary**: Create a concise, professional summary of the candidate's profile. This summary MUST be anonymous and free of any PII listed above.
  - **Skills**: Extract all technical skills (programming languages, frameworks, tools) and relevant soft skills.
  - **Experience**: For each job, extract the job title, company, duration, and a list of key responsibilities or achievements.
  - **Education**: For each degree, extract the degree name, field of study, institution, and graduation year.
  - **Projects**: Extract key personal or academic projects, including their title, a brief description, and the technologies used.
  - **Certifications**: List all professional certifications mentioned.

  Analyze the following resume: {{media url=resumeDataUri}}`,
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
    try {
      const {output} = await prompt(input);
      return output!;
    } catch (error) {
      console.error('Error in analyzeResumeFlow:', error);
      throw new Error(
        'The AI service is currently unavailable. Please try again later.'
      );
    }
  }
);
