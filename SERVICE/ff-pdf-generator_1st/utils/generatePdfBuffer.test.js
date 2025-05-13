const generatePdfBuffer = require('../utils/generatePdfBuffer');

// This test requires mocking Puppeteer
jest.mock('puppeteer-core', () => {
  return {
    launch: jest.fn().mockImplementation(() => {
      return {
        newPage: jest.fn().mockImplementation(() => {
          return {
            setContent: jest.fn().mockResolvedValue(null),
            pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
            setDefaultNavigationTimeout: jest.fn()
          };
        }),
        close: jest.fn().mockResolvedValue(null)
      };
    })
  };
});

jest.mock('@sparticuz/chromium', () => {
  return {
    args: [],
    defaultViewport: { width: 1280, height: 720 },
    executablePath: jest.fn().mockResolvedValue('/path/to/chrome'),
    headless: true
  };
});

describe('generatePdfBuffer', () => {
  test('generates PDF buffer from HTML content', async () => {
    const html = '<h1>Test</h1>';
    
    const buffer = await generatePdfBuffer(html);
    
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.toString()).toBe('mock-pdf-content');
  });
});