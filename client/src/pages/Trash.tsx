import React from 'react';
import { useApp } from '@/context/AppContext';
import { RotateCcw, Trash2 } from 'lucide-react';

const Trash: React.FC = () => {
  const { trashedHabits, restoreHabit, permanentlyDeleteHabit } = useApp();

  const handleRestore = (id: string) => restoreHabit(id);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) {
      permanentlyDeleteHabit(id);
    }
  };

  return (
    <div className="page-container max-w-2xl mx-auto animate-fade-in">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Trash</h1>
        <p className="text-sm text-gray-500 mt-0.5">Deleted habits can be restored here</p>
      </div>

      {trashedHabits.length > 0 ? (
        <div className="space-y-2">
          {trashedHabits.map((habit) => (
            <div key={habit.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl opacity-50">
                {habit.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-600 truncate">{habit.name}</h3>
                <p className="text-[11px] text-gray-400">{habit.category}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => handleRestore(habit.id)}
                  className="p-2 hover:bg-green-50 rounded-lg transition-colors" title="Restore">
                  <RotateCcw size={16} className="text-green-500" />
                </button>
                <button onClick={() => handleDelete(habit.id, habit.name)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete permanently">
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-3">🗑️</div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Trash is Empty</h3>
          <p className="text-sm text-gray-500">Deleted habits will appear here</p>
        </div>
      )}
    </div>
  );
};

export default Trash;
