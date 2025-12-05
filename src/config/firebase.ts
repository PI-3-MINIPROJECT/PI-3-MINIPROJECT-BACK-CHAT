import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin app instance (singleton)
 * Initialized once and reused across the application
 * @type {admin.app.App | null}
 */
let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 * @returns {admin.app.App} Firebase app instance
 * @throws {Error} If Firebase configuration is missing
 */
export const initializeFirebase = (): admin.app.App => {
  if (firebaseApp) return firebaseApp;

  if (admin.apps.length > 0 && admin.apps[0]) {
    firebaseApp = admin.apps[0];
    return firebaseApp;
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
    throw new Error('Missing Firebase configuration. Please check your .env file.');
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  return firebaseApp;
};

/**
 * Get Firestore database instance
 * @returns {FirebaseFirestore.Firestore} Firestore instance
 */
export const getFirestoreInstance = (): FirebaseFirestore.Firestore => {
  const app = initializeFirebase();
  return getFirestore(app);
};

