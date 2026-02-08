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

/* ── Memory System ── */
export interface MemoryCard {
  id: string;
  front: string;          // question / term
  back: string;           // answer / definition
  category: string;       // e.g. 'Vocabulary', 'Science', 'Custom'
  difficulty: 'easy' | 'medium' | 'hard';
  interval: number;       // days until next review (spaced repetition)
  easeFactor: number;     // SM-2 ease factor (default 2.5)
  repetitions: number;    // consecutive correct answers
  nextReview: string;     // YYYY-MM-DD
  lastReviewed: string;   // YYYY-MM-DD
  timesReviewed: number;
  timesCorrect: number;
  streak: number;         // consecutive correct
  createdAt: string;
}

/* ── Money System ── */
export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;       // e.g. 'Food', 'Transport', 'Entertainment'
  note: string;
  date: string;           // YYYY-MM-DD
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;          // monthly budget limit
  month: string;          // YYYY-MM
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;       // YYYY-MM-DD
  color: string;
  createdAt: string;
}

/* ── Notification System ── */
export interface AppNotification {
  id: string;
  type: 'habit' | 'task' | 'memory' | 'money' | 'streak' | 'milestone' | 'nudge';
  title: string;
  message: string;
  icon: string;
  color: string;
  action?: string;        // route to navigate to
  read: boolean;
  createdAt: string;
}
