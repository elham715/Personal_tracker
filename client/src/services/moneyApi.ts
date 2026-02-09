/**
 * Money System — Gamified Bangladeshi Finance Manager
 *
 * Dynamic money pool: income comes anytime, expenses tracked live.
 * Personality-based awareness: detects saver/spender patterns.
 * Challenges, XP, money levels, no-spend streaks.
 * All data stored locally in IndexedDB via Dexie.
 */
import { v4 as uuidv4 } from 'uuid';
import { db } from './offlineDb';
import { Transaction, Budget, SavingsGoal, MoneyProfile, MoneyChallenge } from '@/types';
import { formatDate } from '@/utils/helpers';

// ── Currency ──
export const CURRENCY = '৳';
export const formatMoney = (n: number) =>
  `${CURRENCY}${Math.abs(n).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// ── Expense Categories (Bangladeshi lifestyle) ──
export const EXPENSE_CATEGORIES = [
  { name: 'Food', icon: '🍛', color: '#f97316' },
  { name: 'Transport', icon: '🚌', color: '#3b82f6' },
  { name: 'Coffee & Snacks', icon: '☕', color: '#a855f7' },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
  { name: 'Bills & Recharge', icon: '📱', color: '#ef4444' },
  { name: 'Health', icon: '💊', color: '#22c55e' },
  { name: 'Education', icon: '📚', color: '#06b6d4' },
  { name: 'Entertainment', icon: '🎬', color: '#8b5cf6' },
  { name: 'Ride', icon: '🚕', color: '#0ea5e9' },
  { name: 'Gift', icon: '🎁', color: '#f43f5e' },
  { name: 'Other', icon: '📦', color: '#6b7280' },
];

export const INCOME_CATEGORIES = [
  { name: 'Allowance', icon: '💵', color: '#22c55e' },
  { name: 'Freelance', icon: '💻', color: '#3b82f6' },
  { name: 'Salary', icon: '💰', color: '#10b981' },
  { name: 'Gift', icon: '🎁', color: '#ec4899' },
  { name: 'Refund', icon: '↩️', color: '#f97316' },
  { name: 'Tutoring', icon: '📖', color: '#8b5cf6' },
  { name: 'Sell', icon: '🏷️', color: '#06b6d4' },
  { name: 'Other', icon: '📦', color: '#6b7280' },
];

// ── Money Level System ──
const XP_PER_LEVEL = 100;
export const MONEY_RANKS = [
  { rank: 'Beginner', minLevel: 1, icon: '🌱', color: '#94a3b8' },
  { rank: 'Tracker', minLevel: 5, icon: '📝', color: '#22c55e' },
  { rank: 'Aware', minLevel: 10, icon: '👁️', color: '#3b82f6' },
  { rank: 'Planner', minLevel: 18, icon: '📊', color: '#8b5cf6' },
  { rank: 'Saver', minLevel: 25, icon: '🏦', color: '#06b6d4' },
  { rank: 'Wise Spender', minLevel: 33, icon: '🧠', color: '#f59e0b' },
  { rank: 'Budget Master', minLevel: 42, icon: '👑', color: '#f97316' },
  { rank: 'Money Guru', minLevel: 50, icon: '💎', color: '#ec4899' },
];

export function getMoneyRank(level: number) {
  return [...MONEY_RANKS].reverse().find(r => level >= r.minLevel) || MONEY_RANKS[0];
}

export function getMoneyXPProgress(totalXP: number) {
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const xpInLevel = totalXP % XP_PER_LEVEL;
  return { level: Math.min(level, 50), xpInLevel, xpNeeded: XP_PER_LEVEL, pct: Math.round((xpInLevel / XP_PER_LEVEL) * 100) };
}

// ── Available Challenges ──
const CHALLENGE_TEMPLATES: Omit<MoneyChallenge, 'id' | 'progress' | 'startDate' | 'endDate' | 'completed'>[] = [
  { title: '7-Day Logger', description: 'Log expenses for 7 days in a row', icon: '📝', type: 'log', target: 7, xpReward: 50 },
  { title: '3 No-Spend Days', description: 'Have 3 days with zero spending this week', icon: '🚫', type: 'no-spend', target: 3, xpReward: 40 },
  { title: 'Budget Keeper', description: 'Stay under daily budget for 5 days', icon: '🛡️', type: 'budget', target: 5, xpReward: 60 },
  { title: 'Save ৳500', description: 'Put ৳500 into a savings goal', icon: '🐷', type: 'save', target: 500, xpReward: 45 },
  { title: '14-Day Streak', description: 'Log every day for 2 weeks straight', icon: '🔥', type: 'log', target: 14, xpReward: 80 },
  { title: '5 No-Spend Days', description: 'Have 5 zero-spend days this month', icon: '💪', type: 'no-spend', target: 5, xpReward: 70 },
  { title: 'Budget Master', description: 'Stay under daily budget for 10 days', icon: '👑', type: 'budget', target: 10, xpReward: 100 },
  { title: 'Save ৳2000', description: 'Put ৳2000 into savings goals', icon: '💰', type: 'save', target: 2000, xpReward: 90 },
  { title: '30-Day Logger', description: 'Log expenses every single day for a month', icon: '🏆', type: 'log', target: 30, xpReward: 150 },
];

// ── Money Profile ──
export const moneyProfileAPI = {
  async get(): Promise<MoneyProfile> {
    let p = await db.moneyProfile.get('money-profile');
    if (!p) {
      p = {
        id: 'money-profile',
        moneyLevel: 1,
        totalXP: 0,
        personality: 'new',
        dailyBudget: 500,
        currency: '৳',
        noSpendDays: [],
        loggingStreak: 0,
        bestLoggingStreak: 0,
        activeChallenges: [],
        completedChallenges: [],
        createdAt: new Date().toISOString(),
      };
      await db.moneyProfile.put(p);
    }
    return p;
  },

  async update(updates: Partial<MoneyProfile>): Promise<MoneyProfile> {
    const p = await this.get();
    const updated = { ...p, ...updates };
    updated.moneyLevel = Math.min(getMoneyXPProgress(updated.totalXP).level, 50);
    await db.moneyProfile.put(updated);
    return updated;
  },

  async addXP(amount: number): Promise<{ profile: MoneyProfile; leveledUp: boolean }> {
    const p = await this.get();
    const oldLevel = p.moneyLevel;
    p.totalXP += amount;
    p.moneyLevel = Math.min(getMoneyXPProgress(p.totalXP).level, 50);
    await db.moneyProfile.put(p);
    return { profile: p, leveledUp: p.moneyLevel > oldLevel };
  },

  async setDailyBudget(amount: number): Promise<MoneyProfile> {
    return this.update({ dailyBudget: amount });
  },

  async analyzePersonality(): Promise<MoneyProfile> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const txs = await db.transactions
      .filter(t => t.date >= formatDate(thirtyDaysAgo) && t.date <= formatDate(now))
      .toArray();

    if (txs.length < 5) return this.update({ personality: 'new' });

    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const spendingRatio = income > 0 ? expenses / income : 1;

    let personality: MoneyProfile['personality'] = 'balanced';
    if (spendingRatio > 0.9) personality = 'spender';
    else if (spendingRatio < 0.5) personality = 'saver';

    return this.update({ personality });
  },

  async startChallenge(): Promise<MoneyChallenge | null> {
    const p = await this.get();
    const active = p.activeChallenges.filter(c => !c.completed);
    if (active.length >= 2) return null;

    const available = CHALLENGE_TEMPLATES.filter(
      ct => !p.completedChallenges.includes(ct.title) && !active.some(a => a.title === ct.title)
    );
    if (available.length === 0) return null;

    const template = available[0];
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + (template.type === 'log' ? template.target + 3 : 14));

    const challenge: MoneyChallenge = {
      ...template,
      id: uuidv4(),
      progress: 0,
      startDate: formatDate(now),
      endDate: formatDate(end),
      completed: false,
    };

    await this.update({ activeChallenges: [...p.activeChallenges, challenge] });
    return challenge;
  },

  async updateChallenges(): Promise<{ completed: MoneyChallenge[] }> {
    const p = await this.get();
    const completed: MoneyChallenge[] = [];
    const today = formatDate();

    for (const ch of p.activeChallenges) {
      if (ch.completed) continue;

      if (ch.type === 'log') {
        ch.progress = p.loggingStreak;
      } else if (ch.type === 'no-spend') {
        ch.progress = p.noSpendDays.filter(d => d >= ch.startDate && d <= today).length;
      } else if (ch.type === 'budget') {
        ch.progress = await transactionAPI.getDaysUnderBudget(ch.startDate, today, p.dailyBudget);
      } else if (ch.type === 'save') {
        const goals = await savingsAPI.getAll();
        ch.progress = goals.reduce((s, g) => s + g.currentAmount, 0);
      }

      if (ch.progress >= ch.target) {
        ch.completed = true;
        completed.push(ch);
      }
    }

    if (completed.length > 0) {
      const xp = completed.reduce((s, c) => s + c.xpReward, 0);
      await this.addXP(xp);
      await this.update({
        activeChallenges: p.activeChallenges,
        completedChallenges: [...p.completedChallenges, ...completed.map(c => c.title)],
      });
    } else {
      await this.update({ activeChallenges: p.activeChallenges });
    }

    return { completed };
  },
};

// ── Transactions ──
export const transactionAPI = {
  async getAll(): Promise<Transaction[]> {
    return db.transactions.orderBy('date').reverse().toArray();
  },

  async getByMonth(month: string): Promise<Transaction[]> {
    return db.transactions.filter(t => t.date.startsWith(month)).toArray();
  },

  async getByDateRange(from: string, to: string): Promise<Transaction[]> {
    return db.transactions.filter(t => t.date >= from && t.date <= to).toArray();
  },

  async create(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const tx: Transaction = {
      ...data,
      isNeed: data.isNeed ?? true,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await db.transactions.put(tx);
    await moneyProfileAPI.addXP(5);
    await this.updateLoggingStreak();
    await moneyProfileAPI.analyzePersonality();
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

  async getMonthStats(month?: string) {
    const m = month || formatDate().slice(0, 7);
    const txs = await db.transactions.filter(t => t.date.startsWith(m)).toArray();

    const receivedIncome = txs.filter(t => t.type === 'income' && !t.isPending).reduce((s, t) => s + t.amount, 0);
    const pendingIncome = txs.filter(t => t.type === 'income' && t.isPending).reduce((s, t) => s + t.amount, 0);
    const income = receivedIncome + pendingIncome; // total expected
    const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const needs = txs.filter(t => t.type === 'expense' && t.isNeed).reduce((s, t) => s + t.amount, 0);
    const wants = txs.filter(t => t.type === 'expense' && !t.isNeed).reduce((s, t) => s + t.amount, 0);

    const byCategory: Record<string, number> = {};
    txs.filter(t => t.type === 'expense').forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

    const dailySpending: Record<string, number> = {};
    txs.filter(t => t.type === 'expense').forEach(t => {
      dailySpending[t.date] = (dailySpending[t.date] || 0) + t.amount;
    });

    // net uses only received income (pending hasn't arrived yet)
    return { income: receivedIncome, pendingIncome, totalIncome: income, expenses, net: receivedIncome - expenses, needs, wants, byCategory, dailySpending, transactionCount: txs.length };
  },

  async markReceived(id: string): Promise<Transaction> {
    const tx = await db.transactions.get(id);
    if (!tx) throw new Error('Transaction not found');
    const updated = { ...tx, isPending: false };
    await db.transactions.put(updated);
    return updated;
  },

  async getTodaySpending(): Promise<number> {
    const today = formatDate();
    const txs = await db.transactions.filter(t => t.date === today && t.type === 'expense').toArray();
    return txs.reduce((s, t) => s + t.amount, 0);
  },

  async getDailyRemaining(): Promise<{ spent: number; remaining: number; budget: number; pct: number }> {
    const profile = await moneyProfileAPI.get();
    const spent = await this.getTodaySpending();
    const remaining = profile.dailyBudget - spent;
    const pct = profile.dailyBudget > 0 ? Math.round((spent / profile.dailyBudget) * 100) : 0;
    return { spent, remaining, budget: profile.dailyBudget, pct };
  },

  async getSpendingVelocity(days: number = 3): Promise<{ total: number; avg: number; days: number; trend: 'fast' | 'normal' | 'slow' }> {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - days);

    const txs = await db.transactions
      .filter(t => t.date >= formatDate(from) && t.date <= formatDate(now) && t.type === 'expense')
      .toArray();

    const total = txs.reduce((s, t) => s + t.amount, 0);
    const avg = days > 0 ? total / days : 0;
    const profile = await moneyProfileAPI.get();

    let trend: 'fast' | 'normal' | 'slow' = 'normal';
    if (avg > profile.dailyBudget * 1.3) trend = 'fast';
    else if (avg < profile.dailyBudget * 0.6) trend = 'slow';

    return { total, avg, days, trend };
  },

  async getDaysUnderBudget(from: string, to: string, dailyBudget: number): Promise<number> {
    const txs = await db.transactions
      .filter(t => t.date >= from && t.date <= to && t.type === 'expense')
      .toArray();

    const dailyTotals: Record<string, number> = {};
    txs.forEach(t => { dailyTotals[t.date] = (dailyTotals[t.date] || 0) + t.amount; });

    let count = 0;
    const d = new Date(from);
    const endD = new Date(to);
    while (d <= endD) {
      const ds = formatDate(d);
      if ((dailyTotals[ds] || 0) <= dailyBudget) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  },

  async loggedToday(): Promise<boolean> {
    const today = formatDate();
    const count = await db.transactions.filter(t => t.date === today).count();
    return count > 0;
  },

  async updateLoggingStreak(): Promise<number> {
    const all = await db.transactions.toArray();
    const dates = [...new Set(all.map(t => t.date))].sort().reverse();
    if (dates.length === 0) return 0;

    let streak = 0;
    const d = new Date();
    const today = formatDate(d);
    const yesterday = (() => { const y = new Date(); y.setDate(y.getDate() - 1); return formatDate(y); })();

    if (dates[0] !== today && dates[0] !== yesterday) {
      await moneyProfileAPI.update({ loggingStreak: 0 });
      return 0;
    }

    for (let i = 0; i < 365; i++) {
      const check = formatDate(d);
      if (dates.includes(check)) { streak++; } else if (i > 0) { break; }
      d.setDate(d.getDate() - 1);
    }

    const p = await moneyProfileAPI.get();
    await moneyProfileAPI.update({
      loggingStreak: streak,
      bestLoggingStreak: Math.max(streak, p.bestLoggingStreak),
    });
    return streak;
  },

  async getLoggingStreak(): Promise<number> {
    const p = await moneyProfileAPI.get();
    return p.loggingStreak;
  },

  async getLastIncomeDate(): Promise<string | null> {
    const txs = await db.transactions.filter(t => t.type === 'income').toArray();
    if (txs.length === 0) return null;
    return txs.sort((a, b) => b.date.localeCompare(a.date))[0].date;
  },

  async getTodayByCategory(): Promise<{ category: string; total: number; count: number }[]> {
    const today = formatDate();
    const txs = await db.transactions.filter(t => t.date === today && t.type === 'expense').toArray();
    const map: Record<string, { total: number; count: number }> = {};
    txs.forEach(t => {
      if (!map[t.category]) map[t.category] = { total: 0, count: 0 };
      map[t.category].total += t.amount;
      map[t.category].count++;
    });
    return Object.entries(map)
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.total - a.total);
  },

  async getTodayTransactions(): Promise<Transaction[]> {
    const today = formatDate();
    return (await db.transactions.filter(t => t.date === today).toArray())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getRemainingDaysInMonth(): number {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return lastDay - now.getDate();
  },

  getBudgetPerRemainingDay(balance: number): number {
    const remaining = this.getRemainingDaysInMonth();
    return remaining > 0 ? Math.round(balance / remaining) : balance;
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
    const budget: Budget = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
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
    const goal: SavingsGoal = { ...data, id: uuidv4(), currentAmount: 0, createdAt: new Date().toISOString() };
    await db.savingsGoals.put(goal);
    return goal;
  },

  async addMoney(id: string, amount: number): Promise<SavingsGoal> {
    const goal = await db.savingsGoals.get(id);
    if (!goal) throw new Error('Goal not found');
    const updated = { ...goal, currentAmount: goal.currentAmount + amount };
    await db.savingsGoals.put(updated);
    await moneyProfileAPI.addXP(10);
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

// ── Personality Insights ──
export const PERSONALITY_INFO = {
  new: {
    title: 'Just Getting Started',
    emoji: '🌱',
    desc: 'Keep logging! I\'ll learn your patterns soon.',
    tip: 'Log every expense for a week — awareness is the first step.',
    color: '#94a3b8',
    bg: 'from-slate-500 to-slate-600',
  },
  saver: {
    title: 'Natural Saver',
    emoji: '🏦',
    desc: 'You spend less than 50% of your income. Excellent control!',
    tip: 'Set a savings goal to put your extra money to work.',
    color: '#22c55e',
    bg: 'from-emerald-500 to-teal-600',
  },
  balanced: {
    title: 'Balanced Spender',
    emoji: '⚖️',
    desc: 'You maintain a healthy balance between earning and spending.',
    tip: 'Try a no-spend day challenge to sharpen your awareness.',
    color: '#3b82f6',
    bg: 'from-blue-500 to-indigo-600',
  },
  spender: {
    title: 'Quick Spender',
    emoji: '⚡',
    desc: 'You tend to spend money soon after getting it.',
    tip: 'Try the 24-hour rule: wait a day before non-essential purchases.',
    color: '#f97316',
    bg: 'from-orange-500 to-red-500',
  },
};
