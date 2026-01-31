import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { auth } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/pages/Dashboard';
import TaskManager from '@/pages/TaskManager';
import Everyday from '@/pages/Everyday';
import Habits from '@/pages/Habits';
import HabitManager from '@/pages/HabitManager';
import Trash from '@/pages/Trash';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

// Protected Route wrapper with Firebase auth
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppProvider>
                <div className="min-h-screen bg-artifacts">
                  <Sidebar />
                  <main className="min-h-screen lg:ml-64 pt-16 lg:pt-0">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/tasks" element={<TaskManager />} />
                      <Route path="/everyday" element={<Everyday />} />
                      <Route path="/habits" element={<Habits />} />
                      <Route path="/habit-manager" element={<HabitManager />} />
                      <Route path="/trash" element={<Trash />} />
                    </Routes>
                  </main>
                </div>
              </AppProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
