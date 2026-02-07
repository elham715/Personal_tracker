import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Trash2, X, RotateCcw, ChevronDown } from 'lucide-react';
import { HABIT_ICONS, HABIT_CATEGORIES, HABIT_COLORS } from '@/utils/constants';

const HabitManager: React.FC = () => {
  const { habits, addHabit, deleteHabit, trashedHabits, restoreHabit, permanentlyDeleteHabit } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '✨', category: 'Health', color: 'purple', target: 1 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addHabit(form);
    setForm({ name: '', icon: '✨', category: 'Health', color: 'purple', target: 1 });
    setShowForm(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Move "${name}" to trash?`)) deleteHabit(id);
  };

  return (
    <div className="page-container max-w-lg lg:max-w-3xl mx-auto">
      <div className="flex items-center justify-between pt-4 mb-4 animate-fade-up">
        <h1 className="text-[22px] font-bold text-gray-900">Manage</h1>
        <button onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-1 text-[13px] font-medium px-3 py-1.5 rounded-lg transition-all ${
            showForm ? 'bg-gray-100 text-gray-600' : 'bg-indigo-600 text-white'
          }`}>
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-4 mb-4 animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Name</label>
              <input type="text" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Morning run"
                className="w-full mt-1 px-3 py-2 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required autoFocus />
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Icon</label>
              <div className="grid grid-cols-8 gap-1 mt-1">
                {HABIT_ICONS.map(icon => (
                  <button key={icon} type="button" onClick={() => setForm({ ...form, icon })}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                      form.icon === icon ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-gray-50'
                    }`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Category</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {HABIT_CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      form.category === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Color</label>
              <div className="flex gap-2 mt-1">
                {HABIT_COLORS.map(c => (
                  <button key={c.name} type="button" onClick={() => setForm({ ...form, color: c.name })}
                    className={`w-7 h-7 rounded-full ${c.class} transition-all ${
                      form.color === c.name ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
                    }`} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Daily target</label>
              <input type="number" min="1" value={form.target}
                onChange={e => setForm({ ...form, target: parseInt(e.target.value) || 1 })}
                className="w-16 mt-1 px-2.5 py-1.5 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <button type="submit"
              className="w-full bg-indigo-600 text-white text-[13px] font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition-colors">
              Create Habit
            </button>
          </form>
        </div>
      )}

      {habits.length > 0 ? (
        <div className="space-y-1.5 stagger">
          {habits.map(habit => (
            <div key={habit.id} className="bg-white rounded-xl p-3.5 flex items-center gap-3 animate-fade-up">
              <span className="text-lg">{habit.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-gray-900 truncate">{habit.name}</h3>
                <p className="text-[11px] text-gray-400">{habit.category} · {habit.streak || 0}d streak · {habit.completedDates?.length || 0} total</p>
              </div>
              <button onClick={() => handleDelete(habit.id, habit.name)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 size={15} className="text-gray-400 hover:text-red-400" />
              </button>
            </div>
          ))}
        </div>
      ) : !showForm ? (
        <div className="bg-white rounded-2xl p-8 text-center animate-fade-up">
          <p className="text-3xl mb-2">⚙️</p>
          <p className="text-[14px] font-semibold text-gray-900">No habits</p>
          <p className="text-[12px] text-gray-400">Tap "New" to get started</p>
        </div>
      ) : null}

      {/* ── Trash Section ── */}
      <div className="mt-6 animate-fade-up">
        <button onClick={() => setShowTrash(!showTrash)}
          className="flex items-center gap-2 w-full px-1 py-2 text-left group">
          <Trash2 size={15} className="text-gray-400" />
          <span className="text-[13px] font-semibold text-gray-500">Trash</span>
          {trashedHabits.length > 0 && (
            <span className="text-[10px] font-bold bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">
              {trashedHabits.length}
            </span>
          )}
          <ChevronDown size={14} className={`ml-auto text-gray-400 transition-transform duration-200 ${
            showTrash ? 'rotate-180' : ''
          }`} />
        </button>

        {showTrash && (
          <div className="mt-2 space-y-1.5 animate-scale-in">
            {trashedHabits.length > 0 ? (
              trashedHabits.map(habit => (
                <div key={habit.id} className="bg-white rounded-xl p-3.5 flex items-center gap-3">
                  <span className="text-lg opacity-40">{habit.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-medium text-gray-500 truncate">{habit.name}</h3>
                    <p className="text-[11px] text-gray-400">{habit.category}</p>
                  </div>
                  <button onClick={() => restoreHabit(habit.id)}
                    className="p-1.5 rounded-lg hover:bg-green-50 transition-colors" title="Restore">
                    <RotateCcw size={15} className="text-emerald-500" />
                  </button>
                  <button onClick={() => window.confirm(`Permanently delete "${habit.name}"?`) && permanentlyDeleteHabit(habit.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete permanently">
                    <Trash2 size={15} className="text-red-400" />
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-white/60 rounded-xl p-5 text-center">
                <p className="text-[12px] text-gray-400">Trash is empty</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitManager;
