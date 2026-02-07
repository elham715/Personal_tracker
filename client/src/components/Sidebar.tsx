import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '@/config/firebase';
import { Home, CheckSquare, Target, Calendar, Settings, LogOut } from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const tabs = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/habits', icon: Target, label: 'Habits' },
    { path: '/everyday', icon: Calendar, label: 'Calendar' },
    { path: '/habit-manager', icon: Settings, label: 'Manage' },
  ];

  return (
    <>
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
        <div className="p-5 pb-4">
          <h1 className="text-[15px] font-bold text-gray-900 tracking-tight">Habit Tracker</h1>
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
