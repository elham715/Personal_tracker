import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Habit, Task } from '@/types';
import { auth } from '@/config/firebase';
import { offlineHabitsAPI, offlineTasksAPI, initialSync } from '@/services/offlineApi';
import { onSyncStatus, syncNow } from '@/services/syncEngine';
import { clearLocalData } from '@/services/offlineDb';

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
  
  // Loading & sync state
  loading: boolean;
  error: string | null;
  syncStatus: 'idle' | 'syncing' | 'error' | 'offline';
  pendingChanges: number;
  forceSync: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [trashedHabits, setTrashedHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'offline'>(
    navigator.onLine ? 'idle' : 'offline'
  );
  const [pendingChanges, setPendingChanges] = useState(0);
  const inflightRef = useRef<Set<string>>(new Set());

  // Helper: refresh UI from local IndexedDB
  const refreshFromLocal = useCallback(async () => {
    try {
      const [h, th, t] = await Promise.all([
        offlineHabitsAPI.getAll(),
        offlineHabitsAPI.getTrashed(),
        offlineTasksAPI.getAll(),
      ]);
      setHabits(h);
      setTrashedHabits(th);
      setTasks(t);
    } catch (err) {
      console.error('Failed to read local DB:', err);
    }
  }, []);

  // Listen for sync status changes → refresh UI after sync completes
  useEffect(() => {
    const unsub = onSyncStatus((status, pending) => {
      setSyncStatus(status);
      setPendingChanges(pending);
      // After a successful sync, refresh UI from local DB (which now has server data)
      if (status === 'idle') {
        refreshFromLocal();
      }
    });
    return unsub;
  }, [refreshFromLocal]);

  // Load data on auth state change
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setLoading(true);
        try {
          // First load from local DB (instant)
          await refreshFromLocal();
          // Then trigger a server sync in the background
          await initialSync();
          // Refresh again with server data
          await refreshFromLocal();
          setError(null);
        } catch (err: any) {
          console.error('Load/sync error:', err);
          // Even if sync fails, local data is shown
          setError(navigator.onLine ? 'Sync failed — showing cached data' : null);
        } finally {
          setLoading(false);
        }
      } else {
        // Logged out — clear local data
        await clearLocalData();
        setHabits([]);
        setTrashedHabits([]);
        setTasks([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [refreshFromLocal]);

  const forceSync = useCallback(() => {
    syncNow();
  }, []);

  // ── Habit operations (offline-first) ──

  const addHabit = async (habitData: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'createdAt'>) => {
    try {
      const habit = await offlineHabitsAPI.create(habitData);
      setHabits(prev => [...prev, habit]);
    } catch (err: any) {
      console.error('Failed to add habit:', err);
      throw err;
    }
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    try {
      const updated = await offlineHabitsAPI.update(id, updates);
      setHabits(prev => prev.map(h => h.id === id ? updated : h));
    } catch (err: any) {
      console.error('Failed to update habit:', err);
      throw err;
    }
  };

  const deleteHabit = async (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (habit) {
      setTrashedHabits(prev => [...prev, { ...habit, isTrashed: true }]);
      setHabits(prev => prev.filter(h => h.id !== id));
      setTasks(prev => prev.filter(t => t.habitId !== id));
    }
    try {
      await offlineHabitsAPI.delete(id);
    } catch (err: any) {
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
      const restored = await offlineHabitsAPI.restore(id);
      setHabits(prev => [...prev, restored]);
      setTrashedHabits(prev => prev.filter(h => h.id !== id));
    } catch (err: any) {
      console.error('Failed to restore habit:', err);
      throw err;
    }
  };

  const permanentlyDeleteHabit = async (id: string) => {
    try {
      await offlineHabitsAPI.permanentlyDelete(id);
      setTrashedHabits(prev => prev.filter(h => h.id !== id));
    } catch (err: any) {
      console.error('Failed to permanently delete habit:', err);
      throw err;
    }
  };

  const toggleHabitDate = async (id: string, date: string) => {
    const key = `habit_${id}_${date}`;
    if (inflightRef.current.has(key)) return;
    inflightRef.current.add(key);

    try {
      const updated = await offlineHabitsAPI.toggleDate(id, date);
      setHabits(hs => hs.map(h => h.id === id ? updated : h));
    } catch (err: any) {
      console.error('Failed to toggle habit date:', err);
    } finally {
      inflightRef.current.delete(key);
    }
  };

  // ── Task operations (offline-first) ──

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      const task = await offlineTasksAPI.create(taskData);
      setTasks(prev => [...prev, task]);
    } catch (err: any) {
      console.error('Failed to add task:', err);
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const updated = await offlineTasksAPI.update(id, updates);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    } catch (err: any) {
      console.error('Failed to update task:', err);
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    const prev = tasks;
    setTasks(ts => ts.filter(t => t.id !== id));
    try {
      await offlineTasksAPI.delete(id);
    } catch (err: any) {
      setTasks(prev);
      console.error('Failed to delete task:', err);
      throw err;
    }
  };

  const toggleTask = async (id: string) => {
    const key = `task_${id}`;
    if (inflightRef.current.has(key)) return;
    inflightRef.current.add(key);

    try {
      const toggled = await offlineTasksAPI.toggle(id);
      setTasks(ts => ts.map(t => t.id === id ? toggled : t));
    } catch (err: any) {
      console.error('Failed to toggle task:', err);
      await refreshFromLocal();
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
    syncStatus,
    pendingChanges,
    forceSync,
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
