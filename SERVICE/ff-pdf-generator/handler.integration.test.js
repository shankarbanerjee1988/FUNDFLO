const handler = require('../handler');

// Mock the S3 upload
jest.mock('../utils/uploadToS3', () => {
  return jest.fn().mockResolvedValue('https://example.com/test.pdf');
});

describe('Lambda Handler Integration', () => {
  test('generates PDF and returns URL', async () => {
    const event = {
      body: JSON.stringify({
        templateContent: '<h1>{{title}}</h1><p>{{content}}</p>',
        data: {
          title: 'Integration Test',
          content: 'This is an integration test.'
        }
      })
    };
    
    const response = await handler.generatePdf(event);
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toHaveProperty('url');
  });
  
  test('returns base64 PDF when requested', async () => {
    const event = {
      queryStringParameters: { output: 'base64' },
      body: JSON.stringify({
        templateContent: '<h1>{{title}}</h1>',
        data: { title: 'Base64 Test' }
      })
    };
    
    const response = await handler.generatePdf(event);
    
    expect(response.statusCode).toBe(200);
    expect(response.isBase64Encoded).toBe(true);
    expect(response.headers['Content-Type']).toBe('application/pdf');
  });
  
  test('returns 400 when templateContent is missing', async () => {
    const event = {
      body: JSON.stringify({
        data: { title: 'Missing Template' }
      })
    };
    
    const response = await handler.generatePdf(event);
    
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toHaveProperty('error');
  });
});