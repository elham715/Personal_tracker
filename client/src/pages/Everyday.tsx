import React from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate, getDatesRange, isFuture, isToday } from '@/utils/helpers';
import { Check } from 'lucide-react';

const Everyday: React.FC = () => {
  const { habits, toggleHabitDate } = useApp();
  const dates = getDatesRange(14);
  
  const getStreak = (habit: any, date: Date): number => {
    const dateKey = formatDate(date);
    if (!habit.completedDates.includes(dateKey)) return 0;
    
    let streak = 1;
    const d = new Date(date);
    for (let i = 1; i <= 30; i++) {
      d.setDate(d.getDate() - 1);
      if (habit.completedDates.includes(formatDate(d))) streak++;
      else break;
    }
    return streak;
  };

  const getIntensityClass = (streak: number, colorName: string): string => {
    if (streak === 0) return 'bg-gray-100 border border-gray-300';
    
    const colorClasses: Record<string, string[]> = {
      purple: ['bg-purple-100', 'bg-purple-300', 'bg-purple-500', 'bg-purple-600', 'bg-purple-700'],
      blue: ['bg-blue-100', 'bg-blue-300', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700'],
      green: ['bg-green-100', 'bg-green-300', 'bg-green-500', 'bg-green-600', 'bg-green-700'],
      pink: ['bg-pink-100', 'bg-pink-300', 'bg-pink-500', 'bg-pink-600', 'bg-pink-700'],
      orange: ['bg-orange-100', 'bg-orange-300', 'bg-orange-500', 'bg-orange-600', 'bg-orange-700'],
      cyan: ['bg-cyan-100', 'bg-cyan-300', 'bg-cyan-500', 'bg-cyan-600', 'bg-cyan-700'],
    };

    const colors = colorClasses[colorName] || colorClasses.purple;
    return colors[Math.min(streak - 1, colors.length - 1)];
  };

  const handleCellClick = (habitId: string, date: Date) => {
    if (isFuture(formatDate(date))) return;
    toggleHabitDate(habitId, formatDate(date));
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title">📅 Everyday</h1>
        <p className="text-gray-600">
          Track your daily progress across all habits
        </p>
      </div>

      {/* Heatmap */}
      {habits.length > 0 ? (
        <div className="glass-card p-6 overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 text-gray-700 font-semibold sticky left-0 bg-white z-20 min-w-[180px] border-r border-gray-200">
                  Habit
                </th>
                {dates.map((date, i) => (
                  <th key={i} className="text-center p-2 min-w-[48px]">
                    <div className={`flex flex-col items-center ${isToday(formatDate(date)) ? 'text-purple-600' : 'text-gray-600'}`}>
                      <span className="text-xs font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}</span>
                      <span className={`text-sm font-semibold ${isToday(formatDate(date)) ? 'w-7 h-7 flex items-center justify-center rounded-full bg-purple-600 text-white' : ''}`}>
                        {date.getDate()}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.map((habit) => (
                <tr key={habit.id} className="border-t border-gray-200 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 sticky left-0 bg-white z-10 border-r border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{habit.icon}</span>
                      <div className="min-w-0">
                        <p className="text-gray-900 font-medium truncate max-w-[120px]">{habit.name}</p>
                        <div className="text-xs text-orange-600 font-medium">🔥 {habit.streak}</div>
                      </div>
                    </div>
                  </td>
                  {dates.map((date, i) => {
                    const dateKey = formatDate(date);
                    const isComplete = habit.completedDates.includes(dateKey);
                    const streak = getStreak(habit, date);
                    const future = isFuture(dateKey);
                    const todayCell = isToday(dateKey);

                    return (
                      <td key={i} className="p-1">
                        <button
                          onClick={() => handleCellClick(habit.id, date)}
                          disabled={future}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40 ${
                            future ? 'bg-gray-100' : getIntensityClass(streak, habit.color)
                          } ${todayCell && !future ? 'ring-2 ring-purple-500' : ''}`}
                        >
                          {isComplete && (
                            <Check size={16} className="text-white" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div>
              <span>Not done</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-3 h-4 rounded-l bg-purple-200"></div>
                <div className="w-3 h-4 bg-purple-400"></div>
                <div className="w-3 h-4 rounded-r bg-purple-600"></div>
              </div>
              <span>Intensity</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4 animate-float">🌱</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Habits Yet</h3>
          <p className="text-gray-600 mb-6">Create habits to start tracking your progress</p>
          <a href="/habit-manager" className="btn-primary">
            Create Habit
          </a>
        </div>
      )}
    </div>
  );
};

export default Everyday;
