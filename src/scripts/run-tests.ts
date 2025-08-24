import APITester from './test-api';

async function main() {
  console.log('🚀 Starting Backend API Tests...\n');
  
  const tester = new APITester();
  await tester.runAllTests();
}

main().catch(console.error);
