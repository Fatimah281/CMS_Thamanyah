const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

class PerformanceDashboard {
  constructor(options = {}) {
    this.port = options.port || 8080;
    this.metricsFile = options.metricsFile || './reports/performance-metrics.json';
    this.redisMetricsFile = options.redisMetricsFile || './reports/redis-metrics.json';
    this.wss = null;
    this.server = null;
    this.clients = new Set();
    this.metrics = {
      responseTime: { avg: 0, p95: 0, p99: 0, min: 0, max: 0 },
      throughput: { rps: 0, total: 0, usersPerHour: 0 },
      errorRate: { percentage: 0, total: 0, successRate: 0 },
      redis: { hitRate: 0, missRate: 0, status: 'unknown' },
      scalability: { activeUsers: 0, maxUsers: 0, peakRPS: 0 },
      targets: {
        responseTimeP95: 1000,
        responseTimeP99: 2000,
        errorRate: 5,
        throughput: 2000,
        redisHitRate: 70,
        usersPerHour: 10000000
      }
    };
    this.startTime = Date.now();
  }

  start() {
    console.log('🚀 Starting Performance Dashboard...');
    console.log(`📊 Dashboard URL: http://localhost:${this.port}`);
    
    this.createServer();
    this.startMetricsPolling();
    this.startWebSocket();
    
    console.log('✅ Performance Dashboard is running');
  }

