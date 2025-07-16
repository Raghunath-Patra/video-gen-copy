// utils/monitoring.js - Production monitoring and logging utilities
const fs = require('fs').promises;
const path = require('path');

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      videoGenerations: 0,
      scriptGenerations: 0,
      activeUsers: new Set(),
      responseTime: [],
      memoryUsage: [],
      startTime: Date.now()
    };
    
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.enableRequestLogging = process.env.ENABLE_REQUEST_LOGGING === 'true';
    
    // Start periodic monitoring
    this.startPeriodicMonitoring();
  }
  
  // Logging methods
  log(level, message, meta = {}) {
    const logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    if (logLevels[level] <= logLevels[this.logLevel]) {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        message,
        ...meta
      };
      
      console.log(JSON.stringify(logEntry));
      
      // In production, you might want to send logs to an external service
      if (process.env.NODE_ENV === 'production') {
        this.sendToLogService(logEntry);
      }
    }
  }
  
  error(message, error = null, meta = {}) {
    this.metrics.errors++;
    this.log('error', message, {
      error: error?.message,
      stack: error?.stack,
      ...meta
    });
  }
  
  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }
  
  info(message, meta = {}) {
    this.log('info', message, meta);
  }
  
  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }
  
  // Request tracking
  trackRequest(req, res, responseTime) {
    this.metrics.requests++;
    this.metrics.responseTime.push(responseTime);
    
    if (req.user?.id) {
      this.metrics.activeUsers.add(req.user.id);
    }
    
    if (this.enableRequestLogging) {
      this.log('info', 'Request completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        ip: req.ip
      });
    }
    
    // Keep only last 1000 response times
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
    }
  }
  
  // Feature-specific tracking
  trackVideoGeneration(projectId, userId, duration) {
    this.metrics.videoGenerations++;
    this.info('Video generation completed', {
      projectId,
      userId,
      duration: `${duration}s`,
      feature: 'video_generation'
    });
  }
  
  trackScriptGeneration(projectId, userId, stepsCount) {
    this.metrics.scriptGenerations++;
    this.info('Script generation completed', {
      projectId,
      userId,
      stepsCount,
      feature: 'script_generation'
    });
  }
  
  // System monitoring
  startPeriodicMonitoring() {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60000); // Every minute
    
    setInterval(() => {
      this.logMetricsSummary();
    }, 300000); // Every 5 minutes
  }
  
  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    });
    
    // Keep only last 100 memory measurements
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
    }
    
    // Alert on high memory usage
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (memUsagePercent > 90) {
      this.warn('High memory usage detected', {
        memoryUsagePercent: memUsagePercent.toFixed(2),
        heapUsed: this.formatBytes(memUsage.heapUsed),
        heapTotal: this.formatBytes(memUsage.heapTotal)
      });
    }
  }
  
  logMetricsSummary() {
    const uptime = Date.now() - this.metrics.startTime;
    const avgResponseTime = this.metrics.responseTime.length > 0 
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
      : 0;
    
    const lastMemUsage = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    
    this.info('Service metrics summary', {
      uptime: this.formatDuration(uptime),
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%' : '0%',
      videoGenerations: this.metrics.videoGenerations,
      scriptGenerations: this.metrics.scriptGenerations,
      activeUsers: this.metrics.activeUsers.size,
      avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      memoryUsage: lastMemUsage ? this.formatBytes(lastMemUsage.heapUsed) : 'N/A'
    });
  }
  
  // Health check for monitoring systems
  getHealthStatus() {
    const memUsage = process.memoryUsage();
    const uptime = Date.now() - this.metrics.startTime;
    const avgResponseTime = this.metrics.responseTime.length > 0 
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
      : 0;
    
    const errorRate = this.metrics.requests > 0 
      ? (this.metrics.errors / this.metrics.requests) * 100
      : 0;
    
    // Determine health status
    let status = 'healthy';
    const issues = [];
    
    if (errorRate > 10) {
      status = 'degraded';
      issues.push(`High error rate: ${errorRate.toFixed(2)}%`);
    }
    
    if (avgResponseTime > 5000) {
      status = 'degraded';
      issues.push(`Slow response time: ${avgResponseTime.toFixed(2)}ms`);
    }
    
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (memUsagePercent > 95) {
      status = 'unhealthy';
      issues.push(`Critical memory usage: ${memUsagePercent.toFixed(2)}%`);
    }
    
    return {
      status,
      issues,
      metrics: {
        uptime: this.formatDuration(uptime),
        requests: this.metrics.requests,
        errors: this.metrics.errors,
        errorRate: `${errorRate.toFixed(2)}%`,
        videoGenerations: this.metrics.videoGenerations,
        scriptGenerations: this.metrics.scriptGenerations,
        activeUsers: this.metrics.activeUsers.size,
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        memoryUsage: {
          used: this.formatBytes(memUsage.heapUsed),
          total: this.formatBytes(memUsage.heapTotal),
          percent: `${memUsagePercent.toFixed(2)}%`
        }
      },
      timestamp: new Date().toISOString()
    };
  }
  
  // Express middleware for request tracking
  requestMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        this.trackRequest(req, res, responseTime);
      });
      
      next();
    };
  }
  
  // Error handling middleware
  errorMiddleware() {
    return (error, req, res, next) => {
      this.error('Unhandled request error', error, {
        method: req.method,
        url: req.url,
        userId: req.user?.id,
        ip: req.ip
      });
      
      next(error);
    };
  }
  
  // Utility methods
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
  
  // Send to external log service (implement as needed)
  async sendToLogService(logEntry) {
    // Implement integration with services like:
    // - Logtail
    // - Datadog
    // - New Relic
    // - Custom webhook
    
    if (process.env.LOG_WEBHOOK_URL) {
      try {
        await fetch(process.env.LOG_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        });
      } catch (error) {
        // Don't throw errors for logging failures
        console.error('Failed to send log to external service:', error.message);
      }
    }
  }
  
  // Export metrics for external monitoring
  getMetricsForExport() {
    return {
      video_generations_total: this.metrics.videoGenerations,
      script_generations_total: this.metrics.scriptGenerations,
      requests_total: this.metrics.requests,
      errors_total: this.metrics.errors,
      active_users: this.metrics.activeUsers.size,
      uptime_seconds: Math.floor((Date.now() - this.metrics.startTime) / 1000),
      memory_usage_bytes: process.memoryUsage().heapUsed,
      avg_response_time_ms: this.metrics.responseTime.length > 0 
        ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
        : 0
    };
  }
}

// Create singleton instance
const monitoring = new MonitoringService();

module.exports = monitoring;