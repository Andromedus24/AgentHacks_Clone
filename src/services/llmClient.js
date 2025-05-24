import OpenAI from 'openai';
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
    "burnRate": 0,
    "DSO": 0,
    "DPO": 0,
    "currentRatio": 0,
    "quickRatio": 0
  },
  "dataQuality": {
    "completeness": 0,
    "accuracy": 0,
    "issues": ["string"],
    "recommendations": ["string"]
  },
  "summary": "Executive summary of findings and recommendations"
}`;

    const response = await openai.chat.completions.create({
      model: config.openrouter.model,
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      max_tokens: config.openrouter.maxTokens,
      temperature: config.openrouter.temperature,
      response_format: { type: 'json_object' }
    });

    const analysisResult = JSON.parse(response.choices[0].message.content);
    
    logger.info('Financial analysis completed successfully');
    return analysisResult;
    
  } catch (error) {
    logger.error('Error in financial data analysis:', error);
    
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a few moments.');
    } else if (error.status === 401) {
      throw new Error('Invalid API key. Please check your OpenRouter configuration.');
    } else if (error.status >= 500) {
      throw new Error('OpenRouter service temporarily unavailable. Please try again later.');
    } else {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }
}

/**
 * Retry wrapper with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise} Result of the function
 */
export async function retryWithBackoff(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || error.status === 401) {
        throw error;
      }
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, { error: error.message });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}