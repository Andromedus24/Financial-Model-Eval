import OpenAI from 'openai';
import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Configure OpenAI client for OpenRouter
const openai = new OpenAI({
  apiKey: config.openrouter.apiKey,
  baseURL: config.openrouter.apiUrl.replace('/chat/completions', ''),
  defaultHeaders: {
    'HTTP-Referer': 'https://financial-analyzer.com',
    'X-Title': 'Financial Analysis App'
  }
});

/**
 * Helper: send a Chat request to OpenRouter (adapted from your research tool)
 * @param {Array} messages - Array of message objects
 * @param {string} model - Model to use
 * @param {number} max_tokens - Maximum tokens
 * @returns {Promise<string>} Response content
 */
export async function openRouterChat(messages, model = 'qwen/qwen3-235b-a22b:free', max_tokens = 200) {
  try {
    const payload = { model, messages, max_tokens };
    const headers = {
      'Authorization': `Bearer ${config.openrouter.apiKey}`,
      'Content-Type': 'application/json'
    };
    const resp = await axios.post(config.openrouter.apiUrl, payload, { headers });
    return resp.data.choices[0].message.content.trim();
  } catch (error) {
    logger.error('OpenRouter chat error:', error);
    throw error;
  }
}

/**
 * Analyzes financial data using OpenRouter's AI models
 * @param {Object} data - Financial data object containing invoices, expenses, etc.
 * @returns {Promise<Object>} Analysis results with forecasts, anomalies, and KPIs
 */
export async function analyzeFinancialData(data) {
  try {
    logger.info('Starting financial data analysis', { dataKeys: Object.keys(data) });
    
    const systemPrompt = `You are "OpenRouter Financial Analyst," an expert AI financial analyst and supply-chain consultant.

Given the following financial dataset in JSON format, perform a comprehensive analysis:

**Required Analysis:**
1. 90-day cash-flow projection with monthly breakdown
2. Identify anomalies or potential fraud indicators in payments/ledger entries
3. Recommend procurement optimizations to reduce working capital usage
4. Compute key KPIs: gross margin, net burn rate, days sales outstanding (DSO), days payable outstanding (DPO)
5. Data validation and error correction recommendations

**Financial Data:**
${JSON.stringify(data, null, 2)}

**Output Format (JSON only):**
{
  "cashFlowForecast": {
    "month1": { "inflow": 0, "outflow": 0, "netFlow": 0, "cumulativeBalance": 0 },
    "month2": { "inflow": 0, "outflow": 0, "netFlow": 0, "cumulativeBalance": 0 },
    "month3": { "inflow": 0, "outflow": 0, "netFlow": 0, "cumulativeBalance": 0 }
  },
  "anomalies": [
    { "entryId": "string", "type": "duplicate|outlier|fraud_risk", "issue": "description", "severity": "low|medium|high" }
  ],
  "procurementSuggestions": [
    { "category": "string", "suggestion": "string", "potentialSavings": 0, "implementation": "string" }
  ],
  "kpis": {
    "grossMargin": 0,
    "netBurnRate": 0,
    "dso": 0,
    "dpo": 0
  },
  "dataQuality": {
    "completeness": 0,
    "accuracy": 0,
    "recommendations": ["string"]
  }
}`;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    const response = await openai.chat.completions.create({
      model: config.openrouter.model,
      messages: messages,
      max_tokens: config.openrouter.maxTokens || 4000,
      temperature: config.openrouter.temperature
    });

    const content = response.choices[0].message.content;
    
    try {
      const analysis = JSON.parse(content);
      logger.info('Financial analysis completed successfully');
      return analysis;
    } catch (parseError) {
      logger.error('Failed to parse LLM response as JSON:', parseError);
      return {
        error: 'Analysis parsing failed',
        rawResponse: content
      };
    }
  } catch (error) {
    logger.error('Financial analysis failed:', error);
    throw error;
  }
}

/**
 * Research financial topics using AI (adapted from your research tool)
 * @param {string} topic - Research topic
 * @param {string} context - Additional context
 * @returns {Promise<string>} Research insights
 */
export async function researchFinancialTopic(topic, context = '') {
  const messages = [
    { role: 'system', content: 'You are a financial research assistant specializing in market analysis, regulatory compliance, and industry trends.' },
    { role: 'user', content: `Research topic: ${topic}\n\nContext: ${context}\n\nProvide comprehensive insights including current trends, regulatory considerations, and practical implications for financial analysis.` }
  ];
  
  return openRouterChat(messages, 'gpt-3.5-turbo', 500);
}

/**
 * Generate financial insights summary
 * @param {string} dataDescription - Description of the financial data
 * @returns {Promise<string>} Summary insights
 */
export async function generateFinancialSummary(dataDescription) {
  const prompt = `Summarize key financial insights from the following data description in 3 bullet points:\n${dataDescription}`;
  return openRouterChat([{ role: 'user', content: prompt }], 'gpt-3.5-turbo', 150);
}