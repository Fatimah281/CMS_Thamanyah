const axios = require('axios');

class TestDataSetup {
  constructor(baseUrl = 'http://localhost:3000/api/v1') {
    this.baseUrl = baseUrl;
    this.testUsers = [];
    this.testPrograms = [];
  }

  async setupTestData() {
    console.log('🚀 Setting up test data for load testing...');
    
    try {
      // Check if backend is accessible
      await this.checkBackendHealth();
      
      // Create test users
      await this.createTestUsers();
      
      // Create test categories and languages
      await this.createTestCategories();
      await this.createTestLanguages();
      
      // Create test programs
      await this.createTestPrograms();
      
      console.log('✅ Test data setup completed successfully!');
      console.log(`📊 Created ${this.testUsers.length} test users`);
      console.log(`📊 Created ${this.testPrograms.length} test programs`);
      
    } catch (error) {
      console.error('❌ Failed to setup test data:', error.message);
      throw error;
    }
  }

  async checkBackendHealth() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      if (response.status !== 200) {
        throw new Error(`Backend health check failed: ${response.status}`);
      }
      console.log('✅ Backend is healthy and accessible');
    } catch (error) {
      throw new Error(`Backend not accessible: ${error.message}`);
    }
  }

  async createTestUsers() {
    const users = [
      {
        email: 'admin@test.com',
        password: 'admin123',
        username: 'admin',
        role: 'admin'
      },
      {
        email: 'creator@test.com',
        password: 'creator123',
        username: 'creator',
        role: 'content_creator'
      },
      {
        email: 'viewer@test.com',
        password: 'viewer123',
        username: 'viewer',
        role: 'viewer'
      },
      {
        email: 'editor@test.com',
        password: 'editor123',
        username: 'editor',
        role: 'content_creator'
      },
      {
        email: 'moderator@test.com',
        password: 'moderator123',
        username: 'moderator',
        role: 'admin'
      }
    ];

    for (const user of users) {
      try {
        const response = await axios.post(`${this.baseUrl}/auth/register`, user);
        if (response.data.success) {
          this.testUsers.push(user);
          console.log(`✅ Created test user: ${user.email}`);
        }
      } catch (error) {
        if (error.response?.data?.message?.includes('already exists')) {
          console.log(`⚠️  Test user already exists: ${user.email}`);
          this.testUsers.push(user);
        } else {
          console.error(`❌ Failed to create user ${user.email}:`, error.response?.data?.message || error.message);
        }
      }
    }
  }

  async createTestCategories() {
    const categories = [
      { name: 'Technology', description: 'Technology and innovation content' },
      { name: 'Education', description: 'Educational and learning content' },
      { name: 'Entertainment', description: 'Entertainment and media content' },
      { name: 'Sports', description: 'Sports and fitness content' },
      { name: 'News', description: 'News and current events' },
      { name: 'Science', description: 'Scientific research and discoveries' },
      { name: 'Health', description: 'Health and wellness content' },
      { name: 'Business', description: 'Business and entrepreneurship' }
    ];

    console.log('📝 Creating test categories...');
    
    for (const category of categories) {
      try {
        const response = await axios.post(`${this.baseUrl}/categories`, category);
        if (response.data.success) {
          console.log(`✅ Created category: ${category.name}`);
        }
      } catch (error) {
        if (error.response?.data?.message?.includes('already exists')) {
          console.log(`⚠️  Category already exists: ${category.name}`);
        } else {
          console.error(`❌ Failed to create category ${category.name}:`, error.response?.data?.message || error.message);
        }
      }
    }
  }

  async createTestLanguages() {
    const languages = [
      { name: 'English', code: 'en', description: 'English language' },
      { name: 'Arabic', code: 'ar', description: 'Arabic language' },
      { name: 'French', code: 'fr', description: 'French language' },
      { name: 'Spanish', code: 'es', description: 'Spanish language' },
      { name: 'German', code: 'de', description: 'German language' },
      { name: 'Chinese', code: 'zh', description: 'Chinese language' },
      { name: 'Japanese', code: 'ja', description: 'Japanese language' },
      { name: 'Korean', code: 'ko', description: 'Korean language' }
    ];

    console.log('📝 Creating test languages...');
    
    for (const language of languages) {
      try {
        const response = await axios.post(`${this.baseUrl}/languages`, language);
        if (response.data.success) {
          console.log(`✅ Created language: ${language.name}`);
        }
      } catch (error) {
        if (error.response?.data?.message?.includes('already exists')) {
          console.log(`⚠️  Language already exists: ${language.name}`);
        } else {
          console.error(`❌ Failed to create language ${language.name}:`, error.response?.data?.message || error.message);
        }
      }
    }
  }

  async createTestPrograms() {
    const programs = [
      {
        title: 'Introduction to Web Development',
        description: 'Learn the basics of web development with HTML, CSS, and JavaScript',
        duration: 1800, // 30 minutes
        publishDate: new Date().toISOString(),
        status: 'published',
        categoryId: 1, // Technology
        languageId: 1, // English
        contentType: 'video',
        videoSource: 'youtube',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        tags: ['web-development', 'html', 'css', 'javascript', 'beginner']
      },
      {
        title: 'Advanced JavaScript Patterns',
        description: 'Deep dive into advanced JavaScript patterns and best practices',
        duration: 3600, // 1 hour
        publishDate: new Date().toISOString(),
        status: 'published',
        categoryId: 1, // Technology
        languageId: 1, // English
        contentType: 'video',
        videoSource: 'youtube',
        youtubeUrl: 'https://www.youtube.com/watch?v=example2',
        tags: ['javascript', 'advanced', 'patterns', 'best-practices']
      },
      {
        title: 'Machine Learning Fundamentals',
        description: 'Introduction to machine learning concepts and algorithms',
        duration: 5400, // 1.5 hours
        publishDate: new Date().toISOString(),
        status: 'published',
        categoryId: 6, // Science
        languageId: 1, // English
        contentType: 'video',
        videoSource: 'youtube',
        youtubeUrl: 'https://www.youtube.com/watch?v=example3',
        tags: ['machine-learning', 'ai', 'algorithms', 'data-science']
      },
      {
        title: 'Arabic Calligraphy Basics',
        description: 'Learn the art of Arabic calligraphy from scratch',
        duration: 2700, // 45 minutes
        publishDate: new Date().toISOString(),
        status: 'published',
        categoryId: 2, // Education
        languageId: 2, // Arabic
        contentType: 'video',
        videoSource: 'youtube',
        youtubeUrl: 'https://www.youtube.com/watch?v=example4',
        tags: ['calligraphy', 'arabic', 'art', 'traditional']
      },
      {
        title: 'French Cooking Techniques',
        description: 'Master classic French cooking techniques and recipes',
        duration: 3600, // 1 hour
        publishDate: new Date().toISOString(),
        status: 'published',
        categoryId: 3, // Entertainment
        languageId: 3, // French
        contentType: 'video',
        videoSource: 'youtube',
        youtubeUrl: 'https://www.youtube.com/watch?v=example5',
        tags: ['cooking', 'french', 'recipes', 'culinary']
      },
      {
        title: 'Yoga for Beginners',
        description: 'Complete yoga session for beginners with proper form guidance',
        duration: 1800, // 30 minutes
        publishDate: new Date().toISOString(),
        status: 'published',
        categoryId: 7, // Health
        languageId: 1, // English
        contentType: 'video',
        videoSource: 'youtube',
        youtubeUrl: 'https://www.youtube.com/watch?v=example6',
        tags: ['yoga', 'fitness', 'wellness', 'beginner']
      },
      {
        title: 'Business Strategy Fundamentals',
        description: 'Learn essential business strategy concepts for entrepreneurs',
        duration: 4500, // 1.25 hours
        publishDate: new Date().toISOString(),
        status: 'published',
        categoryId: 8, // Business
        languageId: 1, // English
        contentType: 'video',
        videoSource: 'youtube',
        youtubeUrl: 'https://www.youtube.com/watch?v=example7',
        tags: ['business', 'strategy', 'entrepreneurship', 'management']
      },
      {
        title: 'Spanish Language Learning',
        description: 'Interactive Spanish language learning session for beginners',
        duration: 2400, // 40 minutes
        publishDate: new Date().toISOString(),
        status: 'published',
        categoryId: 2, // Education
        languageId: 4, // Spanish
        contentType: 'video',
        videoSource: 'youtube',
        youtubeUrl: 'https://www.youtube.com/watch?v=example8',
        tags: ['spanish', 'language-learning', 'beginner', 'interactive']
      }
    ];

    console.log('📝 Creating test programs...');
    
    for (const program of programs) {
      try {
        const response = await axios.post(`${this.baseUrl}/programs`, program);
        if (response.data.success) {
          this.testPrograms.push(program);
          console.log(`✅ Created program: ${program.title}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create program ${program.title}:`, error.response?.data?.message || error.message);
      }
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up test data...');
    // Note: In a real scenario, you might want to clean up test data
    // This is optional and depends on your testing strategy
    console.log('✅ Cleanup completed');
  }
}

// CLI usage
if (require.main === module) {
  const setup = new TestDataSetup(process.env.BASE_URL || 'http://localhost:3000/api/v1');
  
  setup.setupTestData()
    .then(() => {
      console.log('🎉 Test data setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test data setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = TestDataSetup;
