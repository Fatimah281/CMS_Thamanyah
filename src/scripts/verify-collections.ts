import * as admin from 'firebase-admin';
import * as fs from 'fs';

// Initialize Firebase Admin SDK
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

async function verifyCollections() {
  console.log('🔍 Verifying Firestore collections...\n');

  const collections = [
    '_counters',
    'categories',
    'languages',
    'user_profiles',
    'programs',
    'metadata',
    'search_logs'
  ];

  try {
    for (const collectionName of collections) {
      console.log(`📂 Checking collection: ${collectionName}`);
      
      const snapshot = await db.collection(collectionName).get();
      const count = snapshot.size;
      
      if (count > 0) {
        console.log(`  ✅ Found ${count} document(s)`);
        
        // Show first few documents for reference
        const docs = snapshot.docs.slice(0, 3);
        docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`    ${index + 1}. ID: ${doc.id}`);
          if (data.name) console.log(`       Name: ${data.name}`);
          if (data.title) console.log(`       Title: ${data.title}`);
          if (data.username) console.log(`       Username: ${data.username}`);
        });
        
        if (count > 3) {
          console.log(`    ... and ${count - 3} more document(s)`);
        }
      } else {
        console.log(`  ⚠️  Collection exists but is empty`);
      }
      console.log('');
    }

    console.log('✅ Collection verification completed!');
    console.log('\n📊 Summary:');
    console.log('  All required collections should be visible in Firebase Console');
    console.log('  Go to: https://console.firebase.google.com/');
    console.log('  Select your project > Firestore Database > Data tab');

  } catch (error) {
    console.error('❌ Error verifying collections:', error);
    process.exit(1);
  }
}

// Run the verification
verifyCollections().then(() => {
  console.log('\n🎉 Verification complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
