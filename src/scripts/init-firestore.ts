import 'dotenv/config';
import * as admin from 'firebase-admin';
import * as fs from 'fs';

function loadServiceAccount(): any {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    console.error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required');
    process.exit(1);
  }

  // If it looks like JSON
  if (raw.trim().startsWith('{')) {
    return JSON.parse(raw);
  }

  // If it looks like a file path
  if (fs.existsSync(raw)) {
    const fileContents = fs.readFileSync(raw, 'utf8');
    return JSON.parse(fileContents);
  }

  // Try base64 decode
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Provide a JSON string, a file path, or base64-encoded JSON.');
    process.exit(1);
  }
}

const serviceAccountObj = loadServiceAccount();
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountObj),
});

const db = admin.firestore();

async function initializeFirestore() {
  console.log('🚀 Initializing Firestore collections...');

  try {
    // Initialize counters collection
    console.log('📊 Setting up counters...');
    await db.collection('_counters').doc('programs').set({ value: 0 });
    await db.collection('_counters').doc('categories').set({ value: 0 });
    await db.collection('_counters').doc('languages').set({ value: 0 });
    await db.collection('_counters').doc('users').set({ value: 0 });

    // Initialize categories collection
    console.log('📂 Creating sample categories...');
    const categories = [
      { id: 1, name: 'Documentaries', description: 'Educational and informative documentaries', isActive: true, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Podcasts', description: 'Audio content and discussions', isActive: true, sortOrder: 2, createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: 'Lectures', description: 'Educational lectures and presentations', isActive: true, sortOrder: 3, createdAt: new Date(), updatedAt: new Date() },
      { id: 4, name: 'Interviews', description: 'Conversations and interviews', isActive: true, sortOrder: 4, createdAt: new Date(), updatedAt: new Date() },
    ];
    for (const category of categories) {
      await db.collection('categories').doc(String(category.id)).set(category);
    }

    // Initialize languages collection
    console.log('🌍 Creating sample languages...');
    const languages = [
      { id: 1, name: 'English', code: 'en', isActive: true, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Arabic', code: 'ar', isActive: true, sortOrder: 2, createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: 'French', code: 'fr', isActive: true, sortOrder: 3, createdAt: new Date(), updatedAt: new Date() },
      { id: 4, name: 'Spanish', code: 'es', isActive: true, sortOrder: 4, createdAt: new Date(), updatedAt: new Date() },
    ];
    for (const language of languages) {
      await db.collection('languages').doc(String(language.id)).set(language);
    }

    // Create a sample admin user profile
    console.log('👤 Creating sample user profile...');
    const sampleUserProfile = {
      uid: 'sample-admin-uid',
      username: 'admin',
      email: 'admin@thamanyah.com',
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection('user_profiles').doc('sample-admin-uid').set(sampleUserProfile);

    // Initialize programs collection with sample data
    console.log('🎬 Creating sample programs...');
    const programs = [
      { id: 1, title: 'Introduction to Islamic Finance', description: 'A comprehensive introduction to the principles and practices of Islamic finance, covering key concepts like riba, gharar, and halal investments.', duration: 120, publishDate: '2024-01-15', status: 'published', thumbnailUrl: 'https://example.com/thumb1.jpg', videoUrl: 'https://example.com/video1.mp4', audioUrl: 'https://example.com/audio1.mp3', viewCount: 0, isActive: true, categoryId: 3, languageId: 1, createdBy: 'sample-admin-uid', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, title: 'The History of Islamic Architecture', description: 'Explore the rich history and beautiful designs of Islamic architecture from the early days to modern times.', duration: 90, publishDate: '2024-01-20', status: 'published', thumbnailUrl: 'https://example.com/thumb2.jpg', videoUrl: 'https://example.com/video2.mp4', audioUrl: 'https://example.com/audio2.mp3', viewCount: 0, isActive: true, categoryId: 1, languageId: 1, createdBy: 'sample-admin-uid', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, title: 'Daily Islamic Reminders Podcast', description: 'Daily reminders and spiritual guidance for Muslims in the modern world.', duration: 15, publishDate: '2024-01-25', status: 'published', thumbnailUrl: 'https://example.com/thumb3.jpg', videoUrl: null, audioUrl: 'https://example.com/audio3.mp3', viewCount: 0, isActive: true, categoryId: 2, languageId: 2, createdBy: 'sample-admin-uid', createdAt: new Date(), updatedAt: new Date() },
    ];
    for (const program of programs) {
      await db.collection('programs').doc(String(program.id)).set(program);
    }

    // Initialize metadata collection
    console.log('📋 Creating sample metadata...');
    const metadata = [
      { id: 1, programId: 1, key: 'speaker', value: 'Dr. Ahmed Hassan', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, programId: 1, key: 'level', value: 'beginner', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, programId: 2, key: 'location', value: 'Cairo, Egypt', createdAt: new Date(), updatedAt: new Date() },
      { id: 4, programId: 3, key: 'host', value: 'Sheikh Omar Al-Rashid', createdAt: new Date(), updatedAt: new Date() },
    ];
    for (const meta of metadata) {
      await db.collection('metadata').doc(String(meta.id)).set(meta);
    }

    // Initialize search_logs collection with sample data
    console.log('🔍 Creating sample search logs...');
    const searchLogs = [
      { id: 1, searchTerm: 'Islamic finance', userId: null, ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', timestamp: new Date() },
      { id: 2, searchTerm: 'architecture', userId: null, ipAddress: '192.168.1.2', userAgent: 'Mozilla/5.0', timestamp: new Date() },
    ];
    for (const log of searchLogs) {
      await db.collection('search_logs').doc(String(log.id)).set(log);
    }

    console.log('✅ Firestore initialization completed successfully!');
    console.log('\n📊 Collections created:');
    console.log('  - _counters');
    console.log('  - categories (4 documents)');
    console.log('  - languages (4 documents)');
    console.log('  - user_profiles (1 document)');
    console.log('  - programs (3 documents)');
    console.log('  - metadata (4 documents)');
    console.log('  - search_logs (2 documents)');
    console.log('\n🔗 Check Firebase Console to see all collections!');

  } catch (error) {
    console.error('❌ Error initializing Firestore:', error);
    process.exit(1);
  }
}

initializeFirestore()
  .then(() => {
    console.log('\n🎉 Setup complete! You can now start your NestJS application.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
