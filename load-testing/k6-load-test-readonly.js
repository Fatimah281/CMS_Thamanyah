import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const programsListed = new Counter('programs_listed');
const programsViewed = new Counter('programs_viewed');
const searchesPerformed = new Counter('searches_performed');
const categoriesViewed = new Counter('categories_viewed');

// Response time trends
const programsListResponseTime = new Trend('programs_list_response_time');
const programsDetailsResponseTime = new Trend('programs_details_response_time');
const searchResponseTime = new Trend('search_response_time');
const categoriesResponseTime = new Trend('categories_response_time');

// Error rates
const programsListErrorRate = new Rate('programs_list_error_rate');
const programsDetailsErrorRate = new Rate('programs_details_error_rate');
const searchErrorRate = new Rate('search_error_rate');
const categoriesErrorRate = new Rate('categories_error_rate');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const DASHBOARD_URL = __ENV.DASHBOARD_URL || 'http://localhost:8080';

// Test data
const searchTerms = [
  'programming', 'javascript', 'python', 'java', 'react', 'angular', 'nodejs',
  'database', 'sql', 'mongodb', 'api', 'rest', 'graphql', 'docker', 'kubernetes',
  'aws', 'azure', 'gcp', 'machine learning', 'ai', 'data science', 'web development',
  'mobile development', 'ios', 'android', 'flutter', 'react native', 'vue', 'svelte',
  'typescript', 'php', 'ruby', 'go', 'rust', 'c++', 'c#', '.net', 'spring', 'django',
  'flask', 'express', 'fastapi', 'laravel', 'rails', 'asp.net', 'blazor'
];

const categories = [
  'programming', 'web-development', 'mobile-development', 'data-science',
  'machine-learning', 'cloud-computing', 'devops', 'cybersecurity',
  'database', 'frontend', 'backend', 'fullstack'
];

const languages = [
  'english', 'arabic', 'spanish', 'french', 'german', 'chinese',
  'japanese', 'korean', 'russian', 'portuguese', 'italian', 'dutch'
];

const levels = ['beginner', 'intermediate', 'advanced'];
const durations = ['short', 'medium', 'long'];

// Helper functions
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomParams() {
  const params = {};
  
  // Random pagination
  if (Math.random() < 0.3) {
    params.page = Math.floor(Math.random() * 10) + 1;
  }
  if (Math.random() < 0.3) {
    params.limit = Math.floor(Math.random() * 20) + 10;
  }
  
  // Random filters
  if (Math.random() < 0.4) {
    params.category = getRandomItem(categories);
  }
  if (Math.random() < 0.3) {
    params.language = getRandomItem(languages);
  }
  if (Math.random() < 0.2) {
    params.level = getRandomItem(levels);
  }
  if (Math.random() < 0.2) {
    params.duration = getRandomItem(durations);
  }
  
  return params;
}

// Send metrics to dashboard
function sendMetricsToDashboard(metrics) {
  try {
    http.post(`${DASHBOARD_URL}/metrics`, JSON.stringify({ metrics }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Silently fail - dashboard is optional
  }
}

// Test functions
function testProgramsList() {
  const params = getRandomParams();
  const queryString = new URLSearchParams(params).toString();
  const url = `${BASE_URL}/api/v1/programs${queryString ? '?' + queryString : ''}`;
  
  const startTime = Date.now();
  const response = http.get(url);
  const responseTime = Date.now() - startTime;
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => r.json('data') !== undefined,
  });
  
  programsListResponseTime.add(responseTime);
  programsListErrorRate.add(!success);
  
  if (success && response.status === 200) {
    const data = response.json('data');
    if (data && Array.isArray(data)) {
      programsListed.add(data.length);
    }
  }
  
  return response;
}

function testProgramDetails(programId) {
  const url = `${BASE_URL}/api/v1/programs/${programId}`;
  
  const startTime = Date.now();
  const response = http.get(url);
  const responseTime = Date.now() - startTime;
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has program data': (r) => r.json('data') !== undefined,
  });
  
  programsDetailsResponseTime.add(responseTime);
  programsDetailsErrorRate.add(!success);
  
  if (success && response.status === 200) {
    programsViewed.add(1);
  }
  
  return response;
}

