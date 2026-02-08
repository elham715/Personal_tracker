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
import Memory from '@/pages/Memory';
import Money from '@/pages/Money';

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
      <main className="pt-11 lg:pt-0 lg:ml-[220px] min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskManager />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/memory" element={<Memory />} />
          <Route path="/money" element={<Money />} />
          {/* Legacy redirects */}
          <Route path="/habits/calendar" element={<Navigate to="/habits" replace />} />
          <Route path="/habits/manage" element={<Navigate to="/habits" replace />} />
          <Route path="/everyday" element={<Navigate to="/habits" replace />} />
          <Route path="/habit-manager" element={<Navigate to="/habits" replace />} />
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