  createServer() {
    this.server = http.createServer((req, res) => {
      if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(this.getDashboardHTML());
      } else if (req.url === '/metrics') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.metrics));
      } else if (req.url === '/api/metrics') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.metrics));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    this.server.listen(this.port, () => {
      console.log(`📈 Dashboard server listening on port ${this.port}`);
    });
  }

  startWebSocket() {
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.wss.on('connection', (ws) => {
      console.log('🔗 New client connected to dashboard');
      this.clients.add(ws);
      
      // Send initial metrics
      ws.send(JSON.stringify({
        type: 'metrics',
        data: this.metrics
      }));
      
      ws.on('close', () => {
        console.log('🔌 Client disconnected from dashboard');
        this.clients.delete(ws);
      });
    });
  }

  startMetricsPolling() {
    // Poll for metrics every 2 seconds
    setInterval(() => {
      this.updateMetrics();
      this.broadcastMetrics();
    }, 2000);
  }

  updateMetrics() {
    try {
      // Update K6 metrics
      if (fs.existsSync(this.metricsFile)) {
        const k6Data = JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
        this.updateK6Metrics(k6Data);
      }
      
      // Update Redis metrics
      if (fs.existsSync(this.redisMetricsFile)) {
        const redisData = JSON.parse(fs.readFileSync(this.redisMetricsFile, 'utf8'));
        this.updateRedisMetrics(redisData);
      }
      
      // Calculate derived metrics
      this.calculateDerivedMetrics();
      
    } catch (error) {
      console.error('Error updating metrics:', error.message);
    }
  }

  updateK6Metrics(k6Data) {
    const httpReqs = k6Data.http_reqs?.values || {};
    const httpDuration = k6Data.http_req_duration?.values || {};
    const httpFailed = k6Data.http_req_failed?.values || {};
    const vus = k6Data.vus?.values || {};
    
    // Response time metrics
    this.metrics.responseTime = {
      avg: httpDuration.avg || 0,
      p95: httpDuration['p(95)'] || 0,
      p99: httpDuration['p(99)'] || 0,
      min: httpDuration.min || 0,
      max: httpDuration.max || 0
    };
    
    // Throughput metrics
    const rps = httpReqs.rate || 0;
    this.metrics.throughput = {
      rps: rps,
      total: httpReqs.count || 0,
      usersPerHour: rps * 3600
    };
    
    // Error rate metrics
    const errorRate = (httpFailed.rate || 0) * 100;
    this.metrics.errorRate = {
      percentage: errorRate,
      total: httpFailed.count || 0,
      successRate: 100 - errorRate
    };
    
    // Scalability metrics
    this.metrics.scalability = {
      activeUsers: vus.value || 0,
      maxUsers: vus.max || 0,
      peakRPS: Math.max(this.metrics.scalability.peakRPS, rps)
    };
  }

  updateRedisMetrics(redisData) {
    if (redisData.length > 0) {
      const latest = redisData[redisData.length - 1];
      const hitRate = latest.performance?.hit_rate || 0;
      const missRate = 100 - hitRate;
      
      this.metrics.redis = {
        hitRate: hitRate,
        missRate: missRate,
        status: latest.server ? 'healthy' : 'unhealthy',
        memoryUsage: latest.server?.used_memory || 0,
        connectedClients: latest.server?.connected_clients || 0
      };
    }
  }

  calculateDerivedMetrics() {
    // Calculate performance scores
    const responseTimeScore = Math.max(0, 100 - (this.metrics.responseTime.p95 / 10));
    const errorRateScore = Math.max(0, 100 - this.metrics.errorRate.percentage * 2);
    const throughputScore = Math.min(100, (this.metrics.throughput.rps / 20));
    const redisScore = this.metrics.redis.hitRate;
    
    this.metrics.performanceScore = Math.round(
      (responseTimeScore + errorRateScore + throughputScore + redisScore) / 4
    );
    
    // Calculate target achievement
    this.metrics.targetAchievement = {
      responseTimeP95: this.metrics.responseTime.p95 <= this.metrics.targets.responseTimeP95,
      responseTimeP99: this.metrics.responseTime.p99 <= this.metrics.targets.responseTimeP99,
      errorRate: this.metrics.errorRate.percentage <= this.metrics.targets.errorRate,
      throughput: this.metrics.throughput.rps >= this.metrics.targets.throughput,
      redisHitRate: this.metrics.redis.hitRate >= this.metrics.targets.redisHitRate,
      usersPerHour: this.metrics.throughput.usersPerHour >= this.metrics.targets.usersPerHour
    };
  }

  broadcastMetrics() {
    const message = JSON.stringify({
      type: 'metrics',
      data: this.metrics,
      timestamp: Date.now()
    });
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  getDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CMS Thamanyah Performance Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            color: white;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .metric-card:hover {
            transform: translateY(-5px);
        }
        
        .metric-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .metric-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #555;
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .metric-subtitle {
            font-size: 0.9rem;
            color: #7f8c8d;
            margin-bottom: 15px;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #ecf0f1;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #2ecc71, #27ae60);
            transition: width 0.3s ease;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-success { background: #2ecc71; }
        .status-warning { background: #f39c12; }
        .status-error { background: #e74c3c; }
        
        .targets-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .target-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .target-achieved {
            border-left: 4px solid #2ecc71;
        }
        
        .target-failed {
            border-left: 4px solid #e74c3c;
        }
        
        .performance-score {
            text-align: center;
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .score-circle {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            font-weight: bold;
            color: white;
            background: conic-gradient(#2ecc71 0deg, #2ecc71 0deg, #ecf0f1 360deg);
        }
        
        .connection-status {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 20px;
            color: white;
            font-weight: 500;
        }
        
        .connected {
            background: #2ecc71;
        }
        
        .disconnected {
            background: #e74c3c;
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
            <h1>🚀 CMS Thamanyah Performance Dashboard</h1>
            <p>Real-time monitoring for 10M users/hour load testing</p>
        </div>
        
        <div class="connection-status" id="connectionStatus">
            <span id="statusText">Connecting...</span>
        </div>
        
        <div class="performance-score">
            <div class="score-circle" id="performanceScore">
                <span id="scoreValue">0</span>
            </div>
            <h2>Overall Performance Score</h2>
            <p>Based on response time, error rate, throughput, and Redis performance</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-header">
                    <span class="metric-title">⚡ Response Time</span>
                    <span class="status-indicator" id="responseTimeStatus"></span>
                </div>
                <div class="metric-value" id="avgResponseTime">0ms</div>
                <div class="metric-subtitle">
                    P95: <span id="p95ResponseTime">0ms</span> | P99: <span id="p99ResponseTime">0ms</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="responseTimeProgress" style="width: 0%"></div>
                </div>
                <div>Target: &lt;1000ms (P95)</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-header">
                    <span class="metric-title">🚀 Throughput</span>
                    <span class="status-indicator" id="throughputStatus"></span>
                </div>
                <div class="metric-value" id="requestsPerSecond">0</div>
                <div class="metric-subtitle">
                    Total: <span id="totalRequests">0</span> | Users/Hour: <span id="usersPerHour">0</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="throughputProgress" style="width: 0%"></div>
                </div>
                <div>Target: &gt;2000 req/s</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-header">
                    <span class="metric-title">❌ Error Rate</span>
                    <span class="status-indicator" id="errorRateStatus"></span>
                </div>
                <div class="metric-value" id="errorRate">0%</div>
                <div class="metric-subtitle">
                    Success Rate: <span id="successRate">100%</span> | Total Errors: <span id="totalErrors">0</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="errorRateProgress" style="width: 0%"></div>
                </div>
                <div>Target: &lt;5%</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-header">
                    <span class="metric-title">🔴 Redis Performance</span>
                    <span class="status-indicator" id="redisStatus"></span>
                </div>
                <div class="metric-value" id="redisHitRate">0%</div>
                <div class="metric-subtitle">
                    Miss Rate: <span id="redisMissRate">0%</span> | Status: <span id="redisHealth">Unknown</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="redisProgress" style="width: 0%"></div>
                </div>
                <div>Target: &gt;70% hit rate</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-header">
                    <span class="metric-title">👥 Active Users</span>
                </div>
                <div class="metric-value" id="activeUsers">0</div>
                <div class="metric-subtitle">
                    Max: <span id="maxUsers">0</span> | Peak RPS: <span id="peakRPS">0</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="usersProgress" style="width: 0%"></div>
                </div>
                <div>Current load level</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-header">
                    <span class="metric-title">📊 Test Duration</span>
                </div>
                <div class="metric-value" id="testDuration">00:00:00</div>
                <div class="metric-subtitle">
                    Started: <span id="startTime">-</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="durationProgress" style="width: 0%"></div>
                </div>
                <div>Test progress</div>
            </div>
        </div>
        
        <div class="targets-grid">
            <div class="target-card" id="targetResponseTime">
                <h3>Response Time P95</h3>
                <div class="metric-value" id="targetResponseTimeValue">0ms</div>
                <div id="targetResponseTimeStatus">Checking...</div>
            </div>
            
            <div class="target-card" id="targetThroughput">
                <h3>Throughput</h3>
                <div class="metric-value" id="targetThroughputValue">0 req/s</div>
                <div id="targetThroughputStatus">Checking...</div>
            </div>
            
            <div class="target-card" id="targetErrorRate">
                <h3>Error Rate</h3>
                <div class="metric-value" id="targetErrorRateValue">0%</div>
                <div id="targetErrorRateStatus">Checking...</div>
            </div>
            
            <div class="target-card" id="targetRedis">
                <h3>Redis Hit Rate</h3>
                <div class="metric-value" id="targetRedisValue">0%</div>
                <div id="targetRedisStatus">Checking...</div>
            </div>
            
            <div class="target-card" id="targetUsersPerHour">
                <h3>Users/Hour Target</h3>
                <div class="metric-value" id="targetUsersPerHourValue">0</div>
                <div id="targetUsersPerHourStatus">Checking...</div>
            </div>
        </div>
    </div>
    
    <script>
        let ws = null;
        let startTime = Date.now();
        
        function connectWebSocket() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = \`\${protocol}//\${window.location.host}\`;
            
            ws = new WebSocket(wsUrl);
            
            ws.onopen = function() {
                updateConnectionStatus(true);
            };
            
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                if (data.type === 'metrics') {
                    updateDashboard(data.data);
                }
            };
            
            ws.onclose = function() {
                updateConnectionStatus(false);
                setTimeout(connectWebSocket, 5000);
            };
            
            ws.onerror = function() {
                updateConnectionStatus(false);
            };
        }
        
        function updateConnectionStatus(connected) {
            const statusElement = document.getElementById('connectionStatus');
            const statusText = document.getElementById('statusText');
            
            if (connected) {
                statusElement.className = 'connection-status connected';
                statusText.textContent = 'Connected';
            } else {
                statusElement.className = 'connection-status disconnected';
                statusText.textContent = 'Disconnected';
            }
        }
        
        function updateDashboard(metrics) {
            // Update response time metrics
            document.getElementById('avgResponseTime').textContent = \`\${metrics.responseTime.avg.toFixed(0)}ms\`;
            document.getElementById('p95ResponseTime').textContent = \`\${metrics.responseTime.p95.toFixed(0)}ms\`;
            document.getElementById('p99ResponseTime').textContent = \`\${metrics.responseTime.p99.toFixed(0)}ms\`;
            
            const responseTimeProgress = Math.max(0, 100 - (metrics.responseTime.p95 / 10));
            document.getElementById('responseTimeProgress').style.width = \`\${responseTimeProgress}%\`;
            updateStatusIndicator('responseTimeStatus', metrics.responseTime.p95 <= 1000);
            
            // Update throughput metrics
            document.getElementById('requestsPerSecond').textContent = \`\${metrics.throughput.rps.toFixed(0)}\`;
            document.getElementById('totalRequests').textContent = metrics.throughput.total.toLocaleString();
            document.getElementById('usersPerHour').textContent = metrics.throughput.usersPerHour.toLocaleString();
            
            const throughputProgress = Math.min(100, (metrics.throughput.rps / 20));
            document.getElementById('throughputProgress').style.width = \`\${throughputProgress}%\`;
            updateStatusIndicator('throughputStatus', metrics.throughput.rps >= 2000);
            
            // Update error rate metrics
            document.getElementById('errorRate').textContent = \`\${metrics.errorRate.percentage.toFixed(2)}%\`;
            document.getElementById('successRate').textContent = \`\${metrics.errorRate.successRate.toFixed(2)}%\`;
            document.getElementById('totalErrors').textContent = metrics.errorRate.total.toLocaleString();
            
            const errorRateProgress = Math.max(0, 100 - metrics.errorRate.percentage * 2);
            document.getElementById('errorRateProgress').style.width = \`\${errorRateProgress}%\`;
            updateStatusIndicator('errorRateStatus', metrics.errorRate.percentage <= 5);
            
            // Update Redis metrics
            document.getElementById('redisHitRate').textContent = \`\${metrics.redis.hitRate.toFixed(1)}%\`;
            document.getElementById('redisMissRate').textContent = \`\${metrics.redis.missRate.toFixed(1)}%\`;
            document.getElementById('redisHealth').textContent = metrics.redis.status;
            
            const redisProgress = metrics.redis.hitRate;
            document.getElementById('redisProgress').style.width = \`\${redisProgress}%\`;
            updateStatusIndicator('redisStatus', metrics.redis.hitRate >= 70);
            
            // Update scalability metrics
            document.getElementById('activeUsers').textContent = metrics.scalability.activeUsers;
            document.getElementById('maxUsers').textContent = metrics.scalability.maxUsers;
            document.getElementById('peakRPS').textContent = \`\${metrics.scalability.peakRPS.toFixed(0)}\`;
            
            const usersProgress = (metrics.scalability.activeUsers / 5000) * 100;
            document.getElementById('usersProgress').style.width = \`\${Math.min(100, usersProgress)}%\`;
            
            // Update performance score
            document.getElementById('scoreValue').textContent = metrics.performanceScore || 0;
            
            // Update target achievements
            updateTargetCard('targetResponseTime', metrics.targetAchievement.responseTimeP95, \`\${metrics.responseTime.p95.toFixed(0)}ms\`);
            updateTargetCard('targetThroughput', metrics.targetAchievement.throughput, \`\${metrics.throughput.rps.toFixed(0)} req/s\`);
            updateTargetCard('targetErrorRate', metrics.targetAchievement.errorRate, \`\${metrics.errorRate.percentage.toFixed(2)}%\`);
            updateTargetCard('targetRedis', metrics.targetAchievement.redisHitRate, \`\${metrics.redis.hitRate.toFixed(1)}%\`);
            updateTargetCard('targetUsersPerHour', metrics.targetAchievement.usersPerHour, metrics.throughput.usersPerHour.toLocaleString());
            
            // Update test duration
            updateTestDuration();
        }
        
        function updateStatusIndicator(elementId, isSuccess) {
            const element = document.getElementById(elementId);
            element.className = \`status-indicator \${isSuccess ? 'status-success' : 'status-error'}\`;
        }
        
        function updateTargetCard(cardId, achieved, value) {
            const card = document.getElementById(cardId);
            const valueElement = document.getElementById(\`\${cardId}Value\`);
            const statusElement = document.getElementById(\`\${cardId}Status\`);
            
            valueElement.textContent = value;
            
            if (achieved) {
                card.className = 'target-card target-achieved';
                statusElement.textContent = '✅ Target Achieved';
                statusElement.style.color = '#2ecc71';
            } else {
                card.className = 'target-card target-failed';
                statusElement.textContent = '❌ Target Not Met';
                statusElement.style.color = '#e74c3c';
            }
        }
        
        function updateTestDuration() {
            const elapsed = Date.now() - startTime;
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            document.getElementById('testDuration').textContent = 
                \`\${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
        }
        
        // Initialize dashboard
        connectWebSocket();
        setInterval(updateTestDuration, 1000);
    </script>
</body>
</html>
    `;
  }

  stop() {
    console.log('🛑 Stopping Performance Dashboard...');
    
    if (this.wss) {
      this.wss.close();
    }
    
    if (this.server) {
      this.server.close();
    }
    
    console.log('✅ Performance Dashboard stopped');
  }
}

// CLI usage
if (require.main === module) {
  const dashboard = new PerformanceDashboard({
    port: process.env.DASHBOARD_PORT || 8080,
    metricsFile: process.env.METRICS_FILE || './reports/performance-metrics.json',
    redisMetricsFile: process.env.REDIS_METRICS_FILE || './reports/redis-metrics.json'
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down dashboard...');
    dashboard.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down dashboard...');
    dashboard.stop();
    process.exit(0);
  });
  
  // Start dashboard
  dashboard.start();
}

module.exports = PerformanceDashboard;
