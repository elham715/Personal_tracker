# 📊 Project Progress — Personal Dashboard & Habit Tracker

> Full documentation of what exists, what was built, what works, and what's left.

---

## Current State: ✅ Fully Functional (Web + Android APK)

The app is a **production-ready** personal habit tracker and task manager. It runs as:
- 🌐 **Web app** — deployed on Vercel at `https://personal-tracker-dwge.vercel.app`
- 📱 **Android APK** — installable native app via Capacitor

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Firebase  │  │  IndexedDB   │  │      React Pages         │  │
│  │   Auth    │  │  (Dexie.js)  │  │  Dashboard · Tasks ·     │  │
│  │          │  │  offlineDb   │  │  Habits · Calendar ·     │  │
│  │  Login    │  │  offlineApi  │  │  HabitManager            │  │
│  │  Google   │  │  syncEngine  │  │                          │  │
│  └──────────┘  └──────┬───────┘  └──────────────────────────┘  │
│                       │ sync                                    │
│                       ▼                                         │
│              ┌────────────────┐                                 │
│              │   api.ts       │ Axios + Firebase JWT token      │
│              │   Smart URL    │ localhost (dev) / Vercel (prod)  │
│              └────────┬───────┘                                 │
└───────────────────────┼─────────────────────────────────────────┘
                        │ HTTPS
┌───────────────────────┼─────────────────────────────────────────┐
│                       ▼        SERVER (Express.js)              │
│              ┌────────────────┐                                 │
│              │  server.js     │ CORS · Helmet · Rate Limit      │
│              └────────┬───────┘                                 │
│                       │                                         │
│    ┌──────────────────┼──────────────────────┐                  │
│    │                  │                      │                  │
│    ▼                  ▼                      ▼                  │
│  /api/auth      /api/habits            /api/tasks               │
│  /api/stats     /api/trash                                      │
│    │                  │                      │                  │
│    └──────────────────┼──────────────────────┘                  │
│                       │                                         │
│              ┌────────▼───────┐                                 │
│              │  PostgreSQL    │ Hosted on Neon                   │
│              │  (database.js) │ SSL connection                  │
│              └────────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Complete File Map & What Each File Does

### Client — `/client/src/`

| File | Purpose | Status |
|------|---------|--------|
| **`App.tsx`** | Root component. Sets up routing, auth guard (`ProtectedRoute`), `AppProvider` wrapper, and layout (Sidebar + pages). Mobile gets `pt-11` padding for the fixed top header. | ✅ Done |
| **`main.tsx`** | Entry point. Renders `<App />` into the DOM. | ✅ Done |
| **`index.css`** | Global styles, Tailwind imports, custom animations (`animate-fade-up`, `animate-scale-in`), glass-card effects. | ✅ Done |

