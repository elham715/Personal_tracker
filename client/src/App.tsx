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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppLayout: React.FC = () => (
  <AppProvider>
    <div className="min-h-screen">
      <Sidebar />
      <main className="lg:ml-[220px] min-h-screen">
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
      <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
    </Routes>
  </Router>
);

export default App;
