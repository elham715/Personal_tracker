import React from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate, getDatesRange } from '@/utils/helpers';
import { Check, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProgressRing: React.FC<{ pct: number; size?: number }> = ({ pct, size = 100 }) => {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="block">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#6366f1" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="progress-ring-circle" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        className="fill-gray-900 text-xl font-bold" style={{ fontSize: '22px' }}>
        {pct}%
      </text>
    </svg>
  );
};

const Dashboard: React.FC = () => {
  const { habits, tasks, toggleHabitDate } = useApp();
  const today = formatDate();
  const todayTasks = tasks.filter(t => t.date === today);

  const completedToday = habits.filter(h => h.completedDates?.includes(today)).length;
  const totalHabits = habits.length;
  const pct = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
  const totalCheckins = habits.reduce((sum, h) => sum + (h.completedDates?.length || 0), 0);
  const tasksCompleted = todayTasks.filter(t => t.completed).length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page-container max-w-lg mx-auto">
      {/* Greeting */}
      <div className="pt-4 mb-6 animate-fade-up">
        <p className="text-[13px] text-gray-400 font-medium">{greeting()}</p>
        <h1 className="text-[22px] font-bold text-gray-900 -mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </h1>
      </div>

      {/* Progress + Stats */}
      <div className="flex items-center gap-5 bg-white rounded-2xl p-5 mb-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <ProgressRing pct={pct} />
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Today</p>
            <p className="text-[15px] font-semibold text-gray-900">{completedToday}/{totalHabits} habits</p>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-[18px] font-bold text-gray-900">{bestStreak}</p>
              <p className="text-[10px] text-gray-400">Best streak</p>
            </div>
            <div>
              <p className="text-[18px] font-bold text-gray-900">{totalCheckins}</p>
              <p className="text-[10px] text-gray-400">Check-ins</p>
            </div>
            <div>
              <p className="text-[18px] font-bold text-gray-900">{tasksCompleted}</p>
              <p className="text-[10px] text-gray-400">Tasks done</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Habits */}
      {habits.length > 0 ? (
        <div className="mb-4 animate-fade-up" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Today's Habits</h2>
            <Link to="/habits" className="text-[12px] text-indigo-600 font-medium flex items-center gap-0.5">
              All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-1.5 stagger">
            {habits.map(habit => {
              const done = habit.completedDates?.includes(today);
              return (
                <button key={habit.id} onClick={() => toggleHabitDate(habit.id, today)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-[0.98] animate-fade-up ${
                    done ? 'bg-indigo-50' : 'bg-white'
                  }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                    done ? 'bg-indigo-600 shadow-sm' : 'bg-gray-100'
                  }`}>
                    {done ? <Check size={16} className="text-white" strokeWidth={3} /> : <span className="text-base">{habit.icon}</span>}
                  </div>
                  <span className={`flex-1 text-left text-[14px] font-medium ${done ? 'text-indigo-700' : 'text-gray-800'}`}>
                    {habit.name}
                  </span>
                  {(habit.streak || 0) > 0 && (
                    <span className="text-[11px] text-orange-500 font-semibold">{habit.streak}d</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center mb-4 animate-fade-up" style={{ animationDelay: '120ms' }}>
          <p className="text-3xl mb-2">🌱</p>
          <p className="text-[14px] font-semibold text-gray-900 mb-1">No habits yet</p>
          <p className="text-[12px] text-gray-400 mb-4">Start building better habits</p>
          <Link to="/habit-manager"
            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-[13px] font-medium px-4 py-2 rounded-lg">
            <Plus size={15} /> Create Habit
          </Link>
        </div>
      )}

      {/* Weekly Overview */}
      {habits.length > 0 && (
        <div className="bg-white rounded-2xl p-4 animate-fade-up" style={{ animationDelay: '180ms' }}>
          <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider mb-3">This Week</h2>
          <div className="space-y-2.5">
            {habits.slice(0, 4).map(habit => {
              const weekDays = getDatesRange(7);
              return (
                <div key={habit.id} className="flex items-center gap-2.5">
                  <span className="text-sm w-6 text-center flex-shrink-0">{habit.icon}</span>
                  <span className="text-[12px] text-gray-600 w-16 truncate flex-shrink-0">{habit.name}</span>
                  <div className="flex gap-1 flex-1 justify-end">
                    {weekDays.map((date, i) => {
                      const d = formatDate(date);
                      const done = habit.completedDates?.includes(d);
                      const future = date > new Date();
                      return (
                        <div key={i} className={`w-6 h-6 rounded-md text-[9px] font-medium flex items-center justify-center ${
                          future ? 'bg-gray-50 text-gray-300' :
                          done ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {done ? '✓' : date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
