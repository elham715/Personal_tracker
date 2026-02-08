# 📱 Building the Personal Dashboard & Habit Tracker as an Android APK

> A complete guide documenting how this React + Vite web app was converted into a native Android APK using Capacitor — including every problem encountered and how it was solved.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Phase 1 — Capacitor Setup](#phase-1--capacitor-setup)
4. [Phase 2 — First APK Build (Command Line)](#phase-2--first-apk-build-command-line)
5. [Phase 3 — Fixing "Data Not Loading" on the Phone](#phase-3--fixing-data-not-loading-on-the-phone)
6. [Phase 4 — CORS & Native HTTP](#phase-4--cors--native-http)
7. [Phase 5 — Offline-First Architecture](#phase-5--offline-first-architecture)
8. [Phase 6 — Mobile UX Improvements](#phase-6--mobile-ux-improvements)
9. [Phase 7 — Task Manager Rework (Past History)](#phase-7--task-manager-rework-past-history)
10. [Quick Rebuild Cheatsheet](#quick-rebuild-cheatsheet)
11. [Project Structure](#project-structure)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The Personal Dashboard & Habit Tracker is a full-stack web application. The goal was to package it as an installable Android `.apk` so it could run natively on a phone — **without needing Android Studio's GUI** at all. Everything was done from the terminal using Gradle directly.

### What Capacitor Does

[Capacitor](https://capacitorjs.com/) is an open-source runtime by Ionic that wraps a web app inside a native Android (or iOS) WebView. Think of it as a lightweight bridge:

```
┌─────────────────────────────────────┐
│          Android Shell (Java)       │
│  ┌───────────────────────────────┐  │
│  │        WebView (Chrome)       │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │   Your React App (JS)   │  │  │
│  │  │   runs exactly as-is    │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
│  Native plugins: HTTP, Camera, etc  │
└─────────────────────────────────────┘
```

Your Vite production build (`dist/`) is copied into the Android project's assets. When the app launches, the WebView loads `index.html` from those assets — your entire React app runs inside it.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Auth | Firebase Authentication (client SDK) |
| Backend API | Express.js deployed on **Vercel** |
| Database | PostgreSQL on **Neon** |
| Offline Storage | **Dexie.js** (IndexedDB wrapper) |
| Mobile Wrapper | **Capacitor 7** |
| Android Build | **Gradle** (command-line, no Android Studio GUI) |
| Java Runtime | JBR bundled with Android Studio |

---

## Phase 1 — Capacitor Setup

### 1.1 Install Capacitor

```bash
cd client
npm install @capacitor/core @capacitor/cli
npx cap init "HabitTracker" "com.habittracker.app" --web-dir dist
```

This creates `capacitor.config.ts` in the client root:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.habittracker.app',
  appName: 'HabitTracker',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: true   // <-- added later to bypass CORS
    },
    SplashScreen: {
      launchShowDuration: 0
    },
    StatusBar: {
      style: 'LIGHT'
    }
  }
};

export default config;
```

### 1.2 Add the Android Platform

```bash
npm install @capacitor/android
npx cap add android
```

This scaffolds a full Android project at `client/android/` with Gradle build files, a `MainActivity.java`, and an `AndroidManifest.xml`.

### 1.3 Install Useful Plugins

```bash
npm install @capacitor/keyboard @capacitor/splash-screen @capacitor/status-bar
```

---

## Phase 2 — First APK Build (Command Line)

No Android Studio GUI required. The entire build is done in the terminal.

### 2.1 Build the Web App

```bash
cd client
npm run build
```

This runs `tsc && vite build`, outputting production files to `dist/`.

### 2.2 Sync Web Assets into Android

```bash
npx cap sync android
```

This copies `dist/` → `android/app/src/main/assets/public/` and also generates `capacitor.config.json` inside the Android assets.

### 2.3 Build the APK with Gradle

The key insight: Android Studio bundles a JDK (JBR). We point `JAVA_HOME` at it:

```bash
cd client/android

JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
  ./gradlew assembleDebug
```

> **Note:** `./gradlew` is the Gradle wrapper script already in the `android/` directory. It downloads the correct Gradle version automatically on first run.

The output APK lands at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 2.4 Copy to Desktop & Install

```bash
cp android/app/build/outputs/apk/debug/app-debug.apk ~/Desktop/HabitTracker.apk
```

Transfer to phone via AirDrop, Google Drive, USB cable, or any file-sharing method. On the phone, open the `.apk` file and allow installation from unknown sources.

---

## Phase 3 — Fixing "Data Not Loading" on the Phone

### The Problem

After login, the app showed a blank dashboard — no habits, no tasks. Everything worked fine in the browser.

### Root Cause

Vite **bakes** environment variables into the bundle at build time. The `.env` file had:

```env
VITE_API_URL=http://localhost:5001/api
```

When the APK ran on a phone, `localhost` pointed to the phone itself (nothing there), not the server.

### The Fix — Smart API URL Detection

Modified `client/src/services/api.ts` to detect Capacitor native environment and always use the deployed Vercel backend:

```ts
import { Capacitor } from '@capacitor/core';

const PRODUCTION_API = 'https://personal-tracker-dun.vercel.app/api';

function getBaseURL(): string {
  // Native app (APK) → always use the deployed backend
  if (Capacitor.isNativePlatform()) {
    return PRODUCTION_API;
  }
  // Web: use env var for local dev, fallback to production
  return import.meta.env.VITE_API_URL || PRODUCTION_API;
}

const api = axios.create({ baseURL: getBaseURL() });
```

**Why this works:**
- `Capacitor.isNativePlatform()` returns `true` inside the Android WebView
- Returns `false` in a normal browser, so local dev still uses `localhost:5001`

---

## Phase 4 — CORS & Native HTTP

### The Problem

Even after fixing the API URL, requests were still blocked. The browser console (via Chrome remote debugging) showed:

```
Access-Control-Allow-Origin: blocked
Origin: https://localhost
```

Capacitor's WebView sends requests with origin `https://localhost` — which wasn't in the server's CORS whitelist.

### Fix 1 — Server CORS Whitelist

Added Capacitor-specific origins to `server/src/server.js`:

```js
const allowedOrigins = [
  'http://localhost:5173',            // Vite dev server
  'https://personal-tracker-dun.vercel.app',
  // Capacitor WebView origins:
  'https://localhost',
  'capacitor://localhost',
  'http://localhost',
];
```

### Fix 2 — Capacitor Native HTTP

Enabled the built-in native HTTP plugin in `capacitor.config.ts`:

```ts
plugins: {
  CapacitorHttp: {
    enabled: true
  }
}
```

When enabled, Capacitor intercepts `fetch()` and `XMLHttpRequest` calls from the WebView and routes them through the **native Android HTTP stack** instead. Native HTTP requests don't have CORS restrictions — the request goes directly from the Java layer, not from the browser engine.

### Fix 3 — Android Manifest

Added cleartext traffic permission in `AndroidManifest.xml`:

```xml
<application
  android:usesCleartextTraffic="true"
  ...>
```

---

## Phase 5 — Offline-First Architecture

The app was made to work offline with automatic sync when connectivity returns. This is critical for a mobile app — users expect it to work without internet.

### Architecture

```
┌──────────────────────────────────────────────────┐
│                    React App                      │
│                                                   │
│  ┌─────────────┐    ┌──────────────────────────┐ │
│  │  AppContext  │───▶│  offlineApi.ts           │ │
│  │  (state)    │    │  ┌────────────────────┐  │ │
│  │             │    │  │ Read: IndexedDB    │  │ │
│  │             │    │  │ Write: IndexedDB + │  │ │
│  │             │    │  │   queue sync entry │  │ │
│  │             │    │  └────────────────────┘  │ │
│  └─────────────┘    └──────────┬───────────────┘ │
│                                │                  │
│                     ┌──────────▼───────────────┐  │
│                     │  syncEngine.ts           │  │
│                     │  • Push queue → server   │  │
│                     │  • Pull server → local   │  │
│                     │  • Auto-reconnect        │  │
│                     └──────────┬───────────────┘  │
│                                │                  │
└────────────────────────────────┼──────────────────┘
                                 │ online
                                 ▼
                     ┌───────────────────────┐
                     │   Vercel Backend API  │
                     │   (Express + Neon DB) │
                     └───────────────────────┘
```

### New Files Created

**`client/src/services/offlineDb.ts`** — Dexie.js IndexedDB schema:
```
Tables: habits, tasks, syncQueue, meta
```

**`client/src/services/syncEngine.ts`** — Push/pull sync:
- Pushes queued operations (create/update/delete) to the server
- Pulls full state from server after push completes
- Listens for `window.online` event to auto-sync
- Broadcasts sync status to UI (synced / syncing / offline / error)

**`client/src/services/offlineApi.ts`** — Local-first CRUD:
- All reads come from IndexedDB (instant)
- All writes go to IndexedDB + enqueue a sync entry
- Uses `uuid` for generating IDs locally before server knows about them

### Packages Added

```bash
npm install dexie uuid
npm install -D @types/uuid
```

### Sync Status Indicator

A cloud icon in the mobile header shows the current sync state:
- ☁️ **Cloud** (green) — synced
- 🔄 **Spinning** (blue) — syncing in progress
- ☁️ **CloudOff** (gray) — offline
- ⚠️ **Alert** (red) — sync error, with pending count badge

---

## Phase 6 — Mobile UX Improvements

### 6.1 Mobile Header with Logout

Added a sticky top header bar for mobile (hidden on desktop where the sidebar exists):
- App title on the left
- Sync status badge
- User avatar dropdown on the right with email display and **Sign Out** button

Added `pt-11 lg:pt-0` to the main content area so it doesn't get hidden behind the fixed header.

### 6.2 Inline Add Task Bar

The original floating action button (FAB) at the bottom-right was overlapping task cards on mobile. Replaced it with an inline dashed-border `+ Add task` bar at the top of the task list that expands into a composer form when tapped.

---

## Phase 7 — Task Manager Rework (Past History)

### 7.1 Past Days Instead of Future

The daily "Week" view originally showed 7 future days. Changed `getWeekDays()` to show **past 6 days + today**, with the newest day at the top. This makes more sense for a task tracker — you review what you've done, not plan a week ahead.

### 7.2 "All" View Grouped by Date

The daily "All" view now groups tasks by date with human-readable labels:
- **Today**
- **Yesterday**
- **Feb 6, 2026**
- etc.

### 7.3 Weekly & Monthly History Cards

Past weeks and months now appear as **collapsible cards** below the current period:

```
┌─────────────────────────────────────────┐
│ 📅  Last Week                           │
│     Jan 26 – Feb 1                      │
│                              3/4 done ▾ │
├─────────────────────────────────────────┤
│ (expanded: shows task cards)            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📅  2 Weeks Ago                         │
│     Jan 19 – Jan 25            2/3 done │
└─────────────────────────────────────────┘
```

**Helper functions added:**
- `getWeekRelativeLabel(weekKey)` → "Last Week", "2 Weeks Ago", etc.
- `getMonthRelativeLabel(monthKey)` → "Last Month", "2 Months Ago", etc.
- `pastWeekGroups` / `pastMonthGroups` — groups tasks by period key, sorted newest first

---

## Quick Rebuild Cheatsheet

After making any code change, rebuild the APK in 3 commands:

```bash
# 1. Build the web app
cd client
npm run build

# 2. Copy web assets into Android project
npx cap sync android

# 3. Build the APK
cd android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
  ./gradlew assembleDebug

# 4. Copy to Desktop
cp app/build/outputs/apk/debug/app-debug.apk ~/Desktop/HabitTracker.apk
```

**One-liner version:**

```bash
cd client && npm run build && npx cap sync android && cd android && JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew assembleDebug && cp app/build/outputs/apk/debug/app-debug.apk ~/Desktop/HabitTracker.apk && echo "✅ Done"
```

---

## Project Structure

```
client/
├── capacitor.config.ts          # Capacitor configuration
├── vite.config.ts               # Vite build config
├── dist/                        # Production build output
├── android/                     # Generated Android project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/public/   # ← web assets copied here by cap sync
│   │   │   ├── AndroidManifest.xml
│   │   │   └── java/.../MainActivity.java
│   │   └── build/outputs/apk/debug/
│   │       └── app-debug.apk    # ← final APK
│   └── gradlew                  # Gradle wrapper
├── src/
│   ├── services/
│   │   ├── api.ts               # Axios client (smart URL detection)
│   │   ├── offlineDb.ts         # IndexedDB schema (Dexie)
│   │   ├── syncEngine.ts        # Push/pull sync engine
│   │   └── offlineApi.ts        # Offline-first CRUD wrapper
│   ├── context/
│   │   └── AppContext.tsx        # Global state (offline-first)
│   ├── components/
│   │   └── Sidebar.tsx          # Desktop sidebar + mobile header
│   └── pages/
│       └── TaskManager.tsx      # Task management with history cards
│
server/
├── src/
│   └── server.js                # Express API (CORS whitelist updated)
└── ...
```

---

## Troubleshooting

### APK shows blank screen after login
- **Cause:** API URL pointing to `localhost` which doesn't exist on the phone.
- **Fix:** Ensure `api.ts` uses `Capacitor.isNativePlatform()` to route to production URL.

### Network requests fail silently
- **Cause:** CORS blocking. Capacitor WebView origin is `https://localhost`.
- **Fix:** Add `https://localhost`, `capacitor://localhost`, `http://localhost` to server CORS whitelist. Also enable `CapacitorHttp` in `capacitor.config.ts`.

### `./gradlew: Permission denied`
```bash
chmod +x android/gradlew
```

### `JAVA_HOME is not set`
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```
You can add this to your `~/.zshrc` to make it permanent.

### Gradle build fails with SDK errors
Make sure Android SDK is installed. If you have Android Studio installed, the SDK is usually at `~/Library/Android/sdk`. Set:
```bash
export ANDROID_HOME=~/Library/Android/sdk
```

### Changes not showing up in APK
You must run **all 3 steps** in order:
1. `npm run build` — rebuilds the web bundle
2. `npx cap sync android` — copies new bundle into Android assets
3. `./gradlew assembleDebug` — repackages the APK

Skipping step 2 means the Android project still has the old web assets.

### App works offline but doesn't sync
- Check if the Vercel backend is deployed and running
- Check the sync status icon in the header (red = error)
- Open Chrome DevTools via `chrome://inspect` to debug the WebView remotely

---

## Git History (Key Commits)

| Commit | Description |
|--------|-------------|
| Initial | Base web app with React + Express + PostgreSQL |
| Capacitor setup | Added Capacitor, Android platform, initial APK build |
| API URL fix | Smart detection for native vs web platform |
| CORS fix | Server whitelist + CapacitorHttp native bypass |
| Offline-first | Dexie.js IndexedDB + sync engine + offline API |
| Mobile header | Top bar with logout + sync status indicator |
| Task history | Past days flow, inline add bar, collapsible weekly/monthly cards |
| Demo cleanup | Removed temporary demo data seed controls |

---

*Last updated: February 8, 2026*
