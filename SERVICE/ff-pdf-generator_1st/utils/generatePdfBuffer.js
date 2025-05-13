// Dual-compatibility approach that works with both @sparticuz/chromium and chrome-aws-lambda
let chromium;
try {
  // First try to load @sparticuz/chromium
  chromium = require('@sparticuz/chromium');
  console.log('Using @sparticuz/chromium');
} catch (error) {
  // Fall back to chrome-aws-lambda (from the layer)
  try {
    chromium = require('chrome-aws-lambda');
    console.log('Using chrome-aws-lambda from layer');
  } catch (fallbackError) {
    console.error('Failed to load chromium:', error);
    console.error('Failed to load chrome-aws-lambda:', fallbackError);
    throw new Error('Could not load any chromium module. Make sure either @sparticuz/chromium or chrome-aws-lambda is available.');
  }
}

const puppeteer = require('puppeteer-core');

/**
 * Generates PDF buffer from HTML using headless Chrome
 * @param {string} html - HTML content
 * @param {Object} options - PDF generation options
 * @returns {Promise<Buffer>} - PDF as buffer
 */

// Default CSS styles for PDF
const defaultStyles = `
<style>
    body { 
        font-family: Arial, sans-serif; 
        padding: 20px;
        line-height: 1.4;
        font-size: 12pt;
    }
    table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 15px 0; 
    }
    th, td { 
        border: 1px solid #ccc; 
        padding: 8px; 
        text-align: left; 
    }
    th { 
        background-color: #f5f5f5; 
        font-weight: bold;
    }
    thead { 
        display: table-header-group; 
        break-inside: avoid; 
    }
    tr { 
        page-break-inside: avoid; 
    }
    h1, h2, h3, h4, h5, h6 { 
        color: #333;
        margin-top: 1em;
        margin-bottom: 0.5em;
    }
    h1 { font-size: 22pt; }
    h2 { font-size: 18pt; }
    h3 { font-size: 16pt; }
    h4 { font-size: 14pt; }
    h5 { font-size: 12pt; }
    h6 { font-size: 10pt; }
    strong { font-weight: bold; }
    em { font-style: italic; }
    p { margin: 0 0 1em; }
    ul, ol { margin: 0 0 1em 2em; }
    img { max-width: 100%; height: auto; }
    hr { border: none; border-top: 1px solid #ccc; margin: 1em 0; }
    @page { margin: 1cm; }
    
    /* Add page break control classes */
    .page-break-before { page-break-before: always; }
    .page-break-after { page-break-after: always; }
    .avoid-break { page-break-inside: avoid; }
</style>
`;

// Default header template
const defaultHeaderTemplate = `
<div style="width: 100%; font-size: 10px; padding: 5px 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between;">
  <div>Generated on: <span class="date"></span></div>
  <div><span class="pageNumber"></span> of <span class="totalPages"></span></div>
</div>
`;

// Default footer template
const defaultFooterTemplate = `
<div style="width: 100%; font-size: 10px; padding: 5px 20px; border-top: 1px solid #ddd; display: flex; justify-content: center;">
  <div>© ${new Date().getFullYear()} - PDF Generator Service</div>
</div>
`;

module.exports = async function generatePdfBuffer(html, options = {}) {
    // Default PDF options
    const defaultOptions = {
      format: 'A4',
      landscape: false,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: defaultHeaderTemplate,
      footerTemplate: defaultFooterTemplate,
      margin: { top: "100px", right: "20px", bottom: "80px", left: "20px" },
      preferCSSPageSize: false,
      timeout: 60000 // 60 second timeout for PDF generation
    };

    // Merge provided options with defaults
    const pdfOptions = {
      ...defaultOptions,
      ...options,
      // Ensure margins are properly set when headers/footers are displayed
      margin: {
        ...defaultOptions.margin,
        ...(options.margin || {})
      },
      // Ensure printBackground is true to show images
      printBackground: options.printBackground !== false
    };

    const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${defaultStyles}
      </head>
      <body>${html}</body>
    </html>
  `;
  
  let browser = null;
  try {
    console.log('Setting up browser with Chromium');
    
    // Handle both types of chromium modules (different API shapes)
    let executablePath;
    let args = [];
    let defaultViewport = null;
    
    if (typeof chromium.executablePath === 'function') {
      // @sparticuz/chromium style
      executablePath = await chromium.executablePath();
      args = chromium.args || [];
      defaultViewport = chromium.defaultViewport || { width: 1280, height: 720 };
    } else {
      // chrome-aws-lambda style
      executablePath = await chromium.executablePath;
      args = chromium.args || [];
      defaultViewport = chromium.defaultViewport || { width: 1280, height: 720 };
    }
    
    console.log(`Chromium executable path: ${executablePath}`);
    
    // Configure browser launch options
    const browserConfig = {
      args: [
        ...args,
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      defaultViewport,
      executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    };
    
    console.log('Launching browser with config:', JSON.stringify({
      executablePath: browserConfig.executablePath,
      numArgs: browserConfig.args.length
    }, null, 2));
    
    browser = await puppeteer.launch(browserConfig);

    // Create a new page
    console.log('Creating new page');
    const page = await browser.newPage();
    
    // Set custom headers to mimic a browser request
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
      'Referer': 'https://www.google.com/' // Sometimes helps with hotlink protection
    });
    
    // Set timeout for navigation
    console.log('Setting navigation timeout:', pdfOptions.timeout);
    await page.setDefaultNavigationTimeout(pdfOptions.timeout);
    
    // Set content with wait until option
    console.log('Setting HTML content');
    // await page.setContent(fullHtml, { 
    //   waitUntil: ['domcontentloaded', 'networkidle0']
    // });
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(1000);


    // Wait for images to load
    console.log('Waiting for images to load');
    await page.evaluate(async () => {
      const imgElements = document.querySelectorAll('img');
      console.log(`Found ${imgElements.length} images on page`);
      
      const imgPromises = Array.from(imgElements).map((img, index) => {
        if (img.complete) {
          console.log(`Image ${index} already loaded: ${img.src.substring(0, 100)}...`);
          return;
        }
        
        return new Promise(resolve => {
          img.addEventListener('load', () => {
            console.log(`Image ${index} loaded: ${img.src.substring(0, 100)}...`);
            resolve();
          });
          
          img.addEventListener('error', () => {
            console.error(`Failed to load image ${index}: ${img.src.substring(0, 100)}...`);
            resolve(); // Resolve anyway to continue
          });
        });
      });
      
      await Promise.all(imgPromises);
    });
    
    // Wait for fonts to load and any images/resources
    console.log('Waiting for fonts to load');
    await page.evaluateHandle('document.fonts.ready');
    
    // Generate PDF with provided options
    console.log('Generating PDF with options');
    const pdfBuffer = await page.pdf(pdfOptions);
    
    // Validate buffer
    if (!pdfBuffer || !(pdfBuffer instanceof Buffer)) {
      console.error('PDF generation failed: puppeteer did not return a valid buffer');
      throw new Error('PDF generation failed: invalid buffer returned from puppeteer');
    }
    
    console.log(`PDF generated successfully. Buffer size: ${pdfBuffer.length} bytes`);
    
    // Clean up resources
    console.log('Closing browser');
    await browser.close();
    browser = null;
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    // Ensure browser is closed even if there's an error
    if (browser !== null) {
      try {
        console.log('Closing browser in finally block');
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
};