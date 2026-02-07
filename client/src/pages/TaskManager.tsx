import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/utils/helpers';
import { Plus, Trash2, Check, ChevronDown, ChevronRight } from 'lucide-react';

const TaskManager: React.FC = () => {
  const { habits, tasks, addTask, toggleTask, deleteTask, toggleHabitDate } = useApp();
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'all'>('today');
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set([formatDate()]));
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newText, setNewText] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingFor && inputRef.current) inputRef.current.focus();
  }, [addingFor]);

  const getNext7Days = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        key: formatDate(d),
        date: d,
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'long' }),
      });
    }
    return dates;
  };

  const days = getNext7Days();

  const getTasksForDate = (dateStr: string) => {
    const habitTasks = habits
      .filter(h => h?.id && Array.isArray(h.completedDates))
      .map(h => ({
        id: `habit_${h.id}_${dateStr}`,
        text: h.name,
        icon: h.icon,
        completed: h.completedDates.includes(dateStr),
        priority: 'high' as const,
        isHabit: true,
        habitId: h.id,
        date: dateStr,
        createdAt: '',
      }));
    const userTasks = tasks.filter(t => t.date === dateStr && !t.isHabit);
    return [...habitTasks, ...userTasks];
  };

  const handleAdd = async (dateStr: string) => {
    if (!newText.trim()) return;
    await addTask({ text: newText, completed: false, priority, isHabit: false, date: dateStr });
    // Keep the add row open so user can quickly add another task
    setNewText('');
    setPriority('medium');
    // Re-focus the input for rapid entry
    setTimeout(() => inputRef.current?.focus(), 50);
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

  const pDot = (p: string) =>
    p === 'high' ? 'bg-red-400' : p === 'medium' ? 'bg-amber-400' : 'bg-emerald-400';

  /* ── Single task row ── */
  const TaskRow: React.FC<{ task: any }> = ({ task }) => (
    <div className={`group flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 ${task.completed ? 'opacity-40' : ''}`}>
      <button onClick={() => handleToggle(task)} className="flex-shrink-0">
        <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all ${
          task.completed ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
        }`}>
          {task.completed && <Check size={11} className="text-white" strokeWidth={3} />}
        </div>
      </button>
      {task.isHabit && <span className="text-sm flex-shrink-0">{task.icon}</span>}
      <span className={`flex-1 text-[14px] ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {task.text}
      </span>
      {task.isHabit ? (
        <span className="text-[10px] font-medium text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">habit</span>
      ) : (
        <div className={`w-1.5 h-1.5 rounded-full ${pDot(task.priority)} flex-shrink-0`} />
      )}
      {!task.isHabit && (
        <button onClick={() => deleteTask(task.id)}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity flex-shrink-0">
          <Trash2 size={13} className="text-gray-300 hover:text-red-400" />
        </button>
      )}
    </div>
  );

  /* ── Inline new-task row (appears when + is clicked) ── */
  const NewTaskRow: React.FC<{ dateStr: string }> = ({ dateStr }) => (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50">
      {/* Empty circle placeholder */}
      <div className="w-5 h-5 rounded-full border-[1.5px] border-dashed border-gray-300 flex-shrink-0" />
      {/* Text input */}
      <input
        ref={inputRef}
        value={newText}
        onChange={e => setNewText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && newText.trim()) handleAdd(dateStr);
          if (e.key === 'Escape') { setAddingFor(null); setNewText(''); }
        }}
        placeholder="New task..."
        className="flex-1 text-[14px] bg-transparent outline-none placeholder:text-gray-300"
      />
      {/* Priority picker - small dots */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {(['high', 'medium', 'low'] as const).map(p => (
          <button key={p} onClick={() => setPriority(p)}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              priority === p
                ? `${pDot(p)} border-transparent scale-110`
                : 'border-gray-200 bg-white'
            }`}
            title={p}
          />
        ))}
      </div>
      {/* Done button */}
      {newText.trim() && (
        <button onClick={() => handleAdd(dateStr)}
          className="text-[12px] font-semibold text-indigo-600 flex-shrink-0">
          Done
        </button>
      )}
    </div>
  );

  /* ── Day section with tasks + add button ── */
  const DaySection: React.FC<{ day: typeof days[0] }> = ({ day }) => {
    const dayTasks = getTasksForDate(day.key);
    const done = dayTasks.filter(t => t.completed).length;
    const open = expandedDays.has(day.key);
    const isAdding = addingFor === day.key;

    return (
      <div className="mb-1">
        {/* Day header */}
        <button onClick={() => toggleDay(day.key)} className="w-full flex items-center gap-2 py-2">
          {open
            ? <ChevronDown size={14} className="text-gray-400" />
            : <ChevronRight size={14} className="text-gray-400" />}
          <span className="text-[13px] font-semibold text-gray-900">{day.label}</span>
          {dayTasks.length > 0 && (
            <span className="text-[11px] text-gray-400">{done}/{dayTasks.length}</span>
          )}
        </button>

        {open && (
          <div className="pl-5 ml-[7px] border-l border-gray-100">
            {/* Existing tasks */}
            {dayTasks.map(t => <TaskRow key={t.id} task={t} />)}

            {/* Inline add row (visible when + clicked) */}
            {isAdding && <NewTaskRow dateStr={day.key} />}

            {/* + Add task button — always visible at bottom */}
            <button
              onClick={() => {
                if (isAdding) {
                  // Close if already open
                  setAddingFor(null);
                  setNewText('');
                } else {
                  setAddingFor(day.key);
                  setExpandedDays(new Set([...expandedDays, day.key]));
                }
              }}
              className={`flex items-center gap-1.5 py-2 transition-colors ${
                isAdding ? 'text-gray-400' : 'text-gray-300 hover:text-indigo-500'
              }`}
            >
              <Plus size={14} />
              <span className="text-[12px]">{isAdding ? 'Cancel' : 'Add task'}</span>
            </button>
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

      {/* Segmented tab control */}
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

      {/* Task list card */}
      <div className="bg-white rounded-2xl px-4 py-1 animate-fade-up" style={{ animationDelay: '120ms' }}>
        {activeTab === 'today' && <DaySection day={days[0]} />}

        {activeTab === 'week' && days.map(d => <DaySection key={d.key} day={d} />)}

        {activeTab === 'all' && (
          tasks.length === 0
            ? <p className="text-center text-[13px] text-gray-400 py-8">No tasks yet</p>
            : tasks.map(task => <TaskRow key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
};

export default TaskManager;
