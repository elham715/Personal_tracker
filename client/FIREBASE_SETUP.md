# Firebase Setup Guide

This guide will help you set up Firebase Authentication for your Personal Dashboard application.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or "Create a project"
3. Enter your project name (e.g., "Personal Dashboard")
4. (Optional) Enable Google Analytics
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, click on "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the following providers:
   - **Email/Password**: Click on it, toggle "Enable", and click "Save"
   - **Google**: Click on it, toggle "Enable", provide a project support email, and click "Save"

## Step 3: Register Your Web App

1. In the Firebase Console, go to Project Overview (click the gear icon)
2. Scroll down to "Your apps" section
3. Click the Web icon (`</>`)
4. Register your app with a nickname (e.g., "Personal Dashboard Web")
5. Check "Also set up Firebase Hosting" (optional)
6. Click "Register app"

## Step 4: Get Your Firebase Configuration

After registering your app, you'll see a code snippet like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXXXXX"
};
```

## Step 5: Configure Environment Variables

1. In the `client` folder, create a `.env` file (copy from `.env.example`)
2. Fill in the values from your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

VITE_API_URL=http://localhost:5000/api
```

3. Save the file

## Step 6: Install Dependencies

In the `client` folder, run:

```bash
npm install
```

This will install Firebase SDK and other dependencies.

## Step 7: Configure Firestore (Optional)

If you want to use Firestore for additional data storage:

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a region close to your users
5. Click "Enable"

### Firestore Security Rules (Recommended)

Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 8: Test Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173/register`
3. Try signing up with:
   - Email/Password
   - Google Sign-in

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"

1. Go to Firebase Console > Authentication > Settings > Authorized domains
2. Add your domain (e.g., `localhost` for development)

### "Firebase: API key not valid"

- Double-check your `.env` file values match the Firebase Console config
- Restart your dev server after changing `.env`

### "Firebase: Project not found"

- Ensure `VITE_FIREBASE_PROJECT_ID` is correct
- Verify the Firebase project is active in the console

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use Firestore rules** - Always secure your database with proper rules
3. **Enable App Check** - Protect your backend resources from abuse
4. **Monitor usage** - Check Firebase Console regularly for unusual activity

## Next Steps

- Configure email verification (optional)
- Set up password reset flow
- Add user profile management
- Enable multi-factor authentication

## Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firebase Web SDK Guide](https://firebase.google.com/docs/web/setup)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
