# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Endpoints

### Register User
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "avatar": "🚀",
  "bio": "Building better habits"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "🚀",
      "bio": "Building better habits",
      "createdAt": "2026-01-31T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** Same as Register

### Get Current User
**GET** `/api/auth/me`
*Requires authentication*

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "🚀",
    "bio": "Building better habits"
  }
}
```

### Update Profile
**PUT** `/api/auth/profile`
*Requires authentication*

**Request Body:**
```json
{
  "name": "John Updated",
  "avatar": "🎯",
  "bio": "New bio"
}
```

### Change Password
**PUT** `/api/auth/password`
*Requires authentication*

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

---

## 🎯 Habit Endpoints

### Get All Habits
**GET** `/api/habits`
*Requires authentication*

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "...",
      "name": "Morning Exercise",
      "icon": "🏃",
      "category": "Fitness",
      "color": "blue",
      "target": 1,
      "streak": 5,
      "completedDates": ["2026-01-31", "2026-01-30", ...],
      "isTrashed": false,
      "createdAt": "..."
    }
  ]
}
```

### Get Single Habit
**GET** `/api/habits/:id`
*Requires authentication*

### Create Habit
**POST** `/api/habits`
*Requires authentication*

**Request Body:**
```json
{
  "name": "Morning Exercise",
  "icon": "🏃",
  "category": "Fitness",
  "color": "blue",
  "target": 1
}
```

### Update Habit
**PUT** `/api/habits/:id`
*Requires authentication*

**Request Body:**
```json
{
  "name": "Updated Name",
  "icon": "🎯",
  "category": "Wellness",
  "color": "violet"
}
```

### Toggle Habit Completion
**PATCH** `/api/habits/:id/toggle`
*Requires authentication*

**Request Body:**
```json
{
  "date": "2026-01-31"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Habit marked as complete",
  "data": { ... }
}
```

### Delete Habit (Move to Trash)
**DELETE** `/api/habits/:id`
*Requires authentication*

### Restore Habit from Trash
**PATCH** `/api/habits/:id/restore`
*Requires authentication*

---

## ✅ Task Endpoints

### Get All Tasks
**GET** `/api/tasks`
*Requires authentication*

**Query Parameters:**
- `date` - Filter by date (YYYY-MM-DD)
- `completed` - Filter by completion (true/false)

**Example:** `/api/tasks?date=2026-01-31&completed=false`

### Get Tasks by Date
**GET** `/api/tasks/date/:date`
*Requires authentication*

**Example:** `/api/tasks/date/2026-01-31`

### Get Single Task
**GET** `/api/tasks/:id`
*Requires authentication*

### Create Task
**POST** `/api/tasks`
*Requires authentication*

**Request Body:**
```json
{
  "text": "Complete project proposal",
  "priority": "high",
  "createdDate": "2026-01-31"
}
```

### Update Task
**PUT** `/api/tasks/:id`
*Requires authentication*

**Request Body:**
```json
{
  "text": "Updated task text",
  "priority": "medium",
  "completed": true
}
```

### Toggle Task Completion
**PATCH** `/api/tasks/:id/toggle`
*Requires authentication*

### Delete Task
**DELETE** `/api/tasks/:id`
*Requires authentication*

---

## 🗑️ Trash Endpoints

### Get Trashed Habits
**GET** `/api/trash`
*Requires authentication*

### Permanently Delete Habit
**DELETE** `/api/trash/:id`
*Requires authentication*

### Empty Trash
**DELETE** `/api/trash/empty`
*Requires authentication*

---

## 📊 Statistics Endpoints

### Get Full Statistics
**GET** `/api/stats`
*Requires authentication*

**Response:**
```json
{
  "success": true,
  "data": {
    "totalHabits": 5,
    "habitsCompletedToday": 3,
    "totalCheckIns": 47,
    "bestStreak": 15,
    "averageStreak": 8,
    "totalTasks": 12,
    "completedTasks": 8,
    "pendingTasks": 4,
    "activeDays": 23,
    "categoryBreakdown": {
      "Fitness": 2,
      "Learning": 1,
      "Wellness": 2
    },
    "recentActivity": [
      { "date": "2026-01-31", "completions": 3 },
      ...
    ],
    "topStreaks": [
      {
        "habitId": "...",
        "name": "Morning Exercise",
        "icon": "🏃",
        "streak": 15
      }
    ]
  }
}
```

### Get Dashboard Summary
**GET** `/api/stats/dashboard`
*Requires authentication*

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-01-31",
    "habitsTotal": 5,
    "habitsCompleted": 3,
    "tasksTotal": 8,
    "tasksCompleted": 5,
    "bestStreak": 15,
    "totalCheckIns": 47
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route. Please login."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server Error"
}
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Get Habits (with token)
```bash
curl http://localhost:5000/api/habits \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Habit
```bash
curl -X POST http://localhost:5000/api/habits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"Morning Run","icon":"🏃","category":"Fitness","color":"blue"}'
```

### Toggle Habit
```bash
curl -X PATCH http://localhost:5000/api/habits/HABIT_ID/toggle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"date":"2026-01-31"}'
```

---

## Postman Collection

Import this JSON into Postman for easy testing:
[See Postman documentation for import instructions]

---

## Rate Limiting

- **Window:** 15 minutes
- **Max Requests:** 100 per IP
- **Response when exceeded:**
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```
