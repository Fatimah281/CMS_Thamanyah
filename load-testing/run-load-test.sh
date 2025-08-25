#!/bin/bash

# Load Testing Script for CMS Thamanyah Backend
# This script runs comprehensive load tests using K6

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:3000/api/v1"}
REDIS_URL=${REDIS_URL:-"localhost:6379"}
TEST_DURATION=${TEST_DURATION:-"30m"}
MAX_VUS=${MAX_VUS:-50}
REPORT_DIR=${REPORT_DIR:-"./reports"}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a service is running
check_service() {
    local service_name=$1
    local service_url=$2
    
    print_status "Checking if $service_name is running..."
    
    if curl -s "$service_url" > /dev/null 2>&1; then
        print_success "$service_name is running"
        return 0
    else
        print_error "$service_name is not running at $service_url"
        return 1
    fi
}

# Function to check Redis status
check_redis() {
    print_status "Checking Redis connection..."
    
    if command -v redis-cli > /dev/null 2>&1; then
        if redis-cli -h localhost -p 6379 ping > /dev/null 2>&1; then
            print_success "Redis is running and accessible"
            
            # Get Redis info
            local redis_info=$(redis-cli -h localhost -p 6379 info server | grep -E "(redis_version|uptime_in_seconds|connected_clients)")
            print_status "Redis Info:"
            echo "$redis_info" | while IFS= read -r line; do
                echo "  $line"
            done
            return 0
        else
            print_error "Redis is not responding"
            return 1
        fi
    else
        print_warning "redis-cli not found, skipping Redis check"
        return 0
    fi
}

# Function to create test users
create_test_users() {
    print_status "Creating test users for load testing..."
    
    local users=(
        '{"email":"admin@test.com","password":"admin123","role":"admin"}'
        '{"email":"creator@test.com","password":"creator123","role":"content_creator"}'
        '{"email":"viewer@test.com","password":"viewer123","role":"viewer"}'
    )
    
    for user in "${users[@]}"; do
        local response=$(curl -s -X POST "$BASE_URL/auth/register" \
            -H "Content-Type: application/json" \
            -d "$user" || echo "{}")
        
        if echo "$response" | grep -q "success.*true"; then
            print_success "Created test user: $(echo "$user" | jq -r '.email')"
        elif echo "$response" | grep -q "already exists"; then
            print_warning "Test user already exists: $(echo "$user" | jq -r '.email')"
        else
            print_warning "Failed to create test user: $(echo "$user" | jq -r '.email')"
        fi
    done
}

# Function to run K6 test
run_k6_test() {
    local test_file=$1
    local test_name=$2
    
    print_status "Running K6 load test: $test_name"
    
    # Create reports directory
    mkdir -p "$REPORT_DIR"
    
    # Run K6 with environment variables
    k6 run \
        --env BASE_URL="$BASE_URL" \
        --env REDIS_URL="$REDIS_URL" \
        --out json="$REPORT_DIR/k6-results.json" \
        --out influxdb=http://localhost:8086/k6 \
        --summary-export="$REPORT_DIR/k6-summary.json" \
        "$test_file"
    
    if [ $? -eq 0 ]; then
        print_success "K6 test completed successfully"
    else
        print_error "K6 test failed"
        exit 1
    fi
}

