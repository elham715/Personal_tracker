import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/utils/helpers';
import { Plus, Trash2, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { PRIORITY_COLORS } from '@/utils/constants';

const TaskManager: React.FC = () => {
  const { habits, tasks, addTask, toggleTask, deleteTask, toggleHabitDate } = useApp();
  const [newTaskText, setNewTaskText] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [activeTab, setActiveTab] = useState<'today' | 'next7' | 'all'>('next7');
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set([formatDate()])); // Today expanded by default
  const [selectedDate, setSelectedDate] = useState<string>(formatDate());
  
  // Get dates for next 7 days
  const getNext7Days = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        dateStr: formatDate(date),
        date: date,
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
        fullLabel: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      });
    }
    return dates;
  };

  const next7Days = getNext7Days();

  // Get tasks for a specific date
  const getTasksForDate = (dateStr: string) => {
    const habitTasks = habits
      .filter(habit => habit && habit.id && Array.isArray(habit.completedDates))
      .map(habit => ({
        id: `habit_task_${habit.id}_${dateStr}`,
        text: `${habit.icon} ${habit.name}`,
        completed: habit.completedDates.includes(dateStr),
        priority: 'high' as const,
        isHabit: true,
        habitId: habit.id,
        date: dateStr,
        createdAt: new Date().toISOString(),
      }));

    const customTasks = tasks.filter(t => t.date === dateStr && !t.isHabit);
    return [...habitTasks, ...customTasks];
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    try {
      await addTask({
        text: newTaskText,
        completed: false,
        priority,
        isHabit: false,
        date: selectedDate,
      });

      setNewTaskText('');
      setPriority('medium');
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task. Please try again.');
    }
  };

  const handleToggle = (task: ReturnType<typeof getTasksForDate>[0]) => {
    if (task.isHabit && task.habitId) {
      toggleHabitDate(task.habitId, task.date);
    } else {
      toggleTask(task.id);
    }
  };

  const toggleDay = (dateStr: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dateStr)) {
      newExpanded.delete(dateStr);
    } else {
      newExpanded.add(dateStr);
    }
    setExpandedDays(newExpanded);
  };

  const renderDaySection = (dayInfo: ReturnType<typeof getNext7Days>[0]) => {
    const dayTasks = getTasksForDate(dayInfo.dateStr);
    const completedCount = dayTasks.filter(t => t.completed).length;
    const totalCount = dayTasks.length;
    const isExpanded = expandedDays.has(dayInfo.dateStr);
    const isToday = dayInfo.label === 'Today';

    return (
      <div key={dayInfo.dateStr} className="mb-4">
        {/* Day Header */}
        <button
          onClick={() => toggleDay(dayInfo.dateStr)}
          className="w-full flex items-center justify-between p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            <h3 className="text-lg font-bold text-gray-900">
              {dayInfo.label} {totalCount > 0 && `(${completedCount}/${totalCount})`}
            </h3>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDate(dayInfo.dateStr);
              setExpandedDays(new Set([...expandedDays, dayInfo.dateStr]));
            }}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Plus size={20} className="text-gray-600" />
          </button>
        </button>

        {/* Tasks List */}
        {isExpanded && (
          <div className="mt-2 space-y-2 ml-4">
            {/* Add task form for this date */}
            {selectedDate === dayInfo.dateStr && (
              <form onSubmit={handleAddTask} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Add a task..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="high">High</option>
                  <option value="medium">Med</option>
                  <option value="low">Low</option>
                </select>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Add
                </button>
              </form>
            )}

            {/* Tasks */}
            {dayTasks.length === 0 ? (
              <p className="text-gray-400 text-sm p-4">No tasks</p>
            ) : (
              dayTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => handleToggle(task)}
                  className={`flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                    task.completed ? 'opacity-60' : ''
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      task.completed
                        ? 'bg-green-600 border-transparent'
                        : 'border-gray-300'
                    }`}
                  >
                    {task.completed && <Check size={14} className="text-white" />}
                  </div>

                  <p className={`flex-1 text-gray-900 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                    {task.text}
                  </p>

                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      task.isHabit
                        ? 'bg-purple-100 text-purple-700'
                        : task.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {task.isHabit ? 'Habit' : task.priority}
                  </span>

                  {!task.isHabit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-container animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">tasks +</h1>
        
        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('today')}
            className={`pb-3 font-medium transition-colors relative ${
              activeTab === 'today' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            today
            {activeTab === 'today' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('next7')}
            className={`pb-3 font-medium transition-colors relative ${
              activeTab === 'next7' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            next 7 days
            {activeTab === 'next7' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 font-medium transition-colors relative ${
              activeTab === 'all' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            all
            {activeTab === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'today' && (
          <div>
            {renderDaySection(next7Days[0])}
          </div>
        )}

        {activeTab === 'next7' && (
          <div>
            {next7Days.map(day => renderDaySection(day))}
          </div>
        )}

        {activeTab === 'all' && (
          <div className="space-y-2">
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`flex items-center gap-3 p-4 bg-white rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                  task.completed ? 'opacity-60' : ''
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    task.completed
                      ? 'bg-green-600 border-transparent'
                      : 'border-gray-300'
                  }`}
                >
                  {task.completed && <Check size={14} className="text-white" />}
                </div>

                <p className={`flex-1 text-gray-900 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                  {task.text}
                </p>

                <span className="text-xs text-gray-500">
                  {new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>

                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    task.priority === 'high'
                      ? 'bg-red-100 text-red-700'
                      : task.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {task.priority}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;
