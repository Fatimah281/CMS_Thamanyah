import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../../cms-thamanyah-firebase-adminsdk-fbsvc-b89cbb4224.json');
const serviceAccount = require(serviceAccountPath);

// Check if Firebase is already initialized
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function fixProgramIds() {
  console.log('🔧 Starting program ID fix process...');
  
  try {
    // Get all programs from the database
    const programsSnapshot = await db.collection('programs').get();
    
    if (programsSnapshot.empty) {
      console.log('✅ No programs found in database');
      return;
    }
    
    console.log(`📊 Found ${programsSnapshot.size} programs to check`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    // Process each program
    for (const doc of programsSnapshot.docs) {
      const programData = doc.data();
      const docId = doc.id;
      
      // Check if the program has an ID field
      if (!programData.id || programData.id === undefined || programData.id === null) {
        console.log(`⚠️  Program "${programData.title}" (doc: ${docId}) has no ID, generating one...`);
        
        // Generate a new unique ID using the counter
        const newId = await generateNextId('programs');
        
        // Update the program with the new ID
        await db.collection('programs').doc(docId).update({
          id: newId,
          updatedAt: new Date()
        });
        
        console.log(`✅ Updated program "${programData.title}" with ID: ${newId}`);
        fixedCount++;
      } else {
        console.log(`✅ Program "${programData.title}" already has ID: ${programData.id}`);
        skippedCount++;
      }
    }
    
    console.log('\n📈 Summary:');
    console.log(`   - Total programs checked: ${programsSnapshot.size}`);
    console.log(`   - Programs fixed: ${fixedCount}`);
    console.log(`   - Programs skipped (already had ID): ${skippedCount}`);
    
    if (fixedCount > 0) {
      console.log('\n🎉 Successfully fixed all programs without IDs!');
    } else {
      console.log('\n✅ All programs already have proper IDs!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing program IDs:', error);
    throw error;
  }
}

async function generateNextId(counterName: string): Promise<number> {
  const ref = db.collection('_counters').doc(counterName);
  
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const currentValue = snapshot.exists ? (snapshot.data()?.value as number) : 0;
    const nextValue = currentValue + 1;
    
    transaction.set(ref, { value: nextValue });
    return nextValue;
  });
}

// Run the fix
fixProgramIds()
  .then(() => {
    console.log('\n🚀 Program ID fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Program ID fix failed:', error);
    process.exit(1);
  });
