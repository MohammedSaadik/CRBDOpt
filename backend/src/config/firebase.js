const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
  process.exit(1);
}

try {
  // Resolve the path relative to the current working directory (project root/backend usually)
  // If the path is relative (e.g., "../serviceAccountKey.json"), verify it resolves correctly.
  const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
  
  const serviceAccount = require(absolutePath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('Firebase Admin Initialized');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

module.exports = { db };
