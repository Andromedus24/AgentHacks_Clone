import fs from 'fs';
import { analyzeFinancialData } from '../services/llmClient.js';
import { parseCSV, parseJSON } from '../services/parser.js';
import { validateFinancialData } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

export const analysisController = {
  async analyzeFinancialData(req, res) {
    try {
      const { data, format = 'json' } = req.body;
      
      if (!data) {
        return res.status(400).json({
          error: 'Missing required field: data',
          message: 'Please provide financial data in the request body'
        });
      }

      // Parse data based on format
      let parsedData;
      try {
        if (format === 'csv') {
          parsedData = parseCSV(data);
        } else {
          parsedData = parseJSON(data);
        }
      } catch (parseError) {
        return res.status(400).json({
          error: 'Data parsing failed',
          message: parseError.message
        });
      }

      // Validate parsed data
      const validation = validateFinancialData(parsedData);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Data validation failed',
          details: validation.errors
        });
      }

      // Analyze with LLM
      const analysis = await analyzeFinancialData(parsedData);
      
      logger.info('Financial analysis completed successfully', {
        dataRecords: Object.values(parsedData).flat().length
      });

      res.json({
        success: true,
        analysis,
        metadata: {
          processedAt: new Date().toISOString(),
          recordsProcessed: Object.values(parsedData).flat().length
        }
      });

    } catch (error) {
      logger.error('Analysis error:', error);
      
      if (error.message.includes('Rate limited')) {
        return res.status(429).json({
          error: 'Rate limited',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Analysis failed',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  async analyzeFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          message: 'Please upload a CSV or JSON file'
        });
      }

      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
      
      let parsedData;
      if (fileExtension === 'csv') {
        parsedData = parseCSV(fileContent);
      } else if (fileExtension === 'json') {
        parsedData = parseJSON(fileContent);
      } else {
        return res.status(400).json({
          error: 'Unsupported file format',
          message: 'Please upload a CSV or JSON file'
        });
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      // Validate and analyze
      const validation = validateFinancialData(parsedData);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Data validation failed',
          details: validation.errors
        });
      }

      const analysis = await analyzeFinancialData(parsedData);
      
      res.json({
        success: true,
        analysis,
        metadata: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          processedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('File analysis error:', error);
      
      // Clean up file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        error: 'File analysis failed',
        message: error.message
      });
    }
  }
};