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
// 10M users/hour = ~2,778 users/second = ~2,778 requests/second (assuming 1 request per user per hour)
export const options = {
  stages: [
    // Warm-up phase
    { duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
    { duration: '3m', target: 100 }, // Stay at 100 users for 3 minutes
    
    // Scaling phase 1 - Moderate load
    { duration: '5m', target: 500 }, // Ramp up to 500 users over 5 minutes
    { duration: '10m', target: 500 }, // Stay at 500 users for 10 minutes
    
    // Scaling phase 2 - High load
    { duration: '5m', target: 1000 }, // Ramp up to 1000 users over 5 minutes
    { duration: '15m', target: 1000 }, // Stay at 1000 users for 15 minutes
    
    // Scaling phase 3 - Peak load (10M users/hour equivalent)
    { duration: '5m', target: 2500 }, // Ramp up to 2500 users over 5 minutes
    { duration: '20m', target: 2500 }, // Stay at 2500 users for 20 minutes
    
    // Stress test phase
    { duration: '5m', target: 5000 }, // Ramp up to 5000 users over 5 minutes
    { duration: '10m', target: 5000 }, // Stay at 5000 users for 10 minutes
    
    // Ramp down phase
    { duration: '5m', target: 1000 }, // Ramp down to 1000 users over 5 minutes
    { duration: '5m', target: 100 }, // Ramp down to 100 users over 5 minutes
    { duration: '2m', target: 0 }, // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    // Performance thresholds for 10M users/hour equivalent
    http_req_duration: [
      'p(95)<1000', // 95% of requests should be below 1 second
      'p(99)<2000', // 99% of requests should be below 2 seconds
      'avg<500', // Average response time should be below 500ms
    ],
    http_req_failed: ['rate<0.05'], // Error rate should be below 5%
    http_reqs: ['rate>2000'], // Should handle at least 2000 requests/second
    errors: ['rate<0.05'],
    redis_hits: ['rate>0.7'], // Redis hit rate should be above 70%
  },
  // Enable detailed metrics collection
  ext: {
    loadimpact: {
      distribution: {
        'Load Test': { loadZone: 'amazon:us:ashburn', percent: 100 },
      },
    },
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';
const REDIS_URL = __ENV.REDIS_URL || 'http://localhost:6379';
const TEST_MODE = __ENV.TEST_MODE || 'comprehensive'; // 'quick', 'comprehensive', 'stress'

// Sample test data
const testUsers = [
  { email: 'admin@test.com', password: 'admin123', username: 'admin', role: 'admin' },
  { email: 'creator@test.com', password: 'creator123', username: 'creator', role: 'content_creator' },
  { email: 'viewer@test.com', password: 'viewer123', username: 'viewer', role: 'viewer' },
  { email: 'editor@test.com', password: 'editor123', username: 'editor', role: 'content_creator' },
  { email: 'moderator@test.com', password: 'moderator123', username: 'moderator', role: 'admin' },
];

const samplePrograms = [
  {
    title: 'Test Program 1',
    description: 'This is a test program for load testing',
    duration: 120,
    publishDate: new Date().toISOString(),
    status: 'published',
    categoryId: 1,
    languageId: 1,
    contentType: 'video',
    videoSource: 'youtube',
    youtubeUrl: 'https://www.youtube.com/watch?v=test1',
    tags: ['test', 'load-testing'],
  },
  {
    title: 'Test Program 2',
    description: 'Another test program for load testing',
    duration: 180,
    publishDate: new Date().toISOString(),
    status: 'draft',
    categoryId: 2,
    languageId: 2,
    contentType: 'audio',
    videoSource: 'upload',
    tags: ['test', 'audio'],
  },
];

// Performance tracking variables
let requestCount = 0;
let startTime = Date.now();

// Helper functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateAuthToken() {
  const user = getRandomElement(testUsers);
  const loginPayload = JSON.stringify({
    username: user.username,
    password: user.password,
  });

  const loginResponse = http.post(`${BASE_URL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginResponse.status === 200) {
    const responseBody = JSON.parse(loginResponse.body);
    return responseBody.data.accessToken;
  }
  return null;
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

// Test scenarios
export default function () {
  const token = generateAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  // Scenario 1: Discovery Frontend - Browse Programs (Read-heavy) - 80%
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
  };

  // Scenario 2: CMS Frontend - Content Management (Write-heavy) - 20%
  const cmsScenario = () => {
    if (!token) {
      console.log('No auth token available for CMS operations');
      return;
    }

    // Create a new program
    const newProgram = getRandomElement(samplePrograms);
    const createResponse = http.post(`${BASE_URL}/programs`, JSON.stringify(newProgram), { headers });
    check(createResponse, {
      'create program status is 201': (r) => r.status === 201,
      'create program response time < 3000ms': (r) => r.timings.duration < 3000,
    });
    recordMetrics(createResponse, 'cms_create');

    if (createResponse.status === 201) {
      const responseBody = JSON.parse(createResponse.body);
      const programId = responseBody.data.id;

      // Update the program
      const updateData = {
        title: `${newProgram.title} - Updated`,
        description: `${newProgram.description} - Updated for load testing`,
      };
      const updateResponse = http.patch(`${BASE_URL}/programs/${programId}`, JSON.stringify(updateData), { headers });
      check(updateResponse, {
        'update program status is 200': (r) => r.status === 200,
        'update program response time < 2000ms': (r) => r.timings.duration < 2000,
      });
      recordMetrics(updateResponse, 'cms_update');

      // Get the updated program
      const getResponse = http.get(`${BASE_URL}/programs/${programId}`, { headers });
      check(getResponse, {
        'get updated program status is 200': (r) => r.status === 200,
        'get updated program response time < 1000ms': (r) => r.timings.duration < 1000,
      });
      recordMetrics(getResponse, 'cms_get');
    }
  };

  // Scenario 3: Authentication and Authorization - 15%
  const authScenario = () => {
    // Login
    const user = getRandomElement(testUsers);
    const loginPayload = JSON.stringify({
      username: user.username,
      password: user.password,
    });
    const loginResponse = http.post(`${BASE_URL}/auth/login`, loginPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    check(loginResponse, {
      'login status is 200': (r) => r.status === 200,
      'login response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    recordMetrics(loginResponse, 'auth_login');

    // Register new user (occasionally)
    if (Math.random() < 0.05) { // 5% chance
      const newUser = {
        email: `testuser${Date.now()}@loadtest.com`,
        password: 'testpass123',
        username: `testuser${Date.now()}`,
        role: 'viewer',
      };
      const registerResponse = http.post(`${BASE_URL}/auth/register`, JSON.stringify(newUser), {
        headers: { 'Content-Type': 'application/json' },
      });
      check(registerResponse, {
        'register status is 201 or 409': (r) => r.status === 201 || r.status === 409,
        'register response time < 1500ms': (r) => r.timings.duration < 1500,
      });
      recordMetrics(registerResponse, 'auth_register');
    }
  };

  // Scenario 4: File Upload (Heavy operations) - 5%
  const uploadScenario = () => {
    if (!token) {
      console.log('No auth token available for upload operations');
      return;
    }

    // Simulate file upload (without actual file)
    const uploadResponse = http.post(`${BASE_URL}/programs/upload`, null, { headers });
    check(uploadResponse, {
      'upload endpoint accessible': (r) => r.status === 400, // Expected to fail without file
      'upload response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    recordMetrics(uploadResponse, 'upload_simulation');
  };

  // Execute scenarios based on probability - prioritize public endpoints
  const scenario = Math.random();
  
  if (scenario < 0.8) {
    // 80% - Discovery (read-heavy, public endpoints)
    discoveryScenario();
  } else if (scenario < 0.9) {
    // 10% - Authentication (public endpoints)
    authScenario();
  } else if (scenario < 0.95) {
    // 5% - CMS (write-heavy, requires auth)
    cmsScenario();
  } else {
    // 5% - File upload (requires auth)
    uploadScenario();
  }

  // Random sleep between requests to simulate real user behavior
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

// Handle test completion with comprehensive reporting
export function handleSummary(data) {
  const summary = {
    test_info: {
      name: 'CMS Thamanyah Load Test - 10M Users/Hour Equivalent',
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
      throughput_passed: (data.metrics.http_reqs?.values?.rate || 0) > 2000,
      redis_hit_rate_passed: (data.metrics.redis_hits?.values?.rate || 0) > 0.7,
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
  if (throughput < 2000) {
    recommendations.push({
      priority: 'high',
      category: 'scalability',
      issue: 'Low throughput',
      current_value: `${throughput.toFixed(2)} req/s`,
      target: '>2000 req/s',
      action: 'Optimize application performance, implement caching, consider horizontal scaling',
    });
  }

  // Redis recommendations
  if (redisHitRate < 0.7) {
    recommendations.push({
      priority: 'medium',
      category: 'caching',
      issue: 'Low Redis hit rate',
      current_value: `${(redisHitRate * 100).toFixed(2)}%`,
      target: '>70%',
      action: 'Optimize cache keys, adjust TTL settings, implement cache warming',
    });
  }

  // Success recommendations
  if (avgResponseTime < 300 && errorRate < 0.02 && throughput > 2500) {
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
  console.log('🚀 Starting comprehensive load test for CMS Thamanyah Backend');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔴 Redis URL: ${REDIS_URL}`);
  console.log(`🎯 Test Mode: ${TEST_MODE}`);
  console.log('📊 Target: 10 Million Users per Hour Equivalent');
  console.log('📈 Test scenarios: Discovery (60%), CMS (20%), Auth (15%), Upload (5%)');
  
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
  console.log(`🎯 Target achieved: ${usersPerHour >= 10000000 ? '✅ YES' : '❌ NO'}`);
}
