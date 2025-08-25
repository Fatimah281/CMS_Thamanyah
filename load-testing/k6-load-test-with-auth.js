import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================================================
// CUSTOM METRICS
// ============================================================================

// Response time metrics
const authResponseTime = new Trend('auth_response_time');
const cmsResponseTime = new Trend('cms_response_time');
const discoveryResponseTime = new Trend('discovery_response_time');
const uploadResponseTime = new Trend('upload_response_time');
const searchResponseTime = new Trend('search_response_time');

// Error rate metrics
const authErrorRate = new Rate('auth_error_rate');
const cmsErrorRate = new Rate('cms_error_rate');
const discoveryErrorRate = new Rate('discovery_error_rate');
const uploadErrorRate = new Rate('upload_error_rate');
const searchErrorRate = new Rate('search_error_rate');

// Business metrics
const programsCreated = new Counter('programs_created');
const programsUpdated = new Counter('programs_updated');
const programsViewed = new Counter('programs_viewed');
const searchesPerformed = new Counter('searches_performed');
const uploadsAttempted = new Counter('uploads_attempted');

// Throughput metrics
const requestsPerSecond = new Trend('requests_per_second');
const activeUsers = new Trend('active_users');

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const DISCOVERY_URL = __ENV.DISCOVERY_URL || 'http://localhost:4200';
const CMS_URL = __ENV.CMS_URL || 'http://localhost:4201';

// Test users for authentication
const testUsers = [
  { email: 'admin@thamanyah.com', password: 'admin123', role: 'admin' },
  { email: 'editor@thamanyah.com', password: 'editor123', role: 'editor' },
  { email: 'viewer@thamanyah.com', password: 'viewer123', role: 'viewer' },
  { email: 'manager@thamanyah.com', password: 'manager123', role: 'manager' },
  { email: 'content@thamanyah.com', password: 'content123', role: 'content' }
];

// Search terms for discovery
const searchTerms = [
  'programming', 'web development', 'mobile app', 'database', 'cloud computing',
  'artificial intelligence', 'machine learning', 'cybersecurity', 'data science',
  'frontend', 'backend', 'fullstack', 'devops', 'agile', 'scrum', 'testing',
  'javascript', 'python', 'java', 'react', 'angular', 'vue', 'nodejs', 'express',
  'mongodb', 'postgresql', 'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp'
];

// Program categories
const categories = ['technology', 'business', 'healthcare', 'education', 'finance', 'entertainment'];

// ============================================================================
// AUTHENTICATION MANAGEMENT
// ============================================================================

// Global token storage
let authToken = null;
let tokenExpiry = 0;
let currentUser = null;

/**
 * Authenticate user and obtain token
 * @param {Object} user - User credentials
 * @returns {boolean} - Success status
 */
function authenticateUser(user) {
  const startTime = Date.now();
  
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password
  });

  const loginResponse = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '10s'
  });

  const responseTime = Date.now() - startTime;
  authResponseTime.add(responseTime);

  const isSuccess = check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'login response has token': (r) => r.json('token') !== undefined,
    'login response has user': (r) => r.json('user') !== undefined,
  });

  if (isSuccess) {
    const responseData = loginResponse.json();
    authToken = responseData.token;
    tokenExpiry = Date.now() + (responseData.expiresIn || 3600000); // Default 1 hour
    currentUser = responseData.user;
    
    // Store token in environment variable for other requests
    __ENV.AUTH_TOKEN = authToken;
    
    console.log(`✅ Authenticated user: ${user.email} (${user.role})`);
    authErrorRate.add(0);
    return true;
  } else {
    console.log(`❌ Authentication failed for user: ${user.email}`);
    authErrorRate.add(1);
    return false;
  }
}

/**
 * Check if token is valid and not expired
 * @returns {boolean} - Token validity
 */
function isTokenValid() {
  return authToken && Date.now() < tokenExpiry;
}

/**
 * Get authentication headers
 * @returns {Object} - Headers with auth token
 */
function getAuthHeaders() {
  if (!isTokenValid()) {
    // Re-authenticate if token is expired
    const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
    authenticateUser(randomUser);
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };
}

/**
 * Ensure authentication before CMS operations
 * @returns {boolean} - Authentication status
 */
function ensureAuthentication() {
  if (!isTokenValid()) {
    const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
    return authenticateUser(randomUser);
  }
  return true;
}

