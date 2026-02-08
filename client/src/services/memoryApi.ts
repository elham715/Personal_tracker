/**
 * Memory System — Offline-First API
 *
 * Spaced repetition flashcard system using SM-2 algorithm.
 * All data stored locally in IndexedDB via Dexie.
 * (Server sync can be added later)
 */
import { v4 as uuidv4 } from 'uuid';
import { db } from './offlineDb';
import { MemoryCard } from '@/types';
import { formatDate } from '@/utils/helpers';

// SM-2 defaults
const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;

export const memoryAPI = {
  /** Get all cards */
  async getAll(): Promise<MemoryCard[]> {
    return db.memoryCards.toArray();
  },

  /** Get cards due for review today (nextReview <= today) */
  async getDueCards(): Promise<MemoryCard[]> {
    const today = formatDate();
    return db.memoryCards.filter(c => c.nextReview <= today).toArray();
  },

  /** Get cards by category */
  async getByCategory(category: string): Promise<MemoryCard[]> {
    return db.memoryCards.where('category').equals(category).toArray();
  },

  /** Create a new card */
  async create(data: Omit<MemoryCard, 'id' | 'interval' | 'easeFactor' | 'repetitions' | 'nextReview' | 'lastReviewed' | 'timesReviewed' | 'timesCorrect' | 'streak' | 'createdAt'>): Promise<MemoryCard> {
    const today = formatDate();
    const card: MemoryCard = {
      ...data,
      id: uuidv4(),
      interval: 0,
      easeFactor: DEFAULT_EASE,
      repetitions: 0,
      nextReview: today,     // review immediately
      lastReviewed: '',
      timesReviewed: 0,
      timesCorrect: 0,
      streak: 0,
      createdAt: new Date().toISOString(),
    };
    await db.memoryCards.put(card);
    return card;
  },

  /** Update a card */
  async update(id: string, updates: Partial<MemoryCard>): Promise<MemoryCard> {
    const existing = await db.memoryCards.get(id);
    if (!existing) throw new Error('Card not found');
    const updated = { ...existing, ...updates };
    await db.memoryCards.put(updated);
    return updated;
  },

  /** Delete a card */
  async delete(id: string): Promise<void> {
    await db.memoryCards.delete(id);
  },

  /**
   * Review a card using SM-2 algorithm
   * @param quality 0-5 rating (0=blackout, 5=perfect)
   *   Simplified: 'wrong' = 0, 'hard' = 2, 'good' = 3, 'easy' = 5
   */
  async review(id: string, quality: number): Promise<MemoryCard> {
    const card = await db.memoryCards.get(id);
    if (!card) throw new Error('Card not found');

    const today = formatDate();
    let { interval, easeFactor, repetitions, streak, timesReviewed, timesCorrect } = card;

    timesReviewed++;

    if (quality >= 3) {
      // Correct answer
      timesCorrect++;
      streak++;
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 3;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions++;
    } else {
      // Wrong answer — reset
      repetitions = 0;
      interval = 1;
      streak = 0;
    }

    // Update ease factor (SM-2 formula)
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < MIN_EASE) easeFactor = MIN_EASE;

    // Calculate next review date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);
    const nextReview = formatDate(nextDate);

    const updated: MemoryCard = {
      ...card,
      interval,
      easeFactor,
      repetitions,
      nextReview,
      lastReviewed: today,
      timesReviewed,
      timesCorrect,
      streak,
    };

    await db.memoryCards.put(updated);
    return updated;
  },

  /** Get all unique categories */
  async getCategories(): Promise<string[]> {
    const cards = await db.memoryCards.toArray();
    return [...new Set(cards.map(c => c.category))];
  },

  /** Get review stats */
  async getStats() {
    const all = await db.memoryCards.toArray();
    const today = formatDate();
    const due = all.filter(c => c.nextReview <= today);
    const mastered = all.filter(c => c.repetitions >= 5);
    const totalReviews = all.reduce((s, c) => s + c.timesReviewed, 0);
    const totalCorrect = all.reduce((s, c) => s + c.timesCorrect, 0);
    const bestStreak = all.reduce((m, c) => Math.max(m, c.streak), 0);

    return {
      totalCards: all.length,
      dueToday: due.length,
      mastered: mastered.length,
      totalReviews,
      accuracy: totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0,
      bestStreak,
    };
  },
};
