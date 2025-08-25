const fs = require('fs');
const path = require('path');

class PerformanceReportGenerator {
  constructor(options = {}) {
    this.reportsDir = options.reportsDir || './reports';
    this.k6MetricsFile = options.k6MetricsFile || './reports/performance-metrics.json';
    this.redisMetricsFile = options.redisMetricsFile || './reports/redis-metrics.json';
    this.summaryFile = options.summaryFile || './reports/load-test-summary.json';
    this.outputFile = options.outputFile || './reports/performance-analysis-report.html';
  }

  async generateReport() {
    console.log('📊 Generating comprehensive performance report...');
    
    try {
      // Load all metrics data
      const k6Data = this.loadK6Metrics();
      const redisData = this.loadRedisMetrics();
      const summaryData = this.loadSummaryData();
      
      // Analyze performance
      const analysis = this.analyzePerformance(k6Data, redisData, summaryData);
      
      // Generate HTML report
      const htmlReport = this.generateHTMLReport(analysis);
      
      // Save report
      fs.writeFileSync(this.outputFile, htmlReport);
      
      // Generate JSON analysis
      const jsonReport = this.generateJSONReport(analysis);
      fs.writeFileSync(this.outputFile.replace('.html', '.json'), JSON.stringify(jsonReport, null, 2));
      
      console.log(`✅ Performance report generated: ${this.outputFile}`);
      console.log(`📈 JSON analysis saved: ${this.outputFile.replace('.html', '.json')}`);
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Error generating performance report:', error.message);
      throw error;
    }
  }

  loadK6Metrics() {
    if (fs.existsSync(this.k6MetricsFile)) {
      return JSON.parse(fs.readFileSync(this.k6MetricsFile, 'utf8'));
    }
    return {};
  }

  loadRedisMetrics() {
    if (fs.existsSync(this.redisMetricsFile)) {
      return JSON.parse(fs.readFileSync(this.redisMetricsFile, 'utf8'));
    }
    return [];
  }

  loadSummaryData() {
    if (fs.existsSync(this.summaryFile)) {
      return JSON.parse(fs.readFileSync(this.summaryFile, 'utf8'));
    }
    return {};
  }

  analyzePerformance(k6Data, redisData, summaryData) {
    const analysis = {
      timestamp: new Date().toISOString(),
      testInfo: summaryData.test_info || {},
      performanceMetrics: this.analyzeK6Metrics(k6Data),
      redisAnalysis: this.analyzeRedisMetrics(redisData),
      scalabilityAnalysis: this.analyzeScalability(k6Data),
      targetAchievement: this.analyzeTargetAchievement(k6Data, redisData),
      recommendations: this.generateRecommendations(k6Data, redisData),
      performanceScore: this.calculatePerformanceScore(k6Data, redisData),
      bottlenecks: this.identifyBottlenecks(k6Data, redisData),
      capacityPlanning: this.capacityPlanning(k6Data)
    };

    return analysis;
  }

  analyzeK6Metrics(k6Data) {
    const httpReqs = k6Data.http_reqs?.values || {};
    const httpDuration = k6Data.http_req_duration?.values || {};
    const httpFailed = k6Data.http_req_failed?.values || {};
    const vus = k6Data.vus?.values || {};

    return {
      responseTime: {
        average: httpDuration.avg || 0,
        median: httpDuration.med || 0,
        p95: httpDuration['p(95)'] || 0,
        p99: httpDuration['p(99)'] || 0,
        min: httpDuration.min || 0,
        max: httpDuration.max || 0,
        distribution: this.analyzeResponseTimeDistribution(httpDuration)
      },
      throughput: {
        requestsPerSecond: httpReqs.rate || 0,
        totalRequests: httpReqs.count || 0,
        usersPerHourEquivalent: (httpReqs.rate || 0) * 3600,
        peakThroughput: this.calculatePeakThroughput(k6Data)
      },
      errorRate: {
        percentage: (httpFailed.rate || 0) * 100,
        totalErrors: httpFailed.count || 0,
        successRate: (1 - (httpFailed.rate || 0)) * 100,
        errorTypes: this.analyzeErrorTypes(k6Data)
      },
      concurrency: {
        maxConcurrentUsers: vus.max || 0,
        averageConcurrentUsers: vus.avg || 0,
        peakConcurrency: vus.max || 0
      }
    };
  }

