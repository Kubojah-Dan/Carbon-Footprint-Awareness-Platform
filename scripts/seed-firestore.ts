import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from apps/web/.env.local or root .env
dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function seed() {
  console.log('Starting Firestore seeding process...');

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }
  }

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Falls back to Google Application Default Credentials
    admin.initializeApp();
  } else {
    console.warn(
      '⚠️  No Firebase Admin credentials found in environment variables.\n' +
      'Please set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in apps/web/.env.local,\n' +
      'or set GOOGLE_APPLICATION_CREDENTIALS pointing to your service account JSON file.\n' +
      'Trying local firebase emulator fallback...'
    );
    // Try to connect to Firestore Emulator if running
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    admin.initializeApp({ projectId: 'earthprint-cc1a7' });
  }

  const db = admin.firestore();

  // 1. Seed Challenges
  try {
    const challengesPath = path.resolve(process.cwd(), 'data/seeds/challenges.json');
    if (!fs.existsSync(challengesPath)) {
      throw new Error(`Challenges seed file not found at ${challengesPath}`);
    }

    const challenges = JSON.parse(fs.readFileSync(challengesPath, 'utf8'));
    console.log(`Found ${challenges.length} challenges to seed.`);

    const challengesCol = db.collection('challenges');
    const batch = db.batch();

    for (const challenge of challenges) {
      const docRef = challengesCol.doc(challenge.id);
      batch.set(docRef, {
        ...challenge,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    await batch.commit();
    console.log('✅ Successfully seeded challenges collection.');
  } catch (error) {
    console.error('❌ Failed to seed challenges:', error);
  }

  // 2. Seed Marketplace Actions
  try {
    const actionsPath = path.resolve(process.cwd(), 'data/seeds/marketplace-actions.json');
    if (!fs.existsSync(actionsPath)) {
      throw new Error(`Marketplace actions seed file not found at ${actionsPath}`);
    }

    const actions = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));
    console.log(`Found ${actions.length} marketplace actions to seed.`);

    const actionsCol = db.collection('marketplace-actions');
    const batch = db.batch();

    for (const action of actions) {
      const docRef = actionsCol.doc(action.id);
      batch.set(docRef, {
        ...action,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    await batch.commit();
    console.log('✅ Successfully seeded marketplace-actions collection.');
  } catch (error) {
    console.error('❌ Failed to seed marketplace actions:', error);
  }

  console.log('Firestore seeding process finished.');
}

seed().catch((err) => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
