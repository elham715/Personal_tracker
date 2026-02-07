/**
 * Offline Database — IndexedDB via Dexie.js
 *
 * Stores habits, tasks, and a sync queue locally.
 * All reads come from here first for instant UI.
 * Writes go here immediately, then get synced to the server.
 */
import Dexie, { type Table } from 'dexie';
import { Habit, Task } from '@/types';

// ── Sync queue entry ──
export interface SyncQueueItem {
  id?: number;               // auto-increment
  entity: 'habit' | 'task';  // which table
  action: 'create' | 'update' | 'delete' | 'toggleDate' | 'toggle' | 'restore' | 'permanentDelete';
  entityId: string;           // the habit/task ID
  payload?: any;              // data for create/update/toggleDate
  createdAt: number;          // timestamp
  retries: number;            // retry count
}

class HabitTrackerDB extends Dexie {
  habits!: Table<Habit & { _dirty?: boolean; _deleted?: boolean }, string>;
  tasks!: Table<Task & { _dirty?: boolean; _deleted?: boolean }, string>;
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
  }
}

export const db = new HabitTrackerDB();

// ── Helper: clear all data (on logout) ──
export async function clearLocalData() {
  await db.habits.clear();
  await db.tasks.clear();
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
