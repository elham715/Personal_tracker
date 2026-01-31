# 🚀 Complete Setup Guide

## Prerequisites

Before starting, ensure you have:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** - Choose one:
  - **Local**: [MongoDB Community Edition](https://www.mongodb.com/try/download/community)
  - **Cloud**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free tier available)
- **npm** or **yarn** package manager

---

## 📦 Installation Steps

### 1. Install Backend Dependencies

```bash
cd server
npm install
```

This installs:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cors` - Cross-origin resource sharing
- `helmet` - Security headers
- `express-validator` - Input validation
- `express-rate-limit` - Rate limiting
- `morgan` - HTTP request logger
- `dotenv` - Environment variables
- `nodemon` - Auto-restart during development

### 2. MongoDB Setup

#### Option A: Local MongoDB

1. Install MongoDB Community Edition
2. Start MongoDB service:

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Windows:**
- MongoDB runs as a Windows service automatically after installation

3. Verify MongoDB is running:
```bash
mongosh
# You should see MongoDB shell prompt
```

#### Option B: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (M0 free tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Update `.env` with your connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/habit-tracker?retryWrites=true&w=majority
```

### 3. Environment Configuration

The `.env` file is already created with default values. Update if needed:

```bash
# Edit server/.env
nano server/.env
```

**Important:** Change `JWT_SECRET` for production!

```env
JWT_SECRET=your-custom-secret-key-make-it-long-and-random
```

### 4. Seed Demo Data (Optional)

Create demo user and sample data:

```bash
cd server
npm run seed
```

This creates:
- Demo user (email: `demo@example.com`, password: `password123`)
- 5 sample habits
- 3 sample tasks
- 1 trashed habit

---

## 🏃 Running the Backend

### Development Mode (with auto-reload)
```bash
cd server
npm run dev
```

### Production Mode
```bash
cd server
npm start
```

You should see:
```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║       🚀 Habit Tracker API Server Running 🚀         ║
║                                                       ║
║       Environment: development                        ║
║       Port: 5000                                      ║
║       URL: http://localhost:5000                      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

✅ MongoDB Connected: localhost
📊 Database: habit-tracker
```

---

## 🧪 Testing the API

### Method 1: cURL (Terminal)

**Health Check:**
```bash
curl http://localhost:5000/health
```

**Register User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Copy the token from the response, then:

**Get Habits:**
```bash
curl http://localhost:5000/api/habits \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Method 2: Postman

1. Install [Postman](https://www.postman.com/downloads/)
2. Create a new request
3. Set method and URL
4. Add headers: `Content-Type: application/json`
5. For protected routes, add: `Authorization: Bearer YOUR_TOKEN`
6. Send request

### Method 3: VS Code Thunder Client Extension

1. Install "Thunder Client" extension in VS Code
2. Create new request
3. Similar to Postman but integrated in VS Code

---

## 🗄️ Database Management

### View Data with MongoDB Compass

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to `mongodb://localhost:27017`
3. Select `habit-tracker` database
4. Browse collections: `users`, `habits`, `tasks`

### View Data with mongosh (MongoDB Shell)

```bash
mongosh

use habit-tracker
db.users.find().pretty()
db.habits.find().pretty()
db.tasks.find().pretty()
```

### Clear All Data

```bash
mongosh

use habit-tracker
db.users.deleteMany({})
db.habits.deleteMany({})
db.tasks.deleteMany({})
```

Then re-run seed:
```bash
npm run seed
```

---

## 🔧 Common Issues & Solutions

### Issue: MongoDB Connection Error

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solutions:**
1. Check if MongoDB is running:
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status mongod
   ```

2. Start MongoDB:
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

3. Verify connection string in `.env`

### Issue: Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solutions:**
1. Change port in `.env`:
   ```env
   PORT=5001
   ```

2. Or kill the process using port 5000:
   ```bash
   # macOS/Linux
   lsof -ti:5000 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

### Issue: JWT Token Invalid

**Error:** `Invalid or expired token`

