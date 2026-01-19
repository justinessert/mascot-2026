import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp();
}

// Firestore database instance
export const db = admin.firestore();
