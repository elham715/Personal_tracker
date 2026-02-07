import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { AppProvider } from '@/context/AppContext';

import Sidebar from '@/components/Sidebar';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import TaskManager from '@/pages/TaskManager';
import Habits from '@/pages/Habits';
import Everyday from '@/pages/Everyday';
import HabitManager from '@/pages/HabitManager';
import Trash from '@/pages/Trash';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppLayout: React.FC = () => (
  <AppProvider>
    <div className="min-h-screen bg-gray-50">
      <div className="bg-artifacts" />
      <Sidebar />
      {/* Main content: offset for desktop sidebar + mobile bottom nav padding */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskManager />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/everyday" element={<Everyday />} />
          <Route path="/habit-manager" element={<HabitManager />} />
          <Route path="/trash" element={<Trash />} />
        </Routes>
      </main>
    </div>
  </AppProvider>
);

const App: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  </Router>
);

export default App;
