import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Trash2, X } from 'lucide-react';
import { HABIT_ICONS, HABIT_CATEGORIES, HABIT_COLORS } from '@/utils/constants';

const HabitManager: React.FC = () => {
  const { habits, addHabit, deleteHabit } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', icon: '✨', category: 'Health', color: 'purple', target: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    addHabit(formData);
    setFormData({ name: '', icon: '✨', category: 'Health', color: 'purple', target: 1 });
    setShowForm(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Move "${name}" to trash?`)) deleteHabit(id);
  };

  return (
    <div className="page-container max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Manage Habits</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-all ${
            showForm ? 'bg-gray-100 text-gray-600' : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> New</>}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 animate-scale-in">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">New Habit</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Morning Exercise"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Icon</label>
              <div className="grid grid-cols-8 gap-1.5">
                {HABIT_ICONS.map((icon) => (
                  <button key={icon} type="button" onClick={() => setFormData({ ...formData, icon })}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                      formData.icon === icon ? 'bg-purple-100 ring-2 ring-purple-500 scale-105' : 'bg-gray-50 hover:bg-gray-100'
                    }`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {HABIT_CATEGORIES.map((cat) => (
                  <button key={cat} type="button" onClick={() => setFormData({ ...formData, category: cat })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      formData.category === cat ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Color</label>
              <div className="flex gap-2">
                {HABIT_COLORS.map((color) => (
                  <button key={color.name} type="button" onClick={() => setFormData({ ...formData, color: color.name })}
                    className={`w-8 h-8 rounded-full ${color.class} transition-all ${
                      formData.color === color.name ? 'ring-2 ring-offset-2 ring-purple-500 scale-110' : 'hover:scale-110'
                    }`} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Daily Target</label>
              <input type="number" min="1" value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 1 })}
                className="w-20 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>

            <button type="submit" className="w-full bg-purple-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-purple-700 transition-colors">
              Create Habit
            </button>
          </form>
        </div>
      )}

      {/* Habits List */}
      {habits.length > 0 ? (
        <div className="space-y-2">
          {habits.map((habit) => (
            <div key={habit.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                HABIT_COLORS.find(c => c.name === habit.color)?.light || 'bg-purple-100'
              }/20`}>
                {habit.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{habit.name}</h3>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span>{habit.category}</span>
                  <span>·</span>
                  <span className="text-orange-600 font-medium">🔥 {habit.streak || 0}</span>
                  <span>·</span>
                  <span>{habit.completedDates?.length || 0} days</span>
                </div>
              </div>
              <button onClick={() => handleDelete(habit.id, habit.name)}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="text-4xl mb-3">⚙️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Habits</h3>
            <p className="text-sm text-gray-500">Tap "New" to create your first habit</p>
          </div>
        )
      )}
    </div>
  );
};

export default HabitManager;
