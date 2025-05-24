import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { logger } from './logger.js';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Financial data schema
const financialDataSchema = {
  type: 'object',
  properties: {
    invoices: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: ['string', 'number'] },
          amount: { type: 'number', minimum: 0 },
          date: { type: 'string', format: 'date' },
          description: { type: 'string' },
          customer: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'cancelled'] }
        },
        required: ['amount', 'date']
      }
    },
    expenses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: ['string', 'number'] },
          amount: { type: 'number', minimum: 0 },
          date: { type: 'string', format: 'date' },
          description: { type: 'string' },
          category: { type: 'string' },
          vendor: { type: 'string' }
        },
        required: ['amount', 'date']
      }
    },
    payments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: ['string', 'number'] },
          amount: { type: 'number' },
          date: { type: 'string', format: 'date' },
          description: { type: 'string' },
          type: { type: 'string', enum: ['inbound', 'outbound'] },
          method: { type: 'string' }
        },
        required: ['amount', 'date', 'type']
      }
    },
    balances: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          account: { type: 'string' },
          balance: { type: 'number' },
          date: { type: 'string', format: 'date' },
          currency: { type: 'string', default: 'USD' }
        },
        required: ['account', 'balance', 'date']
      }
    },
    metadata: {
      type: 'object',
      properties: {
        source: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        recordCount: { type: 'number', minimum: 0 }
      }
    }
  },
  required: ['invoices', 'expenses'],
  additionalProperties: true
};

export const validateFinancialData = ajv.compile(financialDataSchema);

/**
 * Validates financial data and returns detailed error information
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result with isValid flag and errors
 */
export function validateData(data) {
  const isValid = validateFinancialData(data);
  
  const result = {
    isValid,
    errors: isValid ? [] : validateFinancialData.errors.map(formatValidationError),
    warnings: []
  };
  
  // Add warnings for data quality issues
  if (isValid) {
    result.warnings = checkDataQuality(data);
  }
  
  logger.info('Data validation completed', {
    isValid,
    errorCount: result.errors.length,
    warningCount: result.warnings.length
  });
  
  return result;
}

/**
 * Formats AJV validation errors into user-friendly messages
 * @param {Object} error - AJV error object
 * @returns {Object} Formatted error
 */
function formatValidationError(error) {
  return {
    field: error.instancePath || error.schemaPath,
    message: error.message,
    value: error.data,
    constraint: error.params
  };
}

/**
 * Checks data quality and returns warnings
 * @param {Object} data - Financial data to check
 * @returns {Array} Array of warning messages
 */
function checkDataQuality(data) {
  const warnings = [];
  
  // Check for empty categories
  if (data.invoices?.length === 0) {
    warnings.push('No invoice data provided - cash flow projections may be inaccurate');
  }
  
  if (data.expenses?.length === 0) {
    warnings.push('No expense data provided - cost analysis will be limited');
  }
  
  // Check for missing dates
  const allRecords = [
    ...(data.invoices || []),
    ...(data.expenses || []),
    ...(data.payments || [])
  ];
  
  const recordsWithoutDates = allRecords.filter(record => !record.date);
  if (recordsWithoutDates.length > 0) {
    warnings.push(`${recordsWithoutDates.length} records missing dates - timeline analysis may be affected`);
  }
  
  // Check for suspicious amounts
  const suspiciousAmounts = allRecords.filter(record => 
    record.amount && (record.amount < 0 || record.amount > 1000000)
  );
  if (suspiciousAmounts.length > 0) {
    warnings.push(`${suspiciousAmounts.length} records with unusual amounts detected`);
  }
  
  return warnings;
}

/**
 * Validates file upload
 * @param {Object} file - Uploaded file object
 * @returns {Object} Validation result
 */
export function validateFileUpload(file) {
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }
  
  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    errors.push('File size exceeds 10MB limit');
  }
  
  // Check file type
  const allowedTypes = ['text/csv', 'application/json', 'text/plain'];
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}