// ============================================================================
// CMS OPERATIONS
// ============================================================================

/**
 * Create a new program
 * @returns {Object} - Created program data
 */
function createProgram() {
  if (!ensureAuthentication()) {
    console.log('❌ Cannot create program: Authentication failed');
    return null;
  }

  const startTime = Date.now();
  
  const programData = {
    title: `Test Program ${Date.now()}`,
    description: `This is a test program created during load testing at ${new Date().toISOString()}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    duration: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
    level: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
    tags: ['load-test', 'automated', 'performance'],
    content: {
      sections: [
        {
          title: 'Introduction',
          content: 'This is the introduction section of the test program.'
        },
        {
          title: 'Main Content',
          content: 'This is the main content section with detailed information.'
        }
      ]
    }
  };

  const response = http.post(`${BASE_URL}/api/v1/programs`, JSON.stringify(programData), {
    headers: getAuthHeaders(),
    timeout: '15s'
  });

  const responseTime = Date.now() - startTime;
  cmsResponseTime.add(responseTime);

  const isSuccess = check(response, {
    'program creation successful': (r) => r.status === 201,
    'program has ID': (r) => r.json('id') !== undefined,
    'program has title': (r) => r.json('title') === programData.title,
  });

  if (isSuccess) {
    programsCreated.add(1);
    cmsErrorRate.add(0);
    console.log(`✅ Created program: ${programData.title}`);
    return response.json();
  } else {
    cmsErrorRate.add(1);
    console.log(`❌ Failed to create program: ${response.status} - ${response.body}`);
    return null;
  }
}

/**
 * Update an existing program
 * @param {string} programId - Program ID to update
 * @returns {boolean} - Success status
 */
function updateProgram(programId) {
  if (!ensureAuthentication()) {
    console.log('❌ Cannot update program: Authentication failed');
    return false;
  }

  const startTime = Date.now();
  
  const updateData = {
    title: `Updated Program ${Date.now()}`,
    description: `This program was updated during load testing at ${new Date().toISOString()}`,
    tags: ['load-test', 'automated', 'performance', 'updated']
  };

  const response = http.put(`${BASE_URL}/api/v1/programs/${programId}`, JSON.stringify(updateData), {
    headers: getAuthHeaders(),
    timeout: '15s'
  });

  const responseTime = Date.now() - startTime;
  cmsResponseTime.add(responseTime);

  const isSuccess = check(response, {
    'program update successful': (r) => r.status === 200,
    'program was updated': (r) => r.json('title') === updateData.title,
  });

  if (isSuccess) {
    programsUpdated.add(1);
    cmsErrorRate.add(0);
    console.log(`✅ Updated program: ${programId}`);
    return true;
  } else {
    cmsErrorRate.add(1);
    console.log(`❌ Failed to update program ${programId}: ${response.status}`);
    return false;
  }
}

/**
 * Get all programs for CMS (admin view)
 * @returns {Array} - List of programs
 */
function getAllPrograms() {
  if (!ensureAuthentication()) {
    console.log('❌ Cannot get programs: Authentication failed');
    return [];
  }

  const startTime = Date.now();
  
  const response = http.get(`${BASE_URL}/api/v1/programs?page=1&limit=20`, {
    headers: getAuthHeaders(),
    timeout: '10s'
  });

  const responseTime = Date.now() - startTime;
  cmsResponseTime.add(responseTime);

  const isSuccess = check(response, {
    'get programs successful': (r) => r.status === 200,
    'programs array exists': (r) => Array.isArray(r.json('programs')),
  });

  if (isSuccess) {
    cmsErrorRate.add(0);
    return response.json('programs') || [];
  } else {
    cmsErrorRate.add(1);
    console.log(`❌ Failed to get programs: ${response.status}`);
    return [];
  }
}

// ============================================================================
// DISCOVERY OPERATIONS
// ============================================================================

/**
 * View program details
 * @param {string} programId - Program ID to view
 * @returns {Object} - Program details
 */
function viewProgramDetails(programId) {
  const startTime = Date.now();
  
  const response = http.get(`${BASE_URL}/api/v1/programs/${programId}`, {
    timeout: '10s'
  });

  const responseTime = Date.now() - startTime;
  discoveryResponseTime.add(responseTime);

  const isSuccess = check(response, {
    'program details successful': (r) => r.status === 200,
    'program has title': (r) => r.json('title') !== undefined,
    'program has description': (r) => r.json('description') !== undefined,
  });

  if (isSuccess) {
    programsViewed.add(1);
    discoveryErrorRate.add(0);
    return response.json();
  } else {
    discoveryErrorRate.add(1);
    console.log(`❌ Failed to view program ${programId}: ${response.status}`);
    return null;
  }
}

/**
 * Search programs
 * @param {string} searchTerm - Search term
 * @returns {Array} - Search results
 */
function searchPrograms(searchTerm) {
  const startTime = Date.now();
  
  const response = http.get(`${BASE_URL}/api/v1/programs?search=${encodeURIComponent(searchTerm)}&page=1&limit=10`, {
    timeout: '10s'
  });

  const responseTime = Date.now() - startTime;
  searchResponseTime.add(responseTime);

  const isSuccess = check(response, {
    'search successful': (r) => r.status === 200,
    'search results exist': (r) => Array.isArray(r.json('programs')),
  });

  if (isSuccess) {
    searchesPerformed.add(1);
    searchErrorRate.add(0);
    return response.json('programs') || [];
  } else {
    searchErrorRate.add(1);
    console.log(`❌ Search failed for "${searchTerm}": ${response.status}`);
    return [];
  }
}

/**
 * Filter programs by category
 * @param {string} category - Category to filter by
 * @returns {Array} - Filtered results
 */
function filterProgramsByCategory(category) {
  const startTime = Date.now();
  
  const response = http.get(`${BASE_URL}/api/v1/programs?category=${encodeURIComponent(category)}&page=1&limit=10`, {
    timeout: '10s'
  });

  const responseTime = Date.now() - startTime;
  discoveryResponseTime.add(responseTime);

  const isSuccess = check(response, {
    'filter successful': (r) => r.status === 200,
    'filter results exist': (r) => Array.isArray(r.json('programs')),
  });

  if (isSuccess) {
    discoveryErrorRate.add(0);
    return response.json('programs') || [];
  } else {
    discoveryErrorRate.add(1);
    console.log(`❌ Filter failed for category "${category}": ${response.status}`);
    return [];
  }
}

/**
 * Get program categories
 * @returns {Array} - Available categories
 */
function getCategories() {
  const startTime = Date.now();
  
  const response = http.get(`${BASE_URL}/api/v1/categories`, {
    timeout: '10s'
  });

  const responseTime = Date.now() - startTime;
  discoveryResponseTime.add(responseTime);

  const isSuccess = check(response, {
    'categories successful': (r) => r.status === 200,
    'categories array exists': (r) => Array.isArray(r.json('categories')),
  });

  if (isSuccess) {
    discoveryErrorRate.add(0);
    return response.json('categories') || [];
  } else {
    discoveryErrorRate.add(1);
    console.log(`❌ Failed to get categories: ${response.status}`);
    return [];
  }
}

// ============================================================================
// UPLOAD OPERATIONS
// ============================================================================

/**
 * Prepare file upload
 * @returns {Object} - Upload preparation data
 */
function prepareUpload() {
  if (!ensureAuthentication()) {
    console.log('❌ Cannot prepare upload: Authentication failed');
    return null;
  }

  const startTime = Date.now();
  
  const uploadData = {
    fileName: `test-file-${Date.now()}.pdf`,
    fileSize: Math.floor(Math.random() * 10000000) + 1000000, // 1-10MB
    fileType: 'application/pdf',
    programId: null // Will be set when creating program
  };

  const response = http.post(`${BASE_URL}/api/v1/upload/prepare`, JSON.stringify(uploadData), {
    headers: getAuthHeaders(),
    timeout: '15s'
  });

  const responseTime = Date.now() - startTime;
  uploadResponseTime.add(responseTime);

  const isSuccess = check(response, {
    'upload preparation successful': (r) => r.status === 200,
    'upload URL provided': (r) => r.json('uploadUrl') !== undefined,
  });

  if (isSuccess) {
    uploadsAttempted.add(1);
    uploadErrorRate.add(0);
    console.log(`✅ Upload prepared: ${uploadData.fileName}`);
    return response.json();
  } else {
    uploadErrorRate.add(1);
    console.log(`❌ Failed to prepare upload: ${response.status}`);
    return null;
  }
}

/**
 * Check upload status
 * @param {string} uploadId - Upload ID to check
 * @returns {Object} - Upload status
 */
function checkUploadStatus(uploadId) {
  if (!ensureAuthentication()) {
    console.log('❌ Cannot check upload status: Authentication failed');
    return null;
  }

  const startTime = Date.now();
  
  const response = http.get(`${BASE_URL}/api/v1/upload/${uploadId}/status`, {
    headers: getAuthHeaders(),
    timeout: '10s'
  });

  const responseTime = Date.now() - startTime;
  uploadResponseTime.add(responseTime);

  const isSuccess = check(response, {
    'upload status successful': (r) => r.status === 200,
    'status exists': (r) => r.json('status') !== undefined,
  });

  if (isSuccess) {
    uploadErrorRate.add(0);
    return response.json();
  } else {
    uploadErrorRate.add(1);
    console.log(`❌ Failed to check upload status ${uploadId}: ${response.status}`);
    return null;
  }
}

// ============================================================================
// USER SCENARIOS
// ============================================================================

/**
 * CMS User Scenario - Content Management
 */
function cmsUserScenario() {
  console.log('🔄 Starting CMS User Scenario');
  
  // Authenticate as CMS user
  const cmsUser = testUsers.find(u => ['admin', 'editor', 'content'].includes(u.role)) || testUsers[0];
  if (!authenticateUser(cmsUser)) {
    console.log('❌ CMS scenario failed: Authentication failed');
    return;
  }

  // Get existing programs
  const existingPrograms = getAllPrograms();
  
  // Create new program (30% chance)
  if (Math.random() < 0.3) {
    const newProgram = createProgram();
    if (newProgram) {
      // Update the program we just created
      sleep(1);
      updateProgram(newProgram.id);
    }
  }
  
  // Update existing program (40% chance)
  if (existingPrograms.length > 0 && Math.random() < 0.4) {
    const randomProgram = existingPrograms[Math.floor(Math.random() * existingPrograms.length)];
    sleep(1);
    updateProgram(randomProgram.id);
  }
  
  // Prepare upload (20% chance)
  if (Math.random() < 0.2) {
    const uploadPrep = prepareUpload();
    if (uploadPrep) {
      sleep(2);
      checkUploadStatus(uploadPrep.uploadId);
    }
  }
  
  // Realistic think time
  sleep(Math.random() * 3 + 2); // 2-5 seconds
}

/**
 * Discovery User Scenario - Content Consumption
 */
function discoveryUserScenario() {
  console.log('🔄 Starting Discovery User Scenario');
  
  // Get categories first
  const availableCategories = getCategories();
  
  // Browse programs by category (40% chance)
  if (availableCategories.length > 0 && Math.random() < 0.4) {
    const randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    const categoryPrograms = filterProgramsByCategory(randomCategory.name);
    
    // View a program from this category
    if (categoryPrograms.length > 0) {
      const randomProgram = categoryPrograms[Math.floor(Math.random() * categoryPrograms.length)];
      sleep(1);
      viewProgramDetails(randomProgram.id);
    }
  }
  
  // Search for programs (50% chance)
  if (Math.random() < 0.5) {
    const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    const searchResults = searchPrograms(searchTerm);
    
    // View a program from search results
    if (searchResults.length > 0) {
      const randomProgram = searchResults[Math.floor(Math.random() * searchResults.length)];
      sleep(1);
      viewProgramDetails(randomProgram.id);
    }
  }
  
  // Browse all programs (30% chance)
  if (Math.random() < 0.3) {
    const allPrograms = searchPrograms(''); // Empty search to get all
    if (allPrograms.length > 0) {
      const randomProgram = allPrograms[Math.floor(Math.random() * allPrograms.length)];
      sleep(1);
      viewProgramDetails(randomProgram.id);
    }
  }
  
  // Realistic think time
  sleep(Math.random() * 4 + 1); // 1-5 seconds
}

/**
 * Mixed User Scenario - Both CMS and Discovery
 */
function mixedUserScenario() {
  console.log('🔄 Starting Mixed User Scenario');
  
  // Start with discovery (60% chance)
  if (Math.random() < 0.6) {
    discoveryUserScenario();
  } else {
    cmsUserScenario();
  }
  
  // Switch to other scenario (30% chance)
  if (Math.random() < 0.3) {
    sleep(Math.random() * 2 + 1); // 1-3 seconds between scenarios
    if (Math.random() < 0.5) {
      discoveryUserScenario();
    } else {
      cmsUserScenario();
    }
  }
}

// ============================================================================
// K6 CONFIGURATION
// ============================================================================

export const options = {
  stages: [
    // Warm-up phase
    { duration: '2m', target: 50 },  // Ramp up to 50 users over 2 minutes
    { duration: '3m', target: 50 },  // Stay at 50 users for 3 minutes
    
    // Scaling phase 1 - Moderate load
    { duration: '5m', target: 200 }, // Ramp up to 200 users over 5 minutes
    { duration: '10m', target: 200 }, // Stay at 200 users for 10 minutes
    
    // Scaling phase 2 - High load
    { duration: '5m', target: 500 }, // Ramp up to 500 users over 5 minutes
    { duration: '15m', target: 500 }, // Stay at 500 users for 15 minutes
    
    // Scaling phase 3 - Peak load
    { duration: '5m', target: 1000 }, // Ramp up to 1000 users over 5 minutes
    { duration: '20m', target: 1000 }, // Stay at 1000 users for 20 minutes
    
    // Stress test phase
    { duration: '5m', target: 2000 }, // Ramp up to 2000 users over 5 minutes
    { duration: '10m', target: 2000 }, // Stay at 2000 users for 10 minutes
    
    // Ramp down phase
    { duration: '5m', target: 500 },  // Ramp down to 500 users over 5 minutes
    { duration: '5m', target: 100 },  // Ramp down to 100 users over 5 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0 users over 2 minutes
  ],
  
  thresholds: {
    // Response time thresholds
    'auth_response_time': ['p(95)<1000', 'p(99)<2000'],
    'cms_response_time': ['p(95)<2000', 'p(99)<4000'],
    'discovery_response_time': ['p(95)<1000', 'p(99)<2000'],
    'upload_response_time': ['p(95)<3000', 'p(99)<6000'],
    'search_response_time': ['p(95)<1500', 'p(99)<3000'],
    
    // Error rate thresholds
    'auth_error_rate': ['rate<0.05'],      // Less than 5% auth errors
    'cms_error_rate': ['rate<0.10'],       // Less than 10% CMS errors
    'discovery_error_rate': ['rate<0.05'], // Less than 5% discovery errors
    'upload_error_rate': ['rate<0.15'],    // Less than 15% upload errors
    'search_error_rate': ['rate<0.05'],    // Less than 5% search errors
    
    // HTTP thresholds
    'http_req_duration': ['p(95)<2000', 'p(99)<4000'],
    'http_req_failed': ['rate<0.10'],      // Less than 10% failed requests
    'http_reqs': ['rate>100'],             // At least 100 requests per second
  },
  
  ext: {
    loadimpact: {
      distribution: {
        'Load Test': { loadZone: 'amazon:us:ashburn', percent: 100 },
      },
    },
  },
};

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

export default function () {
  // Update active users metric
  activeUsers.add(__VU);
  
  // Update requests per second
  requestsPerSecond.add(1);
  
  // Determine user scenario based on virtual user ID
  const scenarioType = __VU % 10;
  
  try {
    if (scenarioType < 3) {
      // 30% - CMS Users (Content Management)
      cmsUserScenario();
    } else if (scenarioType < 8) {
      // 50% - Discovery Users (Content Consumption)
      discoveryUserScenario();
    } else {
      // 20% - Mixed Users (Both scenarios)
      mixedUserScenario();
    }
  } catch (error) {
    console.log(`❌ Error in user scenario: ${error.message}`);
  }
}

// ============================================================================
// SETUP AND TEARDOWN
// ============================================================================

export function setup() {
  console.log('🚀 Starting K6 Load Test with Authentication');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📍 Discovery URL: ${DISCOVERY_URL}`);
  console.log(`📍 CMS URL: ${CMS_URL}`);
  console.log(`👥 Test Users: ${testUsers.length}`);
  console.log(`🔍 Search Terms: ${searchTerms.length}`);
  console.log(`📂 Categories: ${categories.length}`);
  
  // Test authentication with first user
  const testUser = testUsers[0];
  const authSuccess = authenticateUser(testUser);
  
  if (!authSuccess) {
    throw new Error('Setup failed: Cannot authenticate test user');
  }
  
  console.log('✅ Setup completed successfully');
  return { authToken, currentUser };
}

