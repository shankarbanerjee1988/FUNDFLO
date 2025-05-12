const AWS = require('aws-sdk');
const cloudwatch = process.env.NODE_ENV !== 'test' ? new AWS.CloudWatch() : null;

class Logger {
  constructor(context) {
    this.context = context;
    this.requestId = null;
    this.startTime = Date.now();
    this.metrics = {};
  }
  
  // Set request ID for correlation
  setRequestId(id) {
    this.requestId = id;
    return this;
  }
  
  // Log messages with different levels
  debug(message, data = {}) {
    if (process.env.LOG_LEVEL === 'debug') {
      this._log('DEBUG', message, data);
    }
    return this;
  }
  
  info(message, data = {}) {
    this._log('INFO', message, data);
    return this;
  }
  
  warn(message, data = {}) {
    this._log('WARN', message, data);
    return this;
  }
  
  error(message, data = {}) {
    this._log('ERROR', message, data);
    return this;
  }
  
  // Internal logging method
  _log(level, message, data) {
    // Prepare log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      requestId: this.requestId,
      message,
      ...data
    };
    
    // Format as JSON string
    const logString = JSON.stringify(logEntry);
    
    // Output to console (CloudWatch Logs)
    switch(level) {
      case 'ERROR':
        console.error(logString);
        break;
      case 'WARN':
        console.warn(logString);
        break;
      default:
        console.log(logString);
    }
    
    return this;
  }
  
  // Update metrics
  updateMetrics(metrics) {
    this.metrics = {
      ...this.metrics,
      ...metrics
    };
    return this;
  }
  
  // Log memory usage
  logMemoryUsage() {
    const memUsage = process.memoryUsage();
    this.info('Memory usage', {
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
    });
    
    this.updateMetrics({
      memoryUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024)
    });
    
    return this;
  }
  
  // Record PDF generation performance
  recordPdfGeneration(pdfBuffer, stats = {}) {
    this.updateMetrics({
      pdfSizeKB: Math.round(pdfBuffer.length / 1024),
      generationDuration: Date.now() - this.startTime,
      ...stats
    });
    
    this.info('PDF generation completed', {
      metrics: this.metrics
    });
    
    // Send metrics to CloudWatch if enabled
    this._publishMetrics();
    
    return this;
  }
  
  // Log end of request
  logEnd() {
    const duration = Date.now() - this.startTime;
    this.updateMetrics({ totalDuration: duration });
    
    this.info('Request completed', { 
      durationMs: duration,
      metrics: this.metrics
    });
    
    return this;
  }
  
  // Publish metrics to CloudWatch
  _publishMetrics() {
    if (!cloudwatch || process.env.NODE_ENV === 'test') return;
    
    try {
      const metricData = Object.entries(this.metrics).map(([key, value]) => ({
        MetricName: key,
        Dimensions: [
          { Name: 'Service', Value: 'PDFGenerator' },
          { Name: 'Environment', Value: process.env.STAGE || 'development' }
        ],
        Unit: this._determineUnit(key, value),
        Value: parseFloat(value) || 0
      }));
      
      if (metricData.length === 0) return;
      
      cloudwatch.putMetricData({
        Namespace: 'PDF/Generator',
        MetricData: metricData
      }).promise().catch(err => {
        console.error('Error publishing metrics:', err);
      });
    } catch (err) {
      console.error('Error preparing metrics:', err);
    }
    
    return this;
  }
  
  // Determine appropriate CloudWatch metric unit
  _determineUnit(key, value) {
    if (key.includes('Time') || key.includes('Duration')) {
      return 'Milliseconds';
    } else if (key.includes('Count')) {
      return 'Count';
    } else if (key.includes('Size') || key.includes('Memory') || key.includes('MB')) {
      return 'Kilobytes';
    } else if (key.includes('Percentage') || key.includes('Ratio')) {
      return 'Percent';
    }
    return 'None';
  }
}

module.exports = Logger;