import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Habit, Task } from '@/types';
import { habitsAPI, tasksAPI } from '@/services/api';
import { auth } from '@/config/firebase';

interface AppContextType {
  // Habits
  habits: Habit[];
  trashedHabits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'createdAt'>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  restoreHabit: (id: string) => Promise<void>;
  permanentlyDeleteHabit: (id: string) => Promise<void>;
  toggleHabitDate: (id: string, date: string) => Promise<void>;
  
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  getTasksForDate: (date: string) => Task[];
  
  // Loading state
  loading: boolean;
  error: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [trashedHabits, setTrashedHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef<Set<string>>(new Set());

  // Load data on mount and when auth state changes
  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.log('No user authenticated, skipping data load');
        setHabits([]);
        setTrashedHabits([]);
        setTasks([]);
        setLoading(false);
        return;
      }

      try {
        console.log('Loading data for user:', user.uid);
        setLoading(true);
        const [habitsRes, trashedRes, tasksRes] = await Promise.all([
          habitsAPI.getAll(),
          habitsAPI.getTrashed(),
          tasksAPI.getAll(),
        ]);
        
        console.log('Habits response:', habitsRes.data);
        console.log('Trashed response:', trashedRes.data);
        console.log('Tasks response:', tasksRes.data);
        
        // Backend returns { success: true, data: [...] }
        const activeHabits = Array.isArray(habitsRes.data.data) ? habitsRes.data.data : [];
        const deletedHabits = Array.isArray(trashedRes.data.data) ? trashedRes.data.data : [];
        
        console.log('Active habits:', activeHabits.length);
        console.log('Deleted habits:', deletedHabits.length);
        
        setHabits(activeHabits);
        setTrashedHabits(deletedHabits);
        setTasks(Array.isArray(tasksRes.data.data) ? tasksRes.data.data : []);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load data:', err);
        console.error('Error details:', err.response?.data);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    // Wait a bit for auth to be ready
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadData();
      } else {
        setHabits([]);
        setTrashedHabits([]);
        setTasks([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Habit operations
  const addHabit = async (habitData: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'createdAt'>) => {
    try {
      const response = await habitsAPI.create(habitData);
      setHabits(prev => [...prev, response.data.data]);
    } catch (err: any) {
      console.error('Failed to add habit:', err);
      throw err;
    }
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    try {
      const response = await habitsAPI.update(id, updates);
      setHabits(prev => prev.map(h => h.id === id ? response.data.data : h));
    } catch (err: any) {
      console.error('Failed to update habit:', err);
      throw err;
    }
  };

  const deleteHabit = async (id: string) => {
    // Optimistic update — move to trash instantly in UI
    const habit = habits.find(h => h.id === id);
    if (habit) {
      setTrashedHabits(prev => [...prev, { ...habit, isTrashed: true }]);
      setHabits(prev => prev.filter(h => h.id !== id));
      setTasks(prev => prev.filter(t => t.habitId !== id));
    }
    try {
      await habitsAPI.delete(id);
    } catch (err: any) {
      // Revert on failure
      if (habit) {
        setHabits(prev => [...prev, habit]);
        setTrashedHabits(prev => prev.filter(h => h.id !== id));
      }
      console.error('Failed to delete habit:', err);
      throw err;
    }
  };

  const restoreHabit = async (id: string) => {
    try {
      const response = await habitsAPI.restore(id);
      setHabits(prev => [...prev, response.data.data]);
      setTrashedHabits(prev => prev.filter(h => h.id !== id));
    } catch (err: any) {
      console.error('Failed to restore habit:', err);
      throw err;
    }
  };

  const permanentlyDeleteHabit = async (id: string) => {
    try {
      await habitsAPI.permanentlyDelete(id);
      setTrashedHabits(prev => prev.filter(h => h.id !== id));
    } catch (err: any) {
      console.error('Failed to permanently delete habit:', err);
      throw err;
    }
  };

  const toggleHabitDate = async (id: string, date: string) => {
    // Debounce: skip if a request for this habit+date is already in-flight
    const key = `habit_${id}_${date}`;
    if (inflightRef.current.has(key)) return;
    inflightRef.current.add(key);

    // Optimistic update — toggle instantly in UI
    const prev = habits.find(h => h.id === id);
    if (prev) {
      const alreadyDone = prev.completedDates.includes(date);
      const optimistic = {
        ...prev,
        completedDates: alreadyDone
          ? prev.completedDates.filter(d => d !== date)
          : [...prev.completedDates, date],
        streak: alreadyDone ? Math.max(0, prev.streak - 1) : prev.streak + 1,
      };
      setHabits(hs => hs.map(h => h.id === id ? optimistic : h));
    }
    try {
      const response = await habitsAPI.toggleDate(id, date);
      setHabits(hs => hs.map(h => h.id === id ? response.data.data : h));
    } catch (err: any) {
      if (prev) setHabits(hs => hs.map(h => h.id === id ? prev : h));
      console.error('Failed to toggle habit date:', err);
    } finally {
      inflightRef.current.delete(key);
    }
  };

  // Task operations
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      const response = await tasksAPI.create(taskData);
      setTasks(prev => [...prev, response.data.data]);
    } catch (err: any) {
      console.error('Failed to add task:', err);
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const response = await tasksAPI.update(id, updates);
      setTasks(prev => prev.map(t => t.id === id ? response.data.data : t));
    } catch (err: any) {
      console.error('Failed to update task:', err);
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    // Optimistic update — remove instantly from UI
    const prev = tasks;
    setTasks(ts => ts.filter(t => t.id !== id));
    try {
      await tasksAPI.delete(id);
    } catch (err: any) {
      // Revert on failure
      setTasks(prev);
      console.error('Failed to delete task:', err);
      throw err;
    }
  };

  const toggleTask = async (id: string) => {
    // Debounce: skip if a request for this task is already in-flight
    const key = `task_${id}`;
    if (inflightRef.current.has(key)) return;
    inflightRef.current.add(key);

    // Optimistic update — toggle instantly in UI
    const prev = tasks.find(t => t.id === id);
    if (prev) {
      setTasks(ts => ts.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    }
    try {
      const response = await tasksAPI.toggle(id);
      setTasks(ts => ts.map(t => t.id === id ? response.data.data : t));
    } catch (err: any) {
      if (prev) setTasks(ts => ts.map(t => t.id === id ? prev : t));
      console.error('Failed to toggle task:', err);
    } finally {
      inflightRef.current.delete(key);
    }
  };

  const getTasksForDate = (date: string): Task[] => {
    return tasks.filter(t => t.date === date);
  };

  const value: AppContextType = {
    habits,
    trashedHabits,
    addHabit,
    updateHabit,
    deleteHabit,
    restoreHabit,
    permanentlyDeleteHabit,
    toggleHabitDate,
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    getTasksForDate,
    loading,
    error,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
