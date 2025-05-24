import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['OPENROUTER_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Load Semantic Scholar API key (optional for higher rate limits)
const S2_API_KEY = process.env.S2_API_KEY || '';
if (!S2_API_KEY) {
  console.warn('ℹ️ No Semantic Scholar API key set; using public rate-limited endpoints.');
}

export const config = {
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    apiUrl: process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
    model: 'qwen/qwen3-235b-a22b:free',
    maxTokens: null,
    temperature: 0.1
  },
  semanticScholar: {
    apiKey: S2_API_KEY,
    baseUrl: 'https://api.semanticscholar.org/graph/v1',
    headers: S2_API_KEY ? { 'x-api-key': S2_API_KEY } : {}
  },
  server: {
    port: parseInt(process.env.PORT) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['text/csv', 'application/json', 'text/plain']
  }
};