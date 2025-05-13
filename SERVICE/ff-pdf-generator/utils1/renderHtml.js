const Handlebars = require('handlebars');
const { marked } = require('marked');
const moment = require('moment');

// Import the image utilities
const { enhanceImagesForPdf, fixImageUrls } = require('./imageDebugger');

/**
 * Renders HTML from Handlebars template and data
 * @param {string} templateContent - Handlebars template
 * @param {Object} data - Data to be used in rendering
 * @returns {string} - Rendered HTML
 */
module.exports = function renderHtml(templateContent, data) {
  // Register Handlebars helpers
  registerHandlebarsHelpers();
  
  try {
    // Compile and render the template
    const template = Handlebars.compile(templateContent);
    let html = template(data || {});
    
    // Enhance HTML for better image rendering
    html = enhanceImagesForPdf(html);
    
    // Fix any problematic image URLs
    html = fixImageUrls(html);
    
    return html;
  } catch (error) {
    console.error('Error rendering HTML template:', error);
    throw new Error(`Template rendering failed: ${error.message}`);
  }
};

// Register images helper
Handlebars.registerHelper('base64Image', function(src) {
  try {
    // This helper allows using base64 images directly in templates
    if (!src) return '';
    
    // If it's already a data URL, return as is
    if (src.startsWith('data:')) {
      return new Handlebars.SafeString(`<img src="${src}" style="max-width: 100%; height: auto; display: block;" />`);
    }
    
    // Otherwise, return a regular image tag
    return new Handlebars.SafeString(`<img src="${src}" style="max-width: 100%; height: auto; display: block;" crossorigin="anonymous" />`);
  } catch (error) {
    console.error(`Error processing image: ${error.message}`);
    return '';
  }
});

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
    console.warn(`Currency formatting error: ${error.message}`);
    return value;
  }
}

/**
 * Register all Handlebars helpers
 */
