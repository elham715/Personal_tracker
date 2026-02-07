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

  const getIntensityClass = (streak: number, color: string): string => {
    if (streak === 0) return 'bg-gray-100';
    const map: Record<string, string[]> = {
      purple: ['bg-purple-200', 'bg-purple-400', 'bg-purple-500', 'bg-purple-600', 'bg-purple-700'],
      blue: ['bg-blue-200', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700'],
      green: ['bg-green-200', 'bg-green-400', 'bg-green-500', 'bg-green-600', 'bg-green-700'],
      pink: ['bg-pink-200', 'bg-pink-400', 'bg-pink-500', 'bg-pink-600', 'bg-pink-700'],
      orange: ['bg-orange-200', 'bg-orange-400', 'bg-orange-500', 'bg-orange-600', 'bg-orange-700'],
      cyan: ['bg-cyan-200', 'bg-cyan-400', 'bg-cyan-500', 'bg-cyan-600', 'bg-cyan-700'],
    };
    const colors = map[color] || map.purple;
    return colors[Math.min(streak - 1, colors.length - 1)];
  };

  return (
    <div className="page-container max-w-4xl mx-auto animate-fade-in">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-sm text-gray-500 mt-1">Track your daily progress</p>
      </div>

      {habits.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide sticky left-0 bg-white z-10 min-w-[140px]">
                  Habit
                </th>
                {dates.map((date, i) => (
                  <th key={i} className="text-center p-1.5 min-w-[36px]">
                    <div className={`flex flex-col items-center ${isToday(formatDate(date)) ? 'text-purple-600' : 'text-gray-400'}`}>
                      <span className="text-[10px] font-medium">{date.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                      <span className={`text-xs font-semibold mt-0.5 ${isToday(formatDate(date)) ? 'w-6 h-6 flex items-center justify-center rounded-full bg-purple-600 text-white' : ''}`}>
                        {date.getDate()}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.map((habit) => (
                <tr key={habit.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 px-4 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{habit.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 font-medium truncate max-w-[100px]">{habit.name}</p>
                        <p className="text-[10px] text-orange-500 font-medium">🔥 {habit.streak}</p>
                      </div>
                    </div>
                  </td>
                  {dates.map((date, i) => {
                    const dateKey = formatDate(date);
                    const done = habit.completedDates.includes(dateKey);
                    const streak = getStreak(habit, date);
                    const future = isFuture(dateKey);
                    const todayCell = isToday(dateKey);
                    return (
                      <td key={i} className="p-1">
                        <button
                          onClick={() => !future && toggleHabitDate(habit.id, dateKey)}
                          disabled={future}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:cursor-not-allowed disabled:opacity-30 ${
                            future ? 'bg-gray-50' : getIntensityClass(streak, habit.color)
                          } ${todayCell && !future ? 'ring-2 ring-purple-400 ring-offset-1' : ''}`}
                        >
                          {done && <Check size={12} className="text-white" strokeWidth={3} />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-center gap-4 text-[11px] text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gray-100" /> Not done
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-3 rounded-l bg-purple-200" />
              <div className="w-2 h-3 bg-purple-400" />
              <div className="w-2 h-3 rounded-r bg-purple-600" />
              <span className="ml-1">Streak</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-3">🌱</div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Habits Yet</h3>
          <p className="text-sm text-gray-500 mb-4">Create habits to start tracking</p>
          <a href="/habit-manager" className="btn-primary inline-block text-sm py-2.5 px-5">Create Habit</a>
        </div>
      )}
    </div>
  );
};

export default Everyday;
