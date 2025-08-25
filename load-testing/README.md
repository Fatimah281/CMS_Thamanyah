# Read-Only Load Testing Suite for CMS Thamanyah

## 🎯 Purpose
**Read-only load testing** for CMS Thamanyah backend. Tests GET endpoints only - no database writes.

## ⚠️ Key Points
- **No Authentication Required** - Public read endpoints only
- **No Data Modification** - All operations are GET requests
- **Safe for Production** - Can run against any environment

## 📋 Tested Endpoints
- `GET /api/v1/programs` - List programs with pagination
- `GET /api/v1/programs?category={category}` - Filter by category
- `GET /api/v1/programs?language={language}` - Filter by language
- `GET /api/v1/programs?level={level}` - Filter by difficulty
- `GET /api/v1/programs?duration={duration}` - Filter by duration
- `GET /api/v1/programs/{id}` - Program details
- `GET /api/v1/programs/search?q={term}` - Search programs
- `GET /api/v1/categories` - Available categories

## 📊 Metrics
- **Response Times**: Average, P90, P95, P99 for each endpoint
- **Error Rates**: Per-endpoint tracking
- **Throughput**: Requests per second
- **Business Metrics**: Programs listed, viewed, searched, categories viewed

## 🚀 Quick Start

### Prerequisites
- **K6 installed** - [Installation Guide](https://k6.io/docs/getting-started/installation/)
- **Backend running** - CMS Thamanyah backend accessible

### Usage
```bash
cd load-testing

# Quick test (3 minutes, 10 users)
npm run test:quick

# Full test (75 minutes, up to 500 users)
npm run test:full

# Stress test (16 minutes, up to 500 users)
npm run test:stress

# Dashboard only (port 8080)
npm run dashboard

# Test with real-time dashboard
npm run test:with-dashboard
```

### Custom Configuration
```bash
# Custom base URL
k6 run -e BASE_URL=http://your-api.com k6-load-test-readonly.js

# Custom test duration and users
k6 run --stage 2m:50 --stage 5m:100 k6-load-test-readonly.js
```

## 📈 Test Scenarios
- **40%** - Browse programs list
- **30%** - Search programs
- **20%** - View categories
- **10%** - Browse without details

Each includes randomized parameters and 1-4 second think times.

## 📄 Output
- **Console Output** - Real-time progress and summary
- **load-test-summary-readonly.json** - Detailed metrics
- **Dashboard** - Real-time monitoring at http://localhost:8080

## 🔧 Configuration
- `BASE_URL` - Backend API base URL (default: http://localhost:3000)
- **40+ search terms** - Programming, web development, AI, etc.
- **12 categories** - Technology, business, healthcare, etc.
- **12 languages** - English, Arabic, Spanish, etc.

## 🚨 Troubleshooting

### Common Issues
**Connection Failed**
```bash
❌ Warning: Health check failed (404)
```
**Solution**: Check backend is running and BASE_URL is correct

**High Error Rates**
```bash
❌ Error rate: 15.2%
```
**Solution**: Check backend logs, reduce load, verify endpoints

### Debug Mode
```bash
# Verbose logging
k6 run --verbose k6-load-test-readonly.js

# Single user test
k6 run --vus 1 --duration 1m k6-load-test-readonly.js
```

## 📝 Best Practices
### Before Running
1. Verify backend is running
2. Check data exists in database
3. Ensure system has capacity
4. Start with quick tests

### During Test
1. Monitor backend logs
2. Watch real-time metrics
3. Check resource usage

### After Test
1. Review results
2. Check logs for issues
3. Document findings

## 📞 Support
### Common Commands
```bash
npm run test:quick    # Quick test (3 minutes)
npm run test:full     # Full test (75 minutes)
npm run test:stress   # Stress test (16 minutes)
npm run dashboard     # Start dashboard only
npm run test:with-dashboard  # Test with dashboard
npm run clean         # Clean up results
npm run help          # Show help
```

### Getting Help
1. Check console output and backend logs
2. Verify all prerequisites are met
3. Test API calls manually
4. Start with smaller user counts

---

**Happy Load Testing! 🚀**
Safe, comprehensive performance testing without data modification.