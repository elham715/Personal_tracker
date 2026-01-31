import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/utils/helpers';
import { getColorClasses } from '@/utils/constants';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

const Habits: React.FC = () => {
  const { habits, toggleHabitDate } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const today = formatDate();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleToggleToday = (id: string) => {
    toggleHabitDate(id, today);
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title">🎯 Habits</h1>
        <p className="text-gray-600">
          View and manage all your habits
        </p>
      </div>

      {/* Habits Grid */}
      {habits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {habits.map((habit) => {
            const isCompleteToday = habit.completedDates.includes(today);
            const colorConfig = getColorClasses(habit.color);
            const isExpanded = expandedId === habit.id;

            return (
              <div
                key={habit.id}
                className="glass-card overflow-hidden animate-scale-in"
              >
                {/* Main Card */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-14 rounded-xl ${colorConfig.light}/20 flex items-center justify-center text-3xl`}>
                        {habit.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{habit.name}</h3>
                        <p className="text-sm text-gray-600">{habit.category}</p>
                      </div>
                    </div>
                    
                    {/* Today Toggle */}
                    <button
                      onClick={() => handleToggleToday(habit.id)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                        isCompleteToday
                          ? `bg-gradient-to-r from-green-600 to-emerald-600 shadow-md`
                          : 'border-2 border-gray-300 hover:border-purple-500'
                      }`}
                    >
                      {isCompleteToday && <Check size={24} className="text-white" />}
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{habit.streak}</div>
                      <div className="text-xs text-gray-600">Day Streak 🔥</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{habit.completedDates.length}</div>
                      <div className="text-xs text-gray-600">Total Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{habit.target}</div>
                      <div className="text-xs text-gray-600">Daily Goal</div>
                    </div>
                  </div>

                  {/* Expand Button */}
                  <button
                    onClick={() => toggleExpand(habit.id)}
                    className="w-full flex items-center justify-center gap-2 text-purple-600 hover:text-purple-700 transition-colors py-2 font-medium"
                  >
                    {isExpanded ? (
                      <>
                        <span>Show Less</span>
                        <ChevronUp size={16} />
                      </>
                    ) : (
                      <>
                        <span>View Details</span>
                        <ChevronDown size={16} />
                      </>
                    )}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-0 border-t border-gray-200 animate-slide-in">
                    <div className="mt-4 space-y-4">
                      {/* Recent Activity */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Activity</h4>
                        <div className="flex flex-wrap gap-2">
                          {habit.completedDates
                            .slice(-7)
                            .reverse()
                            .map((date, i) => (
                              <div
                                key={i}
                                className={`px-3 py-1 rounded-lg text-xs bg-${habit.color}-100 text-${habit.color}-700 font-medium`}
                              >
                                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            ))}
                          {habit.completedDates.length === 0 && (
                            <p className="text-sm text-gray-500">No activity yet</p>
                          )}
                        </div>
                      </div>

                      {/* Completion Rate */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Completion Rate (Last 7 Days)
                        </h4>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colorConfig.class}`}
                              style={{
                                width: `${Math.min(
                                  (habit.completedDates.filter(d => {
                                    const date = new Date(d);
                                    const weekAgo = new Date();
                                    weekAgo.setDate(weekAgo.getDate() - 7);
                                    return date >= weekAgo;
                                  }).length / 7) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-900 font-semibold">
                            {Math.round(
                              (habit.completedDates.filter(d => {
                                const date = new Date(d);
                                const weekAgo = new Date();
                                weekAgo.setDate(weekAgo.getDate() - 7);
                                return date >= weekAgo;
                              }).length / 7) * 100
                            )}%
                          </span>
                        </div>
                      </div>

                      {/* Color Badge */}
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${colorConfig.class}`} />
                        <span className="text-sm text-gray-600 capitalize">{habit.color}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4 animate-float">🎯</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Habits Yet</h3>
          <p className="text-gray-600 mb-6">Start building better habits today!</p>
          <a href="/habit-manager" className="btn-primary">
            Create Your First Habit
          </a>
        </div>
      )}
    </div>
  );
};

export default Habits;
