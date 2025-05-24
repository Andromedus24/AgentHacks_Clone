import { parse } from 'csv-parse/sync';
import { logger } from '../utils/logger.js';

/**
 * Parses CSV data into JSON format
 * @param {Buffer|string} csvData - CSV data to parse
 * @returns {Array} Parsed data array
 */
export function parseCSV(csvData) {
  try {
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: true,
      cast_date: true
    });
    
    logger.info(`Successfully parsed CSV with ${records.length} records`);
    return records;
  } catch (error) {
    logger.error('CSV parsing error:', error);
    throw new Error(`Invalid CSV format: ${error.message}`);
  }
}

/**
 * Normalizes various input formats into a standard financial data structure
 * @param {*} input - Input data (JSON string, object, or array)
 * @returns {Object} Normalized financial data object
 */
export function normalizeFinancialData(input) {
  try {
    let data;
    
    // Handle string input (JSON)
    if (typeof input === 'string') {
      try {
        data = JSON.parse(input);
      } catch {
        throw new Error('Invalid JSON format');
      }
    } else {
      data = input;
    }
    
    // If data is an array, try to categorize it
    if (Array.isArray(data)) {
      data = categorizeFlatData(data);
    }
    
    // Ensure required structure
    const normalized = {
      invoices: data.invoices || [],
      expenses: data.expenses || [],
      payments: data.payments || [],
      balances: data.balances || [],
      metadata: {
        source: data.source || 'manual_input',
        timestamp: new Date().toISOString(),
        recordCount: getTotalRecordCount(data)
      }
    };
    
    logger.info('Data normalized successfully', {
      invoices: normalized.invoices.length,
      expenses: normalized.expenses.length,
      payments: normalized.payments.length,
      balances: normalized.balances.length
    });
    
    return normalized;
  } catch (error) {
    logger.error('Data normalization error:', error);
    throw new Error(`Data normalization failed: ${error.message}`);
  }
}

/**
 * Attempts to categorize flat data array into financial categories
 * @param {Array} flatData - Array of financial records
 * @returns {Object} Categorized data object
 */
function categorizeFlatData(flatData) {
  const categorized = {
    invoices: [],
    expenses: [],
    payments: [],
    balances: []
  };
  
  flatData.forEach(record => {
    const type = detectRecordType(record);
    if (categorized[type]) {
      categorized[type].push(record);
    } else {
      // Default to expenses if type cannot be determined
      categorized.expenses.push(record);
    }
  });
  
  return categorized;
}

/**
 * Detects the type of financial record based on its properties
 * @param {Object} record - Financial record
 * @returns {string} Record type (invoices, expenses, payments, balances)
 */
function detectRecordType(record) {
  const keys = Object.keys(record).map(k => k.toLowerCase());
  
  if (keys.some(k => k.includes('invoice') || k.includes('bill') || k.includes('revenue'))) {
    return 'invoices';
  } else if (keys.some(k => k.includes('payment') || k.includes('transaction'))) {
    return 'payments';
  } else if (keys.some(k => k.includes('balance') || k.includes('account'))) {
    return 'balances';
  } else {
    return 'expenses';
  }
}

/**
 * Gets total record count from normalized data
 * @param {Object} data - Financial data object
 * @returns {number} Total number of records
 */
function getTotalRecordCount(data) {
  return (data.invoices?.length || 0) +
         (data.expenses?.length || 0) +
         (data.payments?.length || 0) +
         (data.balances?.length || 0);
}

/**
 * Validates and cleans financial data
 * @param {Object} data - Financial data to clean
 * @returns {Object} Cleaned data
 */
export function cleanFinancialData(data) {
  const cleaned = { ...data };
  
  // Clean each category
  ['invoices', 'expenses', 'payments', 'balances'].forEach(category => {
    if (cleaned[category]) {
      cleaned[category] = cleaned[category]
        .filter(record => record && typeof record === 'object')
        .map(record => cleanRecord(record));
    }
  });
  
  return cleaned;
}

/**
 * Cleans individual financial record
 * @param {Object} record - Financial record to clean
 * @returns {Object} Cleaned record
 */
function cleanRecord(record) {
  const cleaned = {};
  
  Object.entries(record).forEach(([key, value]) => {
    // Skip null/undefined values
    if (value == null) return;
    
    // Clean string values
    if (typeof value === 'string') {
      value = value.trim();
      if (value === '') return;
    }
    
    // Convert numeric strings to numbers
    if (typeof value === 'string' && /^-?\d+\.?\d*$/.test(value)) {
      value = parseFloat(value);
    }
    
    cleaned[key] = value;
  });
  
  return cleaned;
}