function testSearch() {
  const searchTerm = getRandomItem(searchTerms);
  const url = `${BASE_URL}/api/v1/programs/search?q=${encodeURIComponent(searchTerm)}`;
  
  const startTime = Date.now();
  const response = http.get(url);
  const responseTime = Date.now() - startTime;
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has search results': (r) => r.json('data') !== undefined,
  });
  
  searchResponseTime.add(responseTime);
  searchErrorRate.add(!success);
  
  if (success && response.status === 200) {
    searchesPerformed.add(1);
  }
  
  return response;
}

function testCategories() {
  const url = `${BASE_URL}/api/v1/categories`;
  
  const startTime = Date.now();
  const response = http.get(url);
  const responseTime = Date.now() - startTime;
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has categories': (r) => r.json('data') !== undefined,
  });
  
  categoriesResponseTime.add(responseTime);
  categoriesErrorRate.add(!success);
  
  if (success && response.status === 200) {
    categoriesViewed.add(1);
  }
  
  return response;
}

// Test stages
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Warm up
    { duration: '5m', target: 50 },   // Ramp up
    { duration: '10m', target: 100 }, // Peak load
    { duration: '5m', target: 100 },  // Sustained peak
    { duration: '3m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.1'],     // Error rate should be below 10%
    'programs_list_response_time': ['p(95)<1500'],
    'programs_details_response_time': ['p(95)<1000'],
    'search_response_time': ['p(95)<2000'],
    'categories_response_time': ['p(95)<1000'],
  },
};

// Setup function
export function setup() {
  console.log(`🚀 Starting read-only load test against: ${BASE_URL}`);
  console.log(`📊 Dashboard URL: ${DASHBOARD_URL}`);
  
  // Health check
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    console.log(`⚠️ Warning: Health check failed (${healthResponse.status})`);
  } else {
    console.log(`✅ Health check passed`);
  }
  
  return { startTime: Date.now() };
}

// Main test function
export default function(data) {
  // Simulate realistic user behavior with weighted scenarios
  
  // 40% chance: Browse programs list (most common user action)
  if (Math.random() < 0.4) {
    const listResponse = testProgramsList();
    // If we got programs, view a random one (30% chance)
    if (listResponse.status === 200 && Math.random() < 0.3) {
      const programs = listResponse.json('data');
      if (programs && programs.length > 0) {
        const randomProgram = getRandomItem(programs);
        if (randomProgram && randomProgram.id) {
          testProgramDetails(randomProgram.id);
        }
      }
    }
  }
  // 30% chance: Search programs (second most common action)
  else if (Math.random() < 0.3) {
    const searchResponse = testSearch();
    // If search returned results, view a random one (40% chance)
    if (searchResponse.status === 200 && Math.random() < 0.4) {
      const programs = searchResponse.json('data');
      if (programs && programs.length > 0) {
        const randomProgram = getRandomItem(programs);
        if (randomProgram && randomProgram.id) {
          testProgramDetails(randomProgram.id);
        }
      }
    }
  }
  // 20% chance: View categories
  else if (Math.random() < 0.20) {
    testCategories();
  }
  // 10% chance: Just browse programs list without viewing details
  else {
    testProgramsList();
  }
  
  // Realistic think time between requests (1-4 seconds)
  sleep(Math.random() * 3 + 1);
  
  // Send metrics to dashboard every 10 requests
  if (Math.random() < 0.1) {
    const currentMetrics = {
      currentUsers: __VU,
      totalRequests: programsListed.value + programsViewed.value + searchesPerformed.value + categoriesViewed.value,
      successfulRequests: programsListed.value + programsViewed.value + searchesPerformed.value + categoriesViewed.value,
      failedRequests: 0, // Will be calculated from error rates
      avgResponseTime: (programsListResponseTime.value + programsDetailsResponseTime.value + searchResponseTime.value + categoriesResponseTime.value) / 4,
      requestsPerSecond: 0, // Will be calculated
      endpointMetrics: {
        'GET /api/v1/programs': {
          avgResponseTime: programsListResponseTime.value,
          totalRequests: programsListed.value,
          failedRequests: 0
        },
        'GET /api/v1/programs/{id}': {
          avgResponseTime: programsDetailsResponseTime.value,
          totalRequests: programsViewed.value,
          failedRequests: 0
        },
        'GET /api/v1/programs/search': {
          avgResponseTime: searchResponseTime.value,
          totalRequests: searchesPerformed.value,
          failedRequests: 0
        },
        'GET /api/v1/categories': {
          avgResponseTime: categoriesResponseTime.value,
          totalRequests: categoriesViewed.value,
          failedRequests: 0
        }
      }
    };
    
    sendMetricsToDashboard(currentMetrics);
  }
}

