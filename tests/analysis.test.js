import request from 'supertest';
import app from '../src/index.js';

// Mock the OpenRouter client
jest.mock('../src/services/llmClient.js', () => ({
  analyzeFinancialData: jest.fn().mockResolvedValue({
    cashFlowForecast: {
      month1: { inflow: 10000, outflow: 8000, netFlow: 2000, endingBalance: 12000 },
      month2: { inflow: 12000, outflow: 9000, netFlow: 3000, endingBalance: 15000 },
      month3: { inflow: 11000, outflow: 8500, netFlow: 2500, endingBalance: 17500 }
    },
    anomalies: [],
    procurementSuggestions: [
      { category: 'office supplies', suggestion: 'Bulk purchasing', potentialSavings: '15%' }
    ],
    kpis: {
      grossMargin: 0.35,
      burnRate: 8500,
      DSO: 45,
      DPO: 30,
      currentRatio: 1.5,
      runway: 24
    },
    dataValidation: {
      errors: [],
      warnings: [],
      suggestions: []
    },
    summary: 'Financial health is stable with positive cash flow trends.'
  })
}));

describe('Financial Analysis API', () => {
  const sampleData = {
    invoices: [
      {
        id: 'inv_001',
        date: '2024-01-15',
        amount: 5000,
        description: 'Software licensing',
        category: 'technology',
        vendor: 'TechCorp',
        status: 'paid'
      }
    ],
    expenses: [
      {
        id: 'exp_001',
        date: '2024-01-10',
        amount: 1200,
        description: 'Office rent',
        category: 'facilities',
        vendor: 'Property Management'
      }
    ],
    revenues: [],
    payments: [],
    balances: [],
    metadata: {
      currency: 'USD',
      period: 'monthly',
      source: 'test_data'
    }
  };

  test('POST /api/analyze - should analyze financial data successfully', async () => {
    const response = await request(app)
      .post('/api/analyze')
      .send({ data: sampleData })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.analysis).toHaveProperty('cashFlowForecast');
    expect(response.body.analysis).toHaveProperty('kpis');
    expect(response.body.analysis).toHaveProperty('anomalies');
  });

  test('POST /api/analyze - should return 400 for missing data', async () => {
    const response = await request(app)
      .post('/api/analyze')
      .send({})
      .expect(400);

    expect(response.body.error).toBe('Missing required field: data');
  });

  test('GET /api/health - should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.status).toBe('healthy');
    expect(response.body).toHaveProperty('timestamp');
  });
});