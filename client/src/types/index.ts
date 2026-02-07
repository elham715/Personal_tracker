export interface Habit {
  id: string;
  name: string;
  icon: string;
  category: string;
  color: string;
  target: number;
  streak: number;
  completedDates: string[];
  createdAt: string;
  isTrashed?: boolean;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  scope: 'daily' | 'weekly' | 'monthly';
  isHabit: boolean;
  habitId?: string;
  date: string;
  createdAt: string;
}

export interface Stats {
  totalHabits: number;
  completedToday: number;
  totalCheckIns: number;
  bestStreak: number;
  activeDays: number;
}
