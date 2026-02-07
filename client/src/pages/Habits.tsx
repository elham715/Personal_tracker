import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/utils/helpers';
import { getColorClasses } from '@/utils/constants';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Habits: React.FC = () => {
  const { habits, toggleHabitDate } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const today = formatDate();

  return (
    <div className="page-container max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Habits</h1>
        <Link to="/habit-manager" className="text-sm text-purple-600 font-medium hover:text-purple-700">+ New</Link>
      </div>

      {habits.length > 0 ? (
        <div className="space-y-3">
          {habits.map((habit) => {
            const done = habit.completedDates.includes(today);
            const isExpanded = expandedId === habit.id;

            return (
              <div key={habit.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Main row */}
                <div className="flex items-center gap-3 p-4">
                  <button onClick={() => toggleHabitDate(habit.id, today)} className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      done ? 'bg-purple-600 shadow-md' : 'bg-gray-100 hover:bg-purple-100'
                    }`}>
                      {done ? <Check size={20} className="text-white" strokeWidth={3} /> : <span className="text-xl">{habit.icon}</span>}
                    </div>
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-gray-900 truncate">{habit.name}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500">{habit.category}</span>
                      {habit.streak > 0 && <span className="text-xs text-orange-600 font-medium">🔥 {habit.streak}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400">{habit.completedDates.length}d</span>
                    <button onClick={() => setExpandedId(isExpanded ? null : habit.id)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-50">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mt-3 mb-3">
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <div className="text-lg font-bold text-gray-900">{habit.streak}</div>
                        <div className="text-[10px] text-gray-500">Streak 🔥</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <div className="text-lg font-bold text-gray-900">{habit.completedDates.length}</div>
                        <div className="text-[10px] text-gray-500">Total Days</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <div className="text-lg font-bold text-gray-900">{habit.target}</div>
                        <div className="text-[10px] text-gray-500">Daily Goal</div>
                      </div>
                    </div>

                    {/* Recent activity */}
                    {habit.completedDates.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 mb-2">Recent</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {habit.completedDates.slice(-7).reverse().map((date, i) => (
                            <span key={i} className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Completion bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                        <span>7-day completion</span>
                        <span>
                          {Math.round((habit.completedDates.filter(d => {
                            const date = new Date(d);
                            const weekAgo = new Date();
                            weekAgo.setDate(weekAgo.getDate() - 7);
                            return date >= weekAgo;
                          }).length / 7) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min((habit.completedDates.filter(d => {
                              const date = new Date(d);
                              const weekAgo = new Date();
                              weekAgo.setDate(weekAgo.getDate() - 7);
                              return date >= weekAgo;
                            }).length / 7) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Habits Yet</h3>
          <p className="text-sm text-gray-500 mb-4">Start building better habits!</p>
          <Link to="/habit-manager" className="btn-primary inline-block text-sm py-2.5 px-5">Create Habit</Link>
        </div>
      )}
    </div>
  );
};

export default Habits;
