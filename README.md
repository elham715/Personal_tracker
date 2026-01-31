# Personal Dashboard Habit Tracker - Full Stack

A modern habit tracking and task management application with a beautiful circular navigation menu and MongoDB backend.

## 🚀 Features

- **MongoDB Backend**: Full REST API with authentication
- **Beautiful UI**: Minimalistic white theme with circular navigation
- **Habit Tracking**: Track daily habits with streak counting
- **Task Management**: Manage daily tasks with priority levels
- **Calendar View**: Visualize habit completion with heatmaps
- **Analytics**: Dashboard with progress charts and statistics
- **Authentication**: Secure login/register with JWT tokens

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB installed and running locally (or MongoDB Atlas connection string)
- npm or yarn

## 🛠️ Installation

### 1. Clone and Install

```bash
cd "/Users/admin/Downloads/personal-dashboard-habit-tracker 2"
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create `.env` file in `server/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/habit-tracker
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### 3. Frontend Setup

```bash
cd ../client
npm install
```

The `.env` file is already created with:

```env
VITE_API_URL=http://localhost:5000/api
```

## 🎯 Running the Application

### Start MongoDB (if using local MongoDB)

```bash
# macOS (if installed via Homebrew)
brew services start mongodb-community

# Or start manually
mongod
```

### Start Backend Server

```bash
cd server
npm run dev
```

Backend will run on http://localhost:5000

### Start Frontend

In a new terminal:

```bash
cd client
npm run dev
```

Frontend will run on http://localhost:3000 (or next available port)

## 📱 Usage

1. **Register/Login**: 
   - Navigate to http://localhost:3000
   - You'll be redirected to `/login`
   - Click "Sign up" to create an account
   - Or login with existing credentials

2. **Navigate**:
   - Click the **red wave indicator** on the left edge of the screen
   - Circular menu will appear with all navigation options
   - Click any menu item to navigate

3. **Create Habits**:
   - Go to Settings (⚙️)
   - Fill in habit details (name, icon, color, category)
   - Click "Create Habit"

4. **Track Progress**:
   - **Dashboard**: View overall progress, weekly charts, activity heatmap
   - **Tasks**: Check off daily tasks and habits
   - **Calendar**: Visual heatmap of all habit completions
   - **Habits**: Detailed view of each habit with stats

5. **Manage**:
   - **Trash**: View and restore deleted habits
   - **Logout**: Red logout button at bottom of circular menu

## 🗂️ Project Structure

```
personal-dashboard-habit-tracker 2/
├── server/                 # Backend (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API routes
│   │   └── server.js      # Entry point
│   └── package.json
│
├── client/                # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/    # Reusable components (Sidebar, etc.)
│   │   ├── context/       # AppContext (state management with API)
│   │   ├── pages/         # Route pages
│   │   ├── services/      # API service (axios)
│   │   ├── types/         # TypeScript interfaces
│   │   ├── utils/         # Helper functions
│   │   ├── App.tsx        # Main app with routing
│   │   └── main.tsx       # Entry point
│   └── package.json
│
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Habits
- `GET /api/habits` - Get all habits
- `POST /api/habits` - Create habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `POST /api/habits/:id/toggle` - Toggle habit date

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/toggle` - Toggle task completion

## 🎨 Design Features

- **Circular Navigation**: Innovative hidden menu with red wave indicator
- **Glassmorphism**: Modern glass-effect cards
- **Gradient Backgrounds**: Subtle floating gradient artifacts
- **Responsive**: Works on all screen sizes
- **Animations**: Smooth transitions and hover effects

## 📊 Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB & Mongoose
- JWT Authentication
- bcrypt for password hashing

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router
- Lucide Icons
- date-fns

## 🔒 Security

- JWT token-based authentication
- Password hashing with bcrypt
- Protected API routes
- HTTP-only cookies support
- Rate limiting
- Helmet security headers

## 🐛 Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify `.env` file exists with correct values
- Check if port 5000 is available

### Frontend won't connect to backend
- Verify backend is running on port 5000
- Check `.env` file has correct `VITE_API_URL`
- Clear browser cache

### Login/Register not working
- Check browser console for errors
- Verify backend logs for errors
- Ensure MongoDB connection is successful

## 📝 License

MIT

## 🤝 Contributing

Feel free to submit issues and enhancement requests!