  analyzeRedisMetrics(redisData) {
    if (!Array.isArray(redisData) || redisData.length === 0) {
      return {
        status: 'No Redis data available',
        hitRate: 0,
        missRate: 0,
        memoryUsage: 0,
        performance: 'Unknown'
      };
    }

    const latest = redisData[redisData.length - 1];
    const hitRate = latest.performance?.hit_rate || 0;
    const memoryUsage = latest.server?.used_memory || 0;

    return {
      status: latest.server ? 'Healthy' : 'Unhealthy',
      hitRate: hitRate * 100,
      missRate: (1 - hitRate) * 100,
      memoryUsage: memoryUsage / (1024 * 1024), // Convert to MB
      connectedClients: latest.server?.connected_clients || 0,
      performance: this.evaluateRedisPerformance(hitRate, memoryUsage),
      trends: this.analyzeRedisTrends(redisData)
    };
  }

  analyzeScalability(k6Data) {
    const httpReqs = k6Data.http_reqs?.values || {};
    const httpDuration = k6Data.http_req_duration?.values || {};
    const vus = k6Data.vus?.values || {};

    const rps = httpReqs.rate || 0;
    const avgResponseTime = httpDuration.avg || 0;
    const maxUsers = vus.max || 0;

    return {
      currentCapacity: {
        requestsPerSecond: rps,
        concurrentUsers: maxUsers,
        responseTimeAtPeak: avgResponseTime
      },
      scalabilityMetrics: {
        requestsPerUser: maxUsers > 0 ? rps / maxUsers : 0,
        responseTimeDegradation: this.calculateResponseTimeDegradation(k6Data),
        throughputEfficiency: this.calculateThroughputEfficiency(k6Data)
      },
      bottlenecks: this.identifyScalabilityBottlenecks(k6Data),
      recommendations: this.generateScalabilityRecommendations(k6Data)
    };
  }

  analyzeTargetAchievement(k6Data, redisData) {
    const httpDuration = k6Data.http_req_duration?.values || {};
    const httpReqs = k6Data.http_reqs?.values || {};
    const httpFailed = k6Data.http_req_failed?.values || {};
    const redisHitRate = redisData.length > 0 ? (redisData[redisData.length - 1].performance?.hit_rate || 0) * 100 : 0;

    const targets = {
      responseTimeP95: 1000, // ms
      responseTimeP99: 2000, // ms
      errorRate: 5, // %
      throughput: 2000, // req/s
      redisHitRate: 70, // %
      usersPerHour: 10000000 // 10M users/hour
    };

    const actual = {
      responseTimeP95: httpDuration['p(95)'] || 0,
      responseTimeP99: httpDuration['p(99)'] || 0,
      errorRate: (httpFailed.rate || 0) * 100,
      throughput: httpReqs.rate || 0,
      redisHitRate: redisHitRate,
      usersPerHour: (httpReqs.rate || 0) * 3600
    };

    const achievement = {};
    for (const [key, target] of Object.entries(targets)) {
      const actualValue = actual[key];
      let achieved = false;
      
      if (key.includes('responseTime') || key.includes('errorRate')) {
        achieved = actualValue <= target;
      } else {
        achieved = actualValue >= target;
      }
      
      achievement[key] = {
        target: target,
        actual: actualValue,
        achieved: achieved,
        percentage: this.calculateAchievementPercentage(actualValue, target, key)
      };
    }

    return achievement;
  }

