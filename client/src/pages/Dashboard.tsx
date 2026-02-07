import React from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate, getDatesRange } from '@/utils/helpers';
import { Flame, TrendingUp, Check, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { habits, tasks, toggleHabitDate } = useApp();
  const today = formatDate();
  const todayTasks = tasks.filter(t => t.date === today);

  const stats = {
    totalHabits: habits.length,
    completedToday: habits.filter(h => h.completedDates?.includes(today)).length,
    bestStreak: habits.reduce((max, h) => Math.max(max, h.streak || 0), 0),
    totalCheckIns: habits.reduce((sum, h) => sum + (h.completedDates?.length || 0), 0),
    tasksCompleted: todayTasks.filter(t => t.completed).length,
    totalTasks: todayTasks.length,
  };

  const completionPct = stats.totalHabits > 0 ? Math.round((stats.completedToday / stats.totalHabits) * 100) : 0;

  return (
    <div className="page-container max-w-2xl mx-auto animate-fade-in">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Progress Card */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-5 mb-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-white/80">Today's Progress</h2>
          <span className="text-2xl font-bold">{completionPct}%</span>
        </div>
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${completionPct}%` }} />
        </div>
        <p className="text-xs text-white/70">{stats.completedToday} of {stats.totalHabits} habits completed</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <div className="text-xl font-bold text-gray-900">{stats.bestStreak}</div>
          <div className="text-[11px] text-gray-500 flex items-center justify-center gap-1"><Flame size={12} className="text-orange-500" />Best Streak</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <div className="text-xl font-bold text-gray-900">{stats.totalCheckIns}</div>
          <div className="text-[11px] text-gray-500 flex items-center justify-center gap-1"><Check size={12} className="text-green-500" />Check-ins</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <div className="text-xl font-bold text-gray-900">{stats.tasksCompleted}/{stats.totalTasks}</div>
          <div className="text-[11px] text-gray-500 flex items-center justify-center gap-1"><TrendingUp size={12} className="text-blue-500" />Tasks</div>
        </div>
      </div>

      {/* Quick Habits */}
      {habits.length > 0 ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Today's Habits</h2>
            <Link to="/habits" className="text-xs text-purple-600 font-medium">View All</Link>
          </div>
          <div className="space-y-2">
            {habits.map(habit => {
              const done = habit.completedDates?.includes(today);
              return (
                <button
                  key={habit.id}
                  onClick={() => toggleHabitDate(habit.id, today)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    done ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-100 hover:border-purple-200'
                  }`}
                >
                  <span className="text-2xl">{habit.icon}</span>
                  <span className={`flex-1 text-left text-sm font-medium ${done ? 'text-purple-700' : 'text-gray-800'}`}>{habit.name}</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    done ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                  }`}>
                    {done && <Check size={14} className="text-white" strokeWidth={3} />}
                  </div>
                  {habit.streak > 0 && (
                    <span className="text-[11px] text-orange-600 font-medium">🔥{habit.streak}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center mb-6">
          <div className="text-4xl mb-3">🌱</div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Habits Yet</h3>
          <p className="text-sm text-gray-500 mb-4">Start building better habits today!</p>
          <Link to="/habit-manager" className="btn-primary inline-flex items-center gap-2 text-sm py-2.5 px-5">
            <Plus size={16} /> Create Habit
          </Link>
        </div>
      )}

      {/* Weekly Overview */}
      {habits.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">This Week</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 overflow-x-auto">
            {habits.slice(0, 5).map(habit => {
              const weekDays = getDatesRange(7);
              return (
                <div key={habit.id} className="flex items-center gap-2 mb-3 last:mb-0">
                  <span className="text-lg w-8 flex-shrink-0">{habit.icon}</span>
                  <span className="text-xs text-gray-600 w-20 truncate flex-shrink-0">{habit.name}</span>
                  <div className="flex gap-1 flex-1 justify-end">
                    {weekDays.map((date, i) => {
                      const dateStr = formatDate(date);
                      const done = habit.completedDates.includes(dateStr);
                      const isFuture = date > new Date();
                      return (
                        <button
                          key={i}
                          onClick={() => !isFuture && toggleHabitDate(habit.id, dateStr)}
                          disabled={isFuture}
                          className={`w-7 h-7 rounded-lg text-[10px] flex items-center justify-center transition-all ${
                            isFuture ? 'bg-gray-50 text-gray-300' :
                            done ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-purple-100'
                          }`}
                        >
                          {done ? '✓' : date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Motivational Quote */}
      <div className="mt-6 bg-gray-50 rounded-2xl p-5 text-center">
        <p className="text-sm text-gray-600 italic leading-relaxed">
          "Every day it gets a little easier. But you gotta do it every day — that's the hard part."
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
