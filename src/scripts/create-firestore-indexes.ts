import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load Firebase service account
const serviceAccountPath = path.join(__dirname, '../../cms-thamanyah-firebase-adminsdk-fbsvc-b89cbb4224.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Firebase service account file not found. Please ensure the file exists at:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: 'cms-thamanyah'
});

const db = getFirestore(app);

async function createIndexes() {
  console.log('🔧 Creating Firestore indexes...\n');

  try {
    // Create composite index for programs collection
    // This index is required for queries that filter by status and sort by createdAt
    const programsIndex = {
      collectionGroup: 'programs',
      queryScope: 'COLLECTION',
      fields: [
        {
          fieldPath: 'status',
          order: 'ASCENDING'
        },
        {
          fieldPath: 'createdAt',
          order: 'DESCENDING'
        }
      ]
    };

    console.log('📝 Creating programs index...');
    console.log('✅ Index configuration prepared:');
    console.log(JSON.stringify(programsIndex, null, 2));
    
    console.log('\n📋 To create this index manually:');
    console.log('1. Go to Firebase Console > Firestore Database > Indexes');
    console.log('2. Click "Create Index"');
    console.log('3. Collection ID: programs');
    console.log('4. Fields: status (Ascending), createdAt (Descending)');
    console.log('5. Click "Create"');
    
    // Direct link from the error message
    console.log('\n🔗 Direct link to create the programs index:');
    console.log('https://console.firebase.google.com/v1/r/project/cms-thamanyah/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9jbXMtdGhhbWFueWFoL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9wcm9ncmFtcy9pbmRleGVzL18QARoKCgZzdGF0dXMQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC');

    // Create composite index for languages collection
    // This index is required for queries that sort by name
    const languagesIndex = {
      collectionGroup: 'languages',
      queryScope: 'COLLECTION',
      fields: [
        {
          fieldPath: 'sortOrder',
          order: 'ASCENDING'
        },
        {
          fieldPath: 'name',
          order: 'ASCENDING'
        }
      ]
    };

    console.log('\n📝 Creating languages index...');
    console.log('✅ Index configuration prepared:');
    console.log(JSON.stringify(languagesIndex, null, 2));
    
    console.log('\n📋 To create this index manually:');
    console.log('1. Go to Firebase Console > Firestore Database > Indexes');
    console.log('2. Click "Create Index"');
    console.log('3. Collection ID: languages');
    console.log('4. Fields: sortOrder (Ascending), name (Ascending)');
    console.log('5. Click "Create"');
    
    // Alternative: Use the direct link from the error message
    console.log('\n🔗 Direct link to create the languages index:');
    console.log('https://console.firebase.google.com/v1/r/project/cms-thamanyah/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9jbXMtdGhhbWFueWFoL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9sYW5ndWFnZXMvaW5kZXhlcy9fEAEaDQoJc29ydE9yZGVyEAEaCAoEbmFtZRABGgwKCF9fbmFtZV9fEAE');

    // Create composite index for categories collection
    const categoriesIndex = {
      collectionGroup: 'categories',
      queryScope: 'COLLECTION',
      fields: [
        {
          fieldPath: 'sortOrder',
          order: 'ASCENDING'
        },
        {
          fieldPath: 'name',
          order: 'ASCENDING'
        }
      ]
    };

    console.log('\n📝 Creating categories index...');
    console.log('✅ Index configuration prepared:');
    console.log(JSON.stringify(categoriesIndex, null, 2));
    
    console.log('\n📋 To create this index manually:');
    console.log('1. Go to Firebase Console > Firestore Database > Indexes');
    console.log('2. Click "Create Index"');
    console.log('3. Collection ID: categories');
    console.log('4. Fields: sortOrder (Ascending), name (Ascending)');
    console.log('5. Click "Create"');

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
}

// Run the script
createIndexes()
  .then(() => {
    console.log('\n✅ Index creation script completed');
    console.log('\n⚠️  IMPORTANT: You need to manually create these indexes in Firebase Console');
    console.log('   The links above will take you directly to the index creation page');
    console.log('   After creating the indexes, wait a few minutes for them to build');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