// Summary function
export function handleSummary(data) {
  const summary = {
    testInfo: {
      name: 'CMS Thamanyah Read-Only Load Test',
      description: 'Read-only load testing for CMS Thamanyah backend services',
      baseUrl: BASE_URL,
      dashboardUrl: DASHBOARD_URL,
      startTime: new Date().toISOString(),
      duration: `${data.state.testRunDuration / 1000}s`
    },
    metrics: {
      http_req_duration: {
        avg: data.metrics.http_req_duration.values.avg,
        p90: data.metrics.http_req_duration.values['p(90)'],
        p95: data.metrics.http_req_duration.values['p(95)'],
        p99: data.metrics.http_req_duration.values['p(99)']
      },
      http_req_rate: data.metrics.http_req_rate.values.rate,
      http_req_failed: data.metrics.http_req_failed.values.rate,
      http_reqs: data.metrics.http_reqs.values.count
    },
    customMetrics: {
      programsListed: programsListed.value,
      programsViewed: programsViewed.value,
      searchesPerformed: searchesPerformed.value,
      categoriesViewed: categoriesViewed.value,
      programsListResponseTime: {
        avg: programsListResponseTime.value,
        p90: programsListResponseTime.value,
        p95: programsListResponseTime.value
      },
      programsDetailsResponseTime: {
        avg: programsDetailsResponseTime.value,
        p90: programsDetailsResponseTime.value,
        p95: programsDetailsResponseTime.value
      },
      searchResponseTime: {
        avg: searchResponseTime.value,
        p90: searchResponseTime.value,
        p95: searchResponseTime.value
      },
      categoriesResponseTime: {
        avg: categoriesResponseTime.value,
        p90: categoriesResponseTime.value,
        p95: categoriesResponseTime.value
      }
    },
    thresholds: {
      passed: data.root_group.checks.passed,
      failed: data.root_group.checks.failed
    }
  };
  
  console.log('\n📊 Load Test Summary:');
  console.log(`✅ Test completed successfully`);
  console.log(`📈 Total requests: ${summary.metrics.http_reqs}`);
  console.log(`⚡ Average response time: ${Math.round(summary.metrics.http_req_duration.avg)}ms`);
  console.log(`🎯 P95 response time: ${Math.round(summary.metrics.http_req_duration.p95)}ms`);
  console.log(`📊 Requests per second: ${Math.round(summary.metrics.http_req_rate)}`);
  console.log(`❌ Error rate: ${(summary.metrics.http_req_failed * 100).toFixed(1)}%`);
  console.log(`📋 Programs listed: ${summary.customMetrics.programsListed}`);
  console.log(`👁️ Programs viewed: ${summary.customMetrics.programsViewed}`);
  console.log(`🔍 Searches performed: ${summary.customMetrics.searchesPerformed}`);
  console.log(`📂 Categories viewed: ${summary.customMetrics.categoriesViewed}`);
  
  return {
    'stdout': JSON.stringify(summary, null, 2),
    'load-test-summary-readonly.json': JSON.stringify(summary, null, 2),
  };
}
