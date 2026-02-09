import React from 'react';
import { useApp } from '@/context/AppContext';
import { RotateCcw } from 'lucide-react';
import SwipeToDelete from '@/components/SwipeToDelete';

const Trash: React.FC = () => {
  const { trashedHabits, restoreHabit, permanentlyDeleteHabit } = useApp();

  return (
    <div className="page-container max-w-lg mx-auto">
      <div className="pt-4 mb-4 animate-fade-up">
        <h1 className="text-[22px] font-bold text-gray-900">Trash</h1>
        <p className="text-[12px] text-gray-400 mt-0.5">Deleted habits can be restored</p>
      </div>

      {trashedHabits.length > 0 ? (
        <div className="space-y-1.5 stagger">
          {trashedHabits.map(habit => (
            <SwipeToDelete key={habit.id} onDelete={() => window.confirm(`Permanently delete "${habit.name}"?`) && permanentlyDeleteHabit(habit.id)}>
              <div className="bg-white rounded-xl p-3.5 flex items-center gap-3 animate-fade-up">
                <span className="text-lg opacity-40">{habit.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-medium text-gray-500 truncate">{habit.name}</h3>
                  <p className="text-[11px] text-gray-400">{habit.category}</p>
                </div>
                <button onClick={() => restoreHabit(habit.id)}
                  className="p-1.5 rounded-lg hover:bg-green-50 transition-colors" title="Restore">
                  <RotateCcw size={15} className="text-emerald-500" />
                </button>
              </div>
            </SwipeToDelete>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center animate-fade-up">
          <p className="text-3xl mb-2">🗑️</p>
          <p className="text-[14px] font-semibold text-gray-900">Trash is empty</p>
          <p className="text-[12px] text-gray-400 mt-0.5">Deleted habits appear here</p>
        </div>
      )}
    </div>
  );
};

export default Trash;
