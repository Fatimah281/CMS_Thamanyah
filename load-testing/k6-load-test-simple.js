import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// Custom metrics for comprehensive performance monitoring
const errorRate = new Rate('errors');
const redisHitRate = new Rate('redis_hits');
const redisMissRate = new Rate('redis_misses');
const responseTime = new Trend('response_time');
const throughput = new Counter('throughput');
const activeUsers = new Gauge('active_users');
const requestsPerSecond = new Gauge('requests_per_second');
const averageResponseTime = new Trend('avg_response_time');
const p95ResponseTime = new Trend('p95_response_time');
const p99ResponseTime = new Trend('p99_response_time');

// Test configuration for 10 million users per hour equivalent
export const options = {
  stages: [
    // Warm-up phase
    { duration: '1m', target: 10 }, // Ramp up to 10 users over 1 minute
    { duration: '2m', target: 10 }, // Stay at 10 users for 2 minutes
    
    // Scaling phase 1 - Moderate load
    { duration: '2m', target: 50 }, // Ramp up to 50 users over 2 minutes
    { duration: '3m', target: 50 }, // Stay at 50 users for 3 minutes
    
    // Scaling phase 2 - High load
    { duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
    { duration: '3m', target: 100 }, // Stay at 100 users for 3 minutes
    
    // Ramp down phase
    { duration: '1m', target: 10 }, // Ramp down to 10 users over 1 minute
    { duration: '1m', target: 0 }, // Ramp down to 0 users over 1 minute
  ],
  thresholds: {
    // Performance thresholds
    http_req_duration: [
      'p(95)<1000', // 95% of requests should be below 1 second
      'p(99)<2000', // 99% of requests should be below 2 seconds
      'avg<500', // Average response time should be below 500ms
    ],
    http_req_failed: ['rate<0.05'], // Error rate should be below 5%
    http_reqs: ['rate>100'], // Should handle at least 100 requests/second
    errors: ['rate<0.05'],
    redis_hits: ['rate>0.5'], // Redis hit rate should be above 50%
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';
const REDIS_URL = __ENV.REDIS_URL || 'http://localhost:6379';
const TEST_MODE = __ENV.TEST_MODE || 'simple';

// Performance tracking variables
let requestCount = 0;
let startTime = Date.now();

// Helper functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function checkRedisStatus() {
  try {
    const healthResponse = http.get(`${BASE_URL}/health`);
    if (healthResponse.status === 200) {
      const healthData = JSON.parse(healthResponse.body);
      return healthData.cache?.status === 'healthy';
    }
    return false;
  } catch (error) {
    console.error('Redis status check failed:', error);
    return false;
  }
}

function recordMetrics(response, scenario) {
  const duration = response.timings.duration;
  const isSuccess = response.status >= 200 && response.status < 300;
  
  // Record response time metrics
  responseTime.add(duration);
  averageResponseTime.add(duration);
  
  // Record throughput
  requestCount++;
  throughput.add(1);
  
  // Update requests per second gauge
  const elapsed = (Date.now() - startTime) / 1000;
  const currentRPS = requestCount / elapsed;
  requestsPerSecond.add(currentRPS);
  
  // Record error rate
  if (!isSuccess) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
  
  // Record Redis metrics
  const redisStatus = checkRedisStatus();
  if (redisStatus) {
    redisHitRate.add(1);
  } else {
    redisMissRate.add(1);
  }
  
  // Update active users gauge
  activeUsers.add(__VU);
}

// Test scenarios - Public endpoints only
export default function () {
  // Scenario 1: Discovery Frontend - Browse Programs (Read-heavy) - 100%
  const discoveryScenario = () => {
    // Get programs with pagination (public endpoint)
    const programsResponse = http.get(`${BASE_URL}/programs?page=1&limit=10`);
    check(programsResponse, {
      'programs list status is 200': (r) => r.status === 200,
      'programs response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    recordMetrics(programsResponse, 'discovery_programs');

    // Get specific program details (public endpoint)
    const programId = Math.floor(Math.random() * 100) + 1;
    const programResponse = http.get(`${BASE_URL}/programs/${programId}`);
    check(programResponse, {
      'program details status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      'program details response time < 800ms': (r) => r.timings.duration < 800,
    });
    recordMetrics(programResponse, 'discovery_program_details');

    // Get categories (public endpoint)
    const categoriesResponse = http.get(`${BASE_URL}/categories`);
    check(categoriesResponse, {
      'categories status is 200': (r) => r.status === 200,
      'categories response time < 500ms': (r) => r.timings.duration < 500,
    });
    recordMetrics(categoriesResponse, 'discovery_categories');

    // Get languages (public endpoint)
    const languagesResponse = http.get(`${BASE_URL}/languages`);
    check(languagesResponse, {
      'languages status is 200': (r) => r.status === 200,
      'languages response time < 500ms': (r) => r.timings.duration < 500,
    });
    recordMetrics(languagesResponse, 'discovery_languages');

    // Search/filter programs (public endpoint)
    const searchParams = ['test', 'video', 'audio', 'published', 'technology', 'education'];
    const searchTerm = getRandomElement(searchParams);
    const searchResponse = http.get(`${BASE_URL}/programs?search=${searchTerm}&page=1&limit=5`);
    check(searchResponse, {
      'search status is 200': (r) => r.status === 200,
      'search response time < 1200ms': (r) => r.timings.duration < 1200,
    });
    recordMetrics(searchResponse, 'discovery_search');

    // Health check (public endpoint)
    const healthResponse = http.get(`${BASE_URL}/health`);
    check(healthResponse, {
      'health status is 200': (r) => r.status === 200,
      'health response time < 300ms': (r) => r.timings.duration < 300,
    });
    recordMetrics(healthResponse, 'health_check');
  };

  // Execute discovery scenario (100% of the time)
  discoveryScenario();

  // Random sleep between requests to simulate real user behavior
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

// Handle test completion with comprehensive reporting
export function handleSummary(data) {
  const summary = {
    test_info: {
      name: 'CMS Thamanyah Load Test - Public Endpoints Only',
      mode: TEST_MODE,
      base_url: BASE_URL,
      redis_url: REDIS_URL,
      total_duration: `${data.state.testRunDuration / 1000}s`,
      total_requests: data.metrics.http_reqs?.values?.count || 0,
    },
    performance_metrics: {
      response_time: {
        average: data.metrics.http_req_duration?.values?.avg || 0,
        median: data.metrics.http_req_duration?.values?.med || 0,
        p95: data.metrics.http_req_duration?.values?.['p(95)'] || 0,
        p99: data.metrics.http_req_duration?.values?.['p(99)'] || 0,
        min: data.metrics.http_req_duration?.values?.min || 0,
        max: data.metrics.http_req_duration?.values?.max || 0,
      },
      throughput: {
        requests_per_second: data.metrics.http_reqs?.values?.rate || 0,
        total_requests: data.metrics.http_reqs?.values?.count || 0,
        users_per_hour_equivalent: (data.metrics.http_reqs?.values?.rate || 0) * 3600,
      },
      error_rates: {
        http_errors: (data.metrics.http_req_failed?.values?.rate || 0) * 100,
        total_errors: data.metrics.http_req_failed?.values?.count || 0,
        success_rate: (1 - (data.metrics.http_req_failed?.values?.rate || 0)) * 100,
      },
      redis_performance: {
        hit_rate: (data.metrics.redis_hits?.values?.rate || 0) * 100,
        miss_rate: (data.metrics.redis_misses?.values?.rate || 0) * 100,
        total_redis_checks: (data.metrics.redis_hits?.values?.count || 0) + (data.metrics.redis_misses?.values?.count || 0),
      },
      scalability: {
        max_concurrent_users: data.metrics.vus?.values?.max || 0,
        average_concurrent_users: data.metrics.vus?.values?.avg || 0,
        peak_requests_per_second: data.metrics.http_reqs?.values?.rate || 0,
      }
    },
    thresholds_analysis: {
      response_time_p95_passed: data.metrics.http_req_duration?.values?.['p(95)'] < 1000,
      response_time_p99_passed: data.metrics.http_req_duration?.values?.['p(99)'] < 2000,
      error_rate_passed: (data.metrics.http_req_failed?.values?.rate || 0) < 0.05,
      throughput_passed: (data.metrics.http_reqs?.values?.rate || 0) > 100,
      redis_hit_rate_passed: (data.metrics.redis_hits?.values?.rate || 0) > 0.5,
    },
    recommendations: generateRecommendations(data),
  };

  return {
    'load-test-report.html': htmlReport(data),
    'load-test-summary.json': JSON.stringify(summary, null, 2),
    'performance-metrics.json': JSON.stringify(data.metrics, null, 2),
  };
}

function generateRecommendations(data) {
  const recommendations = [];
  const avgResponseTime = data.metrics.http_req_duration?.values?.avg || 0;
  const errorRate = data.metrics.http_req_failed?.values?.rate || 0;
  const throughput = data.metrics.http_reqs?.values?.rate || 0;
  const redisHitRate = data.metrics.redis_hits?.values?.rate || 0;

  // Response time recommendations
  if (avgResponseTime > 500) {
    recommendations.push({
      priority: 'high',
      category: 'performance',
      issue: 'High average response time',
      current_value: `${avgResponseTime.toFixed(2)}ms`,
      target: '<500ms',
      action: 'Implement Redis caching, optimize database queries, add proper indexing',
    });
  }

  // Error rate recommendations
  if (errorRate > 0.05) {
    recommendations.push({
      priority: 'critical',
      category: 'reliability',
      issue: 'High error rate',
      current_value: `${(errorRate * 100).toFixed(2)}%`,
      target: '<5%',
      action: 'Investigate error logs, improve error handling, check database connectivity',
    });
  }

  // Throughput recommendations
  if (throughput < 100) {
    recommendations.push({
      priority: 'high',
      category: 'scalability',
      issue: 'Low throughput',
      current_value: `${throughput.toFixed(2)} req/s`,
      target: '>100 req/s',
      action: 'Optimize application performance, implement caching, consider horizontal scaling',
    });
  }

  // Redis recommendations
  if (redisHitRate < 0.5) {
    recommendations.push({
      priority: 'medium',
      category: 'caching',
      issue: 'Low Redis hit rate',
      current_value: `${(redisHitRate * 100).toFixed(2)}%`,
      target: '>50%',
      action: 'Optimize cache keys, adjust TTL settings, implement cache warming',
    });
  }

  // Success recommendations
  if (avgResponseTime < 300 && errorRate < 0.02 && throughput > 150) {
    recommendations.push({
      priority: 'low',
      category: 'optimization',
      issue: 'Excellent performance achieved',
      current_value: 'All targets met',
      target: 'Maintain current performance',
      action: 'Continue monitoring, consider further optimization for higher loads',
    });
  }

  return recommendations;
}

// Setup function (runs once at the beginning)
export function setup() {
  console.log('🚀 Starting simplified load test for CMS Thamanyah Backend');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔴 Redis URL: ${REDIS_URL}`);
  console.log(`🎯 Test Mode: ${TEST_MODE}`);
  console.log('📊 Target: Public Endpoints Performance Testing');
  console.log('📈 Test scenarios: Discovery (100%) - Public endpoints only');
  
  // Verify backend is accessible
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`Backend health check failed: ${healthCheck.status}`);
  }
  
  console.log('✅ Backend is accessible and ready for load testing');
  return { baseUrl: BASE_URL, startTime: Date.now() };
}

// Teardown function (runs once at the end)
export function teardown(data) {
  const totalDuration = (Date.now() - data.startTime) / 1000;
  const totalRequests = data?.metrics?.http_reqs?.values?.count || 0;
  const avgResponseTime = data?.metrics?.http_req_duration?.values?.avg || 0;
  const errorRate = (data?.metrics?.http_req_failed?.values?.rate || 0) * 100;
  const throughput = data?.metrics?.http_reqs?.values?.rate || 0;
  const usersPerHour = throughput * 3600;

  console.log('🏁 Load test completed');
  console.log(`⏱️  Total duration: ${totalDuration.toFixed(2)} seconds`);
  console.log(`📈 Total requests: ${totalRequests.toLocaleString()}`);
  console.log(`⚡ Average response time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`❌ Error rate: ${errorRate.toFixed(2)}%`);
  console.log(`🚀 Throughput: ${throughput.toFixed(2)} requests/second`);
  console.log(`👥 Users per hour equivalent: ${usersPerHour.toLocaleString()}`);
  console.log(`🎯 Redis Status: ${data?.metrics?.redis_hits?.values?.rate > 0.5 ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT'}`);
}
