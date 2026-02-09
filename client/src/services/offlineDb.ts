/**
 * Offline Database — IndexedDB via Dexie.js
 *
 * Stores habits, tasks, memory cards, transactions, budgets,
 * savings goals, notifications, and a sync queue locally.
 * All reads come from here first for instant UI.
 * Writes go here immediately, then get synced to the server.
 */
import Dexie, { type Table } from 'dexie';
import { Habit, Task, GameResult, PlayerProfile, DailyRecall, Transaction, Budget, SavingsGoal, MoneyProfile, AppNotification } from '@/types';

// ── Sync queue entry ──
export interface SyncQueueItem {
  id?: number;
  entity: 'habit' | 'task';
  action: 'create' | 'update' | 'delete' | 'toggleDate' | 'toggle' | 'restore' | 'permanentDelete';
  entityId: string;
  payload?: any;
  createdAt: number;
  retries: number;
}

class HabitTrackerDB extends Dexie {
  habits!: Table<Habit & { _dirty?: boolean; _deleted?: boolean }, string>;
  tasks!: Table<Task & { _dirty?: boolean; _deleted?: boolean }, string>;
  gameResults!: Table<GameResult, string>;
  playerProfile!: Table<PlayerProfile, string>;
  transactions!: Table<Transaction, string>;
  budgets!: Table<Budget, string>;
  savingsGoals!: Table<SavingsGoal, string>;
  moneyProfile!: Table<MoneyProfile, string>;
  notifications!: Table<AppNotification, string>;
  dailyRecalls!: Table<DailyRecall, string>;
  syncQueue!: Table<SyncQueueItem, number>;
  meta!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('HabitTrackerDB');

    this.version(1).stores({
      habits: 'id, name, category, isTrashed',
      tasks: 'id, date, scope, habitId',
      syncQueue: '++id, entity, action, entityId, createdAt',
      meta: 'key',
    });

    // v2: add memory, money, notifications tables
    this.version(2).stores({
      habits: 'id, name, category, isTrashed',
      tasks: 'id, date, scope, habitId',
      memoryCards: 'id, category, nextReview, difficulty',
      transactions: 'id, date, type, category',
      budgets: 'id, category, month',
      savingsGoals: 'id, name, deadline',
      notifications: 'id, type, read, createdAt',
      syncQueue: '++id, entity, action, entityId, createdAt',
      meta: 'key',
    });

    // v3: replace memoryCards with brain training tables
    this.version(3).stores({
      habits: 'id, name, category, isTrashed',
      tasks: 'id, date, scope, habitId',
      gameResults: 'id, game, date, createdAt',
      playerProfile: 'id',
      transactions: 'id, date, type, category',
      budgets: 'id, category, month',
      savingsGoals: 'id, name, deadline',
      notifications: 'id, type, read, createdAt',
      syncQueue: '++id, entity, action, entityId, createdAt',
      meta: 'key',
    }).upgrade(tx => {
      return (tx as any).memoryCards?.clear?.() || Promise.resolve();
    });

    // v4: add daily recall journal table
    this.version(4).stores({
      habits: 'id, name, category, isTrashed',
      tasks: 'id, date, scope, habitId',
      gameResults: 'id, game, date, createdAt',
      playerProfile: 'id',
      dailyRecalls: 'id, date',
      transactions: 'id, date, type, category',
      budgets: 'id, category, month',
      savingsGoals: 'id, name, deadline',
      notifications: 'id, type, read, createdAt',
      syncQueue: '++id, entity, action, entityId, createdAt',
      meta: 'key',
    });

    // v5: add money profile + isNeed field on transactions
    this.version(5).stores({
      habits: 'id, name, category, isTrashed',
      tasks: 'id, date, scope, habitId',
      gameResults: 'id, game, date, createdAt',
      playerProfile: 'id',
      dailyRecalls: 'id, date',
      transactions: 'id, date, type, category',
      budgets: 'id, category, month',
      savingsGoals: 'id, name, deadline',
      moneyProfile: 'id',
      notifications: 'id, type, read, createdAt',
      syncQueue: '++id, entity, action, entityId, createdAt',
      meta: 'key',
    });
  }
}

export const db = new HabitTrackerDB();

// ── Helper: clear all data (on logout) ──
export async function clearLocalData() {
  await db.habits.clear();
  await db.tasks.clear();
  await db.gameResults.clear();
  await db.playerProfile.clear();
  await db.dailyRecalls.clear();
  await db.transactions.clear();
  await db.budgets.clear();
  await db.savingsGoals.clear();
  await db.moneyProfile.clear();
  await db.notifications.clear();
  await db.syncQueue.clear();
  await db.meta.clear();
}

// ── Helper: get last sync timestamp ──
export async function getLastSync(): Promise<number> {
  const record = await db.meta.get('lastSync');
  return record?.value ?? 0;
}

export async function setLastSync(ts: number) {
  await db.meta.put({ key: 'lastSync', value: ts });
}
