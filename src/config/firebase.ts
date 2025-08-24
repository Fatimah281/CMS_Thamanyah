import { Injectable, Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { initializeApp, applicationDefault, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

function loadServiceAccount(raw: string): any {
  if (!raw) {
    return null;
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
        const serviceAccountJson = config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
        const credentials = loadServiceAccount(serviceAccountJson);
        if (credentials) {
          return initializeApp({ credential: cert(credentials) });
        }
        return initializeApp({ credential: applicationDefault() });
      },
    },
    {
      provide: 'FIRESTORE',
      inject: ['FIREBASE_APP'],
      useFactory: (): Firestore => getFirestore(),
    },
  ],
  exports: ['FIREBASE_APP', 'FIRESTORE'],
})
export class FirebaseModule {}
