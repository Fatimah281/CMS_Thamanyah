const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// Store metrics
let metrics = {
  startTime: null,
  currentUsers: 0,
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  avgResponseTime: 0,
  requestsPerSecond: 0,
  endpointMetrics: {},
  lastUpdate: null
};

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to receive metrics from K6
app.post('/metrics', (req, res) => {
  const data = req.body;
  
  if (data.metrics) {
    metrics = {
      ...metrics,
      ...data.metrics,
      lastUpdate: new Date().toISOString()
    };
  }
  
  res.json({ status: 'ok' });
});

// API endpoint to get current metrics
app.get('/api/metrics', (req, res) => {
  res.json(metrics);
});

// Serve the dashboard
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CMS Thamanyah - Load Test Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s ease;
        }
        
        .metric-card:hover {
            transform: translateY(-5px);
        }
        
        .metric-value {
            font-size: 2.5rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .metric-label {
            font-size: 1rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .chart-container {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        .chart-title {
            font-size: 1.5rem;
            margin-bottom: 20px;
            color: #333;
            text-align: center;
        }
        
        .status {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 10px;
            animation: pulse 2s infinite;
        }
        
        .status-active {
            background: #4CAF50;
        }
        
        .status-inactive {
            background: #f44336;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .endpoint-metrics {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .endpoint-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        
        .endpoint-item:last-child {
            border-bottom: none;
        }
        
        .endpoint-name {
            font-weight: bold;
            color: #333;
        }
        
        .endpoint-stats {
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 CMS Thamanyah</h1>
            <p>Read-Only Load Test Dashboard</p>
        </div>
        
        <div class="status">
            <span class="status-indicator status-active" id="statusIndicator"></span>
            <span id="statusText">Dashboard Active</span>
            <div id="lastUpdate" style="margin-top: 10px; font-size: 0.9rem; color: #666;"></div>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value" id="currentUsers">0</div>
                <div class="metric-label">Current Users</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="totalRequests">0</div>
                <div class="metric-label">Total Requests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="successRate">0%</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="avgResponseTime">0ms</div>
                <div class="metric-label">Avg Response Time</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="requestsPerSecond">0</div>
                <div class="metric-label">Requests/Second</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="errorRate">0%</div>
                <div class="metric-label">Error Rate</div>
            </div>
        </div>
        
        <div class="chart-container">
            <div class="chart-title">Response Time Trend</div>
            <canvas id="responseTimeChart" width="400" height="200"></canvas>
        </div>
        
        <div class="endpoint-metrics">
            <div class="chart-title">Endpoint Performance</div>
            <div id="endpointList">
                <div class="endpoint-item">
                    <span class="endpoint-name">Loading...</span>
                    <span class="endpoint-stats">-</span>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Initialize charts
        const ctx = document.getElementById('responseTimeChart').getContext('2d');
        const responseTimeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Average Response Time (ms)',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // Update metrics
        function updateMetrics() {
            fetch('/api/metrics')
                .then(response => response.json())
                .then(data => {
                    // Update main metrics
                    document.getElementById('currentUsers').textContent = data.currentUsers || 0;
                    document.getElementById('totalRequests').textContent = data.totalRequests || 0;
                    
                    const successRate = data.totalRequests > 0 ? 
                        Math.round((data.successfulRequests / data.totalRequests) * 100) : 0;
                    document.getElementById('successRate').textContent = successRate + '%';
                    
                    document.getElementById('avgResponseTime').textContent = 
                        Math.round(data.avgResponseTime || 0) + 'ms';
                    
                    document.getElementById('requestsPerSecond').textContent = 
                        Math.round(data.requestsPerSecond || 0);
                    
                    const errorRate = data.totalRequests > 0 ? 
                        Math.round((data.failedRequests / data.totalRequests) * 100) : 0;
                    document.getElementById('errorRate').textContent = errorRate + '%';
                    
                    // Update status
                    const statusIndicator = document.getElementById('statusIndicator');
                    const statusText = document.getElementById('statusText');
                    const lastUpdate = document.getElementById('lastUpdate');
                    
                    if (data.lastUpdate) {
                        const timeDiff = Date.now() - new Date(data.lastUpdate).getTime();
                        if (timeDiff < 10000) { // 10 seconds
                            statusIndicator.className = 'status-indicator status-active';
                            statusText.textContent = 'Test Running';
                        } else {
                            statusIndicator.className = 'status-indicator status-inactive';
                            statusText.textContent = 'Test Inactive';
                        }
                        lastUpdate.textContent = 'Last Update: ' + new Date(data.lastUpdate).toLocaleTimeString();
                    }
                    
                    // Update chart
                    if (data.avgResponseTime) {
                        const now = new Date().toLocaleTimeString();
                        responseTimeChart.data.labels.push(now);
                        responseTimeChart.data.datasets[0].data.push(data.avgResponseTime);
                        
                        // Keep only last 20 data points
                        if (responseTimeChart.data.labels.length > 20) {
                            responseTimeChart.data.labels.shift();
                            responseTimeChart.data.datasets[0].data.shift();
                        }
                        
                        responseTimeChart.update('none');
                    }
                    
                    // Update endpoint metrics
                    if (data.endpointMetrics) {
                        updateEndpointMetrics(data.endpointMetrics);
                    }
                })
                .catch(error => {
                    console.error('Error fetching metrics:', error);
                });
        }

        function updateEndpointMetrics(endpointMetrics) {
            const endpointList = document.getElementById('endpointList');
            endpointList.innerHTML = '';
            
            Object.entries(endpointMetrics).forEach(([endpoint, metrics]) => {
                const item = document.createElement('div');
                item.className = 'endpoint-item';
                
                const avgTime = Math.round(metrics.avgResponseTime || 0);
                const errorRate = metrics.totalRequests > 0 ? 
                    Math.round((metrics.failedRequests / metrics.totalRequests) * 100) : 0;
                
                item.innerHTML = `
                    <span class="endpoint-name">${endpoint}</span>
                    <span class="endpoint-stats">${avgTime}ms | ${errorRate}% errors</span>
                `;
                
                endpointList.appendChild(item);
            });
        }

        // Update every second
        setInterval(updateMetrics, 1000);
        
        // Initial update
        updateMetrics();
    </script>
</body>
</html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Performance Dashboard running on http://localhost:${PORT}`);
  console.log(`📊 Ready to receive metrics from K6 load tests`);
  console.log(`💡 Send POST requests to http://localhost:${PORT}/metrics to update dashboard`);
});

module.exports = app;
