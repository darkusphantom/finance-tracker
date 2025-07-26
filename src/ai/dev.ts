import { config } from 'dotenv';
config();

import '@/ai/flows/categorize-transaction.ts';
import '@/ai/flows/extract-transaction-from-image.ts';
import '@/ai/flows/financial-chat-flow.ts';
import '@/ai/flows/risk-profile-flow.ts';