**Solutions:**
1. Login again to get a fresh token
2. Check token format: `Bearer <token>`
3. Ensure no extra spaces in Authorization header

### Issue: CORS Error

**Error:** `Access to fetch blocked by CORS policy`

**Solutions:**
1. Add frontend URL to `.env`:
   ```env
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

2. Restart the server

---

## 📚 Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── User.js              # User schema & methods
│   │   ├── Habit.js             # Habit schema & methods
│   │   └── Task.js              # Task schema & methods
│   ├── controllers/
│   │   ├── authController.js    # Auth logic (register, login)
│   │   ├── habitController.js   # Habit CRUD operations
│   │   ├── taskController.js    # Task CRUD operations
│   │   ├── trashController.js   # Trash management
│   │   └── statsController.js   # Statistics & analytics
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── errorHandler.js      # Error handling
│   │   └── validators.js        # Input validation
│   ├── routes/
│   │   ├── auth.js              # /api/auth routes
│   │   ├── habits.js            # /api/habits routes
│   │   ├── tasks.js             # /api/tasks routes
│   │   ├── trash.js             # /api/trash routes
│   │   └── stats.js             # /api/stats routes
│   ├── utils/
│   │   ├── calculateStreak.js   # Streak calculation logic
│   │   └── seed.js              # Database seeding
│   └── server.js                # Main entry point
├── .env                         # Environment variables
├── .env.example                 # Example env file
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies & scripts
├── README.md                    # Documentation
├── API_DOCS.md                  # API documentation
└── SETUP.md                     # This file
```

---

## 🔐 Security Best Practices

### For Development:
✅ Current setup is fine

### For Production:

1. **Change JWT Secret:**
   ```env
   JWT_SECRET=$(openssl rand -base64 32)
   ```

2. **Use Strong MongoDB Password:**
   - For Atlas: Use auto-generated password
   - For local: Set up authentication

3. **Enable HTTPS:**
   - Use a reverse proxy (Nginx)
   - Get SSL certificate (Let's Encrypt)

4. **Set NODE_ENV:**
   ```env
   NODE_ENV=production
   ```

5. **Rate Limiting:**
   - Already configured
   - Adjust limits in `.env` if needed

6. **Environment Variables:**
   - Never commit `.env` to git
   - Use environment variables in deployment platform

---

## 🚀 Deployment Options

### Render (Recommended - Free Tier)

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. New → Web Service
4. Connect GitHub repository
5. Configure:
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`
6. Add environment variables from `.env`
7. Deploy

### Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Init: `railway init`
4. Deploy: `railway up`
5. Set environment variables in Railway dashboard

### Heroku

1. Install Heroku CLI
2. `heroku create your-app-name`
3. `heroku config:set MONGODB_URI=your-mongo-uri`
4. `git push heroku main`

### DigitalOcean App Platform

1. Create account
2. Apps → Create App
3. Connect GitHub
4. Configure build settings
5. Add environment variables
6. Deploy

---

## 📊 Monitoring & Logs

### View Logs (Development)
Logs are automatically displayed in the terminal

### View Logs (Production - Render)
1. Go to Render dashboard
2. Select your service
3. Click "Logs" tab

### Database Monitoring
- **Atlas:** Built-in monitoring dashboard
- **Local:** Use MongoDB Compass

---

## 🆘 Getting Help

1. **Check logs** for error messages
2. **Review API_DOCS.md** for endpoint documentation
3. **Test endpoints** with Postman/curl
4. **Check MongoDB connection** with Compass
5. **Verify environment variables** in `.env`

---

## ✅ Next Steps

Now that backend is running:

1. ✅ Test all endpoints with Postman
2. ✅ Review API documentation
3. ✅ Understand the data models
4. ⏭️ Connect frontend to backend (next phase)
5. ⏭️ Add authentication to frontend
6. ⏭️ Replace localStorage with API calls

---

## 🎉 Success!

If you see the server running message, you're all set!

**Default Demo Login:**
- Email: `demo@example.com`
- Password: `password123`

**Test the API:**
```bash
curl http://localhost:5000/health
```

Happy coding! 🚀
