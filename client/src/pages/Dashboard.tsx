import React from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate, getGreeting, getDatesRange } from '@/utils/helpers';
import { Flame, CheckCircle2, BarChart3, Plus } from 'lucide-react';

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

  const completionPercentage = stats.totalHabits > 0 
    ? Math.round((stats.completedToday / stats.totalHabits) * 100) 
    : 0;

  // Get last 7 days for weekly progress
  const last7Days = getDatesRange(7).reverse();
  const weeklyProgress = last7Days.map(date => {
    const dateStr = formatDate(date);
    const completed = habits.filter(h => h.completedDates?.includes(dateStr)).length;
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      completed,
      total: stats.totalHabits,
      percentage: stats.totalHabits > 0 ? (completed / stats.totalHabits) * 100 : 0
    };
  });

  // Get last 35 days for heatmap (5 weeks)
  const heatmapDays = getDatesRange(35).reverse();
  const heatmapData = heatmapDays.map(date => {
    const dateStr = formatDate(date);
    const completed = habits.filter(h => h.completedDates.includes(dateStr)).length;
    return {
      date: dateStr,
      intensity: stats.totalHabits > 0 ? Math.round((completed / stats.totalHabits) * 4) : 0
    };
  });

  const motivationalQuotes = [
    "The secret of getting ahead is getting started.",
    "Every day is a new beginning.",
    "Small daily improvements are the key to staggering long-term results.",
    "Success is the sum of small efforts repeated day in and day out.",
    "Don't watch the clock; do what it does. Keep going."
  ];

  const quote = motivationalQuotes[new Date().getDate() % motivationalQuotes.length];

  return (
    <div className="page-container animate-fade-in">
      {/* Quote Card */}
      <div className="glass-card p-6 mb-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <p className="text-xl text-gray-800 italic leading-relaxed text-center">
          "Every day it gets a little easier. But you gotta do it every day—that's the hard part. But it does get easier."
        </p>
      </div>

      {/* Today's Progress Bar */}
      <div className="glass-card p-4 mb-6 bg-gradient-to-br from-purple-600 to-pink-600">
        <h2 className="text-lg font-bold text-white mb-3">Today's Progress</h2>
        
        {/* Linear Progress Bar */}
        <div className="relative w-full h-2 bg-white/20 rounded-full overflow-hidden mb-2">
          <div 
            className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-white">
          <span className="text-xl font-bold">{completionPercentage}%</span>
          <span className="text-xs text-white/90">{stats.completedToday} of {stats.totalHabits} habits done</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-600 mb-1">Best Streak</div>
              <div className="text-2xl font-bold text-gray-900">{stats.bestStreak} days</div>
              <p className="text-xs text-gray-500 mt-1">Your longest consecutive habit completion</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Flame className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Habits with Weekly View */}
      {habits.length > 0 && (
        <div className="space-y-6">
          {habits.map((habit) => {
            const weekDays = getDatesRange(7);
            const weeklyData = weekDays.map(date => {
              const dateStr = formatDate(date);
              return {
                date: dateStr,
                completed: habit.completedDates.includes(dateStr),
                day: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)
              };
            });
            const weekCompleted = weeklyData.filter(d => d.completed).length;
            const weekPercentage = (weekCompleted / 7) * 100;

            return (
              <div key={habit.id} className="glass-card p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-${habit.color}-500 to-${habit.color}-600 flex items-center justify-center text-3xl`}>
                      {habit.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{habit.name}</h3>
                      <p className="text-gray-600">{weekCompleted}/7 this week</p>
                    </div>
                  </div>
                  <button className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-purple-100 flex items-center justify-center transition-colors">
                    <Plus className="text-gray-700" size={24} />
                  </button>
                </div>

                {/* Week Calendar */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {weeklyData.map((day, index) => {
                    const isFutureDate = new Date(day.date) > new Date(formatDate());
                    return (
                      <div key={index} className="text-center">
                        <div className="text-xs text-gray-500 mb-1">{day.day}</div>
                        <button
                          onClick={() => !isFutureDate && toggleHabitDate(habit.id, day.date)}
                          disabled={isFutureDate}
                          className={`w-full aspect-square rounded-xl transition-all ${
                            isFutureDate 
                              ? 'bg-gray-100 cursor-not-allowed opacity-40'
                              : day.completed 
                                ? `bg-gradient-to-br from-${habit.color}-500 to-${habit.color}-600 shadow-md hover:scale-110`
                                : 'bg-gray-200 hover:bg-gray-300 hover:scale-105'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r from-${habit.color}-500 to-${habit.color}-600 transition-all duration-500`}
                    style={{ width: `${weekPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {habits.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4 animate-float">🌱</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Habits Yet</h3>
          <p className="text-gray-600 mb-6">
            Start building better habits today!
          </p>
          <a
            href="/habit-manager"
            className="btn-primary"
          >
            Create Your First Habit
          </a>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