# Function to generate report
generate_report() {
    print_status "Generating load test report..."
    
    if [ -f "$REPORT_DIR/k6-summary.json" ]; then
        # Create HTML report using the data from K6
        cat > "$REPORT_DIR/load-test-report.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CMS Thamanyah Load Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .metric { margin: 10px 0; padding: 10px; border-left: 4px solid #007cba; }
        .success { border-left-color: #28a745; }
        .warning { border-left-color: #ffc107; }
        .error { border-left-color: #dc3545; }
        .chart { margin: 20px 0; padding: 20px; background: #f9f9f9; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>CMS Thamanyah Load Test Report</h1>
        <p>Generated on: <span id="timestamp"></span></p>
    </div>
    
    <div class="metric">
        <h2>Test Summary</h2>
        <div id="summary"></div>
    </div>
    
    <div class="metric">
        <h2>Performance Metrics</h2>
        <div id="metrics"></div>
    </div>
    
    <div class="metric">
        <h2>Redis Performance</h2>
        <div id="redis-metrics"></div>
    </div>
    
    <div class="metric">
        <h2>Recommendations</h2>
        <div id="recommendations"></div>
    </div>
    
    <script>
        // Load and display K6 results
        fetch('./k6-summary.json')
            .then(response => response.json())
            .then(data => {
                document.getElementById('timestamp').textContent = new Date().toLocaleString();
                
                // Display summary
                const summary = document.getElementById('summary');
                summary.innerHTML = `
                    <table>
                        <tr><th>Metric</th><th>Value</th></tr>
                        <tr><td>Total Requests</td><td>${data.metrics.http_reqs?.values?.count || 0}</td></tr>
                        <tr><td>Average Response Time</td><td>${Math.round(data.metrics.http_req_duration?.values?.avg || 0)}ms</td></tr>
                        <tr><td>95th Percentile</td><td>${Math.round(data.metrics.http_req_duration?.values?.['p(95)'] || 0)}ms</td></tr>
                        <tr><td>Error Rate</td><td>${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%</td></tr>
                        <tr><td>Throughput</td><td>${(data.metrics.http_reqs?.values?.rate || 0).toFixed(2)} req/s</td></tr>
                    </table>
                `;
                
                // Display metrics
                const metrics = document.getElementById('metrics');
                metrics.innerHTML = `
                    <h3>Response Time Distribution</h3>
                    <p>Min: ${Math.round(data.metrics.http_req_duration?.values?.min || 0)}ms</p>
                    <p>Max: ${Math.round(data.metrics.http_req_duration?.values?.max || 0)}ms</p>
                    <p>Median: ${Math.round(data.metrics.http_req_duration?.values?.med || 0)}ms</p>
                    <p>95th Percentile: ${Math.round(data.metrics.http_req_duration?.values?.['p(95)'] || 0)}ms</p>
                    <p>99th Percentile: ${Math.round(data.metrics.http_req_duration?.values?.['p(99)'] || 0)}ms</p>
                `;
                
                // Generate recommendations
                const recommendations = document.getElementById('recommendations');
                const avgResponseTime = data.metrics.http_req_duration?.values?.avg || 0;
                const errorRate = data.metrics.http_req_failed?.values?.rate || 0;
                
                let recs = '<ul>';
                if (avgResponseTime > 1000) {
                    recs += '<li>Consider implementing Redis caching for frequently accessed data</li>';
                    recs += '<li>Optimize database queries and add proper indexing</li>';
                }
                if (errorRate > 0.05) {
                    recs += '<li>Investigate and fix the high error rate</li>';
                    recs += '<li>Add better error handling and monitoring</li>';
                }
                if (avgResponseTime < 500 && errorRate < 0.01) {
                    recs += '<li>Performance is excellent! Consider scaling for higher loads</li>';
                }
                recs += '<li>Monitor Redis hit/miss rates and adjust cache TTL accordingly</li>';
                recs += '<li>Consider implementing rate limiting for API endpoints</li>';
                recs += '</ul>';
                
                recommendations.innerHTML = recs;
            })
            .catch(error => {
                console.error('Error loading K6 results:', error);
                document.getElementById('summary').innerHTML = '<p>Error loading test results</p>';
            });
    </script>
</body>
</html>
EOF
        
        print_success "HTML report generated: $REPORT_DIR/load-test-report.html"
    else
        print_warning "No K6 summary file found, skipping report generation"
    fi
}

# Main execution
main() {
    echo "=========================================="
    echo "CMS Thamanyah Load Testing Suite"
    echo "=========================================="
    
    # Check prerequisites
    if ! command -v k6 > /dev/null 2>&1; then
        print_error "K6 is not installed. Please install K6 first."
        print_status "Installation guide: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
    
    if ! command -v curl > /dev/null 2>&1; then
        print_error "curl is not installed. Please install curl first."
        exit 1
    fi
    
    # Check services
    check_service "Backend API" "$BASE_URL/health" || exit 1
    check_redis || print_warning "Redis check failed, continuing without Redis"
    
    # Create test users
    create_test_users
    
    # Run load tests
    print_status "Starting load testing suite..."
    
    # Run main load test
    run_k6_test "k6-load-test.js" "Main Load Test"
    
    # Generate report
    generate_report
    
    print_success "Load testing completed successfully!"
    print_status "Reports available in: $REPORT_DIR"
    print_status "Open $REPORT_DIR/load-test-report.html in your browser to view the detailed report"
}

# Run main function
main "$@"
