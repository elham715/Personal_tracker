# 🔐 User-Specific System - Complete Setup Guide

Your habit tracker is now **fully user-specific**! Each user has their own separate data that nobody else can see.

## ✅ What's Been Updated

### Backend Changes:
- ✅ Firebase Admin SDK installed
- ✅ User model updated with `firebaseUid` field
- ✅ Auth middleware now verifies Firebase tokens
- ✅ Auto-creates users from Firebase authentication
- ✅ All data already filtered by user ID

### Frontend Changes:
- ✅ Firebase Authentication configured
- ✅ API service sends Firebase tokens automatically
- ✅ Login/Register pages with Google OAuth
- ✅ Protected routes with auth state management

## 🚀 Complete Setup (Step by Step)

### Part 1: Firebase Console Setup (5 minutes)

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Add project"
   - Enter project name: `Personal Dashboard`
   - Disable Google Analytics (optional)
   - Click "Create project"

2. **Enable Authentication:**
   - Click "Authentication" > "Get started"
   - Enable **Email/Password**
   - Enable **Google** (select support email)

3. **Register Web App:**
   - Project Settings (gear icon ⚙️)
   - Scroll to "Your apps" > Click Web icon (`</>`)
   - Nickname: `Personal Dashboard Web`
   - Click "Register app"
   - **Copy the config object** (keep page open!)

4. **Get Project ID:**
   - Same page, copy your **Project ID**
   - Example: `personal-dashboard-12345`

### Part 2: Frontend Configuration (2 minutes)

1. **Navigate to client folder:**
```bash
cd "/Users/admin/Downloads/personal-dashboard-habit-tracker 2/client"
```

2. **Create `.env` file:**
```bash
touch .env
```

3. **Edit `.env` with your Firebase config:**
```env
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=personal-dashboard-12345.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=personal-dashboard-12345
VITE_FIREBASE_STORAGE_BUCKET=personal-dashboard-12345.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123

VITE_API_URL=http://localhost:5000/api
```

### Part 3: Backend Configuration (2 minutes)

1. **Navigate to server folder:**
```bash
cd "/Users/admin/Downloads/personal-dashboard-habit-tracker 2/server"
```

2. **Edit `.env` file** (or create from `.env.example`):
```env
# ... existing settings ...

# Add this line:
FIREBASE_PROJECT_ID=personal-dashboard-12345
```

Replace with **YOUR** Project ID from Firebase Console.

### Part 4: Start Everything (1 minute)

**Terminal 1 - Backend:**
```bash
cd "/Users/admin/Downloads/personal-dashboard-habit-tracker 2/server"
npm start
```

**Terminal 2 - Frontend:**
```bash
cd "/Users/admin/Downloads/personal-dashboard-habit-tracker 2/client"
npm run dev
```

### Part 5: Test User Separation (2 minutes)

1. **Open browser:** `http://localhost:5173`

2. **Create User A:**
   - Register with email: `user.a@test.com`
   - Create some habits and tasks
   - Note what you created

3. **Logout** (click profile icon > Logout)

4. **Create User B:**
   - Register with email: `user.b@test.com`
   - Notice: **Empty dashboard!** ✅
   - Create different habits and tasks

5. **Logout and login as User A again:**
   - Login with: `user.a@test.com`
   - Notice: **Only User A's data appears!** ✅

**✨ Each user has completely separate data!**

---

## 🔒 How User Separation Works

### The Flow:

```
1. User Registration/Login
   ↓
2. Firebase creates user with unique UID
   ↓
3. Frontend receives Firebase ID token
   ↓
4. Frontend sends token with every API request
   ↓
5. Backend verifies token with Firebase Admin
   ↓
6. Backend extracts Firebase UID from token
   ↓
7. Backend finds/creates MongoDB user with firebaseUid
   ↓
8. Backend filters ALL queries by user._id
   ↓
9. User only sees their own habits/tasks
```

### Database Structure:

```
MongoDB Collections:

users
├─ { _id: ObjectId('aaa'), firebaseUid: 'firebase-uid-123', email: 'user.a@test.com' }
├─ { _id: ObjectId('bbb'), firebaseUid: 'firebase-uid-456', email: 'user.b@test.com' }

habits
├─ { _id: '1', user: ObjectId('aaa'), name: 'Exercise' }      ← User A's habit
├─ { _id: '2', user: ObjectId('aaa'), name: 'Read' }          ← User A's habit
├─ { _id: '3', user: ObjectId('bbb'), name: 'Meditate' }      ← User B's habit

tasks
├─ { _id: '1', user: ObjectId('aaa'), text: 'Buy groceries' } ← User A's task
├─ { _id: '2', user: ObjectId('bbb'), text: 'Finish report' } ← User B's task
```

**Key Points:**
- Every habit/task has a `user` field
- Backend **always** filters: `{ user: req.user._id }`
- User A **cannot** access User B's data (different user IDs)
- Firebase UID links to MongoDB user document
- Data isolation is enforced at the database level

---

## 🎯 Features

### Multi-User Support:
- ✅ Separate accounts with email/password
- ✅ Google Sign-In support
- ✅ Automatic user creation on first login
- ✅ Secure Firebase authentication
- ✅ Protected API routes

### Data Privacy:
- ✅ Each user sees only their own data
- ✅ Complete data isolation
- ✅ Server-side filtering (not just hiding)
- ✅ Secure token verification
- ✅ Auto-logout on invalid tokens

---

## 🧪 Testing Checklist

- [ ] Create User A, add habits/tasks
- [ ] Logout and create User B
- [ ] Verify User B sees empty dashboard
- [ ] Add different data for User B
- [ ] Logout and login as User A
- [ ] Verify User A's original data appears
- [ ] Try Google Sign-In
- [ ] Verify data persists after refresh
- [ ] Check that logout clears access

---

## 📁 Configuration Files

### Client `.env`:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_API_URL=http://localhost:5000/api
```

### Server `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/habit-tracker
JWT_SECRET=your-secret-key
FIREBASE_PROJECT_ID=your-firebase-project-id
ALLOWED_ORIGINS=http://localhost:5173
```

---

## ⚠️ Important Notes

1. **Same Firebase Project:** Both frontend and backend must use the same Firebase project
2. **Restart Required:** Restart both servers after changing `.env` files
3. **MongoDB:** Make sure MongoDB is running locally or use Atlas
4. **Port 5173:** Frontend runs on port 5173, backend on port 5000

---

## 🐛 Troubleshooting

### "Firebase Admin not initialized"
- Check `FIREBASE_PROJECT_ID` in server `.env`
- Restart backend server

### "Invalid token"
- Check both `.env` files have same project ID
- Clear browser cache and re-login
- Check Firebase Console > Authentication is enabled

### Data not separated
- Check backend logs for `req.user`
- Verify auth middleware is applied to routes
- Check MongoDB user documents have `firebaseUid`

### Google Sign-In not working
- Enable Google provider in Firebase Console
- Check authorized domains include `localhost`
- Verify support email is set

---

## 🎉 You're All Set!

Your habit tracker now has:
- ✅ Multi-user support
- ✅ Complete data separation
- ✅ Secure authentication
- ✅ Google OAuth
- ✅ Protected API routes

Each user has their own private workspace! 🔐
