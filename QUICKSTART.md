# ⚡ Quick Start - User-Specific System

## 🎯 What You Need

1. **Firebase Project ID** - Get from [Firebase Console](https://console.firebase.google.com)
2. **Firebase Web Config** - From Project Settings > Your apps > Config

---

## 📝 Configuration (Copy-Paste Ready)

### 1️⃣ Client `.env`
```bash
cd "/Users/admin/Downloads/personal-dashboard-habit-tracker 2/client"
nano .env
```

Paste (replace with YOUR values):
```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
VITE_API_URL=http://localhost:5000/api
```

### 2️⃣ Server `.env`
```bash
cd "/Users/admin/Downloads/personal-dashboard-habit-tracker 2/server"
nano .env
```

Add this line (replace with YOUR Project ID):
```env
FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
```

---

## 🚀 Start Servers

**Terminal 1:**
```bash
cd "/Users/admin/Downloads/personal-dashboard-habit-tracker 2/server"
npm start
```

**Terminal 2:**
```bash
cd "/Users/admin/Downloads/personal-dashboard-habit-tracker 2/client"
npm run dev
```

---

## ✅ Test It

1. Open `http://localhost:5173`
2. Register as User A
3. Add habits/tasks
4. Logout
5. Register as User B
6. See empty dashboard ✅
7. Login as User A again
8. See User A's data ✅

**Each user has separate data!** 🎉

---

## 📚 Full Documentation

- [USER_SPECIFIC_SETUP.md](./USER_SPECIFIC_SETUP.md) - Complete guide
- [client/FIREBASE_SETUP.md](./client/FIREBASE_SETUP.md) - Frontend Firebase setup
- [server/FIREBASE_BACKEND_SETUP.md](./server/FIREBASE_BACKEND_SETUP.md) - Backend Firebase setup