export function teardown(data) {
  console.log('🛑 K6 Load Test completed');
  console.log(`📊 Final Auth Token: ${data.authToken ? 'Valid' : 'Invalid'}`);
  console.log(`👤 Final User: ${data.currentUser?.email || 'None'}`);
}

// ============================================================================
// HANDLE SUMMARY
// ============================================================================

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test_info: {
      name: 'CMS Thamanyah Load Test with Authentication',
      duration: data.state.testRunDuration,
      virtual_users: data.metrics.vus?.values?.max || 0,
      iterations: data.metrics.iterations?.count || 0,
    },
    performance_metrics: {
      response_time: {
        auth: {
          average: data.metrics.auth_response_time?.avg || 0,
          p95: data.metrics.auth_response_time?.['p(95)'] || 0,
          p99: data.metrics.auth_response_time?.['p(99)'] || 0,
        },
        cms: {
          average: data.metrics.cms_response_time?.avg || 0,
          p95: data.metrics.cms_response_time?.['p(95)'] || 0,
          p99: data.metrics.cms_response_time?.['p(99)'] || 0,
        },
        discovery: {
          average: data.metrics.discovery_response_time?.avg || 0,
          p95: data.metrics.discovery_response_time?.['p(95)'] || 0,
          p99: data.metrics.discovery_response_time?.['p(99)'] || 0,
        },
        upload: {
          average: data.metrics.upload_response_time?.avg || 0,
          p95: data.metrics.upload_response_time?.['p(95)'] || 0,
          p99: data.metrics.upload_response_time?.['p(99)'] || 0,
        },
        search: {
          average: data.metrics.search_response_time?.avg || 0,
          p95: data.metrics.search_response_time?.['p(95)'] || 0,
          p99: data.metrics.search_response_time?.['p(99)'] || 0,
        },
      },
      error_rates: {
        auth: data.metrics.auth_error_rate?.rate || 0,
        cms: data.metrics.cms_error_rate?.rate || 0,
        discovery: data.metrics.discovery_error_rate?.rate || 0,
        upload: data.metrics.upload_error_rate?.rate || 0,
        search: data.metrics.search_error_rate?.rate || 0,
        overall: data.metrics.http_req_failed?.rate || 0,
      },
      throughput: {
        requests_per_second: data.metrics.http_reqs?.rate || 0,
        requests_per_second_avg: data.metrics.requests_per_second?.avg || 0,
        active_users_avg: data.metrics.active_users?.avg || 0,
      },
    },
    business_metrics: {
      programs_created: data.metrics.programs_created?.count || 0,
      programs_updated: data.metrics.programs_updated?.count || 0,
      programs_viewed: data.metrics.programs_viewed?.count || 0,
      searches_performed: data.metrics.searches_performed?.count || 0,
      uploads_attempted: data.metrics.uploads_attempted?.count || 0,
    },
    thresholds: {
      passed: data.root_group?.checks?.pass || 0,
      failed: data.root_group?.checks?.fail || 0,
      total: (data.root_group?.checks?.pass || 0) + (data.root_group?.checks?.fail || 0),
    },
  };

  // The summary will be available in the console output
  
  console.log('\n📊 Load Test Summary:');
  console.log(`⏱️  Duration: ${summary.test_info.duration}ms`);
  console.log(`👥 Max Virtual Users: ${summary.test_info.virtual_users}`);
  console.log(`🔄 Total Iterations: ${summary.test_info.iterations}`);
  console.log(`📈 Requests/Second: ${summary.performance_metrics.throughput.requests_per_second.toFixed(2)}`);
  console.log(`❌ Error Rate: ${(summary.performance_metrics.error_rates.overall * 100).toFixed(2)}%`);
  console.log(`✅ Thresholds Passed: ${summary.thresholds.passed}/${summary.thresholds.total}`);
  
  console.log('\n📋 Business Metrics:');
  console.log(`📝 Programs Created: ${summary.business_metrics.programs_created}`);
  console.log(`✏️  Programs Updated: ${summary.business_metrics.programs_updated}`);
  console.log(`👀 Programs Viewed: ${summary.business_metrics.programs_viewed}`);
  console.log(`🔍 Searches Performed: ${summary.business_metrics.searches_performed}`);
  console.log(`📤 Uploads Attempted: ${summary.business_metrics.uploads_attempted}`);
  
  return {
    'stdout': JSON.stringify(summary, null, 2),
    'load-test-summary-with-auth.json': JSON.stringify(summary, null, 2),
  };
}
