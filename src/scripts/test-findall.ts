import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ProgramsService } from '../modules/programs/programs.service';

async function testFindAll() {
  console.log('🚀 Testing findAll method...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const programsService = app.get(ProgramsService);

  try {
    // Test basic query
    console.log('\n📋 Testing basic query...');
    const result = await programsService.findAll({}, { page: 1, limit: 100 }, 'test-uid', 'admin');
    
    console.log('✅ Query successful!');
    console.log(`📊 Results:`);
    console.log(`  - Total programs: ${result.meta.total}`);
    console.log(`  - Programs returned: ${result.data.length}`);
    console.log(`  - Page: ${result.meta.page} of ${result.meta.totalPages}`);
    
    if (result.data.length > 0) {
      console.log('\n📋 Sample programs:');
      result.data.slice(0, 5).forEach((program, index) => {
        console.log(`  ${index + 1}. ${program.title} (ID: ${program.id})`);
        console.log(`     Status: ${program.status}`);
        console.log(`     Category: ${program.category.name}`);
        console.log(`     Language: ${program.language.name}`);
      });
    } else {
      console.log('⚠️  No programs found in database');
    }

    // Test with different pagination
    console.log('\n📋 Testing pagination...');
    const paginatedResult = await programsService.findAll({}, { page: 1, limit: 5 }, 'test-uid', 'admin');
    console.log(`  - Page 1: ${paginatedResult.data.length} programs`);
    console.log(`  - Has next: ${paginatedResult.meta.hasNext}`);

    if (paginatedResult.meta.hasNext) {
      const page2Result = await programsService.findAll({}, { page: 2, limit: 5 }, 'test-uid', 'admin');
      console.log(`  - Page 2: ${page2Result.data.length} programs`);
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  } finally {
    await app.close();
  }
}

// Run the test
testFindAll().catch(console.error);
