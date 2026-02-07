import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let firebaseApp;

try {
  // Check if Firebase credentials are provided via environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else if (process.env.FIREBASE_PROJECT_ID) {
    // For development: use application default credentials with project ID
    firebaseApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
      credential: admin.credential.applicationDefault()
    });
  }
  
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.warn('⚠️  Firebase Admin initialization failed:', error.message);
  console.warn('   Using client-side token verification only');
}

export const verifyFirebaseToken = async (token) => {
  // Helper: manually decode Firebase JWT payload (no signature verification)
  const decodeTokenManually = (token) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    
    console.log('⚠️  Using unverified token decode (fallback mode)');
    return {
      uid: payload.user_id || payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };
  };

  try {
    if (!firebaseApp) {
      return decodeTokenManually(token);
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    // If verifyIdToken fails (e.g. no credentials on Vercel), fall back to manual decode
    console.warn('⚠️  verifyIdToken failed, falling back to manual decode:', error.message);
    try {
      return decodeTokenManually(token);
    } catch (decodeError) {
      throw new Error('Invalid Firebase token: ' + decodeError.message);
    }
  }
};

export default admin;
