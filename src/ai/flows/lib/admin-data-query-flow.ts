
/**
 * @fileOverview An AI agent to help admins query system data.
 * This file defines the Genkit flow, tools, and prompts.
 *
 * - adminDataQueryFlow - The Genkit flow that answers questions about system metrics.
 * - AdminDataQueryInput - The input type for the adminDataQuery function.
 * - AdminDataQueryOutput - The return type for the adminDataQuery function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Mock Data - In a real application, this would come from a database.
const MOCK_SYSTEM_DATA = {
    totalUsers: 134,
    totalJobs: 78,
    totalApplications: 452,
    resumesParsed: 215,
    aiUsage: [
        { service: 'Resume Parsing', count: 215 },
        { service: 'Job Recommendations', count: 350 },
        { service: 'Candidate Screening', count: 880 },
        { service: 'Interview Chatbot', count: 1200 },
    ],
    userGrowth: [
        { month: 'January', users: 12 },
        { month: 'February', users: 25 },
        { month: 'March', users: 41 },
        { month: 'April', users: 68 },
        { month: 'May', users: 99 },
        { month: 'June', users: 134 },
    ],
};

const getSystemMetrics = ai.defineTool(
  {
    name: 'getSystemMetrics',
    description: 'Retrieves current system metrics and statistics for the platform.',
    inputSchema: z.object({
        metric: z.enum([
            "totalUsers",
            "totalJobs",
            "totalApplications",
            "resumesParsed",
            "aiUsage",
            "userGrowth",
            "all"
        ]).describe("The specific metric to retrieve."),
    }),
    outputSchema: z.any().describe("The value of the requested metric. This could be a number, a string, or an array of objects."),
  },
  async (input) => {
    // In a real app, you would query your database here based on the input.
    // For now, we return data from our mock object.
    if (input.metric === "all") {
        return MOCK_SYSTEM_DATA;
    }
    return MOCK_SYSTEM_DATA[input.metric as keyof typeof MOCK_SYSTEM_DATA];
  }
);


export const AdminDataQueryInputSchema = z.object({
  query: z.string().describe('The natural language query from the admin.'),
});
export type AdminDataQueryInput = z.infer<typeof AdminDataQueryInputSchema>;

export const AdminDataQueryOutputSchema = z.object({
  answer: z.string().describe('The summarized answer to the admin query.'),
});
export type AdminDataQueryOutput = z.infer<typeof AdminDataQueryOutputSchema>;


export const adminDataQueryFlow = ai.defineFlow(
  {
    name: 'adminDataQueryFlow',
    inputSchema: AdminDataQueryInputSchema,
    outputSchema: AdminDataQueryOutputSchema,
  },
  async (input) => {
    if (!process.env.GEMINI_API_KEY) {
        return {
            answer: "I'm sorry, but the AI assistant is not configured. Please set the GEMINI_API_KEY in your environment variables to enable this feature. I can still provide some mock data if you ask for specific metrics like 'total users'."
        };
    }
    try {
        const llmResponse = await ai.generate({
          prompt: input.query,
          model: 'googleai/gemini-2.0-flash',
          tools: [getSystemMetrics],
          system: `You are an AI assistant for the admin of the JobMatch AI platform.
          Your role is to answer questions about the platform's usage and metrics.
          Use the getSystemMetrics tool to find the data you need to answer the user's question.
          Provide concise, clear answers. If the user asks for a comparison, calculate it.
          For example, if asked for the most used AI service, find the service with the highest count and state it clearly.
          Always present the data in a friendly, human-readable format.
          If you don't have the data, say so politely.`,
        });

        return { answer: llmResponse.text };
    } catch (error) {
        console.error('Error in adminDataQueryFlow:', error);
        return {
            answer: "I'm sorry, but I was unable to process your request at this time. The AI service may be temporarily unavailable. Please try again in a few moments."
        };
    }
  }
);
