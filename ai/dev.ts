
'use server';
import { config } from 'dotenv';
config();

import '@/ai/genkit';
import '@/ai/prompts/diagnosis-prompt.ts';
import '@/ai/flows/ai-assisted-diagnosis.ts';
import '@/ai/flows/gpt-oss-diagnosis.ts';
import '@/ai/flows/chat.ts';
import '@/ai/flows/summarize-reports.ts';
import '@/ai/flows/generate-structured-report.ts';
import '@/ai/flows/lookup-radiology-term.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/quality-assurance.ts';
import '@/ai/flows/get-ai-segmentation.ts';
import '@/services/imaios.ts';
import '@/services/openi.ts';
import '@/services/xnat.ts';
import '@/services/tcia.ts';
import '@/services/monai.ts';
import '@/services/radiopaedia-knowledge-base.ts';
import '@/services/knowledge-base-db.ts';
import '@/services/gpt-oss-integration.ts';
import '@/ai/tools/find-case-examples.ts';
import '@/lib/medical-errors.ts';
import '@/lib/performance-monitoring.ts';
import '@/lib/conversation-memory.ts';
import '@/lib/report-validation.ts';
