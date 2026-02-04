import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize admin app if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Check if a username is available.
 * 
 * Logic matches the client-side normalization:
 * - Lowercase
 * - Remove non-alphanumeric characters
 * - Check against 'users' collection 'normalizedDisplayName' field
 */
export const checkUsername = onCall(async (request) => {
    const { username } = request.data;

    if (!username || typeof username !== 'string') {
        throw new HttpsError('invalid-argument', 'The function must be called with a "username" argument.');
    }

    // Normalize the username
    const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (normalizedUsername.length === 0) {
        throw new HttpsError('invalid-argument', 'Username must contain alphanumeric characters.');
    }

    try {
        const db = admin.firestore();

        // Query users collection for this normalized display name
        const usersRef = db.collection('users');
        const querySnapshot = await usersRef
            .where('normalizedDisplayName', '==', normalizedUsername)
            .limit(1)
            .get();

        // If we found a document, the username is taken
        const taken = !querySnapshot.empty;

        return { available: !taken };

    } catch (error) {
        console.error("Error checking username availability:", error);
        throw new HttpsError('internal', 'Unable to check username availability.');
    }
});
