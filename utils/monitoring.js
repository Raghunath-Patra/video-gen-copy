// utils/monitoring.js - Production monitoring and metrics
const startTime = Date.now();
const metrics = {
  requests: 0,
  errors: 0,
  scriptGenerations: 0,
  videoGenerations: 0,
  responseTime: []
};

let healthStatus = 'healthy';
let healthIssues = [];

class Monitoring {
  // Request middleware for tracking
  static requestMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      metrics.requests++;
      
      // Track response time
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        metrics.responseTime.push(duration);
        
        // Keep only last 100 response times
        if (metrics.responseTime.length > 100) {
          metrics.responseTime.shift();
        }
        
        // Track errors
        if (res.statusCode >= 400) {
          metrics.errors++;
        }
      });
      
      next();
    };
  }
  
  // Error middleware for tracking
  static errorMiddleware() {
    return (error, req, res, next) => {
      metrics.errors++;
      this.error('Request error', error, {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode
      });
      next(error);
    };
  }
  
  // Log info message
  static info(message, data = {}) {
    console.log(`[INFO] ${message}`, data);
  }
  
  // Log error message
  static error(message, error, data = {}) {
    console.error(`[ERROR] ${message}`, {
      error: error.message,
      stack: error.stack,
      ...data
    });
  }
  
  // Track script generation
  static trackScriptGeneration(projectId, userId, stepCount) {
    metrics.scriptGenerations++;
    this.info('Script generated', {
      projectId,
      userId,
      stepCount,
      timestamp: new Date().toISOString()
    });
  }
  
  // Track video generation
  static trackVideoGeneration(projectId, userId, duration) {
    metrics.videoGenerations++;
    this.info('Video generated', {
      projectId,
      userId,
      duration,
      timestamp: new Date().toISOString()
    });
  }
  
  // Get health status
  static getHealthStatus() {
    const uptime = Date.now() - startTime;
    const avgResponseTime = metrics.responseTime.length > 0 
      ? metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length 
      : 0;
    
    // Determine health status
    let status = 'healthy';
    const issues = [];
    
    if (avgResponseTime > 5000) {
      status = 'degraded';
      issues.push('High response time');
    }
    
    if (metrics.errors > metrics.requests * 0.1) {
      status = 'unhealthy';
      issues.push('High error rate');
    }
    
    return {
      status,
      issues,
      metrics: {
        uptime: Math.floor(uptime / 1000),
        requests: metrics.requests,
        errors: metrics.errors,
        errorRate: metrics.requests > 0 ? (metrics.errors / metrics.requests * 100).toFixed(2) : 0,
        avgResponseTime: Math.round(avgResponseTime),
        scriptGenerations: metrics.scriptGenerations,
        videoGenerations: metrics.videoGenerations
      }
    };
  }
  
  // Get metrics for export (Prometheus format)
  static getMetricsForExport() {
    const uptime = Date.now() - startTime;
    const avgResponseTime = metrics.responseTime.length > 0 
      ? metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length 
      : 0;
    
    return {
      video_generator_uptime_seconds: Math.floor(uptime / 1000),
      video_generator_requests_total: metrics.requests,
      video_generator_errors_total: metrics.errors,
      video_generator_response_time_avg_ms: Math.round(avgResponseTime),
      video_generator_scripts_generated_total: metrics.scriptGenerations,
      video_generator_videos_generated_total: metrics.videoGenerations,
      video_generator_memory_usage_bytes: process.memoryUsage().heapUsed,
      video_generator_cpu_usage_percent: process.cpuUsage().user / 1000000 // Convert to percentage
    };
  }
}

module.exports = Monitoring;