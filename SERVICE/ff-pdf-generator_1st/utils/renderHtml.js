const Handlebars = require('handlebars');
const { marked } = require('marked');
const moment = require('moment');

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
    return template(data || {});
  } catch (error) {
    console.error('Error rendering HTML template:', error);
    throw new Error(`Template rendering failed: ${error.message}`);
  }
};

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
        ${headers.map(h => `<td>${escapeHtml(row[h] ?? '')}</td>`).join('')}
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
}