import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/utils/helpers';
import { Plus, Trash2, Check, ChevronDown, ChevronRight, X } from 'lucide-react';

const TaskManager: React.FC = () => {
  const { habits, tasks, addTask, toggleTask, deleteTask, toggleHabitDate } = useApp();
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'all'>('today');
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set([formatDate()]));
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newText, setNewText] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (addingFor && inputRef.current) inputRef.current.focus(); }, [addingFor]);

  const getNext7Days = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      dates.push({
        key: formatDate(d), date: d,
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'long' }),
      });
    }
    return dates;
  };

  const days = getNext7Days();

  const getTasksForDate = (dateStr: string) => {
    const habitTasks = habits.filter(h => h?.id && Array.isArray(h.completedDates)).map(h => ({
      id: `habit_${h.id}_${dateStr}`, text: h.name, icon: h.icon,
      completed: h.completedDates.includes(dateStr),
      priority: 'high' as const, isHabit: true, habitId: h.id, date: dateStr, createdAt: '',
    }));
    const userTasks = tasks.filter(t => t.date === dateStr && !t.isHabit);
    return [...habitTasks, ...userTasks];
  };

  const handleAdd = async (dateStr: string) => {
    if (!newText.trim()) return;
    await addTask({ text: newText, completed: false, priority, isHabit: false, date: dateStr });
    setNewText(''); setPriority('medium'); setAddingFor(null);
  };

  const handleToggle = (task: any) => {
    if (task.isHabit && task.habitId) toggleHabitDate(task.habitId, task.date);
    else toggleTask(task.id);
  };

  const toggleDay = (key: string) => {
    const s = new Set(expandedDays);
    s.has(key) ? s.delete(key) : s.add(key);
    setExpandedDays(s);
  };

  const pColor = (p: string) => p === 'high' ? 'bg-red-400' : p === 'medium' ? 'bg-amber-400' : 'bg-emerald-400';

  const TaskRow: React.FC<{ task: any }> = ({ task }) => (
    <div className={`group flex items-center gap-3 py-2.5 transition-opacity ${task.completed ? 'opacity-40' : ''}`}>
      <button onClick={() => handleToggle(task)} className="flex-shrink-0">
        <div className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center transition-all ${
          task.completed ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
        }`}>
          {task.completed && <Check size={12} className="text-white" strokeWidth={3} />}
        </div>
      </button>
      {task.isHabit && <span className="text-sm">{task.icon}</span>}
      <span className={`flex-1 text-[14px] ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {task.text}
      </span>
      {task.isHabit ? (
        <span className="text-[10px] font-medium text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">Habit</span>
      ) : (
        <div className={`w-[6px] h-[6px] rounded-full ${pColor(task.priority)}`} />
      )}
      {!task.isHabit && (
        <button onClick={() => deleteTask(task.id)}
          className="opacity-0 group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1 rounded transition-opacity">
          <Trash2 size={13} className="text-gray-400" />
        </button>
      )}
    </div>
  );

  const DaySection: React.FC<{ day: ReturnType<typeof getNext7Days>[0] }> = ({ day }) => {
    const dayTasks = getTasksForDate(day.key);
    const done = dayTasks.filter(t => t.completed).length;
    const open = expandedDays.has(day.key);
    const isAdding = addingFor === day.key;

    return (
      <div className="animate-fade-up">
        <button onClick={() => toggleDay(day.key)}
          className="w-full flex items-center gap-2 py-2 group">
          {open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
          <span className="text-[13px] font-semibold text-gray-900">{day.label}</span>
          {dayTasks.length > 0 && <span className="text-[11px] text-gray-400">{done}/{dayTasks.length}</span>}
        </button>

        {open && (
          <div className="pl-5 border-l border-gray-100 ml-[7px]">
            {dayTasks.map(t => <TaskRow key={t.id} task={t} />)}

            {isAdding ? (
              <div className="flex items-center gap-2 py-2">
                <input ref={inputRef} value={newText}
                  onChange={e => setNewText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd(day.key); if (e.key === 'Escape') setAddingFor(null); }}
                  placeholder="New task..."
                  className="flex-1 text-[14px] bg-transparent outline-none placeholder:text-gray-300" />
                <select value={priority} onChange={e => setPriority(e.target.value as any)}
                  className="text-[11px] bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-gray-500">
                  <option value="high">High</option>
                  <option value="medium">Med</option>
                  <option value="low">Low</option>
                </select>
                <button onClick={() => handleAdd(day.key)}
                  className="text-[12px] font-semibold text-indigo-600">Add</button>
                <button onClick={() => { setAddingFor(null); setNewText(''); }}>
                  <X size={14} className="text-gray-400" />
                </button>
              </div>
            ) : (
              <button onClick={() => setAddingFor(day.key)}
                className="flex items-center gap-1.5 py-2 text-gray-400 hover:text-indigo-500 transition-colors">
                <Plus size={14} />
                <span className="text-[13px]">Add task</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-container max-w-lg mx-auto">
      <div className="pt-4 mb-4 animate-fade-up">
        <h1 className="text-[22px] font-bold text-gray-900">Tasks</h1>
      </div>

      {/* Segmented control */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 mb-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
        {(['today', 'week', 'all'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-[12px] font-medium rounded-md transition-all ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}>
            {tab === 'today' ? 'Today' : tab === 'week' ? 'This Week' : 'All'}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="bg-white rounded-2xl px-4 py-2 animate-fade-up" style={{ animationDelay: '120ms' }}>
        {activeTab === 'today' && <DaySection day={days[0]} />}
        {activeTab === 'week' && days.map(d => <DaySection key={d.key} day={d} />)}
        {activeTab === 'all' && (
          tasks.length === 0 ? <p className="text-center text-[13px] text-gray-400 py-8">No tasks yet</p> :
          tasks.map(task => <TaskRow key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
};

export default TaskManager;
