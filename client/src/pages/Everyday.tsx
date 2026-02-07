import React from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate, getDatesRange, isFuture, isToday } from '@/utils/helpers';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

/* ── Color map: habit.color → Tailwind classes for streak intensity ── */
const COLOR_INTENSITY: Record<string, string[]> = {
  purple: ['bg-gray-100', 'bg-purple-200', 'bg-purple-400', 'bg-purple-500', 'bg-purple-600'],
  blue:   ['bg-gray-100', 'bg-blue-200',   'bg-blue-400',   'bg-blue-500',   'bg-blue-600'],
  green:  ['bg-gray-100', 'bg-green-200',  'bg-green-400',  'bg-green-500',  'bg-green-600'],
  pink:   ['bg-gray-100', 'bg-pink-200',   'bg-pink-400',   'bg-pink-500',   'bg-pink-600'],
  orange: ['bg-gray-100', 'bg-orange-200', 'bg-orange-400', 'bg-orange-500', 'bg-orange-600'],
  cyan:   ['bg-gray-100', 'bg-cyan-200',   'bg-cyan-400',   'bg-cyan-500',   'bg-cyan-600'],
};

const RING_MAP: Record<string, string> = {
  purple: 'ring-purple-400', blue: 'ring-blue-400', green: 'ring-green-400',
  pink: 'ring-pink-400', orange: 'ring-orange-400', cyan: 'ring-cyan-400',
};

const Everyday: React.FC = () => {
  const { habits, toggleHabitDate } = useApp();
  const dates = getDatesRange(14);

  const getStreak = (habit: any, date: Date): number => {
    const key = formatDate(date);
    if (!habit.completedDates.includes(key)) return 0;
    let s = 1;
    const d = new Date(date);
    for (let i = 1; i <= 30; i++) {
      d.setDate(d.getDate() - 1);
      if (habit.completedDates.includes(formatDate(d))) s++;
      else break;
    }
    return s;
  };

  const intensity = (streak: number, color: string): string => {
    const levels = COLOR_INTENSITY[color] || COLOR_INTENSITY.purple;
    if (streak === 0) return levels[0];
    if (streak <= 1) return levels[1];
    if (streak <= 3) return levels[2];
    if (streak <= 5) return levels[3];
    return levels[4];
  };

  return (
    <div className="page-container max-w-4xl mx-auto">
      <div className="flex items-center justify-between pt-4 mb-4 animate-fade-up">
        <h1 className="text-[22px] font-bold text-gray-900">Calendar</h1>
      </div>

      {habits.length > 0 ? (
        <div className="bg-white rounded-2xl overflow-x-auto animate-fade-up" style={{ animationDelay: '60ms' }}>
          <table className="w-full min-w-[560px]">
            <thead>
              <tr>
                <th className="text-left py-2.5 px-3 text-[11px] font-medium text-gray-400 uppercase tracking-wide sticky left-0 bg-white z-10 w-[120px]">
                  Habit
                </th>
                {dates.map((date, i) => {
                  const t = isToday(formatDate(date));
                  return (
                    <th key={i} className="p-1 text-center">
                      <span className={`text-[10px] font-medium block ${t ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                      </span>
                      <span className={`text-[11px] font-semibold inline-flex items-center justify-center ${
                        t ? 'w-5 h-5 rounded-full bg-indigo-600 text-white' : 'text-gray-600'
                      }`}>
                        {date.getDate()}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {habits.map(habit => {
                const hColor = habit.color || 'purple';
                const ringClass = RING_MAP[hColor] || RING_MAP.purple;
                return (
                  <tr key={habit.id} className="border-t border-gray-50">
                    <td className="py-2 px-3 sticky left-0 bg-white z-10">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{habit.icon}</span>
                        <span className="text-[12px] text-gray-800 font-medium truncate max-w-[80px]">{habit.name}</span>
                      </div>
                    </td>
                    {dates.map((date, i) => {
                      const key = formatDate(date);
                      const done = habit.completedDates.includes(key);
                      const streak = getStreak(habit, date);
                      const future = isFuture(key);
                      const t = isToday(key);
                      return (
                        <td key={i} className="p-0.5 text-center">
                          <button onClick={() => !future && toggleHabitDate(habit.id, key)}
                            disabled={future}
                            className={`w-7 h-7 rounded-md flex items-center justify-center mx-auto transition-all ${
                              future ? 'bg-gray-50 cursor-default' : intensity(streak, hColor)
                            } ${t && !future ? `ring-1.5 ${ringClass} ring-offset-1` : ''}`}>
                            {done && <Check size={11} className="text-white" strokeWidth={3} />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center animate-fade-up">
          <p className="text-3xl mb-2">📅</p>
          <p className="text-[14px] font-semibold text-gray-900 mb-1">No habits to track</p>
          <Link to="/habit-manager" className="inline-block text-[13px] bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg mt-3">
            Create Habit
          </Link>
        </div>
      )}
    </div>
  );
};

export default Everyday;
