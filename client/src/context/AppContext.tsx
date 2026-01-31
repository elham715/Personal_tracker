import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
        const [habitsRes, tasksRes] = await Promise.all([
          habitsAPI.getAll(),
          tasksAPI.getAll(),
        ]);
        
        console.log('Habits response:', habitsRes.data);
        console.log('Tasks response:', tasksRes.data);
        
        // Backend returns { success: true, data: [...] }, so access .data.data
        const allHabits = Array.isArray(habitsRes.data.data) ? habitsRes.data.data : [];
        const activeHabits = allHabits.filter((h: Habit) => !h.isTrashed);
        const deletedHabits = allHabits.filter((h: Habit) => h.isTrashed);
        
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
    try {
      await habitsAPI.update(id, { isTrashed: true });
      const habit = habits.find(h => h.id === id);
      if (habit) {
        setTrashedHabits(prev => [...prev, { ...habit, isTrashed: true }]);
        setHabits(prev => prev.filter(h => h.id !== id));
        setTasks(prev => prev.filter(t => t.habitId !== id));
      }
    } catch (err: any) {
      console.error('Failed to delete habit:', err);
      throw err;
    }
  };

  const restoreHabit = async (id: string) => {
    try {
      const response = await habitsAPI.update(id, { 
        isTrashed: false,
        completedDates: [],
        streak: 0
      });
      setHabits(prev => [...prev, response.data.data]);
      setTrashedHabits(prev => prev.filter(h => h.id !== id));
    } catch (err: any) {
      console.error('Failed to restore habit:', err);
      throw err;
    }
  };

  const permanentlyDeleteHabit = async (id: string) => {
    try {
      await habitsAPI.delete(id);
      setTrashedHabits(prev => prev.filter(h => h.id !== id));
    } catch (err: any) {
      console.error('Failed to permanently delete habit:', err);
      throw err;
    }
  };

  const toggleHabitDate = async (id: string, date: string) => {
    try {
      console.log('Toggling habit:', id, 'for date:', date);
      const response = await habitsAPI.toggleDate(id, date);
      console.log('Toggle response:', response.data);
      setHabits(prev => prev.map(h => h.id === id ? response.data.data : h));
    } catch (err: any) {
      console.error('Failed to toggle habit date:', err);
      console.error('Error details:', err.response?.data);
      throw err;
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
    try {
      await tasksAPI.delete(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      console.error('Failed to delete task:', err);
      throw err;
    }
  };

  const toggleTask = async (id: string) => {
    try {
      console.log('Toggling task:', id);
      const response = await tasksAPI.toggle(id);
      console.log('Toggle task response:', response.data);
      setTasks(prev => prev.map(t => t.id === id ? response.data.data : t));
    } catch (err: any) {
      console.error('Failed to toggle task:', err);
      console.error('Error details:', err.response?.data);
      throw err;
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
