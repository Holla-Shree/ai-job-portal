'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/job-recommendations.ts';
import '@/ai/flows/interview-preparation.ts';
import '@/ai/flows/resume-analyzer.ts';
import '@/ai/flows/job-description-generator.ts';
import '@/ai/flows/candidate-screener.ts';
import '@/ai/flows/question-generator.ts';
