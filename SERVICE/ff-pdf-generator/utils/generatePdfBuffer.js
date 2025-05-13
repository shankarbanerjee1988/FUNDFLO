// Lambda Layer-only generatePdfBuffer.js implementation
// Only uses pre-installed Chromium from Lambda layers without downloading

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { defaultStyles } = require('./defaultValue');
const { execSync } = require('child_process');

// Set up logging
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

/**
 * Generate a PDF buffer from HTML content
 * @param {string} html - HTML content to convert to PDF
 * @param {Object} options - PDF generation options
 * @returns {Promise<Buffer>} - PDF as buffer
 */
module.exports = async function generatePdfBuffer(html, options = {}) {
  logger.info('Starting PDF generation process - Lambda Layer Only approach');
  logger.logMemoryUsage();
  
  // Dump debug information about the environment
  dumpDebugInfo();
  
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
  let pdfBuffer = null;
  
  try {
    // Find the Chromium executable in Lambda layers
    const chromiumPaths = await findAllChromiumExecutables();
    logger.info(`Found ${chromiumPaths.length} possible Chromium executables:`, chromiumPaths);
    
    if (chromiumPaths.length === 0) {
      throw new Error('No Chromium executable found in Lambda layers');
    }
    
    // Try each executable path in order
    for (let i = 0; i < chromiumPaths.length; i++) {
      const executablePath = chromiumPaths[i];
      logger.info(`Attempt ${i+1}/${chromiumPaths.length}: Using executable at ${executablePath}`);
      
      try {
        // Configure browser for this executable
        const browserConfig = {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--hide-scrollbars',
            '--disable-web-security',
            '--single-process',
            '--no-zygote',
            '--disable-extensions'
          ],
          executablePath,
          headless: true,
          ignoreHTTPSErrors: true,
          defaultViewport: { width: 1280, height: 720 }
        };
        
        logger.info(`Launching browser with executable ${executablePath}`);
        browser = await puppeteer.launch(browserConfig);
        logger.info('Browser launched successfully!');
        
        // Generate PDF
        pdfBuffer = await generatePdf(browser, fullHtml, pdfOptions);
        logger.info(`PDF generated successfully. Size: ${pdfBuffer.length} bytes`);
        
        // If we get here, it worked, so break out of the loop
        break;
      } catch (launchError) {
        logger.warn(`Failed to launch with ${executablePath}: ${launchError.message}`);
        
        // Close browser if it was opened despite error
        if (browser) {
          await browser.close();
          browser = null;
        }
        
        // If this is the last executable to try, rethrow the error
        if (i === chromiumPaths.length - 1) {
          throw new Error(`All Chromium executables failed: ${launchError.message}`);
        }
        // Otherwise, continue to the next executable
      }
    }
    
    // Return the generated PDF
    return pdfBuffer;
  } catch (error) {
    logger.error('Error generating PDF:', error.message);
    logger.error('Stack trace:', error.stack);
    throw error;
  } finally {
    // Clean up resources
    if (browser) {
      await browser.close();
      logger.info('Browser closed');
    }
  }
};

/**
 * Find all Chromium executables in Lambda layers
 * @returns {Promise<string[]>} - Array of paths to Chromium executables
 */
async function findAllChromiumExecutables() {
  const executables = [];
  
  // Search in /opt directories first (Lambda layers)
  if (fs.existsSync('/opt')) {
    // Top level paths to check in /opt
    const optPaths = [
      '/opt/bin/chromium',
      '/opt/chrome/headless-chromium',
      '/opt/chrome/chrome'
    ];
    
    // Add any that exist
    for (const path of optPaths) {
      if (fs.existsSync(path)) {
        executables.push(path);
      }
    }
    
    // Search recursively in /opt if we haven't found anything yet
    if (executables.length === 0) {
      const optChromium = findChromiumInDirectory('/opt');
      executables.push(...optChromium);
    }
  }
  
  // Check node_modules after /opt
  const nodeModulePaths = [
    '/var/task/node_modules/@sparticuz/chromium/bin',
    '/var/task/node_modules/@sparticuz/chromium/bin/chromium',
    '/var/task/node_modules/chrome-aws-lambda/bin/chromium',
    '/opt/nodejs/node_modules/chrome-aws-lambda/bin/chromium'
  ];
  
  for (const path of nodeModulePaths) {
    if (fs.existsSync(path)) {
      executables.push(path);
    }
  }
  
  // Check any environment variable paths
  const envPaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROMIUM_PATH,
    process.env.CHROME_AWS_LAMBDA_EXECUTABLE_PATH
  ].filter(Boolean); // Remove undefined/null values
  
  for (const path of envPaths) {
    if (fs.existsSync(path) && !executables.includes(path)) {
      executables.push(path);
    }
  }
  
  return executables;
}

/**
 * Find Chromium executables in a directory
 * @param {string} directory - Directory to search
 * @returns {string[]} - Array of found Chromium paths
 */
