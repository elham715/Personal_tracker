import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Trash2, X } from 'lucide-react';
import { HABIT_ICONS, HABIT_CATEGORIES, HABIT_COLORS } from '@/utils/constants';

const HabitManager: React.FC = () => {
  const { habits, addHabit, deleteHabit } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: '✨',
    category: 'Health',
    color: 'purple',
    target: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addHabit(formData);
    setFormData({
      name: '',
      icon: '✨',
      category: 'Health',
      color: 'purple',
      target: 1,
    });
    setShowForm(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"? It will be moved to trash.`)) {
      deleteHabit(id);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">⚙️ Habit Manager</h1>
          <p className="text-gray-400">Create and manage your habits</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancel' : 'New Habit'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass-card p-6 mb-8 animate-slide-in">
          <h2 className="text-xl font-bold text-gray-900 mb-6">✨ Create New Habit</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Habit Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Morning Exercise"
                className="input-field w-full"
                required
              />
            </div>

            {/* Icon Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Icon
              </label>
              <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">
                {HABIT_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all ${
                      formData.icon === icon
                        ? 'bg-purple-600 scale-110 shadow-md'
                        : 'border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {HABIT_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setFormData({ ...formData, category })}
                    className={`py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                      formData.category === category
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'border-2 border-gray-200 text-gray-700 hover:border-purple-400 hover:bg-purple-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Color
              </label>
              <div className="flex gap-3">
                {HABIT_COLORS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.name })}
                    className={`w-12 h-12 rounded-xl ${color.class} transition-all ${
                      formData.color === color.name
                        ? 'ring-4 ring-purple-300 scale-110'
                        : 'hover:scale-110 opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Target */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Daily Target
              </label>
              <input
                type="number"
                min="1"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 1 })}
                className="input-field w-32"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1">
                Create Habit
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary px-8"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Habits List */}
      {habits.length > 0 ? (
        <div className="space-y-4">
          {habits.map((habit, index) => (
            <div
              key={habit.id}
              className="glass-card-hover p-6 flex items-center gap-4 animate-slide-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl ${HABIT_COLORS.find(c => c.name === habit.color)?.light}/20 flex items-center justify-center text-3xl`}>
                {habit.icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{habit.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{habit.category}</span>
                  <span className="text-orange-600 font-medium">🔥 {habit.streak || 0} streak</span>
                  <span>{habit.completedDates?.length || 0} total days</span>
                </div>
              </div>

              {/* Color Indicator */}
              <div className={`w-3 h-3 rounded-full ${HABIT_COLORS.find(c => c.name === habit.color)?.class}`} />

              {/* Delete */}
              <button
                onClick={() => handleDelete(habit.id, habit.name)}
                className="p-3 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 size={20} className="text-red-500" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4 animate-float">🌱</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Habits Yet</h3>
          <p className="text-gray-600 mb-6">Click "New Habit" to create your first one!</p>
        </div>
      )}
    </div>
  );
};

export default HabitManager;
