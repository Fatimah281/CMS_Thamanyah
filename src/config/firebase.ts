import { Injectable, Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { initializeApp, applicationDefault, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

function loadServiceAccount(raw: string): any {
  if (!raw) {
    return null;
  }

  if (raw.trim().startsWith('{')) {
    return JSON.parse(raw);
  }

  if (fs.existsSync(raw)) {
    const fileContents = fs.readFileSync(raw, 'utf8');
    return JSON.parse(fileContents);
  }

  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'FIREBASE_APP',
      inject: [ConfigService],
      useFactory: (config: ConfigService): App => {
        try {
          console.log('🔥 Initializing Firebase...');
          const serviceAccountJson = config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON') || './cms-thamanyah-firebase-adminsdk-fbsvc-b89cbb4224.json';
          console.log('📄 Service account path:', serviceAccountJson);
          
          const credentials = loadServiceAccount(serviceAccountJson);
          if (credentials) {
            console.log('✅ Firebase credentials loaded from service account');
            return initializeApp({ credential: cert(credentials) });
          }
          console.log('⚠️ No service account found, using default credentials');
          return initializeApp({ credential: applicationDefault() });
        } catch (error) {
          console.warn('❌ Firebase initialization failed, using default credentials:', error.message);
          return initializeApp({ credential: applicationDefault() });
        }
      },
    },
    {
      provide: 'FIRESTORE',
      inject: ['FIREBASE_APP'],
      useFactory: (): Firestore => {
        console.log('📊 Initializing Firestore...');
        const firestore = getFirestore();
        console.log('✅ Firestore initialized successfully');
        return firestore;
      },
    },
  ],
  exports: ['FIREBASE_APP', 'FIRESTORE'],
})
export class FirebaseModule {}