function findChromiumInDirectory(directory) {
  const results = [];
  
  try {
    if (!fs.existsSync(directory)) return results;
    
    const items = fs.readdirSync(directory);
    
    // First pass: look for chromium/chrome directly
    for (const item of items) {
      const fullPath = path.join(directory, item);
      
      try {
        const stats = fs.statSync(fullPath);
        
        if (stats.isFile()) {
          // Check for common chromium filenames
          const lowercaseName = item.toLowerCase();
          if (
            lowercaseName === 'chromium' || 
            lowercaseName === 'chrome' || 
            lowercaseName === 'headless-chromium'
          ) {
            results.push(fullPath);
          }
        }
      } catch (e) {
        // Skip errors
      }
    }
    
    // Second pass: check subdirectories (only if we haven't found anything yet)
    if (results.length === 0) {
      for (const item of items) {
        const fullPath = path.join(directory, item);
        
        try {
          const stats = fs.statSync(fullPath);
          
          if (stats.isDirectory()) {
            // Skip node_modules to avoid deep recursion
            if (item === 'node_modules') continue;
            
            // Check some common directory names first
            if (
              item === 'bin' || 
              item === 'chrome' || 
              item === 'chromium'
            ) {
              const subResults = findChromiumInDirectory(fullPath);
              results.push(...subResults);
            }
            // For other directories, only recurse one level deep to avoid getting stuck
            else if (directory === '/opt') {
              const subResults = findChromiumInDirectory(fullPath);
              results.push(...subResults);
            }
          }
        } catch (e) {
          // Skip errors
        }
      }
    }
  } catch (error) {
    logger.warn(`Error searching directory ${directory}: ${error.message}`);
  }
  
  return results;
}

/**
 * Prepare HTML with styles for PDF generation
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
        <script>
          // Add event listener to all images
          document.addEventListener('DOMContentLoaded', function() {
            const images = document.querySelectorAll('img');
            let loadedCount = 0;
            let errorCount = 0;
            const totalImages = images.length;
            
            console.log('Total images found: ' + totalImages);
            
            if (totalImages === 0) {
              document.body.setAttribute('data-images-loaded', 'true');
              return;
            }
            
            images.forEach(function(img) {
              // Set crossOrigin attribute for CORS images
              if (!img.src.startsWith('data:')) {
                img.crossOrigin = 'anonymous';
              }
              
              // Handle load/error events
              img.onload = function() {
                loadedCount++;
                if (loadedCount + errorCount === totalImages) {
                  document.body.setAttribute('data-images-loaded', 'true');
                }
              };
              
              img.onerror = function() {
                errorCount++;
                if (loadedCount + errorCount === totalImages) {
                  document.body.setAttribute('data-images-loaded', 'true');
                }
              };
              
              // Force re-trigger of load events
              if (img.complete) {
                if (img.naturalWidth === 0) {
                  img.onerror();
                } else {
                  img.onload();
                }
              }
            });
            
            // Set a timeout to proceed after 5s
            setTimeout(function() {
              document.body.setAttribute('data-images-loaded', 'true');
            }, 5000);
          });
        </script>
      </head>
      <body>
        ${html}
        <script>
          // Mark document as ready
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
  const page = await browser.newPage();
  
  try {
    // Log browser version
    const version = await browser.version();
    logger.info(`Browser version: ${version}`);
    
    // Set custom headers and bypass CSP
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      'Cache-Control': 'no-cache',
    });
    
    await page.setBypassCSP(true);
    
    // Set timeout for navigation
    await page.setDefaultNavigationTimeout(pdfOptions.timeout);
    
    // Set content
    logger.info('Setting HTML content');
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: pdfOptions.timeout 
    });
  
    // Wait for document ready state
    try {
      logger.info('Waiting for document to be ready');
      await page.waitForSelector('body[data-pdf-ready="true"]', { 
        timeout: Math.min(pdfOptions.timeout / 2, 15000)
      });
      logger.info('Document ready for PDF generation');
    } catch (waitError) {
      logger.warn('Timeout waiting for document to be ready, continuing anyway');
    }
    
    // Generate PDF
    logger.info('Generating PDF with options:', {
      format: pdfOptions.format,
      landscape: pdfOptions.landscape
    });
    
    const pdfBuffer = await page.pdf(pdfOptions);
    
    if (!pdfBuffer || !(pdfBuffer instanceof Buffer)) {
      throw new Error('PDF generation failed: invalid buffer returned from puppeteer');
    }
    
    return pdfBuffer;
  } finally {
    // Clean up resources
    try {
      await page.close();
    } catch (e) {
      // Ignore page close errors
    }
  }
}

/**
 * Dump debug information about the environment
 */
