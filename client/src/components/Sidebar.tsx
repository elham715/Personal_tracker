import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Calendar, Target, Settings, Trash2, LogOut, Menu, X } from 'lucide-react';
import { auth } from '@/config/firebase';

const Sidebar: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', emoji: '📊' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks', emoji: '✅' },
    { path: '/everyday', icon: Calendar, label: 'Calendar', emoji: '📅' },
    { path: '/habits', icon: Target, label: 'Habits', emoji: '🎯' },
    { path: '/habit-manager', icon: Settings, label: 'Settings', emoji: '⚙️' },
    { path: '/trash', icon: Trash2, label: 'Trash', emoji: '🗑️' },
  ];

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xl">
            ⚡
          </div>
          <h1 className="text-xl font-bold text-gray-900">HabitTracker</h1>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 mt-16"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:w-64
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'}
          ${isMobileOpen ? 'mt-16 h-[calc(100vh-4rem)]' : 'lg:mt-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Desktop Logo */}
          <div className="hidden lg:flex items-center gap-3 p-6 border-b border-gray-200">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl shadow-lg">
              ⚡
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">HabitTracker</h1>
              <p className="text-xs text-gray-500">Build better habits</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                      active
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="font-medium">{item.label}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                {auth.currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {auth.currentUser?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{auth.currentUser?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
