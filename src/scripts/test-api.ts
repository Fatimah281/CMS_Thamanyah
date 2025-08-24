import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  data?: any;
}

class APITester {
  private results: TestResult[] = [];
  private authToken: string | null = null;

  async runAllTests() {
    console.log('🚀 Starting API Tests...\n');

    // Test 1: Health Check
    await this.testHealthCheck();

    // Test 2: Authentication
    await this.testAuthentication();

    // Test 3: Categories
    await this.testCategories();

    // Test 4: Languages
    await this.testLanguages();

    // Test 5: Program Creation
    await this.testProgramCreation();

    // Test 6: Program Retrieval
    await this.testProgramRetrieval();

    // Test 7: Program Search
    await this.testProgramSearch();

    // Test 8: Program Update
    await this.testProgramUpdate();

    // Test 9: Program Deletion
    await this.testProgramDeletion();

    // Test 10: Authorization
    await this.testAuthorization();

    this.printResults();
  }

  private async testHealthCheck(): Promise<void> {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      this.addResult('Health Check', 'PASS', 'API is running', response.data);
    } catch (error) {
      this.addResult('Health Check', 'FAIL', 'API is not accessible');
    }
  }

  private async testAuthentication(): Promise<void> {
    try {
      // Test registration
      const registerData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'editor'
      };

      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registerData);
      this.addResult('User Registration', 'PASS', 'User registered successfully', registerResponse.data);

      // Test login
      const loginData = {
        username: 'test@example.com',
        password: 'password123'
      };

      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
      this.authToken = loginResponse.data.accessToken;
      this.addResult('User Login', 'PASS', 'User logged in successfully', { token: this.authToken?.substring(0, 20) + '...' });

    } catch (error: any) {
      this.addResult('Authentication', 'FAIL', error.response?.data?.message || error.message);
    }
  }

  private async testCategories(): Promise<void> {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`);
      this.addResult('Categories Retrieval', 'PASS', `Retrieved ${response.data.data?.length || 0} categories`, response.data);
    } catch (error: any) {
      this.addResult('Categories Retrieval', 'FAIL', error.response?.data?.message || error.message);
    }
  }

  private async testLanguages(): Promise<void> {
    try {
      const response = await axios.get(`${API_BASE_URL}/languages`);
      this.addResult('Languages Retrieval', 'PASS', `Retrieved ${response.data.data?.length || 0} languages`, response.data);
    } catch (error: any) {
      this.addResult('Languages Retrieval', 'FAIL', error.response?.data?.message || error.message);
    }
  }

  private async testProgramCreation(): Promise<void> {
    if (!this.authToken) {
      this.addResult('Program Creation', 'FAIL', 'No authentication token');
      return;
    }

    try {
      const programData = {
        title: 'Test Program',
        description: 'This is a test program for API validation',
        duration: 15,
        publishDate: '2024-01-25',
        categoryId: 1,
        languageId: 1,
        contentType: 'video',
        videoSource: 'youtube',
        videoUrl: 'https://www.youtube.com/watch?v=jHU3EWvOqxs',
        audioUrl: 'https://example.com/audio3.mp3',
        thumbnailUrl: 'https://example.com/thumb3.jpg',
        status: 'draft',
        isActive: true
      };

      const response = await axios.post(`${API_BASE_URL}/programs`, programData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      this.addResult('Program Creation', 'PASS', 'Program created successfully', response.data);
    } catch (error: any) {
      this.addResult('Program Creation', 'FAIL', error.response?.data?.message || error.message);
    }
  }

  private async testProgramRetrieval(): Promise<void> {
    try {
      const response = await axios.get(`${API_BASE_URL}/programs`);
      this.addResult('Program Retrieval', 'PASS', `Retrieved ${response.data.data?.length || 0} programs`, response.data);
    } catch (error: any) {
      this.addResult('Program Retrieval', 'FAIL', error.response?.data?.message || error.message);
    }
  }

  private async testProgramSearch(): Promise<void> {
    try {
      const response = await axios.get(`${API_BASE_URL}/programs/search?q=test`);
      this.addResult('Program Search', 'PASS', `Search completed`, response.data);
    } catch (error: any) {
      this.addResult('Program Search', 'FAIL', error.response?.data?.message || error.message);
    }
  }

  private async testProgramUpdate(): Promise<void> {
    if (!this.authToken) {
      this.addResult('Program Update', 'FAIL', 'No authentication token');
      return;
    }

    try {
      // First get a program to update
      const programsResponse = await axios.get(`${API_BASE_URL}/programs`);
      const programs = programsResponse.data.data;
      
      if (programs && programs.length > 0) {
        const programId = programs[0].id;
        const updateData = {
          title: 'Updated Test Program',
          description: 'This program has been updated'
        };

        const response = await axios.patch(`${API_BASE_URL}/programs/${programId}`, updateData, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });

        this.addResult('Program Update', 'PASS', 'Program updated successfully', response.data);
      } else {
        this.addResult('Program Update', 'FAIL', 'No programs available to update');
      }
    } catch (error: any) {
      this.addResult('Program Update', 'FAIL', error.response?.data?.message || error.message);
    }
  }

  private async testProgramDeletion(): Promise<void> {
    if (!this.authToken) {
      this.addResult('Program Deletion', 'FAIL', 'No authentication token');
      return;
    }

    try {
      // First get a program to delete
      const programsResponse = await axios.get(`${API_BASE_URL}/programs`);
      const programs = programsResponse.data.data;
      
      if (programs && programs.length > 0) {
        const programId = programs[0].id;

        await axios.delete(`${API_BASE_URL}/programs/${programId}`, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });

        this.addResult('Program Deletion', 'PASS', 'Program deleted successfully');
      } else {
        this.addResult('Program Deletion', 'FAIL', 'No programs available to delete');
      }
    } catch (error: any) {
      this.addResult('Program Deletion', 'FAIL', error.response?.data?.message || error.message);
    }
  }

  private async testAuthorization(): Promise<void> {
    try {
      // Test accessing protected endpoint without token
      await axios.get(`${API_BASE_URL}/programs`);
      this.addResult('Public Access', 'PASS', 'Public endpoints accessible without authentication');
    } catch (error: any) {
      this.addResult('Public Access', 'FAIL', error.response?.data?.message || error.message);
    }

    try {
      // Test accessing protected endpoint with invalid token
      await axios.get(`${API_BASE_URL}/programs`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      this.addResult('Invalid Token', 'FAIL', 'Should reject invalid token');
    } catch (error: any) {
      this.addResult('Invalid Token', 'PASS', 'Correctly rejected invalid token');
    }
  }

  private addResult(test: string, status: 'PASS' | 'FAIL', message: string, data?: any): void {
    this.results.push({ test, status, message, data });
  }

  private printResults(): void {
    console.log('\n📊 Test Results:');
    console.log('================\n');

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.status}`);
      console.log(`   ${result.message}`);
      if (result.data) {
        console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
      }
      console.log('');
    });

    console.log(`\n🎯 Summary: ${passed}/${total} tests passed, ${failed} failed`);
    
    if (failed === 0) {
      console.log('🎉 All tests passed! Backend functionality is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the backend implementation.');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new APITester();
  tester.runAllTests().catch(console.error);
}

export default APITester;
