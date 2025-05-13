/**
 * Ensure the Chromium executable has the right permissions
 * @param {string} executablePath - Path to the Chromium executable
 */
async function ensureExecutablePermissions(executablePath) {
  if (!executablePath) {
    logger.warn('No executable path provided');
    return;
  }

  try {
    logger.info(`Checking permissions for: ${executablePath}`);
    
    if (!fs.existsSync(executablePath)) {
      logger.warn(`Executable not found at: ${executablePath}`);
      
      // Check if the executable exists in a bin subdirectory
      const binPath = path.join(path.dirname(executablePath), 'bin', path.basename(executablePath));
      if (fs.existsSync(binPath)) {
        logger.info(`Found executable in bin subdirectory: ${binPath}`);
        
        // Update permissions on the actual executable
        fs.chmodSync(binPath, 0o755);
        logger.info(`Updated permissions for ${binPath}`);
        
        // Create a symbolic link to the actual location
        try {
          fs.symlinkSync(binPath, executablePath);
          logger.info(`Created symlink from ${binPath} to ${executablePath}`);
        } catch (symlinkError) {
          logger.warn(`Could not create symlink: ${symlinkError.message}`);
        }
      } else {
        // Try to find Chromium elsewhere in the directory structure
        const foundPaths = findChromiumInDirectory(path.dirname(executablePath));
        if (foundPaths.length > 0) {
          logger.info(`Found alternative Chromium paths: ${foundPaths.join(', ')}`);
          
          // Use the first found path
          fs.chmodSync(foundPaths[0], 0o755);
          logger.info(`Updated permissions for ${foundPaths[0]}`);
          
          // Try to create a symbolic link if needed
          if (foundPaths[0] !== executablePath) {
            try {
              // Create parent directory if needed
              const dir = path.dirname(executablePath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              
              fs.symlinkSync(foundPaths[0], executablePath);
              logger.info(`Created symlink from ${foundPaths[0]} to ${executablePath}`);
            } catch (symlinkError) {
              logger.warn(`Could not create symlink: ${symlinkError.message}`);
            }
          }
        } else {
          logger.warn('Could not find Chromium executable anywhere in the specified directory');
        }
      }
      return;
    }
    
    const stats = fs.statSync(executablePath);
    const currentMode = stats.mode;
    const octalMode = currentMode.toString(8);
    
    logger.info(`Current permissions: ${octalMode}`);
    
    // Check if file is executable (0o111 = --x--x--x)
    if ((currentMode & 0o111) === 0) {
      logger.info(`Setting executable permissions on ${executablePath}`);
      fs.chmodSync(executablePath, 0o755); // rwxr-xr-x permissions
      
      // Verify permissions were set
      const newStats = fs.statSync(executablePath);
      logger.info(`New permissions: ${newStats.mode.toString(8)}`);
    } else {
      logger.info('File already has executable permissions');
    }
  } catch (error) {
    logger.error(`Error checking/setting permissions: ${error.message}`);
  }
}

/**
 * Recursively find Chromium executable in a directory
 * @param {string} directory - Directory to search in
 * @returns {Array} - Array of found Chromium paths
 */
function findChromiumInDirectory(directory, depth = 0) {
  const maxDepth = 3; // Limit search depth to prevent excessive recursion
  const results = [];
  
  if (depth > maxDepth) return results;
  
  try {
    if (!fs.existsSync(directory)) return results;
    
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const fullPath = path.join(directory, file);
      
      try {
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          // Recursively search subdirectories
          const subdirResults = findChromiumInDirectory(fullPath, depth + 1);
          results.push(...subdirResults);
        } else if (stats.isFile()) {
          // Check if file looks like a Chromium executable
          if (
            file === 'chromium' ||
            file === 'chrome' ||
            file === 'headless-chromium' ||
            file.includes('chromium') ||
            file.includes('chrome')
          ) {
            results.push(fullPath);
          }
        }
      } catch (statError) {
        // Skip files we can't stat
      }
    }
  } catch (error) {
    logger.warn(`Error searching directory ${directory}: ${error.message}`);
  }
  
  return results;
}// Simplified generatePdfBuffer.js using only @sparticuz/chromium

