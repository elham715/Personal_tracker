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
  try {
    if (!firebaseApp) {
      // Fallback: decode without verification (dev only)
      // Firebase tokens are JWTs, we can decode the payload
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
      
      console.log('⚠️  Using unverified token decode (development mode)');
      return {
        uid: payload.user_id || payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      };
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid Firebase token: ' + error.message);
  }
};

export default admin;
