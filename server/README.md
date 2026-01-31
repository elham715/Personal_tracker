# Habit Tracker Backend API

Professional REST API for the Personal Dashboard Habit Tracker application.

## Tech Stack
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Features
✅ User authentication & authorization
✅ Habit CRUD operations
✅ Daily task management
✅ Habit completion tracking
✅ Streak calculation
✅ Trash/restore functionality
✅ User statistics
✅ Rate limiting & security

## Installation

1. Install dependencies:
```bash
cd server
npm install
```

2. Setup environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Install MongoDB:
- **Local**: Install MongoDB Community Edition
- **Cloud**: Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

4. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Habits
- `GET /api/habits` - Get all user habits
- `POST /api/habits` - Create new habit
- `GET /api/habits/:id` - Get single habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Move habit to trash
- `PATCH /api/habits/:id/toggle` - Toggle habit completion for a date
- `PATCH /api/habits/:id/restore` - Restore from trash

### Tasks
- `GET /api/tasks` - Get all user tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/date/:date` - Get tasks for specific date
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/toggle` - Toggle task completion

### Trash
- `GET /api/trash` - Get all trashed habits
- `DELETE /api/trash/:id` - Permanently delete habit
- `DELETE /api/trash/empty` - Empty trash

### Stats
- `GET /api/stats` - Get user statistics

## Project Structure
```
server/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Habit.js             # Habit schema
│   │   └── Task.js              # Task schema
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── habitController.js   # Habit CRUD logic
│   │   ├── taskController.js    # Task CRUD logic
│   │   ├── trashController.js   # Trash management
│   │   └── statsController.js   # Statistics logic
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── errorHandler.js      # Error handling
│   │   └── validators.js        # Request validation
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── habits.js            # Habit routes
│   │   ├── tasks.js             # Task routes
│   │   ├── trash.js             # Trash routes
│   │   └── stats.js             # Stats routes
│   ├── utils/
│   │   ├── calculateStreak.js   # Streak calculation
│   │   └── seed.js              # Database seeding
│   └── server.js                # App entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Environment Variables
See `.env.example` for all required variables.

## Security Features
- JWT authentication
- Password hashing with bcrypt
- Helmet.js for HTTP headers
- CORS configuration
- Rate limiting
- Input validation
- XSS protection

## Testing
Use tools like:
- **Postman** - API testing
- **Thunder Client** (VS Code extension)
- **curl** - Command line

## Deployment
Ready to deploy on:
- **Render**
- **Railway**
- **Heroku**
- **DigitalOcean**
- **AWS EC2**

## License
MIT
