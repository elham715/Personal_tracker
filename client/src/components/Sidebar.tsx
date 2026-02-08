import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '@/config/firebase';
import { useApp } from '@/context/AppContext';
import { Home, CheckSquare, Target, Brain, Wallet, LogOut, Cloud, CloudOff, RefreshCw, AlertCircle, Bell } from 'lucide-react';

const SyncBadge: React.FC<{ status: string; pending: number; onSync: () => void }> = ({ status, pending, onSync }) => {
  if (status === 'idle' && pending === 0) return <Cloud size={14} className="text-green-500" />;
  if (status === 'offline') return <CloudOff size={14} className="text-gray-400" />;
  if (status === 'syncing') return <RefreshCw size={14} className="text-indigo-500 animate-spin" />;
  if (status === 'error') return (
    <button onClick={onSync}><AlertCircle size={14} className="text-amber-500" /></button>
  );
  // pending > 0
  return (
    <button onClick={onSync} className="flex items-center gap-0.5">
      <Cloud size={14} className="text-amber-500" />
      <span className="text-[9px] font-bold text-amber-600">{pending}</span>
    </button>
  );
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { syncStatus, pendingChanges, forceSync } = useApp();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    setShowMobileMenu(false);
    await auth.signOut();
    navigate('/login');
  };

  const tabs = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/habits', icon: Target, label: 'Habits' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/memory', icon: Brain, label: 'Memory' },
    { path: '/money', icon: Wallet, label: 'Money' },
  ];

  return (
    <>
      {/* ── MOBILE: Top Header Bar with user/logout ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/60 pt-safe">
        <div className="flex items-center justify-between h-11 px-4">
          <div className="flex items-center gap-1.5">
            <h1 className="text-[15px] font-bold text-gray-900 tracking-tight">Habit Tracker</h1>
            <SyncBadge status={syncStatus} pending={pendingChanges} onSync={forceSync} />
          </div>
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <Link to="/" className="relative p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
              <Bell size={18} className="text-gray-600" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </Link>
            <div className="relative">
              <button onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-50 active:bg-indigo-100 transition-colors">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                {auth.currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>
            {showMobileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-gray-200/80 w-48 overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <p className="text-[12px] font-medium text-gray-900 truncate">{auth.currentUser?.email?.split('@')[0]}</p>
                    <p className="text-[10px] text-gray-400 truncate">{auth.currentUser?.email}</p>
                  </div>
                  <button onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors">
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      </header>

      {/* ── MOBILE: Bottom Tab Bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200/60 pb-safe">
        <div className="grid grid-cols-5 h-[52px]">
          {tabs.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <Link key={path} to={path}
                className="flex flex-col items-center justify-center gap-[2px]">
                <Icon size={20} strokeWidth={active ? 2.2 : 1.5}
                  className={active ? 'text-indigo-600' : 'text-gray-400'} />
                <span className={`text-[9px] font-medium ${active ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── DESKTOP: Left Sidebar ── */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-[220px] bg-white border-r border-gray-200/60 z-50 flex-col">
        <div className="p-5 pb-4 flex items-center gap-2">
          <h1 className="text-[15px] font-bold text-gray-900 tracking-tight">Habit Tracker</h1>
          <SyncBadge status={syncStatus} pending={pendingChanges} onSync={forceSync} />
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {tabs.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <Link key={path} to={path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <Icon size={17} strokeWidth={active ? 2 : 1.5} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-bold text-indigo-700">
              {auth.currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="text-[12px] text-gray-500 truncate">{auth.currentUser?.email?.split('@')[0]}</span>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-red-500 hover:bg-red-50 w-full transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
