
'use server';
import { config } from 'dotenv';
config();

import '@/ai/genkit';
import '@/ai/prompts/diagnosis-prompt.ts';
import '@/ai/flows/ai-assisted-diagnosis.ts';
import '@/ai/flows/summarize-reports.ts';
import '@/ai/flows/generate-structured-report.ts';
import '@/ai/flows/get-ai-segmentation.ts';
import '@/ai/flows/save-final-report.ts';
import '@/ai/flows/lookup-radiology-term.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/services/imaios.ts';
import '@/services/openi.ts';
import '@/services/xnat.ts';
import '@/ai/tools/find-case-examples.ts';
import '@/services/monai.ts';


