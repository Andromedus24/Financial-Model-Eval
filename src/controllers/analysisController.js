import fs from 'fs';
import { analyzeFinancialData, researchFinancialTopic, generateFinancialSummary } from '../services/llmClient.js';
import { searchPapers, researchCompliance, summarizeAbstract } from '../services/researchService.js';
import { parseCSV, normalizeFinancialData } from '../services/parser.js';
import { validateData } from '../utils/validation.js';
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
          const csvArray = parseCSV(data);
          parsedData = normalizeFinancialData(csvArray);
        } else {
          parsedData = normalizeFinancialData(data);
        }
      } catch (parseError) {
        return res.status(400).json({
          error: 'Data parsing failed',
          message: parseError.message
        });
      }

      // Validate parsed data
      const validation = validateData(parsedData);
      if (!validation.isValid) {
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
        data: parsedData,
        analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Analysis failed:', error);
      res.status(500).json({
        error: 'Analysis failed',
        message: error.message
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

      const fileContent = req.file.buffer.toString('utf8');
      let parsedData;

      try {
        if (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) {
          const csvArray = parseCSV(fileContent);
          parsedData = normalizeFinancialData(csvArray);
        } else {
          parsedData = normalizeFinancialData(JSON.parse(fileContent));
        }
      } catch (parseError) {
        logger.error('File parsing failed:', parseError);
        return res.status(400).json({
          error: 'File parsing failed',
          message: parseError.message
        });
      }

      const validation = validateData(parsedData);
      if (!validation.isValid) {
        logger.error('Data validation failed:', validation.errors);
        return res.status(400).json({
          error: 'Data validation failed',
          details: validation.errors
        });
      }

      const analysis = await analyzeFinancialData(parsedData);
      
      logger.info('File analysis completed successfully', {
        filename: req.file.originalname,
        dataRecords: Object.values(parsedData).flat().length
      });

      res.json({
        success: true,
        filename: req.file.originalname,
        data: parsedData,
        analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('File analysis failed:', error);
      res.status(500).json({
        error: 'File analysis failed',
        message: error.message
      });
    }
  },

  // New research endpoints (adapted from your research tool)
  async researchTopic(req, res) {
    try {
      const { topic, context } = req.body;
      
      if (!topic) {
        return res.status(400).json({
          error: 'Missing required field: topic'
        });
      }

      const insights = await researchFinancialTopic(topic, context);
      
      res.json({
        success: true,
        topic,
        insights,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Research failed:', error);
      res.status(500).json({
        error: 'Research failed',
        message: error.message
      });
    }
  },

  async searchPapers(req, res) {
    try {
      const { query, limit = 5 } = req.query;
      
      if (!query) {
        return res.status(400).json({
          error: 'Missing required parameter: query'
        });
      }

      const papers = await searchPapers(query, parseInt(limit));
      
      res.json({
        success: true,
        query,
        papers,
        count: papers.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Paper search failed:', error);
      res.status(500).json({
        error: 'Paper search failed',
        message: error.message
      });
    }
  },

  async researchCompliance(req, res) {
    try {
      const { topic, limit = 3 } = req.body;
      
      if (!topic) {
        return res.status(400).json({
          error: 'Missing required field: topic'
        });
      }

      const research = await researchCompliance(topic, parseInt(limit));
      
      res.json({
        success: true,
        ...research,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Compliance research failed:', error);
      res.status(500).json({
        error: 'Compliance research failed',
        message: error.message
      });
    }
  }
};