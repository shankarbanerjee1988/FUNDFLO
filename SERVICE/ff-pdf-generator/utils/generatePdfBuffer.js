// Updated generatePdfBuffer.js with improved Chromium path handling
// Need to force the correct path for Chromium on AWS Lambda

let chromium;
try {
  chromium = require('@sparticuz/chromium');
  console.log('Using @sparticuz/chromium');
} catch (error) {
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
let Logger;
try {
  Logger = require('./logger');
} catch (error) {
  try {
    Logger = require('./Logger');
  } catch (upperError) {
    Logger = class SimpleLogger {
      constructor(context) {
        this.context = context;
      }
      debug(msg, data) { console.log(`[DEBUG] [${this.context}]`, msg, data || ''); }
      info(msg, data) { console.log(`[INFO] [${this.context}]`, msg, data || ''); }
      warn(msg, data) { console.warn(`[WARN] [${this.context}]`, msg, data || ''); }
      error(msg, data) { console.error(`[ERROR] [${this.context}]`, msg, data || ''); }
      updateMetrics() {}
      logMemoryUsage() {
        const memUsage = process.memoryUsage();
        console.log(`Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
      }
      recordPdfGeneration() {}
      logEnd() {}
    };
  }
}

// Initialize logger
const logger = new Logger('PDF-Generator');

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
    img { 
        max-width: 100%; 
        height: auto; 
        display: block;
        margin: 10px auto;
        page-break-inside: avoid;
    }
    hr { border: none; border-top: 1px solid #ccc; margin: 1em 0; }
    @page { margin: 1cm; }
    
    /* Add page break control classes */
    .page-break-before { page-break-before: always; }
    .page-break-after { page-break-after: always; }
    .avoid-break { page-break-inside: avoid; }
    
    /* Image handling improvements */
    img {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        object-fit: contain !important;
    }
    
    /* Fallback for missing images */
    img:not([src]), img[src=""] {
        min-width: 100px;
        min-height: 100px;
        border: 2px dashed #ff0000;
        background-color: #ffeeee;
    }
    
    /* Force image container visibility */
    *:has(> img) {
        overflow: visible !important;
        page-break-inside: avoid !important;
    }
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
  <div>© Powered by Fundflo Technologies</div>
</div>
`;

// Check if we can force garbage collection
const canForceGc = typeof global.gc === 'function';

// Function to try freeing memory when possible
async function tryToFreeMemory() {
  if (canForceGc) {
    logger.debug('Forcing garbage collection');
    global.gc();
  }
  
  // Give event loop a chance to clean up
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Inject scripts for image handling and debugging
const imageHandlingScript = `
<script>
// Add event listener to all images
document.addEventListener('DOMContentLoaded', function() {
  const images = document.querySelectorAll('img');
  let loadedCount = 0;
  let errorCount = 0;
  const totalImages = images.length;
  
  console.log('Total images found: ' + totalImages);
  window.pdfGeneratorStats = {
    totalImages: totalImages,
    loadedImages: 0,
    failedImages: 0
  };
  
  if (totalImages === 0) {
    // If no images, set a flag to indicate we're ready
    document.body.setAttribute('data-images-loaded', 'true');
    return;
  }
  
  images.forEach(function(img, index) {
    // Debug original src
    console.log('Image #' + index + ' src: ' + img.src);
    
    // Set crossOrigin attribute for CORS images
    if (!img.src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    
    // Handle successful load
    img.onload = function() {
      loadedCount++;
      window.pdfGeneratorStats.loadedImages = loadedCount;
      console.log('Image #' + index + ' loaded successfully. ' + loadedCount + '/' + totalImages);
      if (loadedCount + errorCount === totalImages) {
        document.body.setAttribute('data-images-loaded', 'true');
      }
    };
    
    // Handle errors
    img.onerror = function(e) {
      console.error('Failed to load image #' + index + ': ' + img.src);
      errorCount++;
      window.pdfGeneratorStats.failedImages = errorCount;
      
      // Add error styling to show something went wrong
      img.style.border = '2px dashed #ff0000';
      img.style.width = '200px';
      img.style.height = '100px';
      img.style.background = '#ffeeee';
      img.style.display = 'flex';
      img.style.justifyContent = 'center';
      img.style.alignItems = 'center';
      img.setAttribute('alt', 'Image failed to load: ' + img.src);
      
      // Try loading with different approaches
      if (!img.src.startsWith('data:')) {
        // Try with cache-busting
        const cacheBustUrl = img.src + (img.src.includes('?') ? '&' : '?') + 'cacheBust=' + new Date().getTime();
        setTimeout(() => {
          console.log('Retrying image load with cache-busting: ' + cacheBustUrl);
          img.src = cacheBustUrl;
        }, 500);
      } else {
        // Still count it as "loaded" for our purposes if it's a data URL
        if (loadedCount + errorCount === totalImages) {
          document.body.setAttribute('data-images-loaded', 'true');
        }
      }
    };
    
    // Force re-trigger of load events for cached images
    if (img.complete) {
      // Image already loaded (or failed)
      if (img.naturalWidth === 0) {
        // Image failed to load
        console.error('Pre-loaded image #' + index + ' has no width, marking as error');
        img.onerror();
      } else {
        // Image already loaded successfully
        console.log('Pre-loaded image #' + index + ' already loaded successfully');
        img.onload();
      }
    } else if (img.src) {
      // Force reload to trigger events
      const currentSrc = img.src;
      img.src = '';
      setTimeout(() => { img.src = currentSrc; }, 10);
    }
  });
  
  // Set a timeout to proceed anyway after a maximum wait time (10 seconds)
  setTimeout(function() {
    if (!document.body.hasAttribute('data-images-loaded')) {
      console.warn('Not all images loaded after timeout, proceeding anyway');
      document.body.setAttribute('data-images-loaded', 'true');
    }
  }, 10000);
});
</script>
`;

module.exports = async function generatePdfBuffer(html, options = {}) {
    logger.info('Starting PDF generation process');
    logger.logMemoryUsage();
    
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
      timeout: 30000 // 30 second timeout for PDF generation
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
      // IMPORTANT: Always enable printBackground to ensure images are rendered
      printBackground: true
    };

    const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'; img-src * data: blob: 'unsafe-inline';">
        ${defaultStyles}
        ${imageHandlingScript}
      </head>
      <body>${html}</body>
    </html>
  `;
  
  let browser = null;
  try {
    logger.info('Setting up browser with Chromium');
    
    // Handle both types of chromium modules (different API shapes)
    let executablePath;
    let args = [];
    let defaultViewport = null;
    
    // Try to get executable path based on module type
    if (typeof chromium.executablePath === 'function') {
      try {
        // Force path for @sparticuz/chromium
        process.env.CHROMIUM_PATH = '/opt/bin/chromium';
        executablePath = await chromium.executablePath();
        args = chromium.args || [];
        defaultViewport = chromium.defaultViewport || { width: 1280, height: 720 };
        logger.info('Using @sparticuz/chromium executablePath with forced path');
      } catch (error) {
        logger.warn(`Error getting path from @sparticuz/chromium: ${error.message}`);
        // Fall back to hardcoded path
        executablePath = '/opt/bin/chromium';
        logger.info('Falling back to hardcoded Lambda layer path: /opt/bin/chromium');
      }
    } else if (chromium.executablePath) {
      // chrome-aws-lambda style
      executablePath = await chromium.executablePath;
      args = chromium.args || [];
      defaultViewport = chromium.defaultViewport || { width: 1280, height: 720 };
      logger.info('Using chrome-aws-lambda executablePath');
    } else {
      logger.warn('No executablePath available from chromium module, checking for Layer path');
      
      // Check common locations for chromium in AWS Lambda layers environment
      const possiblePaths = [
        '/opt/bin/chromium',
        '/opt/nodejs/node_modules/@sparticuz/chromium/bin',
        '/opt/chrome/chrome',
        '/var/task/node_modules/@sparticuz/chromium/bin',
        '/tmp/chromium'
      ];
      
      // Try to find chromium in common locations
      const fs = require('fs');
      for (const path of possiblePaths) {
        try {
          if (fs.existsSync(path)) {
            logger.info(`Found Chromium at: ${path}`);
            executablePath = path;
            break;
          }
        } catch (err) {
          logger.debug(`Error checking path ${path}: ${err.message}`);
        }
      }
      
      // If we still don't have a path, try the AWS Lambda layer path
      if (!executablePath) {
        logger.info('Using default AWS Lambda layer path for Chromium');
        executablePath = '/opt/bin/chromium';
      }
    }
    
    // Log the chromium executable path for debugging
    logger.debug(`Chromium executable path: ${executablePath}`);
    
    // Configure browser launch options
    const browserConfig = {
      args: [
        ...args,
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // Allow cross-origin images
        '--allow-file-access-from-files',
        '--disable-web-security',
        // Additional memory/performance options
        '--js-flags=--max-old-space-size=2048',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run'
      ],
      defaultViewport,
      executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    };
    
    logger.info('Launching browser with config', {
      executablePath,
      args: browserConfig.args.slice(0, 3) + '... (truncated)'
    });
    
    browser = await puppeteer.launch(browserConfig);

    // Create a new page
    logger.info('Creating new page');
    const page = await browser.newPage();
    
    // Capture console messages from page for debugging
    page.on('console', msg => logger.debug(`PAGE CONSOLE: ${msg.text()}`));
    page.on('pageerror', err => logger.error(`PAGE ERROR: ${err.message}`));
    
    // Track requests and failures for diagnostics
    let totalRequests = 0;
    let failedRequests = 0;
    let imageRequests = 0;
    let imageFailures = 0;
    
    page.on('request', request => {
      totalRequests++;
      if (request.resourceType() === 'image') {
        imageRequests++;
        logger.debug(`Loading image: ${request.url().substring(0, 100)}...`);
      }
    });
    
    page.on('requestfailed', request => {
      failedRequests++;
      logger.warn(`Request failed: ${request.url().substring(0, 100)}...`, {
        reason: request.failure() ? request.failure().errorText : 'unknown'
      });
      
      if (request.resourceType() === 'image') {
        imageFailures++;
        logger.warn(`Image failed to load: ${request.url().substring(0, 100)}...`);
      }
    });
    
    // Set custom headers to mimic a browser request
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });
    
    // Allow all content
    await page.setBypassCSP(true);
    
    // Set timeout for navigation
    logger.info('Setting navigation timeout:', pdfOptions.timeout);
    await page.setDefaultNavigationTimeout(pdfOptions.timeout);
    
    // Set content with wait until option
    logger.info('Setting HTML content');
    await page.setContent(fullHtml, { 
      waitUntil: 'networkidle0',
      timeout: pdfOptions.timeout 
    });

    // Optional: Add local debugging step to take a screenshot
    if (process.env.DEBUG_MODE === 'true') {
      logger.debug('Taking debug screenshot');
      await page.screenshot({ path: '/tmp/debug-screenshot.png' });
    }

    // Wait for all images to load
    logger.info('Waiting for images to load...');
    try {
      await page.waitForSelector('body[data-images-loaded="true"]', { 
        timeout: Math.min(pdfOptions.timeout / 2, 15000) // Use half the timeout for just image loading, max 15s
      });
      logger.info('All images loaded successfully!');
    } catch (waitError) {
      logger.warn('Timeout waiting for images to load, continuing anyway:', waitError.message);
      // Continue with PDF generation even if not all images are loaded
    }
    
    // Get image loading statistics from the page
    const imageStats = await page.evaluate(() => {
      return window.pdfGeneratorStats || { 
        totalImages: document.querySelectorAll('img').length,
        loadedImages: 0,
        failedImages: 0
      };
    });
    
    logger.info('Image loading statistics:', imageStats);
    logger.updateMetrics({
      imageCount: imageStats.totalImages,
      successfulImageLoads: imageStats.loadedImages,
      failedImageLoads: imageStats.failedImages
    });
    
    // Additional wait for any ongoing network activity
    await page.waitForTimeout(1000);
    
    // Wait for fonts to load
    logger.info('Waiting for fonts to load');
    await page.evaluateHandle('document.fonts.ready');
    
    // Fix image rendering issues by making them visible
    await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        // Ensure image is visible
        img.style.display = 'block';
        img.style.maxWidth = '100%';
        img.style.pageBreakInside = 'avoid';
      });
    });
    
    // Attempt to free some memory before generating PDF
    await tryToFreeMemory();
    
    // Generate PDF with provided options
    logger.info('Generating PDF');
    const pdfBuffer = await page.pdf(pdfOptions);
    
    // Validate buffer
    if (!pdfBuffer || !(pdfBuffer instanceof Buffer)) {
      logger.error('PDF generation failed: puppeteer did not return a valid buffer');
      throw new Error('PDF generation failed: invalid buffer returned from puppeteer');
    }
    
    logger.info(`PDF generated successfully. Buffer size: ${pdfBuffer.length} bytes`);
    logger.updateMetrics({ pdfSizeKB: Math.round(pdfBuffer.length / 1024) });
    
    // Record PDF generation metrics
    logger.recordPdfGeneration(pdfBuffer, {
      totalRequests,
      failedRequests,
      imageRequests,
      imageFailures,
      pdfOptions: {
        format: pdfOptions.format,
        landscape: pdfOptions.landscape
      }
    });
    
    // Clean up resources
    logger.info('Closing browser');
    await browser.close();
    browser = null;
    
    // Final memory check
    logger.logMemoryUsage();
    logger.logEnd();
    
    return pdfBuffer;
  } catch (error) {
    logger.error('Error generating PDF:', error);
    throw error;
  } finally {
    // Ensure browser is closed even if there's an error
    if (browser !== null) {
      try {
        logger.info('Closing browser in finally block');
        await browser.close();
      } catch (closeError) {
        logger.error('Error closing browser:', closeError);
      }
    }
  }
};