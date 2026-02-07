/**
 * Offline-First API
 *
 * Every operation:
 *   1. Writes to IndexedDB instantly (so UI updates immediately)
 *   2. Queues a sync entry (pushed to server when online)
 *   3. Reads always come from local DB
 */
import { v4 as uuidv4 } from 'uuid';
import { db } from './offlineDb';
import { enqueue, syncNow } from './syncEngine';
import { Habit, Task } from '@/types';

// ──────────────────────────────────────────────
//  HABITS
// ──────────────────────────────────────────────

export const offlineHabitsAPI = {
  /** Get all active (non-trashed) habits from local DB */
  async getAll(): Promise<Habit[]> {
    return db.habits.filter(h => !h.isTrashed && !h._deleted).toArray();
  },

  /** Get trashed habits from local DB */
  async getTrashed(): Promise<Habit[]> {
    return db.habits.filter(h => !!h.isTrashed && !h._deleted).toArray();
  },

  /** Create a new habit — instant local + queued sync */
  async create(data: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'createdAt'>): Promise<Habit> {
    const habit: Habit = {
      ...data,
      id: uuidv4(),
      streak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    await db.habits.put(habit);
    await enqueue({ entity: 'habit', action: 'create', entityId: habit.id, payload: data });
    return habit;
  },

  /** Update a habit */
  async update(id: string, updates: Partial<Habit>): Promise<Habit> {
    const existing = await db.habits.get(id);
    if (!existing) throw new Error('Habit not found locally');
    const updated = { ...existing, ...updates };
    await db.habits.put(updated);
    await enqueue({ entity: 'habit', action: 'update', entityId: id, payload: updates });
    return updated;
  },

  /** Soft-delete (move to trash) */
  async delete(id: string): Promise<void> {
    const habit = await db.habits.get(id);
    if (habit) {
      await db.habits.put({ ...habit, isTrashed: true });
      // Also remove associated tasks locally
      await db.tasks.where('habitId').equals(id).delete();
    }
    await enqueue({ entity: 'habit', action: 'delete', entityId: id });
  },

  /** Restore from trash */
  async restore(id: string): Promise<Habit> {
    const habit = await db.habits.get(id);
    if (!habit) throw new Error('Habit not found locally');
    const restored = { ...habit, isTrashed: false };
    await db.habits.put(restored);
    await enqueue({ entity: 'habit', action: 'restore', entityId: id });
    return restored;
  },

  /** Permanently delete from trash */
  async permanentlyDelete(id: string): Promise<void> {
    await db.habits.delete(id);
    await enqueue({ entity: 'habit', action: 'permanentDelete', entityId: id });
  },

  /** Toggle a date on/off for a habit */
  async toggleDate(id: string, date: string): Promise<Habit> {
    const habit = await db.habits.get(id);
    if (!habit) throw new Error('Habit not found locally');

    const alreadyDone = habit.completedDates.includes(date);
    const updated: Habit = {
      ...habit,
      completedDates: alreadyDone
        ? habit.completedDates.filter(d => d !== date)
        : [...habit.completedDates, date],
      streak: alreadyDone ? Math.max(0, habit.streak - 1) : habit.streak + 1,
    };
    await db.habits.put(updated);
    await enqueue({ entity: 'habit', action: 'toggleDate', entityId: id, payload: { date } });
    return updated;
  },
};

// ──────────────────────────────────────────────
//  TASKS
// ──────────────────────────────────────────────

export const offlineTasksAPI = {
  /** Get all tasks from local DB */
  async getAll(): Promise<Task[]> {
    return db.tasks.filter(t => !t._deleted).toArray();
  },

  /** Create a new task */
  async create(data: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const task: Task = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await db.tasks.put(task);
    await enqueue({ entity: 'task', action: 'create', entityId: task.id, payload: data });
    return task;
  },

  /** Update a task */
  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const existing = await db.tasks.get(id);
    if (!existing) throw new Error('Task not found locally');
    const updated = { ...existing, ...updates };
    await db.tasks.put(updated);
    await enqueue({ entity: 'task', action: 'update', entityId: id, payload: updates });
    return updated;
  },

  /** Delete a task */
  async delete(id: string): Promise<void> {
    await db.tasks.delete(id);
    await enqueue({ entity: 'task', action: 'delete', entityId: id });
  },

  /** Toggle task completed */
  async toggle(id: string): Promise<Task> {
    const task = await db.tasks.get(id);
    if (!task) throw new Error('Task not found locally');
    const toggled = { ...task, completed: !task.completed };
    await db.tasks.put(toggled);
    await enqueue({ entity: 'task', action: 'toggle', entityId: id });
    return toggled;
  },
};

// ── Initial load: populate local DB from server if empty ──
export async function initialSync(): Promise<void> {
  if (navigator.onLine) {
    await syncNow();
  }
  // If offline and local DB has data, that's fine — UI reads from local
}
