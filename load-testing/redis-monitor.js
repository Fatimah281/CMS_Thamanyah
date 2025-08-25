const redis = require('redis');
const fs = require('fs');
const path = require('path');

class RedisMonitor {
  constructor(options = {}) {
    this.host = options.host || 'localhost';
    this.port = options.port || 6379;
    this.password = options.password;
    this.db = options.db || 0;
    this.metricsFile = options.metricsFile || './reports/redis-metrics.json';
    this.interval = options.interval || 5000; // 5 seconds
    
    this.client = null;
    this.metrics = [];
    this.isMonitoring = false;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        host: this.host,
        port: this.port,
        password: this.password,
        db: this.db,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis server refused connection');
            return new Error('Redis server refused connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('✅ Connected to Redis');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis is ready');
      });

      await this.client.connect();
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      return false;
    }
  }

  async getRedisInfo() {
    try {
      const info = await this.client.info();
      const lines = info.split('\r\n');
      const infoObj = {};
      
      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          infoObj[key] = value;
        }
      });
      
      return infoObj;
    } catch (error) {
      console.error('Error getting Redis info:', error);
      return {};
    }
  }

  async getRedisStats() {
    try {
      const info = await this.getRedisInfo();
      const stats = await this.client.memory('USAGE');
      
      return {
        timestamp: new Date().toISOString(),
        server: {
          version: info.redis_version,
          uptime: parseInt(info.uptime_in_seconds) || 0,
          connected_clients: parseInt(info.connected_clients) || 0,
          used_memory: parseInt(info.used_memory) || 0,
          used_memory_peak: parseInt(info.used_memory_peak) || 0,
          used_memory_rss: parseInt(info.used_memory_rss) || 0,
          total_commands_processed: parseInt(info.total_commands_processed) || 0,
          total_connections_received: parseInt(info.total_connections_received) || 0,
          keyspace_hits: parseInt(info.keyspace_hits) || 0,
          keyspace_misses: parseInt(info.keyspace_misses) || 0,
        },
        memory: {
          usage: stats || 0,
        },
        performance: {
          hit_rate: info.keyspace_hits && info.keyspace_misses ? 
            (parseInt(info.keyspace_hits) / (parseInt(info.keyspace_hits) + parseInt(info.keyspace_misses))) * 100 : 0,
          commands_per_sec: parseInt(info.instantaneous_ops_per_sec) || 0,
        }
      };
    } catch (error) {
      console.error('Error getting Redis stats:', error);
      return {
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async startMonitoring() {
    if (!this.client) {
      const connected = await this.connect();
      if (!connected) {
        throw new Error('Failed to connect to Redis');
      }
    }

    this.isMonitoring = true;
    console.log('🔍 Starting Redis monitoring...');
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(this.metricsFile);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const monitorInterval = setInterval(async () => {
      if (!this.isMonitoring) {
        clearInterval(monitorInterval);
        return;
      }

      try {
        const stats = await this.getRedisStats();
        this.metrics.push(stats);
        
        // Save metrics to file
        fs.writeFileSync(this.metricsFile, JSON.stringify(this.metrics, null, 2));
        
        // Log current stats
        console.log(`📊 Redis Stats [${stats.timestamp}]:`, {
          connected_clients: stats.server?.connected_clients || 0,
          used_memory_mb: Math.round((stats.server?.used_memory || 0) / 1024 / 1024 * 100) / 100,
          hit_rate: Math.round((stats.performance?.hit_rate || 0) * 100) / 100 + '%',
          commands_per_sec: stats.performance?.commands_per_sec || 0,
        });
        
      } catch (error) {
        console.error('Error during monitoring:', error);
      }
    }, this.interval);

    return monitorInterval;
  }

  async stopMonitoring() {
    this.isMonitoring = false;
    console.log('🛑 Stopping Redis monitoring...');
    
    if (this.client) {
      await this.client.quit();
      console.log('✅ Redis connection closed');
    }
  }

  async generateReport() {
    if (this.metrics.length === 0) {
      console.log('No metrics collected');
      return;
    }

    const report = {
      summary: {
        total_samples: this.metrics.length,
        monitoring_duration: this.getMonitoringDuration(),
        average_connected_clients: this.calculateAverage('server.connected_clients'),
        average_used_memory_mb: this.calculateAverage('server.used_memory') / 1024 / 1024,
        average_hit_rate: this.calculateAverage('performance.hit_rate'),
        average_commands_per_sec: this.calculateAverage('performance.commands_per_sec'),
        peak_used_memory_mb: Math.max(...this.metrics.map(m => m.server?.used_memory || 0)) / 1024 / 1024,
        peak_connected_clients: Math.max(...this.metrics.map(m => m.server?.connected_clients || 0)),
      },
      metrics: this.metrics,
      recommendations: this.generateRecommendations()
    };

    const reportFile = this.metricsFile.replace('.json', '-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log('📄 Redis monitoring report generated:', reportFile);
    return report;
  }

  getMonitoringDuration() {
    if (this.metrics.length < 2) return 0;
    const start = new Date(this.metrics[0].timestamp);
    const end = new Date(this.metrics[this.metrics.length - 1].timestamp);
    return (end - start) / 1000; // seconds
  }

  calculateAverage(path) {
    const values = this.metrics
      .map(m => this.getNestedValue(m, path))
      .filter(v => v !== undefined && !isNaN(v));
    
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  generateRecommendations() {
    const avgHitRate = this.calculateAverage('performance.hit_rate');
    const avgMemory = this.calculateAverage('server.used_memory') / 1024 / 1024;
    const peakMemory = Math.max(...this.metrics.map(m => m.server?.used_memory || 0)) / 1024 / 1024;
    
    const recommendations = [];
    
    if (avgHitRate < 80) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Low cache hit rate detected. Consider optimizing cache keys and TTL settings.',
        current_value: `${avgHitRate.toFixed(2)}%`,
        target: '>80%'
      });
    }
    
    if (peakMemory > 100) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: 'High memory usage detected. Consider implementing cache eviction policies.',
        current_value: `${peakMemory.toFixed(2)}MB`,
        target: '<100MB'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'general',
        priority: 'low',
        message: 'Redis performance is within acceptable ranges.',
        current_value: 'Good',
        target: 'Maintain current performance'
      });
    }
    
    return recommendations;
  }
}

// CLI usage
if (require.main === module) {
  const monitor = new RedisMonitor({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    interval: parseInt(process.env.MONITOR_INTERVAL) || 5000,
    metricsFile: process.env.METRICS_FILE || './reports/redis-metrics.json'
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await monitor.stopMonitoring();
    await monitor.generateReport();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await monitor.stopMonitoring();
    await monitor.generateReport();
    process.exit(0);
  });

  // Start monitoring
  monitor.startMonitoring().catch(error => {
    console.error('Failed to start monitoring:', error);
    process.exit(1);
  });
}

module.exports = RedisMonitor;
