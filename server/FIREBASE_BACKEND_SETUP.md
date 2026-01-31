# Backend Firebase Setup

The backend uses Firebase Admin SDK to verify Firebase authentication tokens from the frontend.

## Quick Setup (Development)

1. **Add Firebase Project ID to `.env`:**

```bash
cd server
```

2. **Edit `.env` file** (create from `.env.example` if it doesn't exist):

```env
# ... other settings ...

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
```

Replace `your-firebase-project-id` with the Project ID from your Firebase Console:
- Go to [Firebase Console](https://console.firebase.google.com)
- Select your project
- Click gear icon ⚙️ > Project Settings
- Copy the **Project ID**

3. **Install dependencies:**

```bash
npm install
```

4. **Start the server:**

```bash
npm start
```

That's it for development! The backend will now accept Firebase tokens.

---

## Production Setup (Optional - More Secure)

For production, use a Firebase Service Account for better security:

### Step 1: Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click gear icon ⚙️ > Project Settings
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file (keep it secure!)

### Step 2: Configure Environment Variable

**Option A: Use JSON file directly** (not recommended for cloud deployment)

```env
FIREBASE_SERVICE_ACCOUNT=/path/to/serviceAccountKey.json
```

**Option B: Stringify JSON** (recommended for cloud platforms like Heroku, Render, etc.)

1. Open the downloaded JSON file
2. Minify it (remove all line breaks and spaces)
3. Add to `.env`:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

### Step 3: Security Best Practices

- ✅ Add `serviceAccountKey.json` to `.gitignore` (already done)
- ✅ Never commit service account credentials to git
- ✅ Use environment variables for production
- ✅ Rotate keys periodically
- ✅ Restrict service account permissions

---

## How It Works

1. **Frontend**: User logs in via Firebase → Gets Firebase ID token
2. **Frontend**: Sends token in `Authorization: Bearer <token>` header
3. **Backend**: Receives token → Verifies with Firebase Admin SDK
4. **Backend**: Extracts user info (uid, email, name) from token
5. **Backend**: Finds or creates user in MongoDB with `firebaseUid`
6. **Backend**: Associates all habits/tasks with this user
7. **Backend**: Returns only data belonging to authenticated user

## User-Specific Data Flow

```
User A (Firebase UID: abc123)
  └─> MongoDB User Document { firebaseUid: 'abc123', email: 'usera@example.com' }
      └─> Habits Collection: { user: ObjectId('...'), name: 'Exercise' }
      └─> Tasks Collection: { user: ObjectId('...'), text: 'Buy groceries' }

User B (Firebase UID: xyz789)
  └─> MongoDB User Document { firebaseUid: 'xyz789', email: 'userb@example.com' }
      └─> Habits Collection: { user: ObjectId('...'), name: 'Meditation' }
      └─> Tasks Collection: { user: ObjectId('...'), text: 'Finish report' }
```

Each user only sees their own data! 🔒

## Troubleshooting

### "Firebase Admin not initialized"

- Check that `FIREBASE_PROJECT_ID` is set in `.env`
- Restart the server after changing `.env`

### "Invalid Firebase token"

- Frontend and backend must use the same Firebase project
- Check that both `.env` files have matching project IDs
- Token might be expired (frontend automatically refreshes)

### "User not found" but token is valid

- The backend automatically creates users on first login
- Check MongoDB connection
- Check that User model has `firebaseUid` field

## Environment Variables Summary

```env
# Required for Firebase Auth
FIREBASE_PROJECT_ID=your-firebase-project-id

# Optional for production (choose one method)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
# OR
FIREBASE_SERVICE_ACCOUNT=/path/to/serviceAccountKey.json
```
