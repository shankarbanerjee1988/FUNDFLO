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
const Logger = require('./logger');

// Initialize logger
const logger = new Logger('PDF-Generator');

// Browser pool configuration
const browserPool = [];
const MAX_POOL_SIZE = parseInt(process.env.BROWSER_POOL_SIZE || '2');
const BROWSER_TIMEOUT = parseInt(process.env.BROWSER_TIMEOUT || '45000');

// Default options for PDF generation
const defaultOptions = {
  format: 'A4',
  landscape: false,
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: `
    <div style="width: 100%; font-size: 10px; padding: 5px 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between;">
      <div style="flex: 1; text-align: left;">Generated on: <span class="date"></span></div>
      <div style="flex: 1; text-align: center; font-weight: bold;"><span class="title"></span></div>
      <div style="flex: 1; text-align: right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
    </div>
  `,
  footerTemplate: `
    <div style="width: 100%; font-size: 10px; padding: 5px 20px; border-top: 1px solid #ddd; display: flex; justify-content: space-between;">
      <div style="flex: 1; text-align: left;"><span class="copyright"></span></div>
      <div style="flex: 1; text-align: center;"><span class="customFooter"></span></div>
      <div style="flex: 1; text-align: right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
    </div>
  `,
  margin: { top: "100px", right: "20px", bottom: "80px", left: "20px" },
  preferCSSPageSize: false,
  timeout: 30000 // Default 30 second timeout
};

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