/**
 * Module to generate PDF buffers using Puppeteer and Chromium in AWS Lambda
 * Simplified to only use @sparticuz/chromium for better compatibility
 */

const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { defaultStyles } = require('./defaultValue');

// Set up simple logging
let logger;
try {
  const Logger = require('./logger-file');
  logger = new Logger('PDF-Generator');
} catch (error) {
  // Fallback logger
  logger = {
    debug: (msg, data) => console.log(`[DEBUG] [PDF-Generator] ${msg}`, data || ''),
    info: (msg, data) => console.log(`[INFO] [PDF-Generator] ${msg}`, data || ''),
    warn: (msg, data) => console.warn(`[WARN] [PDF-Generator] ${msg}`, data || ''),
    error: (msg, data) => console.error(`[ERROR] [PDF-Generator] ${msg}`, data || ''),
    logMemoryUsage: () => {
      const memUsage = process.memoryUsage();
      console.log(`Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    },
    updateMetrics: () => {},
    recordPdfGeneration: () => {},
    logEnd: () => {}
  };
}

// Define multiple possible Chromium paths to try
const possibleChromiumPaths = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  process.env.CHROMIUM_PATH,
  '/opt/chrome/headless-chromium',
  '/opt/bin/chromium',                 // Common Lambda Layer location
  '/opt/chrome/chrome',                // Alternative Layer location
  '/var/task/node_modules/@sparticuz/chromium/bin', // Local path if included in build
  '/tmp/chromium'                      // Temp directory that Lambda can write to
].filter(Boolean); // Remove undefined entries

// Templates for PDF headers/footers
const defaultHeaderTemplate = `
<div style="width: 100%; font-size: 10px; padding: 5px 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between;">
  <div>Generated on: <span class="date"></span></div>
  <div><span class="pageNumber"></span> of <span class="totalPages"></span></div>
</div>
`;

const defaultFooterTemplate = `
<div style="width: 100%; font-size: 10px; padding: 5px 20px; border-top: 1px solid #ddd; display: flex; justify-content: center;">
  <div>© Powered by Fundflo Technologies</div>
</div>
`;

// Check if we can force garbage collection
const canForceGc = typeof global.gc === 'function';

/**
 * Generate a PDF buffer from HTML content
 * @param {string} html - HTML content to convert to PDF
 * @param {Object} options - PDF generation options
 * @returns {Promise<Buffer>} - PDF as buffer
 */
module.exports = async function generatePdfBuffer(html, options = {}) {
  logger.info('Starting PDF generation process');
  logger.logMemoryUsage();
  
  // Log the execution environment
  const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  logger.info(`Execution environment: ${isLambda ? 'AWS Lambda' : 'Local'}`);
  
  // Ensure Lambda temp directories exist
  if (isLambda) {
    const tempDirs = [
      '/tmp/puppeteer-cache',
      '/tmp/chromium'
    ];
    
    for (const dir of tempDirs) {
      try {
        if (!fs.existsSync(dir)) {
          logger.info(`Creating directory: ${dir}`);
          fs.mkdirSync(dir, { recursive: true });
        }
      } catch (err) {
        logger.warn(`Error creating directory ${dir}: ${err.message}`);
      }
    }
    
    // Set cache directory for Puppeteer
    process.env.PUPPETEER_CACHE_DIR = '/tmp/puppeteer-cache';
  }
  
  // Check which paths exist
  const existingPaths = possibleChromiumPaths.filter(path => {
    try {
      return fs.existsSync(path);
    } catch (e) {
      return false;
    }
  });
  
  logger.info(`Possible Chromium paths: ${JSON.stringify(possibleChromiumPaths)}`);
  logger.info(`Existing Chromium paths: ${JSON.stringify(existingPaths)}`);
  
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
    timeout: 30000
  };

  // Merge options
  const pdfOptions = {
    ...defaultOptions,
    ...options,
    margin: { ...defaultOptions.margin, ...(options.margin || {}) },
    printBackground: true
  };

  // Prepare the HTML with styles
  const fullHtml = prepareHtml(html);
  
  let browser = null;
  
  try {
    // First try to use a custom executable path if it exists
    let executablePath;
    if (existingPaths.length > 0) {
      executablePath = existingPaths[0];
      logger.info(`Using found executable path: ${executablePath}`);
    } else {
      // Otherwise use the dynamic path from @sparticuz/chromium
      try {
        executablePath = await chromium.executablePath();
        logger.info(`Using dynamic executable path: ${executablePath}`);
      } catch (chromiumError) {
        logger.warn(`Error getting chromium path: ${chromiumError.message}`);
        
        // Try to explicitly download and install chromium to /tmp
        if (isLambda) {
          logger.info('Attempting to download Chromium to /tmp in Lambda environment');
          
          try {
            // Set the install path explicitly to /tmp
            process.env.CHROMIUM_PATH = '/tmp/chromium/chromium';
            
            // Force a re-download
            await chromium.executablePath({
              cacheDirectory: '/tmp',
              folder: '/tmp/chromium',
              forceInstallation: true
            });
            
            executablePath = '/tmp/chromium/chromium';
            
            // Make sure the binary is executable
            try {
              logger.info(`Setting executable permissions on ${executablePath}`);
              fs.chmodSync(executablePath, 0o755); // rwxr-xr-x permissions
              
              // Verify permissions were set correctly
              const stats = fs.statSync(executablePath);
              logger.info(`Chromium permissions: ${stats.mode.toString(8)}`);
            } catch (permissionError) {
              logger.error(`Error setting permissions: ${permissionError.message}`);
            }
            
            logger.info(`Downloaded Chromium to: ${executablePath}`);
          } catch (downloadError) {
            logger.error(`Failed to download Chromium: ${downloadError.message}`);
            throw new Error(`Could not find or download Chromium: ${downloadError.message}`);
          }
        } else {
          throw chromiumError; // Re-throw if not in Lambda
        }
      }
    }
    
    // Configure browser launch options optimized for Lambda
    const browserConfig = {
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--disable-extensions',
        '--remote-debugging-port=0',
        '--homedir=/tmp'
      ],
      defaultViewport: { width: 1280, height: 720 },
      executablePath,
      headless: chromium.headless || true,
      ignoreHTTPSErrors: true,
      cacheDirectory: '/tmp/puppeteer-cache'
    };
    
    logger.info('Launching browser with config', {
      executablePath: browserConfig.executablePath,
      headless: browserConfig.headless
    });
    
    // Verify executable permissions before launching
    if (isLambda) {
      await ensureExecutablePermissions(browserConfig.executablePath);
    }
    
    // Launch browser with proper error handling
    browser = await puppeteer.launch(browserConfig);
    logger.info('Browser launched successfully');
    
    // Generate the PDF
    const pdfBuffer = await generatePdf(browser, fullHtml, pdfOptions);
    
    // Record metrics and clean up
    logger.info(`PDF generated successfully. Buffer size: ${pdfBuffer.length} bytes`);
    logger.updateMetrics({ pdfSizeKB: Math.round(pdfBuffer.length / 1024) });
    
    // Clean up resources
    await closeBrowser(browser);
    browser = null;
    
    // Final memory check
    logger.logMemoryUsage();
    logger.logEnd();
    
    return pdfBuffer;
  } catch (error) {
    logger.error('Error generating PDF:', error);
    
    // More detailed error logging
    if (error.message && error.message.includes('executablePath')) {
      logger.error('Chromium executable path error. Details:', {
        possiblePaths: possibleChromiumPaths,
        existingPaths: existingPaths
      });
      
      // Try to list directory contents for debugging
      try {
        if (isLambda) {
          const baseDir = '/opt';
          const contents = fs.readdirSync(baseDir);
          logger.info(`Contents of ${baseDir}:`, contents);
          
          // Check common locations
          ['chrome', 'bin'].forEach(subdir => {
            if (contents.includes(subdir)) {
              try {
                const subdirContents = fs.readdirSync(`${baseDir}/${subdir}`);
                logger.info(`Contents of ${baseDir}/${subdir}:`, subdirContents);
              } catch (e) {
                logger.error(`Error listing ${baseDir}/${subdir}:`, e.message);
              }
            }
          });
        }
      } catch (fsErr) {
        logger.error('Error listing directory contents:', fsErr.message);
      }
    }
    
    await closeBrowser(browser);
    throw error;
  }
};

/**
 * Safely close the browser instance
 * @param {Object} browser - Puppeteer browser instance
 */
async function closeBrowser(browser) {
  if (browser) {
    try {
      logger.info('Closing browser');
      await browser.close();
      browser = null;
      
      // Try to free memory
      if (canForceGc) {
        logger.debug('Forcing garbage collection');
        global.gc();
      }
    } catch (closeError) {
      logger.error('Error closing browser:', closeError);
    }
  }
}

/**
 * Prepare HTML with needed styles for PDF generation
 * @param {string} html - Original HTML
 * @returns {string} - Enhanced HTML
 */
function prepareHtml(html) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'; img-src * data: blob: 'unsafe-inline';">
        ${defaultStyles}
        ${getImageHandlingScript()}
      </head>
      <body>
        ${html}
        <script>
          // Mark document as ready after a short delay to ensure all content is processed
          setTimeout(() => {
            document.body.setAttribute('data-pdf-ready', 'true');
          }, 1000);
        </script>
      </body>
    </html>
  `;
}

/**
 * Generate PDF using the browser instance
 * @param {Object} browser - Puppeteer browser instance
 * @param {string} html - HTML content
 * @param {Object} pdfOptions - PDF generation options
 * @returns {Promise<Buffer>} - Generated PDF buffer
 */
async function generatePdf(browser, html, pdfOptions) {
  // Create a new page
  logger.info('Creating new page');
  const page = await browser.newPage();
  
  // Set up monitoring
  setupPageMonitoring(page);
  
  try {
    // Set custom headers and bypass CSP
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Cache-Control': 'no-cache',
    });
    
    await page.setBypassCSP(true);
    
    // Set timeout for navigation
    await page.setDefaultNavigationTimeout(pdfOptions.timeout);
    
    // Set content with wait until option
    logger.info('Setting HTML content');
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: pdfOptions.timeout 
    });
  
    // Optional: Add local debugging step to take a screenshot
    if (process.env.DEBUG_MODE === 'true') {
      logger.debug('Taking debug screenshot');
      await page.screenshot({ path: '/tmp/debug-screenshot.png' });
    }
  
    // Wait for all images to load
    logger.info('Waiting for document to be ready...');
    try {
      await page.waitForSelector('body[data-pdf-ready="true"]', { 
        timeout: Math.min(pdfOptions.timeout / 2, 15000)
      });
      logger.info('Document ready for PDF generation');
    } catch (waitError) {
      logger.warn('Timeout waiting for document to be ready, continuing anyway');
    }
    
    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');
    
    // Generate PDF with provided options
    logger.info('Generating PDF with options:', {
      format: pdfOptions.format,
      landscape: pdfOptions.landscape,
      displayHeaderFooter: pdfOptions.displayHeaderFooter
    });
    
    const pdfBuffer = await page.pdf(pdfOptions);
    
    // Validate buffer
    if (!pdfBuffer || !(pdfBuffer instanceof Buffer)) {
      throw new Error('PDF generation failed: invalid buffer returned from puppeteer');
    }
    
    return pdfBuffer;
  } finally {
    try {
      await page.close();
    } catch (e) {
      // Ignore page close errors
    }
  }
}

/**
 * Set up monitoring for the Puppeteer page
 * @param {Object} page - Puppeteer page object
 */
function setupPageMonitoring(page) {
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
    const failure = request.failure ? request.failure() : { errorText: 'unknown'};
    
    logger.warn(`Request failed: ${request.url().substring(0, 100)}...`, {
      reason: failure ? failure.errorText : 'unknown'
    });
    
    if (request.resourceType() === 'image') {
      imageFailures++;
      logger.warn(`Image failed to load: ${request.url().substring(0, 100)}...`);
    }
  });
}

/**
 * Get script for handling images in the PDF
 * @returns {string} - Script for image handling
 */
function getImageHandlingScript() {
  return `
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
}