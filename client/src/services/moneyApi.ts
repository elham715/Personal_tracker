/**
 * Money System — Offline-First API
 *
 * Budget tracking, expense logging, savings goals.
 * All data stored locally in IndexedDB via Dexie.
 */
import { v4 as uuidv4 } from 'uuid';
import { db } from './offlineDb';
import { Transaction, Budget, SavingsGoal } from '@/types';
import { formatDate } from '@/utils/helpers';

// ── Expense Categories ──
export const EXPENSE_CATEGORIES = [
  { name: 'Food', icon: '🍔', color: '#f97316' },
  { name: 'Transport', icon: '🚗', color: '#3b82f6' },
  { name: 'Entertainment', icon: '🎬', color: '#8b5cf6' },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
  { name: 'Bills', icon: '📄', color: '#ef4444' },
  { name: 'Health', icon: '💊', color: '#22c55e' },
  { name: 'Education', icon: '📚', color: '#06b6d4' },
  { name: 'Savings', icon: '🏦', color: '#10b981' },
  { name: 'Other', icon: '📦', color: '#6b7280' },
];

export const INCOME_CATEGORIES = [
  { name: 'Salary', icon: '💰', color: '#22c55e' },
  { name: 'Freelance', icon: '💻', color: '#3b82f6' },
  { name: 'Gift', icon: '🎁', color: '#ec4899' },
  { name: 'Refund', icon: '↩️', color: '#f97316' },
  { name: 'Other', icon: '📦', color: '#6b7280' },
];

// ── Transactions ──
export const transactionAPI = {
  async getAll(): Promise<Transaction[]> {
    return db.transactions.orderBy('date').reverse().toArray();
  },

  async getByMonth(month: string): Promise<Transaction[]> {
    // month = "YYYY-MM"
    return db.transactions
      .filter(t => t.date.startsWith(month))
      .toArray();
  },

  async getByDateRange(from: string, to: string): Promise<Transaction[]> {
    return db.transactions
      .filter(t => t.date >= from && t.date <= to)
      .toArray();
  },

  async create(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const tx: Transaction = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await db.transactions.put(tx);
    return tx;
  },

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const existing = await db.transactions.get(id);
    if (!existing) throw new Error('Transaction not found');
    const updated = { ...existing, ...updates };
    await db.transactions.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.transactions.delete(id);
  },

  /** Get spending stats for current month */
  async getMonthStats(month?: string) {
    const m = month || formatDate().slice(0, 7); // YYYY-MM
    const txs = await db.transactions.filter(t => t.date.startsWith(m)).toArray();

    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    // Group expenses by category
    const byCategory: Record<string, number> = {};
    txs.filter(t => t.type === 'expense').forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

    // Daily spending for chart
    const dailySpending: Record<string, number> = {};
    txs.filter(t => t.type === 'expense').forEach(t => {
      dailySpending[t.date] = (dailySpending[t.date] || 0) + t.amount;
    });

    return {
      income,
      expenses,
      net: income - expenses,
      byCategory,
      dailySpending,
      transactionCount: txs.length,
    };
  },

  /** Check if user logged expenses today (for streak) */
  async loggedToday(): Promise<boolean> {
    const today = formatDate();
    const count = await db.transactions.filter(t => t.date === today).count();
    return count > 0;
  },

  /** Get logging streak (consecutive days with at least 1 transaction) */
  async getLoggingStreak(): Promise<number> {
    const all = await db.transactions.toArray();
    const dates = [...new Set(all.map(t => t.date))].sort().reverse();
    if (dates.length === 0) return 0;

    let streak = 0;
    const d = new Date();
    const today = formatDate(d);
    const yesterday = (() => { const y = new Date(); y.setDate(y.getDate() - 1); return formatDate(y); })();

    // Must have logged today or yesterday to have an active streak
    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    for (let i = 0; i < 365; i++) {
      const check = formatDate(d);
      if (dates.includes(check)) {
        streak++;
      } else if (i > 0) {
        break; // gap found
      }
      d.setDate(d.getDate() - 1);
    }
    return streak;
  },
};

// ── Budgets ──
export const budgetAPI = {
  async getAll(): Promise<Budget[]> {
    return db.budgets.toArray();
  },

  async getForMonth(month?: string): Promise<Budget[]> {
    const m = month || formatDate().slice(0, 7);
    return db.budgets.where('month').equals(m).toArray();
  },

  async create(data: Omit<Budget, 'id' | 'createdAt'>): Promise<Budget> {
    const budget: Budget = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await db.budgets.put(budget);
    return budget;
  },

  async update(id: string, updates: Partial<Budget>): Promise<Budget> {
    const existing = await db.budgets.get(id);
    if (!existing) throw new Error('Budget not found');
    const updated = { ...existing, ...updates };
    await db.budgets.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.budgets.delete(id);
  },

  /** Check which budgets are exceeded */
  async getAlerts(month?: string) {
    const m = month || formatDate().slice(0, 7);
    const budgets = await this.getForMonth(m);
    const stats = await transactionAPI.getMonthStats(m);

    return budgets.map(b => ({
      ...b,
      spent: stats.byCategory[b.category] || 0,
      remaining: b.limit - (stats.byCategory[b.category] || 0),
      exceeded: (stats.byCategory[b.category] || 0) > b.limit,
      pct: b.limit > 0 ? Math.round(((stats.byCategory[b.category] || 0) / b.limit) * 100) : 0,
    }));
  },
};

// ── Savings Goals ──
export const savingsAPI = {
  async getAll(): Promise<SavingsGoal[]> {
    return db.savingsGoals.toArray();
  },

  async create(data: Omit<SavingsGoal, 'id' | 'currentAmount' | 'createdAt'>): Promise<SavingsGoal> {
    const goal: SavingsGoal = {
      ...data,
      id: uuidv4(),
      currentAmount: 0,
      createdAt: new Date().toISOString(),
    };
    await db.savingsGoals.put(goal);
    return goal;
  },

  async addMoney(id: string, amount: number): Promise<SavingsGoal> {
    const goal = await db.savingsGoals.get(id);
    if (!goal) throw new Error('Goal not found');
    const updated = { ...goal, currentAmount: goal.currentAmount + amount };
    await db.savingsGoals.put(updated);
    return updated;
  },

  async update(id: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal> {
    const existing = await db.savingsGoals.get(id);
    if (!existing) throw new Error('Goal not found');
    const updated = { ...existing, ...updates };
    await db.savingsGoals.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.savingsGoals.delete(id);
  },
};
