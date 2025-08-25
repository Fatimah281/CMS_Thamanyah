# Load Testing Suite for CMS Thamanyah Backend

This directory contains a comprehensive load testing solution for the CMS Thamanyah backend services using K6 and Redis monitoring.

## 🎯 Overview

The load testing suite simulates realistic user behavior for both CMS and Discovery frontend services, with comprehensive Redis performance monitoring and detailed reporting.

## 📋 Prerequisites

### Required Software
- **K6**: Performance testing tool
- **Node.js**: For Redis monitoring scripts
- **Redis**: Cache server (running on localhost:6379)
- **curl**: For API testing and health checks

### Installation

#### 1. Install K6
```bash
# Windows (using Chocolatey)
choco install k6

# macOS (using Homebrew)
brew install k6

# Linux (Ubuntu/Debian)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Or download from: https://k6.io/docs/getting-started/installation/
```

#### 2. Install Node.js Dependencies
```bash
cd load-testing
npm install redis
```

#### 3. Verify Redis Installation
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG
```

**If Redis CLI is not found, install Redis using one of these methods:**

**Option 1: Download from Redis website**
- Visit: https://redis.io/download
- Download Windows version
- Extract and add to PATH

**Option 2: Using Windows Package Manager (if available)**
```bash
winget install Redis.Redis
```

**Option 3: Using Chocolatey (if installed)**
```bash
choco install redis-64
```

**Option 4: Manual installation**
- Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
- Extract to C:\Redis
- Add C:\Redis to your PATH environment variable
- Start Redis server: `redis-server`
```

## 🚀 Quick Start

### 1. Start the Backend
```bash
# From the project root
npm run start:dev
```

### 2. Run Comprehensive Load Tests (10M Users/Hour Target)
```bash
# Option 1: Run everything together
npm run load:all

# Option 2: Run components separately
npm run load:dashboard    # Start real-time dashboard
npm run load:monitor      # Start Redis monitoring
npm run load:test:10m     # Run 10M users/hour load test
```

### 3. View Results
```bash
# Real-time dashboard (during test)
open http://localhost:8080

# Generated reports (after test)
open reports/load-test-report.html
open reports/performance-analysis-report.html
```

## 📊 Test Scenarios

The load testing suite includes four main scenarios that simulate realistic user behavior:

### 1. Discovery Frontend (60% of traffic)
- **Purpose**: Simulates end users browsing content
- **Operations**: 
  - Browse programs with pagination
  - View program details
  - Search and filter programs
  - Get categories and languages
- **Load Pattern**: Read-heavy, high frequency

### 2. CMS Frontend (20% of traffic)
- **Purpose**: Simulates content creators and administrators
- **Operations**:
  - Create new programs
  - Update existing programs
  - View program details
- **Load Pattern**: Write-heavy, moderate frequency

### 3. Authentication (15% of traffic)
- **Purpose**: Simulates user login/logout cycles
- **Operations**:
  - User login
  - User registration (occasional)
  - Token refresh
- **Load Pattern**: Moderate frequency, authentication-heavy

### 4. File Upload (5% of traffic)
- **Purpose**: Simulates video upload operations
- **Operations**:
  - File upload endpoint testing
  - Upload validation
- **Load Pattern**: Heavy operations, low frequency

## 🔧 Configuration

### Environment Variables

You can customize the load testing behavior using environment variables:

```bash
# API Configuration
export BASE_URL="http://localhost:3000/api/v1"
export REDIS_URL="localhost:6379"

# Test Configuration
export TEST_DURATION="30m"
export MAX_VUS=50

# Redis Configuration
export REDIS_HOST="localhost"
export REDIS_PORT=6379
export REDIS_PASSWORD=""
export MONITOR_INTERVAL=5000

# Output Configuration
export REPORT_DIR="./reports"
export METRICS_FILE="./reports/redis-metrics.json"
```

### Test Parameters

The K6 test configuration includes:

- **Stages**: Ramp-up from 100 to 5000 users over 90 minutes (10M users/hour equivalent)
- **Thresholds**: 
  - 95% of requests should complete within 1 second
  - 99% of requests should complete within 2 seconds
  - Error rate should be below 5%
  - Throughput should be above 2000 requests/second
  - Redis hit rate should be above 70%
- **Metrics**: Comprehensive performance monitoring with real-time dashboard

## 📈 Monitoring and Metrics

### Redis Performance Monitoring

The suite includes comprehensive Redis monitoring:

```bash
# Start Redis monitoring separately
node redis-monitor.js

# Or run with custom configuration
REDIS_HOST=localhost REDIS_PORT=6379 node redis-monitor.js
```

**Monitored Metrics:**
- Connected clients
- Memory usage
- Hit/miss rates
- Commands per second
- Response times

### Performance Metrics

The load tests measure:

- **Response Time**: Average, median, 95th and 99th percentiles
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Redis Performance**: Hit rates and latency

## 📄 Reports and Analysis

### Generated Reports

After running the load tests, you'll find:

1. **`load-test-report.html`**: Interactive HTML report with charts and metrics
2. **`k6-summary.json`**: Raw K6 test results
3. **`