#### Pages

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| **`Login.tsx`** | Email/password login + Google Sign-In + Forgot Password. Redirects if already logged in. | 192 | ✅ Done |
| **`Register.tsx`** | Email/password registration with name. Google sign-up option. | ~180 | ✅ Done |
| **`Dashboard.tsx`** | Home page. Shows: greeting, progress ring (% habits done today), stats (best streak, check-ins, tasks done), today's habit list with tap-to-toggle, weekly overview heatmap (4 habits × 7 days), "The Habit Manual" banner linking to Habits page. Desktop gets 2-column grid. | 201 | ✅ Done |
| **`TaskManager.tsx`** | Task management with 3 scopes (Daily/Weekly/Monthly). Features: urgency system (Urgent/Important/Chill with themed colors), inline add task composer, progress banner with ring. **Daily** has 3 sub-views (Today/Week/All). **Week view** shows past 6 days + today (newest first). **All view** groups tasks by date with labels (Today/Yesterday/date). **Weekly & Monthly** show current period tasks + collapsible "Previous Weeks/Months" history cards with relative labels (Last Week, 2 Weeks Ago, etc.) and done counts. | 680 | ✅ Done |
| **`Habits.tsx`** | "The Habit Manual" — a full Atomic Habits educational guide. 100 rotating daily quotes. 10 detailed sections with rich content types (quotes, comparisons, steps, examples, key points). Collapsible accordion cards. | 731 | ✅ Done |
| **`Everyday.tsx`** | Calendar view. 14-day habit heatmap grid (habits × dates) with color intensity based on streak length. Tap to toggle. Analytics section: streak stats cards per habit (current/best/total), 14-day completion bar chart, SVG line chart of daily completion %. | 332 | ✅ Done |
| **`HabitManager.tsx`** | CRUD for habits. Create form with icon picker (24 emojis), category selector (9 categories), color picker (6 colors), daily target. List of habits with delete-to-trash. Trash section with restore + permanent delete. | ~200 | ✅ Done |
| **`Trash.tsx`** | Standalone trash page (also accessible via HabitManager's trash section). | ~60 | ✅ Done |

#### Services

| File | Purpose | Status |
|------|---------|--------|
| **`api.ts`** | Axios instance with: smart base URL detection (Capacitor native → Vercel, web dev → localhost, production web → Vercel), Firebase JWT token interceptor, request/response logging, `habitsAPI` and `tasksAPI` objects with all CRUD endpoints. | ✅ Done |
| **`auth.ts`** | Firebase Auth service: register, login, Google login, logout, getCurrentUser, getIdToken. | ✅ Done |
| **`offlineDb.ts`** | Dexie.js IndexedDB database (`HabitTrackerDB`). Tables: `habits` (id, name, category, isTrashed), `tasks` (id, date, scope, habitId), `syncQueue` (auto-increment id, entity, action, entityId, payload, retries), `meta` (key-value for lastSync). Helpers: `clearLocalData()`, `getLastSync()`, `setLastSync()`. | ✅ Done |
| **`syncEngine.ts`** | Push/pull sync engine. Queues local changes, flushes to server when online. `pushQueue()`: replays each action against server API (create/update/delete/toggle/restore). Retries up to 5 times, drops stale 404/409 items. `pullFromServer()`: fetches all habits+tasks from server, replaces local DB (server wins) while preserving items with pending offline changes. Broadcasts status to UI listeners. Auto-syncs on `window.online` event. | ✅ Done |
| **`offlineApi.ts`** | Offline-first CRUD wrapper. All reads from IndexedDB (instant). All writes: write to IndexedDB + enqueue sync entry. Uses `uuid` for local ID generation. `offlineHabitsAPI`: getAll, getTrashed, create, update, delete (soft), restore, permanentlyDelete, toggleDate. `offlineTasksAPI`: getAll, create, update, delete, toggle. `initialSync()`: triggers `syncNow()` if online. | ✅ Done |

#### Other Client Files

| File | Purpose | Status |
|------|---------|--------|
| **`components/Sidebar.tsx`** | Three UI elements: (1) **Mobile top header** — fixed, app title + sync status badge + avatar dropdown with email + sign out. (2) **Mobile bottom tab bar** — 5 tabs (Home/Tasks/Habits/Calendar/Manage). (3) **Desktop left sidebar** — 220px wide, same nav + user info + logout. `SyncBadge` component shows green cloud/spinning/gray offline/amber error. | ✅ Done |
| **`context/AppContext.tsx`** | Global state provider. Manages: habits, trashedHabits, tasks, loading, error, syncStatus, pendingChanges. All CRUD operations use offline-first API. Listens for sync status changes and refreshes UI from local DB after sync. Auth state listener: loads from local DB → triggers server sync → refreshes. Clears local data on logout. Inflight request deduplication via `inflightRef`. | ✅ Done |
| **`config/firebase.ts`** | Firebase app initialization with env vars. Exports `auth` and `db` (Firestore, unused). | ✅ Done |
| **`types/index.ts`** | TypeScript interfaces: `Habit` (id, name, icon, category, color, target, streak, completedDates, createdAt, isTrashed), `Task` (id, text, completed, priority, scope, isHabit, habitId, date, createdAt), `Stats`. | ✅ Done |
| **`utils/helpers.ts`** | Utility functions: `formatDate()` (YYYY-MM-DD), `isToday()`, `isFuture()`, `calculateStreak()`, `getDatesRange()`, `getGreeting()`. | ✅ Done |
| **`utils/constants.ts`** | Constants: `HABIT_ICONS` (24 emojis), `HABIT_CATEGORIES` (9), `HABIT_COLORS` (6 with Tailwind classes), `PRIORITY_COLORS`, `getColorClasses()`. | ✅ Done |
| **`utils/storage.ts`** | Local storage utilities (may be legacy from before IndexedDB migration). | ✅ Done |

### Server — `/server/src/`

| File | Purpose | Status |
|------|---------|--------|
| **`server.js`** | Express app. Middleware: helmet, CORS (whitelist includes Capacitor origins), rate limiter (500 req/15min), morgan logging. Routes: auth, habits, tasks, trash, stats. Health check at `/health`. | ✅ Done |
| **`config/database.js`** | PostgreSQL connection via `pg.Pool`. Connects to Neon with SSL. Inline schema SQL creates tables (users, habits, tasks) with indexes. Auto-applies schema on first connect. Helper functions: `toCamelCase()`, `toCamelCaseArray()` for snake_case → camelCase conversion. | ✅ Done |
| **`config/firebase.js`** | Firebase Admin SDK initialization for server-side token verification. | ✅ Done |
| **`middleware/auth.js`** | JWT middleware. Verifies Firebase ID token from `Authorization: Bearer <token>`. Finds or creates user in PostgreSQL. Attaches `req.user` for downstream routes. | ✅ Done |
| **`middleware/errorHandler.js`** | Global error handler + 404 handler. | ✅ Done |
| **`middleware/validators.js`** | Express-validator rules for habits and tasks. | ✅ Done |
| **`models/Habit.js`** | Habit model: findByUser, findOne, findOneActive, findOneTrashed, create, update, toggleDate (add/remove from completedDates array + recalculate streak), softDelete, restore, permanentlyDelete. | ✅ Done |
| **`models/Task.js`** | Task model: findByUser (with filters), findByDate, findOne, create, update, toggle, delete. Formats `createdDate` → `date` for frontend. | ✅ Done |
| **`models/User.js`** | User model: findByFirebaseUid, findByEmail, create, update. | ✅ Done |
| **`controllers/*.js`** | Controller logic for each route (auth, habit, task, trash, stats). | ✅ Done |
| **`routes/*.js`** | Express routers mapping HTTP methods to controllers. All protected routes use auth middleware. | ✅ Done |
| **`utils/calculateStreak.js`** | Server-side streak calculation. | ✅ Done |
| **`utils/seed.js`** | Database seed script. | ✅ Done |

### Config & Build Files

| File | Purpose |
|------|---------|
| `client/capacitor.config.ts` | Capacitor config: appId `com.habittracker.app`, webDir `dist`, CapacitorHttp enabled, SplashScreen disabled |
| `client/vite.config.ts` | Vite config with React plugin and `@` path alias |
| `client/tailwind.config.js` | Tailwind with custom animations, custom utilities |
| `client/tsconfig.json` | TypeScript strict mode, `@/` path alias |
| `client/package.json` | All dependencies listed above |
| `server/package.json` | Express, pg, firebase-admin, helmet, cors, etc. |
| `client/android/` | Generated Android project (Gradle, manifest, assets) |

---

## 🔄 Data Flow — How Everything Connects

### Authentication Flow
```
User opens app
  → Firebase Auth check (onAuthStateChanged)
  → If logged in:
      → Load from IndexedDB (instant UI)
      → Background: sync with server (push queue + pull state)
      → Refresh UI with server data
  → If logged out:
      → Clear IndexedDB
      → Redirect to /login
```

### Creating a Task (example)
```
User types "Buy groceries" → taps Add
  → offlineTasksAPI.create()
      → Generate UUID locally
      → Write to IndexedDB instantly
      → Enqueue {entity: 'task', action: 'create', payload: {...}}
      → UI updates immediately (setState)
  → syncEngine detects queue item
      → If online: push to server via tasksAPI.create()
      → If offline: stays in queue, auto-pushes when online
  → After push: pull full state from server
  → Refresh UI from IndexedDB
```

### Habit Toggle Flow
```
User taps habit checkbox for today
  → offlineHabitsAPI.toggleDate(id, "2026-02-08")
      → Read habit from IndexedDB
      → Add/remove date from completedDates array
      → Update streak count
      → Write back to IndexedDB
      → Enqueue {entity: 'habit', action: 'toggleDate', payload: {date}}
  → UI updates immediately
  → Sync pushes toggle to server when online
```

---

## 📱 App Screens & Features

### 1. Login / Register
- Email + password authentication
- Google Sign-In (one tap)
- "Forgot password" sends reset email
- Auto-redirect if already logged in
- Clean gradient design with glass-card effect

### 2. Dashboard (Home)
- Greeting based on time of day
- Circular progress ring — today's habit completion %
- Stats: best streak 🔥, total check-ins, tasks done today
- Quick habit toggle list (tap to mark today as done)
- Weekly overview: 4 habits × 7 days mini heatmap
- "The Habit Manual" promotional banner → links to Habits page
- Desktop: 2-column layout

### 3. Task Manager
- **3 scope tabs**: Daily / Weekly / Monthly
- **Urgency system**: Urgent (🔥 rose), Important (⚡ amber), Chill (🌿 emerald)
- **Progress banner**: Colored gradient per scope with ring + stats
- **Inline composer**: Dashed "Add task" bar expands to input with urgency picker
- **Daily sub-views**:
  - Today: Today's tasks + habits as cards
  - Week: Past 6 days + today, each day's tasks shown separately (newest day at top)
  - All: Every daily task grouped by date (Today/Yesterday/older dates)
- **Weekly/Monthly history**: Collapsible past-period cards showing "Last Week", "2 Weeks Ago", "Last Month", etc. with done/total badges and expand/collapse
- Cards show priority color, label, checkbox toggle, delete button (hover)

### 4. Habits Page ("The Habit Manual")
- Full educational guide based on Atomic Habits
- 100 original habit quotes (one per day, rotates daily)
- 10 sections: Tiny Changes, Systems vs Goals, Identity, Habit Loop, 4 Laws, Advanced Strategies, Common Mistakes
- Rich content types: quotes, comparisons tables, step-by-step, before/after examples, key points
- Collapsible accordion UI

### 5. Calendar (Everyday)
- 14-day habit heatmap grid
- Color intensity = streak length (1 day = light, 5+ days = dark)
- Per-habit color theming (purple, blue, green, pink, orange, cyan)
- Today column highlighted with ring
- Future dates disabled
- **Analytics section**:
  - Streak stats cards per habit (current streak 🔥, best streak 🏆, total days)
  - 14-day completion bar chart (per habit, colored gradient bars)
  - SVG line chart of daily completion % over 14 days

### 6. Habit Manager
- Create habit form: name, icon (24 emoji grid), category (9 options), color (6 picks), daily target
- Habit list with delete-to-trash button
- Expandable Trash section: restore or permanently delete

### 7. Navigation
- **Mobile**: Fixed top header (title + sync badge + avatar dropdown) + bottom tab bar (5 tabs)
- **Desktop**: Left sidebar 220px with tabs + user info + logout

---

## 🗄️ Database Schema

```sql
users (
  id           UUID PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE,
  name         VARCHAR(50),
  email        VARCHAR(255) UNIQUE,
  password     VARCHAR(255),          -- unused with Firebase
  avatar       TEXT DEFAULT '🚀',
  bio          VARCHAR(200),
  created_at   TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ
)

habits (
  id              UUID PRIMARY KEY,
  user_id         UUID → users(id),
  name            VARCHAR(100),
  icon            TEXT DEFAULT '✨',
  category        VARCHAR(50),
  color           VARCHAR(20),
  target          INTEGER DEFAULT 1,
  streak          INTEGER DEFAULT 0,
  completed_dates TEXT[] DEFAULT '{}',  -- PostgreSQL array of date strings
  is_trashed      BOOLEAN DEFAULT FALSE,
  trashed_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
)

tasks (
  id           UUID PRIMARY KEY,
  user_id      UUID → users(id),
  text         VARCHAR(500),
  completed    BOOLEAN DEFAULT FALSE,
  priority     VARCHAR(10),     -- 'high' | 'medium' | 'low'
  scope        VARCHAR(10),     -- 'daily' | 'weekly' | 'monthly'
  is_habit     BOOLEAN DEFAULT FALSE,
  habit_id     UUID → habits(id),
  created_date VARCHAR(10),     -- YYYY-MM-DD (used as "date" in frontend)
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ
)
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login (Firebase token exchange) |
| GET | `/api/habits` | Get all active habits |
| POST | `/api/habits` | Create habit |
| PUT | `/api/habits/:id` | Update habit |
| DELETE | `/api/habits/:id` | Soft-delete (trash) habit |
| PATCH | `/api/habits/:id/toggle` | Toggle date in completedDates |
| PATCH | `/api/habits/:id/restore` | Restore from trash |
| GET | `/api/tasks` | Get all tasks (optional `?date=` filter) |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| PATCH | `/api/tasks/:id/toggle` | Toggle completed |
| GET | `/api/trash` | Get trashed habits |
| DELETE | `/api/trash/:id` | Permanently delete |
| GET | `/api/stats` | Get user stats |
| GET | `/health` | Health check |

All routes except `/health` and auth routes require `Authorization: Bearer <firebase-token>`.

---

## 📦 Dependencies

### Client (23 packages)
| Package | Version | What It Does |
|---------|---------|-------------|
| react + react-dom | 18.2.0 | UI framework |
| react-router-dom | 6.22.0 | Client-side routing |
| typescript | 5.3.3 | Type safety |
| vite | 5.1.0 | Build tool + dev server |
| tailwindcss | 3.4.1 | Utility-first CSS |
| firebase | 12.8.0 | Auth SDK (client) |
| axios | 1.13.4 | HTTP client |
| dexie | 4.3.0 | IndexedDB wrapper (offline storage) |
| uuid | 13.0.0 | Generate local IDs offline |
| lucide-react | 0.323.0 | Icon library |
| date-fns | 3.3.1 | Date utilities (imported but lightly used) |
| clsx | 2.1.0 | Conditional className helper |
| @capacitor/core + cli + android | 8.0.2 | Native mobile wrapper |
| @capacitor/keyboard | 8.0.0 | Keyboard handling on mobile |
| @capacitor/splash-screen | 8.0.0 | Splash screen |
| @capacitor/status-bar | 8.0.0 | Status bar styling |

### Server (11 packages)
| Package | Version | What It Does |
|---------|---------|-------------|
| express | 4.18.2 | Web framework |
| pg | 8.13.1 | PostgreSQL client |
| firebase-admin | 12.7.0 | Server-side token verification |
| cors | 2.8.5 | Cross-origin support |
| helmet | 7.1.0 | Security headers |
| express-rate-limit | 7.1.5 | Rate limiting |
| express-validator | 7.0.1 | Input validation |
| morgan | 1.10.0 | HTTP logging |
| dotenv | 16.3.1 | Environment variables |
| bcryptjs | 2.4.3 | Password hashing (legacy, unused with Firebase) |
| jsonwebtoken | 9.0.2 | JWT handling (legacy, Firebase handles this now) |

---

## 🐛 Bugs Fixed During Development

| # | Bug | Root Cause | Fix |
|---|-----|-----------|-----|
| 1 | APK shows blank screen after login | `VITE_API_URL=http://localhost:5001` was baked into the Vite build. On the phone, localhost = the phone itself (nothing listening). | Made `api.ts` detect Capacitor native platform and always use the Vercel production URL. |
| 2 | API requests fail silently on APK | CORS blocking. Capacitor WebView sends origin `https://localhost` which wasn't in the server's CORS whitelist. | Added `https://localhost`, `capacitor://localhost`, `http://localhost` to server CORS. Enabled `CapacitorHttp` in Capacitor config for native HTTP bypass. |
| 3 | Data doesn't persist when offline | App made direct API calls that failed without internet. | Built full offline-first architecture: IndexedDB (Dexie.js) for local storage, sync queue, push/pull engine with auto-reconnect. |
| 4 | No way to logout on mobile | Desktop sidebar has logout, but mobile only had a bottom tab bar. | Added fixed top header bar on mobile with avatar dropdown containing email + Sign Out button. |
| 5 | FAB button overlaps task cards | Floating action button at bottom-right covered the last task card on mobile. | Replaced FAB with inline dashed "Add task" bar that expands to composer in-place. |
| 6 | Tasks show future days | Daily "Week" view showed 7 future days, which makes no sense for tracking. | Changed to show past 6 days + today, newest at top. |
| 7 | No history of past weeks/months | Weekly/Monthly only showed current period. Past tasks were invisible. | Added collapsible past-period cards grouped by week/month with relative labels and done counts. |

---

## ✅ Feature Checklist

### Core Features
- [x] User registration (email + Google)
- [x] User login (email + Google)
- [x] Forgot password (reset email)
- [x] Protected routes (redirect to login if not authenticated)
- [x] Create / edit / delete habits
- [x] Habit icon picker (24 emojis)
- [x] Habit category system (9 categories)
- [x] Habit color theming (6 colors)
- [x] Daily habit toggle (tap to mark done)
- [x] Streak tracking (current + best)
- [x] Soft-delete habits (trash + restore + permanent delete)
- [x] Create / delete tasks
- [x] Task urgency system (Urgent / Important / Chill)
- [x] Task scopes (Daily / Weekly / Monthly)
- [x] Task completion toggle
- [x] Dashboard with progress ring + stats
- [x] 14-day calendar heatmap with intensity colors
- [x] Analytics: streak cards, completion bars, line chart
- [x] Atomic Habits educational content (10 sections, 100 quotes)

### Mobile & Offline
- [x] Android APK via Capacitor
- [x] Offline-first architecture (IndexedDB)
- [x] Sync engine (push queue + pull from server)
- [x] Sync status indicator (cloud icons)
- [x] Mobile responsive design
- [x] Mobile top header with logout
- [x] Mobile bottom tab navigation
- [x] Desktop left sidebar

### Task Manager Advanced
- [x] Daily sub-views: Today / Week / All
- [x] Week view shows past 6 days + today
- [x] All view groups tasks by date
- [x] Inline add task composer
- [x] Weekly history — collapsible past week cards
- [x] Monthly history — collapsible past month cards
- [x] Relative time labels (Last Week, 2 Months Ago, etc.)

---

## 🚧 Known Limitations & Potential Improvements

### Things That Could Be Better
1. **No task editing** — tasks can be created, toggled, deleted, but not edited (text/priority change)
2. **No push notifications** — no reminders to complete habits
3. **No data export** — can't export habit data to CSV or PDF
4. **No habit reordering** — habits display in creation order, can't drag-to-reorder
5. **No dark mode** — everything is light theme only
6. **No weekly/monthly habit targets** — habits are daily only (target = times per day)
7. **No habit archive** — only trash (soft delete), no "completed/retired" state
8. **Streak calculation is simple** — doesn't account for "rest days" or flexible schedules
9. **No multi-user / sharing** — strictly personal, single-user per account
10. **No profile editing** — can't change name, avatar, or bio from the app
11. **No search** — can't search through tasks or habits
12. **No task due dates / reminders** — tasks have a scope date but no time-based reminders
13. **Calendar only shows 14 days** — no month view or date picker
14. **No app icon or splash screen customization** — uses default Capacitor defaults
15. **Sync conflicts** — server-wins strategy means offline edits can be overwritten if the same item was edited on another device
16. **Legacy packages** — `bcryptjs` and `jsonwebtoken` in server are unused (Firebase handles auth) but still installed

### Potential Future Features
- [ ] Task editing (tap to edit text/priority)
- [ ] Dark mode toggle
- [ ] Push notifications / reminders
- [ ] Habit reordering (drag & drop)
- [ ] Data export (CSV/PDF)
- [ ] Profile page (edit name, avatar)
- [ ] Search through tasks and habits
- [ ] Yearly habit heatmap (GitHub-style)
- [ ] Habit categories filter on Dashboard
- [ ] Weekly/Monthly habit targets
- [ ] Custom app icon & splash screen for APK
- [ ] iOS build (Capacitor supports iOS too)

---

## 🛠️ Development Commands

```bash
# ── Local Development ──
cd client && npm run dev          # Vite dev server at localhost:5173
cd server && npm run dev          # Express server at localhost:5001

# ── Production Build ──
cd client && npm run build        # TypeScript check + Vite production build

# ── Android APK Build ──
cd client && npm run build                    # 1. Build web
npx cap sync android                          # 2. Copy to Android
cd android                                    # 3. Enter Android project
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
  ./gradlew assembleDebug                     # 4. Build APK
cp app/build/outputs/apk/debug/app-debug.apk ~/Desktop/HabitTracker.apk  # 5. Copy

# ── Git ──
git add -A && git commit -m "message" && git push origin main

# ── Server Deploy ──
# Server auto-deploys on Vercel when pushed to main
```

---

## 📈 Project Stats

| Metric | Value |
|--------|-------|
| Total TypeScript/TSX files (client) | 18 |
| Total JavaScript files (server) | 15 |
| Largest file | Habits.tsx (731 lines — educational content) |
| Second largest | TaskManager.tsx (680 lines — most complex UI) |
| Total client dependencies | 23 |
| Total server dependencies | 11 |
| Database tables | 3 (users, habits, tasks) |
| API endpoints | 16 |
| Pages / screens | 7 (Login, Register, Dashboard, Tasks, Habits, Calendar, Manager) |

---

*Last updated: February 8, 2026*
*Repository: github.com/elham715/Personal_tracker*
*Branch: main*