function registerHandlebarsHelpers() {
  // Markdown helper
  Handlebars.registerHelper('markdown', function(md) {
    if (!md) return '';
    
    try {
      return new Handlebars.SafeString(marked.parse(String(md)));
    } catch (error) {
      console.warn(`Markdown parsing error: ${error.message}`);
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
      console.warn('Invalid date format:', formatStr);
      formatStr = 'DD/MM/YYYY';
    }
    
    try {
      const momentDate = moment(date);
      if (!momentDate.isValid()) return '';
      return momentDate.format(formatStr);
    } catch (error) {
      console.warn(`Date formatting error: ${error.message}`);
      return date;
    }
  });

  Handlebars.registerHelper('formatDateDDMMYY', (date, formatStr = 'DD MM YYYY') => {
    if (!date) return '';
    
    // Ensure formatStr is a string
    if (typeof formatStr !== 'string') {
      console.warn('Invalid date format:', formatStr);
      formatStr = 'DD-MM-YYYY';
    }
    
    try {
      const momentDate = moment(date);
      if (!momentDate.isValid()) return '';
      return momentDate.format(formatStr);
    } catch (error) {
      console.warn(`Date formatting error: ${error.message}`);
      return date;
    }
  });

  // Conditional helpers
  Handlebars.registerHelper('ifEq', function(a, b, options) {
    return a == b ? options.fn(this) : options.inverse(this);
  });
  
  Handlebars.registerHelper('ifGt', function(a, b, options) {
    return a > b ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper('isEven', function(value, options) {
    return parseInt(value) % 2 === 0 ? options.fn(this) : options.inverse(this);
  });
  
  Handlebars.registerHelper('isOdd', function(value, options) {
    return parseInt(value) % 2 !== 0 ? options.fn(this) : options.inverse(this);
  });
  
  Handlebars.registerHelper('contains', function(haystack, needle, options) {
    if (!haystack) return options.inverse(this);
    
    const found = Array.isArray(haystack)
      ? haystack.includes(needle)
      : String(haystack).includes(String(needle));
      
    return found ? options.fn(this) : options.inverse(this);
  });
  
  Handlebars.registerHelper('startsWith', function(str, prefix, options) {
    if (!str) return options.inverse(this);
    return String(str).startsWith(String(prefix)) ? options.fn(this) : options.inverse(this);
  });
  
  Handlebars.registerHelper('endsWith', function(str, suffix, options) {
    if (!str) return options.inverse(this);
    return String(str).endsWith(String(suffix)) ? options.fn(this) : options.inverse(this);
  });

  // Advanced conditional helper
  Handlebars.registerHelper('ifCond', function(v1, op, v2, options) {
    switch (op) {
      case '==': return v1 == v2 ? options.fn(this) : options.inverse(this);
      case '===': return v1 === v2 ? options.fn(this) : options.inverse(this);
      case '!=': return v1 != v2 ? options.fn(this) : options.inverse(this);
      case '<': return v1 < v2 ? options.fn(this) : options.inverse(this);
      case '<=': return v1 <= v2 ? options.fn(this) : options.inverse(this);
      case '>': return v1 > v2 ? options.fn(this) : options.inverse(this);
      case '>=': return v1 >= v2 ? options.fn(this) : options.inverse(this);
      case '&&': return v1 && v2 ? options.fn(this) : options.inverse(this);
      case '||': return v1 || v2 ? options.fn(this) : options.inverse(this);
      default: return options.inverse(this);
    }
  });
  
  // String helpers
  Handlebars.registerHelper('toLowerCase', function(str) {
    return str ? String(str).toLowerCase() : '';
  });
  
  Handlebars.registerHelper('toUpperCase', function(str) {
    return str ? String(str).toUpperCase() : '';
  });
  
  Handlebars.registerHelper('truncate', function(str, length, end = '...') {
    if (!str) return '';
    str = String(str);
    if (str.length <= length) return str;
    return str.slice(0, length) + end;
  });
  
  // Array helpers
  Handlebars.registerHelper('join', function(array, separator = ', ') {
    if (!Array.isArray(array)) return '';
    return array.join(separator);
  });
  
  Handlebars.registerHelper('first', function(array, count = 1) {
    if (!Array.isArray(array)) return '';
    return array.slice(0, count);
  });
  
  Handlebars.registerHelper('last', function(array, count = 1) {
    if (!Array.isArray(array)) return '';
    return array.slice(-count);
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

// Custom page number counter (for custom page numbering in document body)
Handlebars.registerHelper('pageCounter', function(options) {
  // This adds a visible page number inside the document content
  // Not the same as header/footer page numbers, but useful for documents with sections
  const classes = options.hash.class || '';
  const style = options.hash.style || 'text-align: center; font-size: 10pt; color: #888;';
  
  return new Handlebars.SafeString(
    `<div class="page-counter ${classes}" style="${style}">
      Page <span class="counter"></span>
    </div>
    <script>
      // Will be replaced with actual page number during PDF generation
      document.querySelectorAll('.counter').forEach(function(el, i) {
        el.textContent = (i + 1);
      });
    </script>`
  );
});

// Section numbering helper (for creating sections with their own page numbers)
Handlebars.registerHelper('section', function(options) {
  const sectionName = options.hash.name || '';
  const sectionNumber = options.hash.number || '';
  const showPageNumbers = options.hash.showPageNumbers !== false;
  
  let result = '<div class="section">';
  
  // Add section header if provided
  if (sectionName || sectionNumber) {
    result += `<div class="section-header">`;
    if (sectionNumber) {
      result += `<span class="section-number">${sectionNumber}</span> `;
    }
    if (sectionName) {
      result += `<span class="section-name">${sectionName}</span>`;
    }
    result += `</div>`;
  }
  
  // Add page numbers if requested
  if (showPageNumbers) {
    result += `<div class="section-page-numbers" style="position: absolute; right: 20px; bottom: 20px; font-size: 10pt;">
      Section ${sectionNumber} - Page <span class="section-page"></span>
    </div>`;
  }
  
  // Add section content
  result += options.fn(this);
  result += '</div>';
  
  return new Handlebars.SafeString(result);
});


}