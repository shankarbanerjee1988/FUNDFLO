const Handlebars = require('handlebars');
const { marked } = require('marked');
const moment = require('moment');
const { LRUCache } = require('lru-cache'); // Import the class correctly
const { enhanceImagesForPdf, fixImageUrls } = require('./imageDebugger');
const Logger = require('./logger');

// Initialize logger
const logger = new Logger('Template-Renderer');

// Template cache configuration
const templateCache = new LRU({
  max: 100, // Maximum 100 templates in cache
  maxAge: 1000 * 60 * 60 // Cache for 1 hour
});

/**
 * Renders HTML from Handlebars template and data
 * @param {string} templateContent - Handlebars template
 * @param {Object} data - Data to be used in rendering
 * @returns {string} - Rendered HTML
 */
module.exports = function renderHtml(templateContent, data) {
  // Register Handlebars helpers (if not already registered)
  registerHandlebarsHelpers();
  
  try {
    // Create a hash for the template
    const templateHash = createHash(templateContent);
    
    // Check if template is in cache
    let template = templateCache.get(templateHash);
    let cacheHit = false;
    
    if (template) {
      logger.debug('Template cache hit');
      cacheHit = true;
    } else {
      // Compile and cache the template
      logger.debug('Template cache miss, compiling template');
      template = Handlebars.compile(templateContent);
      templateCache.set(templateHash, template);
    }
    
    // Render the template
    const renderStart = Date.now();
    let html = template(data || {});
    const renderTime = Date.now() - renderStart;
    
    logger.debug(`Template rendered in ${renderTime}ms (cache ${cacheHit ? 'hit' : 'miss'})`);
    
    // Process images
    const imageProcessStart = Date.now();
    html = enhanceImagesForPdf(html);
    html = fixImageUrls(html);
    const imageProcessTime = Date.now() - imageProcessStart;
    
    logger.debug(`Image processing completed in ${imageProcessTime}ms`);
    
    // Log rendering metrics
    logger.updateMetrics({
      templateRenderTime: renderTime,
      imageProcessingTime: imageProcessTime,
      templateCacheHit: cacheHit ? 1 : 0
    });
    
    return html;
  } catch (error) {
    logger.error('Error rendering HTML template:', { error: error.message });
    throw new Error(`Template rendering failed: ${error.message}`);
  }
};

// Helper function to create a hash for a template
function createHash(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString();
}

// Register all Handlebars helpers (only once)
let helpersRegistered = false;
function registerHandlebarsHelpers() {
  if (helpersRegistered) return;
  helpersRegistered = true;
  
  // Markdown helper
  Handlebars.registerHelper('markdown', function(md) {
    if (!md) return '';
    
    try {
      return new Handlebars.SafeString(marked.parse(String(md)));
    } catch (error) {
      logger.warn(`Markdown parsing error: ${error.message}`);
      return new Handlebars.SafeString(`<div class="markdown-error">${escapeHtml(md)}</div>`);
    }
  });

  // JSON Table helper
  Handlebars.registerHelper('jsonTable', function(context, options) {
    return new Handlebars.SafeString(jsonTable(context, options.hash));
  });

  // Formatting helpers
  Handlebars.registerHelper('formatNumber', formatNumber);
  Handlebars.registerHelper('formatCurrency', formatCurrency);

  // Math helpers
  Handlebars.registerHelper('multiply', (a, b) => {
    a = parseFloat(a) || 0;
    b = parseFloat(b) || 0;
    return a * b;
  });

  Handlebars.registerHelper('sum', function() {
    const args = Array.from(arguments).slice(0, -1);
    return args.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  });

  Handlebars.registerHelper('subtract', (a, b) => {
    a = parseFloat(a) || 0;
    b = parseFloat(b) || 0;
    return a - b;
  });

  Handlebars.registerHelper('divide', (a, b) => {
    a = parseFloat(a) || 0;
    b = parseFloat(b) || 0;
    
    if (b === 0) return '∞';
    return a / b;
  });

  // Date formatting helper
  Handlebars.registerHelper('formatDate', (date, formatStr = 'DD/MM/YYYY') => {
    if (!date) return '';
    
    // Ensure formatStr is a string
    if (typeof formatStr !== 'string') {
      logger.warn('Invalid date format:', formatStr);
      formatStr = 'DD/MM/YYYY';
    }
    
    try {
      const momentDate = moment(date);
      if (!momentDate.isValid()) return '';
      return momentDate.format(formatStr);
    } catch (error) {
      logger.warn(`Date formatting error: ${error.message}`);
      return date;
    }
  });

  // Page break helpers for manual page number control
  Handlebars.registerHelper('pageBreak', function() {
    return new Handlebars.SafeString('<div class="page-break-after"></div>');
  });

  Handlebars.registerHelper('pageBreakBefore', function() {
    return new Handlebars.SafeString('<div class="page-break-before"></div>');
  });

  // Avoid page break inside a block
  Handlebars.registerHelper('avoidBreak', function(options) {
    return new Handlebars.SafeString('<div class="avoid-break">' + options.fn(this) + '</div>');
  });

  // And all other existing helpers...
  
  logger.debug('Handlebars helpers registered');
}

/**
 * Converts JSON array to HTML table
 * @param {Array} data - Array of objects to render as table
 * @param {Object} options - Table rendering options
 * @returns {string} - HTML table
 */
function jsonTable(data, options = {}) {
  // Handle empty or invalid data
  if (!Array.isArray(data) || data.length === 0) {
    return '<div class="empty-table">No data available</div>';
  }
  
  // Extract options
  const { 
    classes = 'table table-bordered', 
    cellpadding = '5',
    striped = true
  } = options;
  
  // Get headers from first row
  const headers = Object.keys(data[0]);
  
  // Generate table header
  const thead = `<thead>
    <tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
  </thead>`;
  
  // Generate table body with row striping if enabled
  const tbody = `<tbody>
    ${data.map((row, index) => 
      `<tr${striped && index % 2 ? ' class="striped"' : ''}>
        ${headers.map(h => {
          // Special handling for image URLs in table cells
          const cellValue = row[h];
          if (typeof cellValue === 'string' && (cellValue.startsWith('http') || cellValue.startsWith('data:')) && 
              (cellValue.endsWith('.jpg') || cellValue.endsWith('.jpeg') || cellValue.endsWith('.png') || 
               cellValue.endsWith('.gif') || cellValue.endsWith('.svg') || cellValue.startsWith('data:image'))) {
            return `<td><img src="${escapeHtml(cellValue)}" style="max-width: 100px; max-height: 100px;" crossorigin="anonymous"></td>`;
          }
          return `<td>${escapeHtml(cellValue ?? '')}</td>`;
        }).join('')}
      </tr>`
    ).join('')}
  </tbody>`;
  
  // Return the complete table
  return `<table class="${classes}" cellpadding="${cellpadding}" cellspacing="0">
    ${thead}${tbody}
  </table>`;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {*} unsafe - Value to escape
 * @returns {string} - Escaped HTML
 */
function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  if (typeof unsafe !== 'string') unsafe = String(unsafe);
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format a number with specified decimals
 * @param {number} value - Number to format
 * @param {number} decimals - Decimal places
 * @returns {string} - Formatted number
 */
function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '';
  
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a number as currency
 * @param {number} value - Number to format
 * @param {string} currency - Currency code
 * @param {string} locale - Locale for formatting
 * @returns {string} - Formatted currency
 */
function formatCurrency(value, currency = 'INR', locale = 'en-IN') {
  if (value === null || value === undefined || isNaN(value)) return '';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    logger.warn(`Currency formatting error: ${error.message}`);
    return value;
  }
}