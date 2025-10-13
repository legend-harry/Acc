
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-spending-insights.ts';
import '@/ai/flows/import-data-and-suggest-categories.ts';
import '@/ai/flows/extract-transaction-details.ts';

