import * as admin from "firebase-admin";

// ✅ Replace this with your actual Firebase User UID
const ALLOWED_USER_UID = "34YJ8X2W5GTvsl9MqPpw1mqTqmC2";

export async function authenticateRequest(req: any, res: any) {
    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
        res.status(403).json({ error: "Unauthorized: No token provided." });
        throw new Error("Unauthorized: No token provided.");
    }

    const idToken = req.headers.authorization.split("Bearer ")[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log(`🔑 Authenticated user: ${decodedToken.uid}`);

        // ✅ Check if the user is allowed
        if (decodedToken.uid !== ALLOWED_USER_UID) {
            console.warn(`⛔ User ${decodedToken.uid} is not authorized.`);
            res.status(403).json({ error: "Unauthorized: You do not have permission to perform this action." });
            throw new Error("Unauthorized: You do not have permission.");
        }

        return decodedToken; // ✅ User is authorized, proceed

    } catch (error) {
        console.error("❌ Error verifying token:", error);
        res.status(403).json({ error: "Unauthorized: Invalid token." });
        throw new Error("Unauthorized: Invalid token.");
    }
}
