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

/* ── Brain Training System ── */
export type GameType = 'number-memory' | 'sequence-memory' | 'chimp-test' | 'word-recall' | 'visual-pairs' | 'pattern-matrix' | 'speed-match' | 'memory-palace';

export interface GameResult {
  id: string;
  game: GameType;
  score: number;           // raw score for that round
  level: number;           // level achieved in that round
  xpEarned: number;        // XP awarded
  accuracy: number;        // 0–100
  duration: number;        // seconds spent
  date: string;            // YYYY-MM-DD
  createdAt: string;
}

export interface PlayerProfile {
  id: string;              // always 'player'
  brainLevel: number;      // overall brain level (1-100)
  totalXP: number;
  currentStreak: number;   // daily training streak
  bestStreak: number;
  lastTrainedDate: string; // YYYY-MM-DD
  gamesPlayed: number;
  /* Per-game progression */
  gameLevels: Record<GameType, number>;      // current level per game (1-50)
  gameHighScores: Record<GameType, number>;  // best score per game
  gamePlays: Record<GameType, number>;       // total plays per game
  dailyGoalMinutes: number;                  // default 15
  createdAt: string;
}

/* ── Daily Recall Journal ── */
export interface DailyRecall {
  id: string;              // YYYY-MM-DD (one per day)
  content: string;         // free-form journal entry — user writes however they want
  mood: 'great' | 'good' | 'okay' | 'foggy'; // how clear the recall felt
  clarityScore: number;    // 1-10 self-rated
  date: string;            // YYYY-MM-DD
  completedAt: string;     // ISO timestamp
  createdAt: string;
}

/* ── Money System ── */
export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;       // e.g. 'Food', 'Transport', 'Entertainment'
  note: string;
  isNeed: boolean;        // true = "needed", false = "wanted" (for awareness)
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

export type MoneyPersonality = 'saver' | 'balanced' | 'spender' | 'new';

export interface MoneyProfile {
  id: string;             // always 'money-profile'
  moneyLevel: number;     // 1-50, gamified level
  totalXP: number;
  personality: MoneyPersonality;
  dailyBudget: number;    // user-set daily spending limit (৳)
  currency: string;       // '৳' for BDT
  noSpendDays: string[];  // YYYY-MM-DD dates of no-spend days
  loggingStreak: number;
  bestLoggingStreak: number;
  activeChallenges: MoneyChallenge[];
  completedChallenges: string[]; // challenge IDs
  createdAt: string;
}

export interface MoneyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'no-spend' | 'save' | 'log' | 'budget';
  target: number;         // e.g. 7 no-spend days, log for 14 days
  progress: number;
  xpReward: number;
  startDate: string;
  endDate: string;
  completed: boolean;
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
