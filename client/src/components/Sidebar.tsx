import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { auth } from '@/config/firebase';

const Sidebar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const mainNavItems = [
    { path: '/', label: 'Home', emoji: '📊' },
    { path: '/tasks', label: 'Tasks', emoji: '✅' },
    { path: '/habits', label: 'Habits', emoji: '🎯' },
    { path: '/everyday', label: 'Calendar', emoji: '📅' },
  ];

  const secondaryNavItems = [
    { path: '/habit-manager', label: 'Manage', emoji: '⚙️' },
    { path: '/trash', label: 'Trash', emoji: '🗑️' },
  ];

  const allNavItems = [...mainNavItems, ...secondaryNavItems];

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* MOBILE: Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-gray-100 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm">⚡</div>
          <h1 className="text-lg font-bold text-gray-900">Tracker</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -mr-1 rounded-lg hover:bg-gray-100 transition-colors">
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* MOBILE: Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-40 pb-safe">
        <div className="flex items-stretch justify-around h-16 px-1">
          {mainNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} className={`relative flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors ${active ? 'text-purple-600' : 'text-gray-400'}`}>
                <span className={`text-xl transition-transform ${active ? 'scale-110' : ''}`}>{item.emoji}</span>
                <span className={`text-[10px] font-medium ${active ? 'text-purple-600' : 'text-gray-400'}`}>{item.label}</span>
                {active && <div className="absolute top-0 w-8 h-0.5 rounded-full bg-purple-600" />}
              </Link>
            );
          })}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`relative flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors ${isMobileMenuOpen || secondaryNavItems.some(i => isActive(i.path)) ? 'text-purple-600' : 'text-gray-400'}`}>
            <span className="text-lg font-bold tracking-widest">···</span>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* MOBILE: Popup Menu */}
      {isMobileMenuOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="lg:hidden fixed bottom-20 left-3 right-3 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
            <div className="p-2 space-y-0.5">
              {secondaryNavItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <span className="text-xl">{item.emoji}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              <div className="border-t border-gray-100 my-1" />
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                  {auth.currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm text-gray-500 truncate flex-1">{auth.currentUser?.email}</span>
              </div>
              <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-medium">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* DESKTOP: Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-100 z-50 flex-col">
        <div className="flex items-center gap-3 p-6 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xl shadow-lg">⚡</div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">HabitTracker</h1>
            <p className="text-[11px] text-gray-400">Build better habits</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-0.5">
            {allNavItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${active ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <span className="text-xl">{item.emoji}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
              {auth.currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{auth.currentUser?.email?.split('@')[0] || 'User'}</p>
              <p className="text-[11px] text-gray-400 truncate">{auth.currentUser?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-medium">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