  generateRecommendations(k6Data, redisData) {
    const recommendations = [];
    const httpDuration = k6Data.http_req_duration?.values || {};
    const httpFailed = k6Data.http_req_failed?.values || {};
    const httpReqs = k6Data.http_reqs?.values || {};
    const redisHitRate = redisData.length > 0 ? (redisData[redisData.length - 1].performance?.hit_rate || 0) * 100 : 0;

    // Response time recommendations
    if (httpDuration['p(95)'] > 1000) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        issue: 'High 95th percentile response time',
        current: `${httpDuration['p(95)'].toFixed(0)}ms`,
        target: '<1000ms',
        actions: [
          'Implement Redis caching for frequently accessed data',
          'Optimize database queries and add proper indexing',
          'Consider implementing database connection pooling',
          'Review and optimize API endpoints with slowest response times'
        ]
      });
    }

    // Error rate recommendations
    if ((httpFailed.rate || 0) * 100 > 5) {
      recommendations.push({
        priority: 'critical',
        category: 'reliability',
        issue: 'High error rate',
        current: `${((httpFailed.rate || 0) * 100).toFixed(2)}%`,
        target: '<5%',
        actions: [
          'Investigate error logs to identify root causes',
          'Improve error handling and validation',
          'Check database connectivity and connection limits',
          'Implement circuit breakers for external dependencies'
        ]
      });
    }

    // Throughput recommendations
    if ((httpReqs.rate || 0) < 2000) {
      recommendations.push({
        priority: 'high',
        category: 'scalability',
        issue: 'Low throughput',
        current: `${(httpReqs.rate || 0).toFixed(0)} req/s`,
        target: '>2000 req/s',
        actions: [
          'Optimize application performance and reduce response times',
          'Implement horizontal scaling with load balancing',
          'Consider using a CDN for static content',
          'Review and optimize resource-intensive operations'
        ]
      });
    }

    // Redis recommendations
    if (redisHitRate < 70) {
      recommendations.push({
        priority: 'medium',
        category: 'caching',
        issue: 'Low Redis hit rate',
        current: `${redisHitRate.toFixed(1)}%`,
        target: '>70%',
        actions: [
          'Optimize cache key strategies and TTL settings',
          'Implement cache warming for frequently accessed data',
          'Review cache invalidation strategies',
          'Consider implementing cache preloading'
        ]
      });
    }

    // Success recommendations
    if (httpDuration['p(95)'] < 500 && (httpFailed.rate || 0) * 100 < 2 && (httpReqs.rate || 0) > 2500) {
      recommendations.push({
        priority: 'low',
        category: 'optimization',
        issue: 'Excellent performance achieved',
        current: 'All targets exceeded',
        target: 'Maintain current performance',
        actions: [
          'Continue monitoring performance metrics',
          'Consider further optimization for higher loads',
          'Document current configuration as baseline',
          'Plan for future capacity requirements'
        ]
      });
    }

    return recommendations;
  }

  calculatePerformanceScore(k6Data, redisData) {
    const httpDuration = k6Data.http_req_duration?.values || {};
    const httpFailed = k6Data.http_req_failed?.values || {};
    const httpReqs = k6Data.http_reqs?.values || {};
    const redisHitRate = redisData.length > 0 ? (redisData[redisData.length - 1].performance?.hit_rate || 0) * 100 : 0;

    // Calculate individual scores (0-100)
    const responseTimeScore = Math.max(0, 100 - (httpDuration['p(95)'] || 0) / 10);
    const errorRateScore = Math.max(0, 100 - ((httpFailed.rate || 0) * 100) * 2);
    const throughputScore = Math.min(100, ((httpReqs.rate || 0) / 20));
    const redisScore = redisHitRate;

    // Weighted average
    const weights = { responseTime: 0.3, errorRate: 0.3, throughput: 0.25, redis: 0.15 };
    const overallScore = Math.round(
      responseTimeScore * weights.responseTime +
      errorRateScore * weights.errorRate +
      throughputScore * weights.throughput +
      redisScore * weights.redis
    );

    return {
      overall: overallScore,
      breakdown: {
        responseTime: Math.round(responseTimeScore),
        errorRate: Math.round(errorRateScore),
        throughput: Math.round(throughputScore),
        redis: Math.round(redisScore)
      },
      grade: this.getPerformanceGrade(overallScore)
    };
  }

  identifyBottlenecks(k6Data, redisData) {
    const bottlenecks = [];
    const httpDuration = k6Data.http_req_duration?.values || {};
    const httpFailed = k6Data.http_req_failed?.values || {};
    const httpReqs = k6Data.http_reqs?.values || {};

    // Response time bottlenecks
    if (httpDuration['p(95)'] > 1000) {
      bottlenecks.push({
        type: 'response_time',
        severity: 'high',
        description: '95th percentile response time exceeds 1 second',
        impact: 'Poor user experience, potential timeout issues',
        suggestions: ['Database optimization', 'Caching implementation', 'API optimization']
      });
    }

    // Error rate bottlenecks
    if ((httpFailed.rate || 0) * 100 > 5) {
      bottlenecks.push({
        type: 'error_rate',
        severity: 'critical',
        description: 'Error rate exceeds 5%',
        impact: 'Service reliability issues, user frustration',
        suggestions: ['Error investigation', 'Improved error handling', 'Infrastructure review']
      });
    }

    // Throughput bottlenecks
    if ((httpReqs.rate || 0) < 2000) {
      bottlenecks.push({
        type: 'throughput',
        severity: 'high',
        description: 'Throughput below 2000 req/s',
        impact: 'Limited capacity for high user loads',
        suggestions: ['Performance optimization', 'Horizontal scaling', 'Resource allocation']
      });
    }

    return bottlenecks;
  }

  capacityPlanning(k6Data) {
    const httpReqs = k6Data.http_reqs?.values || {};
    const vus = k6Data.vus?.values || {};
    const currentRPS = httpReqs.rate || 0;
    const maxUsers = vus.max || 0;

    return {
      currentCapacity: {
        requestsPerSecond: currentRPS,
        concurrentUsers: maxUsers,
        usersPerHour: currentRPS * 3600
      },
      scalingRecommendations: {
        immediate: this.getImmediateScalingNeeds(currentRPS, maxUsers),
        shortTerm: this.getShortTermScalingPlan(currentRPS, maxUsers),
        longTerm: this.getLongTermScalingPlan(currentRPS, maxUsers)
      },
      resourceRequirements: this.calculateResourceRequirements(currentRPS, maxUsers)
    };
  }

  // Helper methods
  analyzeResponseTimeDistribution(httpDuration) {
    return {
      excellent: httpDuration['p(50)'] < 200 ? 'Under 200ms' : 'Above 200ms',
      good: httpDuration['p(75)'] < 500 ? 'Under 500ms' : 'Above 500ms',
      acceptable: httpDuration['p(95)'] < 1000 ? 'Under 1s' : 'Above 1s',
      poor: httpDuration['p(99)'] < 2000 ? 'Under 2s' : 'Above 2s'
    };
  }

  calculatePeakThroughput(k6Data) {
    // This would need more detailed time-series data
    return k6Data.http_reqs?.values?.rate || 0;
  }

  analyzeErrorTypes(k6Data) {
    // This would need more detailed error data
    return {
      http4xx: 'Unknown',
      http5xx: 'Unknown',
      timeouts: 'Unknown',
      connectionErrors: 'Unknown'
    };
  }

  evaluateRedisPerformance(hitRate, memoryUsage) {
    if (hitRate > 0.8) return 'Excellent';
    if (hitRate > 0.7) return 'Good';
    if (hitRate > 0.5) return 'Acceptable';
    return 'Poor';
  }

  analyzeRedisTrends(redisData) {
    if (redisData.length < 2) return 'Insufficient data';
    
    const first = redisData[0];
    const last = redisData[redisData.length - 1];
    const hitRateChange = (last.performance?.hit_rate || 0) - (first.performance?.hit_rate || 0);
    
    if (hitRateChange > 0.1) return 'Improving';
    if (hitRateChange < -0.1) return 'Degrading';
    return 'Stable';
  }

  calculateResponseTimeDegradation(k6Data) {
    // This would need time-series data
    return 'Unknown';
  }

  calculateThroughputEfficiency(k6Data) {
    const httpReqs = k6Data.http_reqs?.values || {};
    const vus = k6Data.vus?.values || {};
    const rps = httpReqs.rate || 0;
    const maxUsers = vus.max || 0;
    
    return maxUsers > 0 ? rps / maxUsers : 0;
  }

  identifyScalabilityBottlenecks(k6Data) {
    return ['Database connections', 'Memory usage', 'CPU utilization'];
  }

  generateScalabilityRecommendations(k6Data) {
    return [
      'Implement horizontal scaling',
      'Add load balancing',
      'Optimize database queries',
      'Implement caching strategies'
    ];
  }

  calculateAchievementPercentage(actual, target, metric) {
    if (metric.includes('responseTime') || metric.includes('errorRate')) {
      return Math.max(0, Math.min(100, (target / actual) * 100));
    } else {
      return Math.max(0, Math.min(100, (actual / target) * 100));
    }
  }

  getPerformanceGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    return 'D';
  }

  getImmediateScalingNeeds(currentRPS, maxUsers) {
    if (currentRPS < 1000) return 'Low priority';
    if (currentRPS < 2000) return 'Medium priority';
    return 'High priority';
  }

  getShortTermScalingPlan(currentRPS, maxUsers) {
    return [
      'Optimize application performance',
      'Implement caching strategies',
      'Add database indexes',
      'Review and optimize API endpoints'
    ];
  }

  getLongTermScalingPlan(currentRPS, maxUsers) {
    return [
      'Implement microservices architecture',
      'Add horizontal scaling capabilities',
      'Implement auto-scaling',
      'Consider cloud-native solutions'
    ];
  }

  calculateResourceRequirements(currentRPS, maxUsers) {
    return {
      cpu: 'Based on current load analysis',
      memory: 'Based on current usage patterns',
      storage: 'Based on data growth projections',
      network: 'Based on throughput requirements'
    };
  }

  generateHTMLReport(analysis) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CMS Thamanyah Performance Analysis Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .section {
            margin-bottom: 40px;
            padding: 25px;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            background: #fafafa;
        }
        
        .section h2 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 1.8rem;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #3498db;
        }
        
        .metric-title {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .metric-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #3498db;
        }
        
        .metric-subtitle {
            font-size: 0.9rem;
            color: #7f8c8d;
            margin-top: 5px;
        }
        
        .performance-score {
            text-align: center;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .score-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: bold;
            color: white;
            background: conic-gradient(#2ecc71 0deg, #2ecc71 0deg, #ecf0f1 360deg);
        }
        
        .recommendations {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .recommendation {
            margin-bottom: 20px;
            padding: 15px;
            border-left: 4px solid #e74c3c;
            background: #fdf2f2;
        }
        
        .recommendation.high {
            border-left-color: #e74c3c;
            background: #fdf2f2;
        }
        
        .recommendation.medium {
            border-left-color: #f39c12;
            background: #fef9e7;
        }
        
        .recommendation.low {
            border-left-color: #27ae60;
            background: #f0f9f0;
        }
        
        .recommendation h4 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .recommendation ul {
            margin-left: 20px;
        }
        
        .recommendation li {
            margin-bottom: 5px;
        }
        
        .target-achievement {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .target-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .target-achieved {
            border-left: 4px solid #27ae60;
        }
        
        .target-failed {
            border-left: 4px solid #e74c3c;
        }
        
        .bottlenecks {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .bottleneck {
            margin-bottom: 15px;
            padding: 10px;
            background: white;
            border-radius: 5px;
            border-left: 4px solid #e74c3c;
        }
        
        .severity-high {
            border-left-color: #e74c3c;
        }
        
        .severity-medium {
            border-left-color: #f39c12;
        }
        
        .severity-low {
            border-left-color: #27ae60;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: #2c3e50;
            color: white;
            border-radius: 10px;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .metrics-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 CMS Thamanyah Performance Analysis Report</h1>
            <p>Comprehensive analysis for 10M users/hour load testing</p>
            <p>Generated on: ${new Date(analysis.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="performance-score">
            <div class="score-circle">
                ${analysis.performanceScore.overall}
            </div>
            <h2>Overall Performance Score: ${analysis.performanceScore.grade}</h2>
            <p>Based on response time, error rate, throughput, and Redis performance</p>
        </div>
        
        <div class="section">
            <h2>📊 Performance Metrics</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-title">Response Time (P95)</div>
                    <div class="metric-value">${analysis.performanceMetrics.responseTime.p95.toFixed(0)}ms</div>
                    <div class="metric-subtitle">Target: &lt;1000ms</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">Throughput</div>
                    <div class="metric-value">${analysis.performanceMetrics.throughput.requestsPerSecond.toFixed(0)} req/s</div>
                    <div class="metric-subtitle">Target: &gt;2000 req/s</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">Error Rate</div>
                    <div class="metric-value">${analysis.performanceMetrics.errorRate.percentage.toFixed(2)}%</div>
                    <div class="metric-subtitle">Target: &lt;5%</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">Redis Hit Rate</div>
                    <div class="metric-value">${analysis.redisAnalysis.hitRate.toFixed(1)}%</div>
                    <div class="metric-subtitle">Target: &gt;70%</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">Concurrent Users</div>
                    <div class="metric-value">${analysis.performanceMetrics.concurrency.maxConcurrentUsers}</div>
                    <div class="metric-subtitle">Peak load achieved</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">Users/Hour Equivalent</div>
                    <div class="metric-value">${analysis.performanceMetrics.throughput.usersPerHourEquivalent.toLocaleString()}</div>
                    <div class="metric-subtitle">Target: 10,000,000</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>🎯 Target Achievement</h2>
            <div class="target-achievement">
                ${Object.entries(analysis.targetAchievement).map(([key, target]) => `
                    <div class="target-card ${target.achieved ? 'target-achieved' : 'target-failed'}">
                        <h4>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                        <div class="metric-value">${target.actual.toFixed(2)}</div>
                        <div class="metric-subtitle">Target: ${target.target}</div>
                        <div>${target.achieved ? '✅ Achieved' : '❌ Not Met'}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${analysis.bottlenecks.length > 0 ? `
        <div class="section">
            <h2>⚠️ Identified Bottlenecks</h2>
            <div class="bottlenecks">
                ${analysis.bottlenecks.map(bottleneck => `
                    <div class="bottleneck severity-${bottleneck.severity}">
                        <h4>${bottleneck.type.replace(/_/g, ' ').toUpperCase()}</h4>
                        <p><strong>Description:</strong> ${bottleneck.description}</p>
                        <p><strong>Impact:</strong> ${bottleneck.impact}</p>
                        <p><strong>Suggestions:</strong> ${bottleneck.suggestions.join(', ')}</p>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="section">
            <h2>💡 Recommendations</h2>
            <div class="recommendations">
                ${analysis.recommendations.map(rec => `
                    <div class="recommendation ${rec.priority}">
                        <h4>${rec.issue}</h4>
                        <p><strong>Current:</strong> ${rec.current} | <strong>Target:</strong> ${rec.target}</p>
                        <ul>
                            ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2>📈 Capacity Planning</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-title">Current Capacity</div>
                    <div class="metric-value">${analysis.capacityPlanning.currentCapacity.requestsPerSecond.toFixed(0)} req/s</div>
                    <div class="metric-subtitle">${analysis.capacityPlanning.currentCapacity.concurrentUsers} concurrent users</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">Scaling Priority</div>
                    <div class="metric-value">${analysis.capacityPlanning.scalingRecommendations.immediate}</div>
                    <div class="metric-subtitle">Immediate needs</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Performance Analysis Report - CMS Thamanyah Load Testing</p>
            <p>Generated automatically by the load testing suite</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  generateJSONReport(analysis) {
    return {
      reportInfo: {
        generatedAt: analysis.timestamp,
        version: '1.0.0',
        description: 'Comprehensive performance analysis for CMS Thamanyah load testing'
      },
      analysis: analysis
    };
  }
}

// CLI usage
if (require.main === module) {
  const generator = new PerformanceReportGenerator({
    reportsDir: process.env.REPORTS_DIR || './reports',
    k6MetricsFile: process.env.K6_METRICS_FILE || './reports/performance-metrics.json',
    redisMetricsFile: process.env.REDIS_METRICS_FILE || './reports/redis-metrics.json',
    summaryFile: process.env.SUMMARY_FILE || './reports/load-test-summary.json',
    outputFile: process.env.OUTPUT_FILE || './reports/performance-analysis-report.html'
  });
  
  generator.generateReport()
    .then(() => {
      console.log('✅ Performance report generation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Performance report generation failed:', error.message);
      process.exit(1);
    });
}

module.exports = PerformanceReportGenerator;
