import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/utils/helpers';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Habits: React.FC = () => {
  const { habits, toggleHabitDate } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const today = formatDate();

  return (
    <div className="page-container max-w-lg mx-auto">
      <div className="flex items-center justify-between pt-4 mb-4 animate-fade-up">
        <h1 className="text-[22px] font-bold text-gray-900">Habits</h1>
        <Link to="/habit-manager" className="text-[13px] text-indigo-600 font-medium">+ New</Link>
      </div>

      {habits.length > 0 ? (
        <div className="space-y-2 stagger">
          {habits.map(habit => {
            const done = habit.completedDates.includes(today);
            const open = expandedId === habit.id;

            return (
              <div key={habit.id} className="bg-white rounded-xl overflow-hidden animate-fade-up">
                <div className="flex items-center gap-3 p-3.5">
                  {/* Toggle */}
                  <button onClick={() => toggleHabitDate(habit.id, today)} className="flex-shrink-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      done ? 'bg-indigo-600' : 'bg-gray-100'
                    }`}>
                      {done ? <Check size={16} className="text-white" strokeWidth={3} /> : <span className="text-base">{habit.icon}</span>}
                    </div>
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-gray-900 truncate">{habit.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-400">{habit.category}</span>
                      {(habit.streak || 0) > 0 && <span className="text-[11px] text-orange-500 font-medium">{habit.streak}d streak</span>}
                    </div>
                  </div>

                  <button onClick={() => setExpandedId(open ? null : habit.id)} className="p-1">
                    {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>
                </div>

                {open && (
                  <div className="px-3.5 pb-3.5 pt-0 border-t border-gray-50 animate-scale-in">
                    <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
                      {[
                        { v: habit.streak, l: 'Streak' },
                        { v: habit.completedDates.length, l: 'Total' },
                        { v: habit.target, l: 'Goal' },
                      ].map(s => (
                        <div key={s.l} className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-[16px] font-bold text-gray-900">{s.v}</p>
                          <p className="text-[10px] text-gray-400">{s.l}</p>
                        </div>
                      ))}
                    </div>

                    {habit.completedDates.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {habit.completedDates.slice(-5).reverse().map((d, i) => (
                          <span key={i} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                            {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        ))}
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>7-day</span>
                        <span>{Math.round((habit.completedDates.filter(d => {
                          const dt = new Date(d); const wa = new Date(); wa.setDate(wa.getDate() - 7);
                          return dt >= wa;
                        }).length / 7) * 100)}%</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{
                          width: `${Math.min((habit.completedDates.filter(d => {
                            const dt = new Date(d); const wa = new Date(); wa.setDate(wa.getDate() - 7);
                            return dt >= wa;
                          }).length / 7) * 100, 100)}%`
                        }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center animate-fade-up">
          <p className="text-3xl mb-2">🎯</p>
          <p className="text-[14px] font-semibold text-gray-900 mb-1">No habits yet</p>
          <Link to="/habit-manager" className="inline-block text-[13px] bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg mt-3">
            Create Habit
          </Link>
        </div>
      )}
    </div>
  );
};

export default Habits;
