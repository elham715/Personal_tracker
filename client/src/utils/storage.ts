import { Habit } from '@/types';

const STORAGE_KEYS = {
  HABITS: 'lifetrack_habits',
  TASKS: 'lifetrack_tasks',
  TRASHED_HABITS: 'lifetrack_trashed_habits',
};

export const storage = {
  // Habits
  getHabits: (): Habit[] => {
    const data = localStorage.getItem(STORAGE_KEYS.HABITS);
    return data ? JSON.parse(data) : [];
  },

  saveHabits: (habits: Habit[]): void => {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  },

  // Trashed Habits
  getTrashedHabits: (): Habit[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TRASHED_HABITS);
    return data ? JSON.parse(data) : [];
  },

  saveTrashedHabits: (habits: Habit[]): void => {
    localStorage.setItem(STORAGE_KEYS.TRASHED_HABITS, JSON.stringify(habits));
  },

  // Tasks
  getTasks: (date?: string): any[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    const allTasks = data ? JSON.parse(data) : [];
    
    if (date) {
      return allTasks.filter((task: any) => task.date === date);
    }
    
    return allTasks;
  },

  saveTasks: (tasks: any[]): void => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  // Clear all data
  clearAll: (): void => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },
};
