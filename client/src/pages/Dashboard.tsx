import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/utils/helpers';
import { Target, CheckSquare, Brain, Wallet, ArrowRight, Sparkles, Zap, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { memoryAPI } from '@/services/memoryApi';
import { transactionAPI, budgetAPI, savingsAPI } from '@/services/moneyApi';
import { generateNotifications } from '@/services/notificationEngine';
import { AppNotification } from '@/types';

/* ═══════════════════════════════════════════════════════════════════════
   DASHBOARD — Focus Hub
   All systems at a glance. One focused next-action per system.
   ═══════════════════════════════════════════════════════════════════════ */

const Dashboard: React.FC = () => {
  const { habits, tasks, toggleHabitDate } = useApp();
  const today = formatDate();
  const todayTasks = tasks.filter(t => t.date === today);

  // Habit stats
  const completedToday = habits.filter(h => h.completedDates?.includes(today)).length;
  const totalHabits = habits.length;
  const habitPct = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);

  // Task stats
  const tasksCompleted = todayTasks.filter(t => t.completed).length;
  const tasksPending = todayTasks.filter(t => !t.completed).length;
  const highPriorityPending = todayTasks.filter(t => !t.completed && t.priority === 'high');

  // Memory + Money stats (loaded from local DB)
  const [memoryStats, setMemoryStats] = useState({ brainLevel: 0, totalXP: 0, streak: 0, bestStreak: 0, gamesPlayed: 0, trainedToday: false, todayGames: 0, avgAccuracy: 0 });
  const [moneyStats, setMoneyStats] = useState({ income: 0, expenses: 0, net: 0, transactionCount: 0 });
  const [budgetAlerts, setBudgetAlerts] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadExtras = useCallback(async () => {
    try {
      const [mStats, txStats, , bAlerts] = await Promise.all([
        memoryAPI.getStats(),
        transactionAPI.getMonthStats(),
        savingsAPI.getAll(),
        budgetAPI.getAlerts(),
      ]);
      setMemoryStats(mStats);
      setMoneyStats(txStats);
      setBudgetAlerts(bAlerts.filter((b: any) => b.exceeded).length);

      // Generate smart notifications
      const notifs = await generateNotifications(habits, tasks);
      setNotifications(notifs.slice(0, 3)); // show top 3
    } catch (err) {
      console.error('Dashboard extras error:', err);
    }
  }, [habits, tasks]);

  useEffect(() => { loadExtras(); }, [loadExtras]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page-container max-w-lg lg:max-w-5xl mx-auto pb-24">
      {/* Greeting */}
      <div className="pt-4 mb-5 animate-fade-up">
        <p className="text-[13px] lg:text-[14px] text-gray-400 font-medium">{greeting()}</p>
        <h1 className="text-[22px] lg:text-[28px] font-bold text-gray-900 -mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </h1>
      </div>

      {/* ── Smart Nudges ── */}
      {notifications.length > 0 && (
        <div className="space-y-2 mb-5 animate-fade-up" style={{ animationDelay: '40ms' }}>
          {notifications.map((n) => (
            <Link key={n.id} to={n.action || '/'} className="block">
              <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 active:bg-gray-50 transition-colors border border-gray-100/60">
                <span className="text-lg flex-shrink-0">{n.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800">{n.title}</p>
                  <p className="text-[11px] text-gray-400 truncate">{n.message}</p>
                </div>
                <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Habit Completion — full-width row ── */}
      <Link to="/habits" className="block mb-2 animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-3.5 active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Target size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Today's Habits</p>
              <p className="text-white text-lg font-bold leading-tight">{completedToday}/{totalHabits} <span className="text-sm font-medium text-white/50">completed</span></p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {bestStreak > 0 && (
                <span className="text-xs text-white/50 font-medium">🔥 {bestStreak}d</span>
              )}
              {/* Progress ring */}
              <div className="w-10 h-10 relative">
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                  <circle cx="20" cy="20" r="16" fill="none" stroke="white" strokeWidth="3"
                    strokeDasharray={100.5} strokeDashoffset={100.5 - (habitPct / 100) * 100.5}
                    strokeLinecap="round" transform="rotate(-90 20 20)" className="transition-all duration-700" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">{habitPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* ── Tasks · Memory · Money — 3 in a row ── */}
      <div className="grid grid-cols-3 gap-2 mb-3 animate-fade-up" style={{ animationDelay: '120ms' }}>

        {/* TASKS */}
        <Link to="/tasks" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-700 p-3 active:scale-95 transition-transform">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-2">
            <CheckSquare size={18} className="text-white" />
          </div>
          <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Tasks</p>
          <p className="text-white text-base font-bold leading-tight">{tasksCompleted}/{todayTasks.length}</p>
          {tasksPending > 0 && (
            <p className="text-[9px] text-white/40 mt-1">{tasksPending} left</p>
          )}
          {highPriorityPending.length > 0 && (
            <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-400/30 flex items-center justify-center">
              <Zap size={10} className="text-amber-300" />
            </div>
          )}
        </Link>

        {/* MEMORY */}
        <Link to="/memory" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-700 p-3 active:scale-95 transition-transform">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-2">
            <Brain size={18} className="text-white" />
          </div>
          <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Memory</p>
          {memoryStats.gamesPlayed > 0 ? (
            <p className="text-white text-base font-bold leading-tight">Lv.{memoryStats.brainLevel}</p>
          ) : (
            <p className="text-white/60 text-xs font-medium mt-0.5">Train →</p>
          )}
          {memoryStats.gamesPlayed > 0 && (
            <p className="text-[9px] text-white/40 mt-1">{memoryStats.trainedToday ? `${memoryStats.todayGames} today ✓` : 'Not trained'}</p>
          )}
        </Link>

        {/* MONEY */}
        <Link to="/money" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-cyan-600 p-3 active:scale-95 transition-transform">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-2">
            <Wallet size={18} className="text-white" />
          </div>
          <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Money</p>
          {moneyStats.transactionCount > 0 ? (
            <p className="text-white text-base font-bold leading-tight truncate">
              {moneyStats.net >= 0 ? '+' : ''}{moneyStats.net.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
          ) : (
            <p className="text-white/60 text-xs font-medium mt-0.5">Track →</p>
          )}
          {moneyStats.transactionCount > 0 && (
            <div className="text-[9px] text-white/40 mt-1 truncate">
              ↑{moneyStats.income.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </div>
          )}
          {budgetAlerts > 0 && (
            <p className="text-[9px] text-red-300 font-medium mt-1">⚠ {budgetAlerts} over</p>
          )}
        </Link>

      </div>

      {/* ── Today's Habits Quick Toggle ── */}
      {habits.length > 0 && (
        <div className="mt-3 animate-fade-up" style={{ animationDelay: '320ms' }}>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Quick Check-in</h2>
            <Link to="/habits" className="text-[12px] text-indigo-600 font-medium flex items-center gap-0.5">
              All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-6 gap-2">
            {habits.slice(0, 8).map(habit => {
              const done = habit.completedDates?.includes(today);
              return (
                <button key={habit.id} onClick={() => toggleHabitDate(habit.id, today)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-95 ${
                    done ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'bg-white'
                  }`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    done ? 'bg-indigo-600 shadow-sm shadow-indigo-200' : 'bg-gray-100'
                  }`}>
                    {done ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span className="text-base">{habit.icon}</span>
                    )}
                  </div>
                  <span className={`text-[9px] font-medium text-center line-clamp-1 px-0.5 ${done ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {habit.name.length > 8 ? habit.name.slice(0, 8) + '…' : habit.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── The Habit Manual ── */}
      <Link to="/habits" className="block mt-5 animate-fade-up" style={{ animationDelay: '380ms' }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 p-5 shadow-lg shadow-slate-300/30 active:scale-[0.98] transition-transform">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-indigo-500/10" />
          <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full bg-purple-500/10" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BookOpen size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="text-[15px] font-bold text-white">The Habit Manual</h3>
                <Sparkles size={13} className="text-amber-400" />
              </div>
              <p className="text-[11.5px] text-white/50 leading-snug">
                Master the science of Atomic Habits
              </p>
            </div>
            <ArrowRight size={16} className="text-white/30 shrink-0" />
          </div>
        </div>
      </Link>
    </div>
  );
};

export default Dashboard;
