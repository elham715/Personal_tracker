import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/utils/helpers';
import { Plus, Trash2, Check, ChevronDown, ChevronRight, Circle } from 'lucide-react';

const TaskManager: React.FC = () => {
  const { habits, tasks, addTask, toggleTask, deleteTask, toggleHabitDate } = useApp();
  const [newTaskText, setNewTaskText] = useState('');
  const [showAddFor, setShowAddFor] = useState<string | null>(null);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'all'>('today');
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set([formatDate()]));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddFor && inputRef.current) inputRef.current.focus();
  }, [showAddFor]);

  const getNext7Days = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        dateStr: formatDate(date),
        date,
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long' }),
        shortLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
    return dates;
  };

  const next7Days = getNext7Days();

  const getTasksForDate = (dateStr: string) => {
    const habitTasks = habits
      .filter(h => h && h.id && Array.isArray(h.completedDates))
      .map(h => ({
        id: `habit_${h.id}_${dateStr}`,
        text: `${h.icon} ${h.name}`,
        completed: h.completedDates.includes(dateStr),
        priority: 'high' as const,
        isHabit: true,
        habitId: h.id,
        date: dateStr,
        createdAt: new Date().toISOString(),
      }));
    const customTasks = tasks.filter(t => t.date === dateStr && !t.isHabit);
    return [...habitTasks, ...customTasks];
  };

  const handleAddTask = async (dateStr: string) => {
    if (!newTaskText.trim()) return;
    try {
      await addTask({ text: newTaskText, completed: false, priority, isHabit: false, date: dateStr });
      setNewTaskText('');
      setPriority('medium');
      setShowAddFor(null);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleToggle = (task: ReturnType<typeof getTasksForDate>[0]) => {
    if (task.isHabit && task.habitId) toggleHabitDate(task.habitId, task.date);
    else toggleTask(task.id);
  };

  const toggleDay = (dateStr: string) => {
    const next = new Set(expandedDays);
    next.has(dateStr) ? next.delete(dateStr) : next.add(dateStr);
    setExpandedDays(next);
  };

  const priorityDot = (p: string) => {
    if (p === 'high') return 'bg-red-500';
    if (p === 'medium') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const renderTask = (task: ReturnType<typeof getTasksForDate>[0]) => (
    <div
      key={task.id}
      className={`group flex items-center gap-3 py-3 px-1 border-b border-gray-50 last:border-0 transition-all ${task.completed ? 'opacity-50' : ''}`}
    >
      {/* Checkbox */}
      <button onClick={() => handleToggle(task)} className="flex-shrink-0">
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          task.completed ? 'bg-purple-600 border-purple-600' : 'border-gray-300 hover:border-purple-400'
        }`}>
          {task.completed && <Check size={14} className="text-white" strokeWidth={3} />}
        </div>
      </button>

      {/* Text */}
      <span className={`flex-1 text-[15px] leading-snug ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {task.text}
      </span>

      {/* Badges */}
      {task.isHabit ? (
        <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Habit</span>
      ) : (
        <div className={`w-2 h-2 rounded-full ${priorityDot(task.priority)} flex-shrink-0`} />
      )}

      {/* Delete */}
      {!task.isHabit && (
        <button
          onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
        >
          <Trash2 size={14} className="text-red-400" />
        </button>
      )}
    </div>
  );

  const renderDaySection = (dayInfo: ReturnType<typeof getNext7Days>[0]) => {
    const dayTasks = getTasksForDate(dayInfo.dateStr);
    const completed = dayTasks.filter(t => t.completed).length;
    const total = dayTasks.length;
    const isExpanded = expandedDays.has(dayInfo.dateStr);
    const isAddingHere = showAddFor === dayInfo.dateStr;

    return (
      <div key={dayInfo.dateStr} className="mb-3">
        {/* Day Header */}
        <button
          onClick={() => toggleDay(dayInfo.dateStr)}
          className="w-full flex items-center gap-2 py-2 px-1 group"
        >
          {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
          <span className="text-sm font-semibold text-gray-900">{dayInfo.label}</span>
          {total > 0 && (
            <span className="text-xs text-gray-400">{completed}/{total}</span>
          )}
          <div className="flex-1" />
          <span className="text-xs text-gray-400">{dayInfo.shortLabel}</span>
        </button>

        {/* Task List */}
        {isExpanded && (
          <div className="ml-1 pl-4 border-l-2 border-gray-100">
            {dayTasks.map(renderTask)}

            {/* Inline Add */}
            {isAddingHere ? (
              <div className="py-2 flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTask(dayInfo.dateStr);
                    if (e.key === 'Escape') { setShowAddFor(null); setNewTaskText(''); }
                  }}
                  placeholder="What needs to be done?"
                  className="flex-1 text-[15px] text-gray-800 placeholder:text-gray-300 bg-transparent outline-none"
                />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                  className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-600"
                >
                  <option value="high">!</option>
                  <option value="medium">!!</option>
                  <option value="low">!!!</option>
                </select>
                <button
                  onClick={() => handleAddTask(dayInfo.dateStr)}
                  className="text-purple-600 font-semibold text-sm hover:text-purple-700"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setShowAddFor(dayInfo.dateStr); setExpandedDays(new Set([...expandedDays, dayInfo.dateStr])); }}
                className="flex items-center gap-2 py-2.5 text-gray-400 hover:text-purple-500 transition-colors w-full"
              >
                <Plus size={16} />
                <span className="text-sm">Add task</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-container max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
        {[
          { key: 'today' as const, label: 'Today' },
          { key: 'week' as const, label: 'This Week' },
          { key: 'all' as const, label: 'All' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        {activeTab === 'today' && renderDaySection(next7Days[0])}
        {activeTab === 'week' && next7Days.map(day => renderDaySection(day))}
        {activeTab === 'all' && (
          <div>
            {tasks.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No tasks yet</p>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="group flex items-center gap-3 py-3 px-1 border-b border-gray-50 last:border-0">
                  <button onClick={() => toggleTask(task.id)} className="flex-shrink-0">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      task.completed ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                    }`}>
                      {task.completed && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>
                  </button>
                  <span className={`flex-1 text-[15px] ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.text}</span>
                  <span className="text-[11px] text-gray-400">{task.date}</span>
                  <div className={`w-2 h-2 rounded-full ${priorityDot(task.priority)}`} />
                  <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;