// Improved progressive image loading script
const imageHandlingScript = `
<script>
// Progressive image loading with priority loading
document.addEventListener('DOMContentLoaded', function() {
  const images = document.querySelectorAll('img');
  const totalImages = images.length;
  
  console.log('Total images found: ' + totalImages);
  
  // Initialize stats
  window.pdfGeneratorStats = {
    totalImages: totalImages,
    loadedImages: 0,
    failedImages: 0,
    startTime: Date.now()
  };
  
  // If no images, set ready flag
  if (totalImages === 0) {
    document.body.setAttribute('data-images-loaded', 'true');
    return;
  }
  
  // Group images by viewport visibility
  const visibleImages = [];
  const hiddenImages = [];
  
  // First pass - load visible images
  images.forEach(function(img) {
    // Check if image is in viewport
    const rect = img.getBoundingClientRect();
    const isVisible = (
      rect.top >= -100 && 
      rect.left >= -100 && 
      rect.bottom <= (window.innerHeight + 100) &&
      rect.right <= (window.innerWidth + 100)
    );
    
    // Set data attribute for tracking
    img.setAttribute('data-loading-started', 'false');
    
    if (isVisible) {
      visibleImages.push(img);
    } else {
      hiddenImages.push(img);
    }
  });
  
  // Setup image loading with priorities
  function setupImageLoading(img, index) {
    // Mark loading started
    img.setAttribute('data-loading-started', 'true');
    
    // Handle successful load
    img.onload = function() {
      window.pdfGeneratorStats.loadedImages++;
      checkCompletion();
    };
    
    // Handle errors
    img.onerror = function() {
      window.pdfGeneratorStats.failedImages++;
      
      // Add error styling
      img.style.border = '2px dashed #ff0000';
      img.style.width = '200px';
      img.style.height = '100px';
      img.style.background = '#ffeeee';
      
      checkCompletion();
    };
    
    // Force reload to trigger events
    if (img.complete) {
      if (img.naturalWidth === 0) {
        img.onerror();
      } else {
        img.onload();
      }
    } else if (img.src) {
      const currentSrc = img.src;
      img.src = '';
      setTimeout(() => { img.src = currentSrc; }, 10);
    }
  }
  
  // Check if all images are loaded
  function checkCompletion() {
    const loadedCount = window.pdfGeneratorStats.loadedImages;
    const failedCount = window.pdfGeneratorStats.failedImages;
    
    // If all images are processed or timeout reached
    if (loadedCount + failedCount === totalImages || 
        Date.now() - window.pdfGeneratorStats.startTime > 12000) {
      
      // Mark document as ready for PDF generation
      document.body.setAttribute('data-images-loaded', 'true');
      
      // Calculate loading time
      window.pdfGeneratorStats.loadTime = Date.now() - window.pdfGeneratorStats.startTime;
      console.log('Image loading completed in ' + window.pdfGeneratorStats.loadTime + 'ms');
    }
    
    // Start loading next batch of hidden images if some visible are loaded
    else if (loadedCount > 0 && hiddenImages.length > 0) {
      // Load next batch (5 at a time)
      const batch = hiddenImages.splice(0, 5);
      batch.forEach(setupImageLoading);
    }
  }
  
  // Start loading visible images first
  visibleImages.forEach(setupImageLoading);
  
  // Start loading a small batch of hidden images
  hiddenImages.slice(0, 3).forEach(setupImageLoading);
  
  // Set a maximum timeout
  setTimeout(function() {
    if (!document.body.hasAttribute('data-images-loaded')) {
      console.warn('Not all images loaded after timeout, proceeding anyway');
      document.body.setAttribute('data-images-loaded', 'true');
    }
  }, 12000);
});
</script>
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

/**
 * Get browser from pool or create a new one
 */
async function getBrowser() {
  logger.debug(`Browser pool size: ${browserPool.length}`);
  
  // Try to reuse an existing browser
  if (browserPool.length > 0) {
    const browser = browserPool.pop();
    logger.debug('Reusing browser from pool');
    return browser;
  }
  
  // Create new browser
  logger.info('Setting up new browser with Chromium');
  
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
  
  const browser = await puppeteer.launch(browserConfig);
  
  // Set timeout to force close hanging browsers
  browser._timeoutId = setTimeout(async () => {
    try {
      logger.warn('Browser timeout reached, force closing');
      await browser.close();
    } catch (e) {
      logger.error('Error force closing browser:', e);
    }
  }, BROWSER_TIMEOUT);
  
  return browser;
}

/**
 * Release browser back to pool or close it
 */
async function releaseBrowser(browser) {
  // Clear the timeout
  if (browser._timeoutId) {
    clearTimeout(browser._timeoutId);
  }
  
  // Check if we should keep it in the pool
  if (browserPool.length < MAX_POOL_SIZE) {
    // Close all pages to free memory
    try {
      const pages = await browser.pages();
      await Promise.all(pages.map(page => page.close()));
    } catch (e) {
      logger.warn('Error closing pages:', e);
    }
    
    // Return to pool for reuse
    browserPool.push(browser);
    logger.debug('Returned browser to pool');
    return;
  }
  
  // Otherwise close it
  try {
    await browser.close();
    logger.debug('Closed browser (pool full)');
  } catch (e) {
    logger.error('Error closing browser:', e);
  }
}

/**
 * Generates PDF buffer from HTML using headless Chrome
 * @param {string} html - HTML content
 * @param {Object} options - PDF generation options
 * @returns {Promise<Buffer>} - PDF as buffer
 */
module.exports = async function generatePdfBuffer(html, options = {}) {
  logger.info('Starting PDF generation process');
  logger.logMemoryUsage();
  
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

  // Process header and footer templates
  let headerTemplate = options.headerTemplate || defaultOptions.headerTemplate;
  let footerTemplate = options.footerTemplate || defaultOptions.footerTemplate;

  // Replace placeholders with provided values
  if (options.title) {
    headerTemplate = headerTemplate.replace('<span class="title"></span>', `<span class="title">${options.title}</span>`);
  }
  
  if (options.copyright) {
    footerTemplate = footerTemplate.replace('<span class="copyright"></span>', `<span class="copyright">${options.copyright}</span>`);
  }
  
  if (options.customFooter) {
    footerTemplate = footerTemplate.replace('<span class="customFooter"></span>', `<span class="customFooter">${options.customFooter}</span>`);
  }
  
  // Update options with processed templates
  pdfOptions.headerTemplate = headerTemplate;
  pdfOptions.footerTemplate = footerTemplate;

  // Prepare full HTML document with styles and scripts
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
    // Get browser from pool or create new
    browser = await getBrowser();

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
        reason: request.failure()?.errorText
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
        failedImages: 0,
        loadTime: 0
      };
    });
    
    logger.info('Image loading statistics:', imageStats);
    logger.updateMetrics({
      imageCount: imageStats.totalImages,
      successfulImageLoads: imageStats.loadedImages,
      failedImageLoads: imageStats.failedImages,
      imageLoadTime: imageStats.loadTime
    });
    
    // Additional wait for any ongoing network activity
    await page.waitForTimeout(1000);
    
    // Wait for fonts to load
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
    
    // Close the page to free memory
    await page.close();
    
    // Final memory check
    logger.logMemoryUsage();
    logger.logEnd();
    
    return pdfBuffer;
  } catch (error) {
    logger.error('Error generating PDF:', error);
    throw error;
  } finally {
    // Release the browser back to the pool or close it
    if (browser !== null) {
      try {
        logger.info('Releasing browser');
        await releaseBrowser(browser);
      } catch (closeError) {
        logger.error('Error releasing browser:', closeError);
      }
    }
  }
};