function dumpDebugInfo() {
  try {
    logger.info('Lambda environment debug info:');
    
    // System info
    logger.info('System info:', {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      env: process.env.AWS_EXECUTION_ENV || 'local'
    });
    
    // Check key directories more thoroughly
    const directories = [
      '/',
      '/opt',
      '/opt/bin',
      '/opt/chrome',
      '/var/task',
      '/var/runtime',
      '/var/lang',
      '/var/lang/bin',
      '/usr/bin',
      '/usr/local/bin'
    ];
    
    directories.forEach(dir => {
      try {
        if (fs.existsSync(dir)) {
          const items = fs.readdirSync(dir);
          logger.info(`Contents of ${dir}:`, items);
          
          // For important directories, go one level deeper
          if (['/opt', '/opt/bin', '/var/runtime', '/opt/chrome'].includes(dir)) {
            items.forEach(item => {
              const subdir = `${dir}/${item}`;
              try {
                if (fs.existsSync(subdir) && fs.statSync(subdir).isDirectory()) {
                  const subitems = fs.readdirSync(subdir);
                  logger.info(`Contents of ${subdir}:`, subitems);
                }
              } catch (e) {
                logger.warn(`Error reading subdirectory ${subdir}: ${e.message}`);
              }
            });
          }
        } else {
          logger.info(`Directory ${dir} does not exist`);
        }
      } catch (e) {
        logger.warn(`Error reading directory ${dir}: ${e.message}`);
      }
    });
    
    // Check for any executable files in /opt and its subdirectories
    try {
      if (fs.existsSync('/opt')) {
        findExecutablesInDirectory('/opt', 2);
      }
    } catch (e) {
      logger.warn(`Error searching for executables: ${e.message}`);
    }
    
    // List ALL Lambda layers
    try {
      const layersDir = '/opt';
      if (fs.existsSync(layersDir)) {
        logger.info('*** LAMBDA LAYERS INSPECTION ***');
        
        // First level inspection
        const items = fs.readdirSync(layersDir);
        logger.info(`Lambda layers (${items.length}):`, items);
        
        // Recursive search for chromium in all of /opt
        const chromiumFiles = findFilesWithName(layersDir, ['chromium', 'chrome', 'headless-chromium'], 3);
        logger.info(`Found ${chromiumFiles.length} chromium-related files:`, chromiumFiles);
      }
    } catch (e) {
      logger.warn(`Error inspecting layers: ${e.message}`);
    }
    
    // Environment variables
    logger.info('Environment variables:', {
      PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH,
      CHROMIUM_PATH: process.env.CHROMIUM_PATH,
      PATH: process.env.PATH,
      NODE_PATH: process.env.NODE_PATH
    });
    
  } catch (error) {
    logger.warn('Error during debug dump:', error.message);
  }
}

/**
 * Find executable files in a directory
 * @param {string} directory - Directory to search
 * @param {number} maxDepth - Maximum recursion depth
 * @param {number} currentDepth - Current recursion depth
 */
function findExecutablesInDirectory(directory, maxDepth = 2, currentDepth = 0) {
  if (currentDepth > maxDepth) return;
  
  try {
    if (!fs.existsSync(directory)) return;
    
    const items = fs.readdirSync(directory);
    items.forEach(item => {
      const fullPath = `${directory}/${item}`;
      try {
        const stats = fs.statSync(fullPath);
        if (stats.isFile() && (stats.mode & 0o111)) { // Check if file is executable
          logger.info(`Executable found: ${fullPath} (permissions: ${stats.mode.toString(8)})`);
        } else if (stats.isDirectory()) {
          findExecutablesInDirectory(fullPath, maxDepth, currentDepth + 1);
        }
      } catch (e) {
        // Skip files with permission issues
      }
    });
  } catch (e) {
    // Skip directories with permission issues
  }
}

/**
 * Find files with specific name in directory and subdirectories
 * @param {string} directory - Directory to search
 * @param {Array<string>} namePatterns - Array of name patterns to match
 * @param {number} maxDepth - Maximum recursion depth
 * @param {number} currentDepth - Current recursion depth
 * @returns {Array<string>} - Array of matching file paths
 */
function findFilesWithName(directory, namePatterns, maxDepth = 3, currentDepth = 0) {
  const results = [];
  
  if (currentDepth > maxDepth) return results;
  
  try {
    if (!fs.existsSync(directory)) return results;
    
    const items = fs.readdirSync(directory);
    items.forEach(item => {
      const fullPath = `${directory}/${item}`;
      try {
        const stats = fs.statSync(fullPath);
        if (stats.isFile()) {
          const lowerName = item.toLowerCase();
          if (namePatterns.some(pattern => lowerName.includes(pattern.toLowerCase()))) {
            results.push({
              path: fullPath,
              permissions: stats.mode.toString(8),
              size: stats.size,
              isExecutable: !!(stats.mode & 0o111)
            });
          }
        } else if (stats.isDirectory()) {
          const subResults = findFilesWithName(fullPath, namePatterns, maxDepth, currentDepth + 1);
          results.push(...subResults);
        }
      } catch (e) {
        // Skip files with permission issues
      }
    });
  } catch (e) {
    // Skip directories with permission issues
  }
  
  return results;
}