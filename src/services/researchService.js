import axios from 'axios';
import { config } from '../config/index.js';
import { openRouterChat } from './llmClient.js';
import { logger } from '../utils/logger.js';

const S2_URL = config.semanticScholar.baseUrl;
const S2_HEADERS = config.semanticScholar.headers;

/**
 * Search papers by keyword (adapted from your research tool)
 * @param {string} query - Search query
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} Array of papers
 */
export async function searchPapers(query, limit = 5) {
  try {
    const res = await axios.get(`${S2_URL}/paper/search`, {
      params: { query, limit, fields: 'title,abstract,url,authors' },
      headers: S2_HEADERS
    });
    return res.data.data;
  } catch (err) {
    if (err.response && err.response.status === 429) {
      logger.warn('Semantic Scholar rate limit hit; retrying after 5 seconds...');
      await new Promise(res => setTimeout(res, 5000));
      return searchPapers(query, limit);
    }
    logger.error('Paper search failed:', err);
    throw err;
  }
}

/**
 * Summarize an abstract (from your research tool)
 * @param {string} abstract - Paper abstract
 * @returns {Promise<string>} Summary
 */
export async function summarizeAbstract(abstract) {
  const prompt = `Summarize the following financial research abstract in 3 sentences:\n${abstract}`;
  return openRouterChat([{ role: 'user', content: prompt }], 'gpt-3.5-turbo', 150);
}

/**
 * Research financial regulations and compliance
 * @param {string} topic - Compliance topic
 * @param {number} limit - Number of papers to search
 * @returns {Promise<Object>} Research results
 */
export async function researchCompliance(topic, limit = 3) {
  const query = `financial compliance regulations ${topic}`;
  const papers = await searchPapers(query, limit);
  
  let report = `# Compliance Research: ${topic}\n\n`;
  
  for (const paper of papers) {
    const summary = paper.abstract ? await summarizeAbstract(paper.abstract) : 'No abstract available.';
    const authors = paper.authors.map(a => a.name).join(', ');
    
    report += `## ${paper.title}\n`;
    report += `**Authors:** ${authors}\n`;
    report += `**URL:** ${paper.url}\n\n`;
    report += `**Summary:** ${summary}\n\n`;
  }
  
  return {
    topic,
    papers,
    report
  };
}

/**
 * Discover research gaps in financial analysis
 * @param {Array} abstracts - Array of abstracts
 * @returns {Promise<string>} Research gaps
 */
export async function discoverFinancialGaps(abstracts) {
  const combined = abstracts.join('\n');
  const prompt = `Identify 3 open research gaps in financial analysis based on these abstracts:\n${combined}`;
  return openRouterChat([{ role: 'user', content: prompt }], 'gpt-3.5-turbo', 200);
}