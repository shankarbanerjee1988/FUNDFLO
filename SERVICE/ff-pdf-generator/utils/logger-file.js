// utils/logger.js - Lowercase version for case-sensitive filesystems

/**
 * Simple Logger class for PDF generator service with additional metrics
 */
class Logger {
    /**
     * Create a new logger instance
     * @param {string} context - Context name for log prefixing
     */
    constructor(context) {
      this.context = context;
      this.startTime = Date.now();
      this.metrics = {};
    }
  
    /**
     * Log debug level message
     * @param {string} msg - Message to log
     * @param {*} data - Optional data to include
     */
    debug(msg, data) {
      if (process.env.LOG_LEVEL === 'debug') {
        console.log(`[DEBUG] [${this.context}] ${msg}`, data ? data : '');
      }
    }
  
    /**
     * Log info level message
     * @param {string} msg - Message to log
     * @param {*} data - Optional data to include
     */
    info(msg, data) {
      if (['debug', 'info'].includes(process.env.LOG_LEVEL || 'info')) {
        console.log(`[INFO] [${this.context}] ${msg}`, data ? data : '');
      }
    }
  
    /**
     * Log warning level message
     * @param {string} msg - Message to log
     * @param {*} data - Optional data to include
     */
    warn(msg, data) {
      if (['debug', 'info', 'warn'].includes(process.env.LOG_LEVEL || 'info')) {
        console.warn(`[WARN] [${this.context}] ${msg}`, data ? data : '');
      }
    }
  
    /**
     * Log error level message
     * @param {string} msg - Message to log
     * @param {*} data - Optional data to include
     */
    error(msg, data) {
      console.error(`[ERROR] [${this.context}] ${msg}`, data ? data : '');
    }
  
    /**
     * Log memory usage stats
     */
    logMemoryUsage() {
      const memUsage = process.memoryUsage();
      this.info(`Memory Usage: RSS ${Math.round(memUsage.rss / 1024 / 1024)}MB | ` +
        `Heap: ${Math.round(memUsage.heapUsed / 1024 / 1024)}/${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
    }
  
    /**
     * Update metrics object with new values
     * @param {Object} newMetrics - Metrics to add/update
     */
    updateMetrics(newMetrics = {}) {
      this.metrics = {
        ...this.metrics,
        ...newMetrics
      };
    }
  
    /**
     * Record PDF generation metrics
     * @param {Buffer} pdfBuffer - The generated PDF buffer
     * @param {Object} stats - Additional statistics
     */
    recordPdfGeneration(pdfBuffer, stats = {}) {
      const endTime = Date.now();
      const generationTime = endTime - this.startTime;
      
      this.info('PDF Generation Complete', {
        generationTimeMs: generationTime,
        pdfSizeKB: Math.round(pdfBuffer.length / 1024),
        ...stats
      });
  
      this.updateMetrics({
        generationTimeMs: generationTime,
        pdfSizeKB: Math.round(pdfBuffer.length / 1024)
      });
    }
  
    /**
     * Log final execution metrics
     */
    logEnd() {
      const endTime = Date.now();
      const executionTime = endTime - this.startTime;
      
      this.info(`Execution completed in ${executionTime}ms`, this.metrics);
    }
  }
  
  module.exports = Logger;