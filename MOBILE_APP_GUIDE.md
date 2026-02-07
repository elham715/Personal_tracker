# 📱 Habit Tracker — Mobile App Guide

## What Was Done

Your web app has been converted into a **hybrid mobile app** using [Capacitor](https://capacitorjs.com/) by Ionic. Capacitor wraps your existing React web app inside a native Android (and eventually iOS) shell — so it runs as a real app from the Play Store, not just a website.

### Files Added / Changed

| File | Purpose |
|------|---------|
| `client/capacitor.config.ts` | Main config — app name, bundle ID, splash screen, status bar settings |
| `client/android/` | Full native Android project (Gradle, Java, resources) |
| `client/src/services/api.ts` | Updated to auto-detect native app and use deployed backend |
| `client/index.html` | Added viewport-fit, theme-color, mobile meta tags |
| `client/src/index.css` | Added safe-area padding for native status bar |
| `client/.gitignore` | Added Android build artifact ignores |

### Plugins Installed

| Plugin | Purpose |
|--------|---------|
| `@capacitor/core` | Core Capacitor runtime |
| `@capacitor/cli` | CLI tools for build/sync |
| `@capacitor/android` | Android platform support |
| `@capacitor/splash-screen` | Native splash screen on app launch |
| `@capacitor/status-bar` | Control phone status bar color/style |
| `@capacitor/keyboard` | Handle keyboard behavior in the app |

---

## How to Run on Your Phone (Testing)

### Option 1: Android Emulator

1. Open **Android Studio** (it should already have your project)
2. If not open, run this in terminal:
   ```bash
   cd client
   npx cap open android
   ```
3. Wait for **Gradle sync** to finish (progress bar at bottom of Android Studio)
4. Click the **device dropdown** at the top → **Device Manager** → Create a virtual device (e.g., Pixel 7, API 34)
5. Click the green **▶️ Run** button
6. Your app launches in the emulator!

### Option 2: Real Android Phone (USB)

1. On your phone: **Settings → About Phone → tap "Build Number" 7 times** to enable Developer Mode
2. Go to **Settings → Developer Options → enable "USB Debugging"**
3. Connect phone to Mac via USB cable
4. Your phone appears in Android Studio's device dropdown
5. Click **▶️ Run** — the app installs on your phone!

### Option 3: Real Android Phone (APK file)

1. In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. The APK file is generated at:
   ```
   client/android/app/build/outputs/apk/debug/app-debug.apk
   ```
3. Send this file to your phone (AirDrop, email, Google Drive, etc.)
4. Open the APK on your phone and install it
5. You may need to allow "Install from unknown sources" in settings

---

## How to Build a Release APK / AAB (For Publishing)

### Step 1: Generate a Signing Key

You need a keystore to sign your app. Run this **once**:

```bash
keytool -genkey -v -keystore ~/habit-tracker-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias habit-tracker
```

It will ask for:
- **Password**: Choose a strong password (save it somewhere safe!)
- **Name, Organization, etc.**: Fill in your details
- **Confirm**: Type `yes`

> ⚠️ **NEVER lose this keystore file or password.** You need it for every future update on the Play Store.

### Step 2: Configure Signing in Android Studio

1. Open Android Studio
2. Go to **Build → Generate Signed Bundle / APK**
3. Choose **Android App Bundle (AAB)** for Play Store (or APK for direct sharing)
4. Select your keystore file (`~/habit-tracker-release.jks`)
5. Enter your password and alias
6. Choose **release** build variant
7. Click **Create**

The signed file will be at:
```
client/android/app/build/outputs/bundle/release/app-release.aab
```

### Step 3: Or Build via Command Line

```bash
# Set Java to Android Studio's JDK
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

# Navigate to android folder
cd client/android

# Build release AAB
./gradlew bundleRelease
```

---

## Where to Upload / Ship

### 🟢 Google Play Store (Main Option)

1. Go to [Google Play Console](https://play.google.com/console)
2. Pay the **one-time $25 developer fee**
3. Click **"Create app"**
4. Fill in:
   - **App name**: Habit Tracker
   - **Default language**: English
   - **App type**: App
   - **Free or Paid**: Free
5. Complete the **Dashboard checklist**:
   - App content (privacy policy, target audience, etc.)
   - Store listing (description, screenshots, icon)
6. Go to **Production → Create new release**
7. Upload your **`.aab`** file (from Step 2 above)
8. Click **Review release → Start rollout to production**
9. Google reviews your app (usually 1-3 days for first submission)

**What you need for the listing:**
- App icon (512×512 PNG)
- Feature graphic (1024×500 PNG)
- At least 2 phone screenshots
- Short description (80 chars max)
- Full description (4000 chars max)
- Privacy policy URL (can be a simple page on your website or a free one from [privacypolicytemplate.net](https://www.privacypolicytemplate.net/))

### 🔵 Alternative: Direct APK Sharing

If you don't want to go through the Play Store:
- Build a debug or release APK
- Share it via **Google Drive, WhatsApp, Telegram, or email**
- Anyone with the APK can install it on their Android phone
- They'll need to enable "Install from unknown sources"

### 🟡 Alternative: Amazon Appstore

- Free to publish
- [Amazon Developer Console](https://developer.amazon.com/apps-and-games)
- Upload the same AAB/APK
- Reaches Fire tablets and some Android users

### 🍎 iOS (Future — Requires Xcode)

When you're ready for iOS:
1. Install **Xcode** from the Mac App Store (free, ~12GB)
2. Install **CocoaPods**: `sudo gem install cocoapods`
3. Run:
   ```bash
   cd client
   npx cap add ios
   npx cap open ios
   ```
4. You'll need an **Apple Developer account** ($99/year) to publish on the App Store
5. Build and submit through Xcode → App Store Connect

---

## Everyday Workflow

When you make changes to your web app:

```bash
# 1. Make your code changes in src/

# 2. Build and sync to Android
cd client
npm run build && npx cap sync android

# 3. Open Android Studio and run
npx cap open android
```

Or for quick testing with live reload (phone and Mac on same WiFi):

```bash
# 1. Find your Mac's local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# 2. Edit capacitor.config.ts — uncomment and set:
#    url: 'http://YOUR_IP:3000'

# 3. Start dev server
npm run dev -- --host

# 4. Sync and run
npx cap sync android && npx cap open android
```

---

## App Details

| Setting | Value |
|---------|-------|
| **App ID (Bundle)** | `com.elham.habittracker` |
| **App Name** | Habit Tracker |
| **Backend API** | `https://personal-tracker-dun.vercel.app/api` (when native) |
| **Splash Screen** | Dark theme (#0f172a), 1.5s |
| **Min Android** | API 22 (Android 5.1+) |
| **Java/JDK** | JDK 21 (bundled with Android Studio) |

---

## Custom App Icon

The current icon is the default Capacitor icon. To replace it:

1. Create a **1024×1024 PNG** of your logo
2. Go to [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html) or use Android Studio → **right-click `res` → New → Image Asset**
3. Upload your icon and generate all sizes
4. Replace the files in `client/android/app/src/main/res/mipmap-*/`

---

## Summary

```
Your Web App (React + Vite)
        ↓
    npm run build        → Creates dist/ folder
        ↓
    npx cap sync         → Copies dist/ into Android project
        ↓
    Android Studio       → Builds native .apk/.aab
        ↓
    Google Play Store    → Users download your app! 📱
```

**You're ready to ship.** 🚀
