/**
 * Sync Engine — pushes queued local changes to server when online,
 * then pulls the latest server state and merges into IndexedDB.
 *
 * Strategy:
 *   • Write → local DB immediately + queue a sync entry
 *   • When online → flush the queue (push) → pull full state from server
 *   • Conflict resolution: server wins on pull (server is source of truth)
 */
import { db, SyncQueueItem, setLastSync } from './offlineDb';
import { habitsAPI, tasksAPI } from './api';
import { Habit, Task } from '@/types';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';
type SyncListener = (status: SyncStatus, pending: number) => void;

const listeners = new Set<SyncListener>();
let currentStatus: SyncStatus = navigator.onLine ? 'idle' : 'offline';
let syncing = false;

// ── Public API ──

export function onSyncStatus(fn: SyncListener) {
  listeners.add(fn);
  // fire immediately with current state
  db.syncQueue.count().then(n => fn(currentStatus, n));
  return () => { listeners.delete(fn); };
}

function broadcast(status: SyncStatus) {
  currentStatus = status;
  db.syncQueue.count().then(n => {
    listeners.forEach(fn => fn(status, n));
  });
}

// ── Queue a change ──
export async function enqueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retries'>) {
  await db.syncQueue.add({
    ...item,
    createdAt: Date.now(),
    retries: 0,
  });
  // If online, start syncing immediately
  if (navigator.onLine) {
    syncNow();
  } else {
    broadcast('offline');
  }
}

// ── Flush the sync queue (push) + pull from server ──
export async function syncNow() {
  if (syncing || !navigator.onLine) return;
  syncing = true;
  broadcast('syncing');

  try {
    // 1) Push queued changes
    await pushQueue();

    // 2) Pull latest from server → merge into local DB
    await pullFromServer();

    setLastSync(Date.now());
    broadcast('idle');
  } catch (err) {
    console.error('[Sync] Error:', err);
    broadcast('error');
  } finally {
    syncing = false;
  }
}

// ── Push: replay each queued action against the server ──
async function pushQueue() {
  const queue = await db.syncQueue.orderBy('createdAt').toArray();
  
  for (const item of queue) {
    try {
      await executeRemote(item);
      // Success → remove from queue
      await db.syncQueue.delete(item.id!);
    } catch (err: any) {
      const status = err?.response?.status;
      
      // If 404/409 the entity was already deleted/changed on server — drop it
      if (status === 404 || status === 409) {
        console.warn(`[Sync] Dropping stale queue item ${item.id} (${status})`);
        await db.syncQueue.delete(item.id!);
        continue;
      }

      // Increment retries; give up after 5
      const retries = (item.retries || 0) + 1;
      if (retries >= 5) {
        console.warn(`[Sync] Giving up on queue item ${item.id} after ${retries} retries`);
        await db.syncQueue.delete(item.id!);
      } else {
        await db.syncQueue.update(item.id!, { retries });
      }
    }
  }
}

async function executeRemote(item: SyncQueueItem) {
  const { entity, action, entityId, payload } = item;

  if (entity === 'habit') {
    switch (action) {
      case 'create':
        // The server will assign its own ID — we map it afterwards in pull
        await habitsAPI.create(payload);
        break;
      case 'update':
        await habitsAPI.update(entityId, payload);
        break;
      case 'delete':
        await habitsAPI.delete(entityId);
        break;
      case 'toggleDate':
        await habitsAPI.toggleDate(entityId, payload.date);
        break;
      case 'restore':
        await habitsAPI.restore(entityId);
        break;
      case 'permanentDelete':
        await habitsAPI.permanentlyDelete(entityId);
        break;
    }
  } else if (entity === 'task') {
    switch (action) {
      case 'create':
        await tasksAPI.create(payload);
        break;
      case 'update':
        await tasksAPI.update(entityId, payload);
        break;
      case 'delete':
        await tasksAPI.delete(entityId);
        break;
      case 'toggle':
        await tasksAPI.toggle(entityId);
        break;
    }
  }
}

// ── Pull: fetch full state from server, replace local DB ──
async function pullFromServer() {
  try {
    const [habitsRes, trashedRes, tasksRes] = await Promise.all([
      habitsAPI.getAll(),
      habitsAPI.getTrashed(),
      tasksAPI.getAll(),
    ]);

    const serverHabits: Habit[] = Array.isArray(habitsRes.data.data)
      ? habitsRes.data.data : [];
    const serverTrashed: Habit[] = Array.isArray(trashedRes.data.data)
      ? trashedRes.data.data : [];
    const serverTasks: Task[] = Array.isArray(tasksRes.data.data)
      ? tasksRes.data.data : [];

    // Merge: server wins — replace local data with server state
    // (only if there are no pending queue items for that entity)
    const pendingHabitIds = new Set(
      (await db.syncQueue.where('entity').equals('habit').toArray()).map(q => q.entityId)
    );
    const pendingTaskIds = new Set(
      (await db.syncQueue.where('entity').equals('task').toArray()).map(q => q.entityId)
    );

    // Clear and re-insert habits (except those with pending offline changes)
    await db.transaction('rw', db.habits, async () => {
      // Remove all that don't have pending changes
      const allLocal = await db.habits.toArray();
      const toRemove = allLocal.filter(h => !pendingHabitIds.has(h.id));
      await db.habits.bulkDelete(toRemove.map(h => h.id));

      // Insert server state (skip if local has pending changes for that ID)
      const toInsert = [...serverHabits, ...serverTrashed.map(h => ({ ...h, isTrashed: true }))]
        .filter(h => !pendingHabitIds.has(h.id));
      await db.habits.bulkPut(toInsert);
    });

    // Clear and re-insert tasks
    await db.transaction('rw', db.tasks, async () => {
      const allLocal = await db.tasks.toArray();
      const toRemove = allLocal.filter(t => !pendingTaskIds.has(t.id));
      await db.tasks.bulkDelete(toRemove.map(t => t.id));

      const toInsert = serverTasks.filter(t => !pendingTaskIds.has(t.id));
      await db.tasks.bulkPut(toInsert);
    });
  } catch (err) {
    console.error('[Sync] Pull failed:', err);
    throw err;
  }
}

// ── Auto-sync on reconnect ──
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Sync] Back online — syncing...');
    syncNow();
  });
  window.addEventListener('offline', () => {
    console.log('[Sync] Went offline');
    broadcast('offline');
  });
}
