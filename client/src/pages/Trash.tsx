import React from 'react';
import { useApp } from '@/context/AppContext';
import { RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { getColorClasses } from '@/utils/constants';

const Trash: React.FC = () => {
  const { trashedHabits, restoreHabit, permanentlyDeleteHabit } = useApp();

  const handleRestore = (id: string, name: string) => {
    if (window.confirm(`Restore "${name}"? Note: Completion history will be cleared.`)) {
      restoreHabit(id);
    }
  };

  const handlePermanentDelete = (id: string, name: string) => {
    if (window.confirm(`Permanently delete "${name}"? This cannot be undone!`)) {
      permanentlyDeleteHabit(id);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title">🗑️ Trash</h1>
        <p className="text-gray-600">
          {trashedHabits.length} habit{trashedHabits.length !== 1 ? 's' : ''} in trash
        </p>
      </div>

      {/* Warning */}
      {trashedHabits.length > 0 && (
        <div className="glass-card p-4 mb-6 border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-amber-300 font-semibold text-sm">Restoration Notice</h3>
              <p className="text-amber-200/70 text-sm">
                Restored habits will have their completion history cleared to ensure a fresh start.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trashed Habits */}
      {trashedHabits.length > 0 ? (
        <div className="space-y-4">
          {trashedHabits.map((habit, index) => {
            const colorConfig = getColorClasses(habit.color);
            
            return (
              <div
                key={habit.id}
                className="glass-card p-6 animate-slide-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  {/* Icon (Faded) */}
                  <div className={`w-14 h-14 rounded-xl ${colorConfig.light}/10 flex items-center justify-center text-3xl opacity-50`}>
                    {habit.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-500 truncate">
                      {habit.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span>{habit.category}</span>
                      <span>•</span>
                      <span>Had {habit.completedDates.length} check-ins</span>
                      <span>•</span>
                      <span>Streak: {habit.streak}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestore(habit.id, habit.name)}
                      className="px-4 py-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex items-center gap-2 font-medium"
                    >
                      <RotateCcw size={16} />
                      Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(habit.id, habit.name)}
                      className="px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-2 font-medium"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4 animate-float">✨</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Trash is Empty</h3>
          <p className="text-gray-600">Deleted habits will appear here</p>
        </div>
      )}
    </div>
  );
};

export default Trash;
