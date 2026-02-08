/**
 * Brain Training Engine — Memory Improvement System
 *
 * 8 scientifically-backed memory exercises with auto-difficulty scaling.
 * Level-based progression, XP system, daily training streaks.
 *
 * Games:
 *   1. Number Memory   — Memorize & recall digit sequences (working memory)
 *   2. Sequence Memory  — Simon-like pattern recall (sequential memory)
 *   3. Chimp Test       — Briefly shown numbers, click in order (short-term)
 *   4. Word Recall      — Study word list, recall as many as possible (verbal)
 *   5. Visual Pairs     — Classic card matching pairs (visual memory)
 *   6. Pattern Matrix   — Grid lights up, reproduce pattern (spatial)
 *   7. Speed Match      — Is current same as previous? (processing speed)
 *   8. Memory Palace    — Loci technique: memorize items in rooms (long-term)
 *
 * Difficulty auto-scales: pass → level up → harder. Fail → stay or ease down.
 * Daily 15-min sessions build streaks and compound improvement over weeks.
 */
import { v4 as uuidv4 } from 'uuid';
import { db } from './offlineDb';
import { GameType, GameResult, PlayerProfile, DailyRecall } from '@/types';
import { formatDate } from '@/utils/helpers';

/* ═══════════════════════════════════════════════════════════════════════
   GAME DEFINITIONS
   ═══════════════════════════════════════════════════════════════════════ */
export interface GameDef {
  id: GameType;
  name: string;
  icon: string;
  description: string;
  skill: string;
  color: string;
  colorTo: string;
  instructions: string;
  avgTime: number;
}

export const GAMES: GameDef[] = [
  {
    id: 'number-memory', name: 'Number Memory', icon: '🔢',
    description: 'Memorize increasingly long number sequences',
    skill: 'Working Memory', color: 'from-blue-600', colorTo: 'to-indigo-700',
    instructions: 'A number will flash on screen. Memorize it and type it back correctly.',
    avgTime: 45,
  },
  {
    id: 'sequence-memory', name: 'Sequence Memory', icon: '🎯',
    description: 'Remember the order of flashing tiles',
    skill: 'Sequential Memory', color: 'from-purple-600', colorTo: 'to-violet-700',
    instructions: 'Tiles will flash in a sequence. Repeat the sequence by tapping tiles in the same order.',
    avgTime: 60,
  },
  {
    id: 'chimp-test', name: 'Chimp Test', icon: '🐵',
    description: 'Numbers appear briefly — click them in order',
    skill: 'Short-term Memory', color: 'from-amber-500', colorTo: 'to-orange-600',
    instructions: 'Numbers appear on a grid. After they hide, click their positions in ascending order.',
    avgTime: 40,
  },
  {
    id: 'word-recall', name: 'Word Recall', icon: '📝',
    description: 'Seen or New? Track which words you\'ve already seen',
    skill: 'Verbal Memory', color: 'from-emerald-500', colorTo: 'to-teal-600',
    instructions: 'Words appear one at a time. Mark each as "Seen" if you\'ve already seen it, or "New" if it\'s appearing for the first time.',
    avgTime: 90,
  },
  {
    id: 'visual-pairs', name: 'Visual Pairs', icon: '🃏',
    description: 'Find matching pairs of cards',
    skill: 'Visual Memory', color: 'from-pink-500', colorTo: 'to-rose-600',
    instructions: 'Cards are face down. Flip two at a time to find matching pairs. Fewer attempts = higher score.',
    avgTime: 60,
  },
  {
    id: 'pattern-matrix', name: 'Pattern Matrix', icon: '🟦',
    description: 'Memorize a grid pattern and reproduce it',
    skill: 'Spatial Memory', color: 'from-cyan-500', colorTo: 'to-blue-600',
    instructions: 'Some cells in a grid will highlight. After they disappear, tap the same cells from memory.',
    avgTime: 40,
  },
  {
    id: 'speed-match', name: 'Speed Match', icon: '⚡',
    description: 'Does the current symbol match the previous one?',
    skill: 'Processing Speed', color: 'from-red-500', colorTo: 'to-pink-600',
    instructions: 'Symbols appear one after another. Quickly decide if the current matches the previous one.',
    avgTime: 45,
  },
  {
    id: 'memory-palace', name: 'Memory Palace', icon: '🏛️',
    description: 'Place items in rooms using the loci technique',
    skill: 'Long-term Memory', color: 'from-indigo-600', colorTo: 'to-purple-700',
    instructions: 'Items will be placed in rooms of a palace. Study their locations, then recall which item was in which room.',
    avgTime: 90,
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   GAME PARAMETER SCALING — difficulty per level
   ═══════════════════════════════════════════════════════════════════════ */
export function getGameParams(game: GameType, level: number) {
  const l = Math.max(1, Math.min(level, 50));
  switch (game) {
    case 'number-memory':
      return { digits: l + 2, displayMs: Math.max(800, 3000 - l * 80) };
    case 'sequence-memory':
      return {
        sequenceLength: l + 2,
        gridSize: l <= 5 ? 3 : l <= 15 ? 4 : 5,
        flashMs: Math.max(250, 600 - l * 12),
      };
    case 'chimp-test':
      return {
        numbers: Math.min(l + 3, 25),
        gridSize: l <= 5 ? 4 : l <= 15 ? 5 : 6,
        displayMs: Math.max(500, 2500 - l * 70),
      };
    case 'word-recall':
      return {
        wordCount: Math.min(5 + l * 2, 40),
        rounds: Math.min(10 + l, 30),
      };
    case 'visual-pairs':
      return {
        pairCount: Math.min(2 + l, 15),
        previewMs: Math.max(1000, 5000 - l * 150),
      };
    case 'pattern-matrix':
      return {
        gridSize: l <= 5 ? 3 : l <= 15 ? 4 : l <= 30 ? 5 : 6,
        highlightCount: Math.min(2 + Math.floor(l * 0.7), 15),
        displayMs: Math.max(600, 2500 - l * 60),
      };
    case 'speed-match':
      return {
        rounds: Math.min(10 + l * 2, 50),
        timeLimit: Math.max(1500, 4000 - l * 80),
        symbolCount: Math.min(3 + Math.floor(l / 3), 12),
      };
    case 'memory-palace':
      return {
        rooms: Math.min(2 + Math.floor(l / 2), 12),
        itemsPerRoom: Math.min(1 + Math.floor(l / 5), 4),
        studyMs: Math.max(3000, 8000 - l * 150),
      };
    default:
      return { digits: 3, displayMs: 3000 };
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   XP & LEVELING
   ═══════════════════════════════════════════════════════════════════════ */
function calcXP(score: number, level: number, accuracy: number): number {
  const base = Math.round(score * (1 + level * 0.1));
  const accuracyBonus = accuracy >= 90 ? 1.5 : accuracy >= 70 ? 1.2 : 1;
  return Math.round(base * accuracyBonus);
}

function xpForBrainLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

export function getBrainLevel(totalXP: number): number {
  let lvl = 1;
  while (xpForBrainLevel(lvl + 1) <= totalXP && lvl < 100) lvl++;
  return lvl;
}

export function xpProgress(totalXP: number): { current: number; needed: number; pct: number } {
  const lvl = getBrainLevel(totalXP);
  const currentLevelXP = xpForBrainLevel(lvl);
  const nextLevelXP = xpForBrainLevel(lvl + 1);
  const current = totalXP - currentLevelXP;
  const needed = nextLevelXP - currentLevelXP;
  return { current, needed, pct: Math.min(100, Math.round((current / needed) * 100)) };
}

/* ═══════════════════════════════════════════════════════════════════════
   MASTERY RANKS — Your journey to Memory Master
   ═══════════════════════════════════════════════════════════════════════ */
export interface MasteryRank {
  title: string;
  emoji: string;
  minLevel: number;        // brain level threshold
  color: string;           // tailwind gradient from
  colorTo: string;         // tailwind gradient to
  description: string;     // what this rank means
}

export const MASTERY_RANKS: MasteryRank[] = [
  { title: 'Beginner',            emoji: '🌱', minLevel: 1,  color: 'from-gray-400',   colorTo: 'to-gray-500',    description: 'Starting your memory journey' },
  { title: 'Apprentice',          emoji: '📖', minLevel: 5,  color: 'from-green-400',  colorTo: 'to-emerald-500', description: 'Building the basics of recall' },
  { title: 'Practitioner',        emoji: '🧩', minLevel: 12, color: 'from-blue-400',   colorTo: 'to-blue-600',    description: 'Developing consistent memory habits' },
  { title: 'Skilled Thinker',     emoji: '🎯', minLevel: 20, color: 'from-cyan-400',   colorTo: 'to-teal-600',    description: 'Your working memory is sharpening' },
  { title: 'Sharp Mind',          emoji: '⚡', minLevel: 30, color: 'from-indigo-500', colorTo: 'to-violet-600',  description: 'Noticeably faster recall & pattern recognition' },
  { title: 'Memory Adept',        emoji: '🔮', minLevel: 42, color: 'from-purple-500', colorTo: 'to-purple-700',  description: 'Your brain is rewiring for strength' },
  { title: 'Elite Memorizer',     emoji: '👑', minLevel: 55, color: 'from-amber-400',  colorTo: 'to-orange-600',  description: 'Top-tier retention & speed' },
  { title: 'Grandmaster',         emoji: '🏆', minLevel: 72, color: 'from-rose-500',   colorTo: 'to-red-700',     description: 'Memory skills rival trained mnemonists' },
  { title: 'Memory Master',       emoji: '🧠', minLevel: 90, color: 'from-amber-300',  colorTo: 'to-yellow-500',  description: 'You have mastered your memory — legendary recall' },
];

export interface MasteryInfo {
  current: MasteryRank;
  next: MasteryRank | null;  // null when at max rank
  progress: number;          // 0-100% toward next rank
  levelsToNext: number;      // brain levels remaining to next rank
  isMemoryMaster: boolean;
}

export function getMasteryInfo(brainLevel: number): MasteryInfo {
  let currentRank = MASTERY_RANKS[0];
  let nextRank: MasteryRank | null = null;

  for (let i = MASTERY_RANKS.length - 1; i >= 0; i--) {
    if (brainLevel >= MASTERY_RANKS[i].minLevel) {
      currentRank = MASTERY_RANKS[i];
      nextRank = i < MASTERY_RANKS.length - 1 ? MASTERY_RANKS[i + 1] : null;
      break;
    }
  }

  let progress = 100;
  let levelsToNext = 0;
  if (nextRank) {
    const rangeStart = currentRank.minLevel;
    const rangeEnd = nextRank.minLevel;
    progress = Math.min(100, Math.round(((brainLevel - rangeStart) / (rangeEnd - rangeStart)) * 100));
    levelsToNext = nextRank.minLevel - brainLevel;
  }

  return {
    current: currentRank,
    next: nextRank,
    progress,
    levelsToNext,
    isMemoryMaster: brainLevel >= 90,
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   DAILY TRAINING SESSION — pick 4 games
   ═══════════════════════════════════════════════════════════════════════ */
export function getDailyGames(): GameType[] {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const shuffled = [...GAMES].sort((a, b) => {
    const ha = ((dayOfYear * 7 + a.id.charCodeAt(0)) % 97);
    const hb = ((dayOfYear * 7 + b.id.charCodeAt(0)) % 97);
    return ha - hb;
  });
  return shuffled.slice(0, 4).map(g => g.id);
}

/* ═══════════════════════════════════════════════════════════════════════
   GAME DATA — Word Bank, Palace Rooms/Items, Speed Symbols
   ═══════════════════════════════════════════════════════════════════════ */
export const WORD_BANK = [
  'mountain','river','candle','forest','bridge','silver','garden','rhythm',
  'crystal','thunder','basket','mirror','sunset','marble','anchor','whisper',
  'castle','feather','rocket','lantern','shadow','puzzle','breeze','velvet',
  'compass','island','dragon','blossom','harbor','legend','copper','voyage',
  'meadow','scarlet','temple','falcon','potion','summit','canyon','beacon',
  'cobalt','glacier','mystic','nebula','orchid','quartz','saffron','tundra',
  'vortex','zenith','amber','cosmos','dune','ember','fjord','grove',
  'haven','ivory','jade','karma','lotus','nimbus','opal','prism',
  'realm','surge','tide','unity','vapor','weave','atlas','bloom',
  'cedar','drift','epoch','flame','glyph','haste','index','jewel',
  'knack','lunar','mango','nexus','ocean','plume','quest','ridge',
  'solar','trace','umbra','vista','wrath','yield','zinc','abyss',
  'blaze','crest','delta','eclipse','frost','grain','hollow','ignite',
];

export const PALACE_ROOMS = [
  { name: 'Entrance Hall', emoji: '🚪' },
  { name: 'Living Room', emoji: '🛋️' },
  { name: 'Kitchen', emoji: '🍳' },
  { name: 'Library', emoji: '📚' },
  { name: 'Bedroom', emoji: '🛏️' },
  { name: 'Garden', emoji: '🌿' },
  { name: 'Attic', emoji: '🏚️' },
  { name: 'Basement', emoji: '🔦' },
  { name: 'Balcony', emoji: '🌅' },
  { name: 'Study', emoji: '🖊️' },
  { name: 'Bathroom', emoji: '🛁' },
  { name: 'Garage', emoji: '🚗' },
];

export const PALACE_ITEMS = [
  '🦁 Lion','🎸 Guitar','🔑 Golden Key','🎩 Top Hat','🧲 Magnet',
  '🦅 Eagle','🎪 Circus Tent','💎 Diamond','🗡️ Sword','🎭 Mask',
  '🦋 Butterfly','🔭 Telescope','🏺 Ancient Vase','🧊 Ice Cube','🎯 Dartboard',
  '🦊 Fox','🪄 Magic Wand','🧬 DNA Helix','🌋 Volcano','🎻 Violin',
  '🐙 Octopus','🗿 Moai Statue','🧭 Compass','🪐 Saturn','🎲 Dice',
  '🦜 Parrot','🏆 Trophy','⚗️ Potion','🪞 Mirror','🎨 Palette',
  '🐉 Dragon','🔮 Crystal Ball','⚡ Lightning Bolt','🪶 Feather','🧸 Teddy Bear',
  '🦈 Shark','🎹 Piano','📿 Beads','🗺️ Map','🎠 Carousel',
  '🐺 Wolf','🏮 Lantern','🧿 Evil Eye','🪃 Boomerang','🎬 Clapperboard',
  '🦉 Owl','🔔 Bell','⏳ Hourglass','🪨 Boulder',
];

export const SPEED_SYMBOLS = ['◆','●','▲','■','★','♥','◐','✦','⬟','⬡','⬢','✿'];

/* ═══════════════════════════════════════════════════════════════════════
   PLAYER PROFILE DEFAULTS
   ═══════════════════════════════════════════════════════════════════════ */
const DEFAULT_GAME_LEVELS: Record<GameType, number> = {
  'number-memory': 1, 'sequence-memory': 1, 'chimp-test': 1, 'word-recall': 1,
  'visual-pairs': 1, 'pattern-matrix': 1, 'speed-match': 1, 'memory-palace': 1,
};
const DEFAULT_SCORES: Record<GameType, number> = {
  'number-memory': 0, 'sequence-memory': 0, 'chimp-test': 0, 'word-recall': 0,
  'visual-pairs': 0, 'pattern-matrix': 0, 'speed-match': 0, 'memory-palace': 0,
};
const DEFAULT_PLAYS: Record<GameType, number> = {
  'number-memory': 0, 'sequence-memory': 0, 'chimp-test': 0, 'word-recall': 0,
  'visual-pairs': 0, 'pattern-matrix': 0, 'speed-match': 0, 'memory-palace': 0,
};

function defaultProfile(): PlayerProfile {
  return {
    id: 'player', brainLevel: 1, totalXP: 0,
    currentStreak: 0, bestStreak: 0, lastTrainedDate: '',
    gamesPlayed: 0,
    gameLevels: { ...DEFAULT_GAME_LEVELS },
    gameHighScores: { ...DEFAULT_SCORES },
    gamePlays: { ...DEFAULT_PLAYS },
    dailyGoalMinutes: 15,
    createdAt: new Date().toISOString(),
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   API
   ═══════════════════════════════════════════════════════════════════════ */
export const memoryAPI = {
  async getProfile(): Promise<PlayerProfile> {
    let profile = await db.playerProfile.get('player');
    if (!profile) {
      profile = defaultProfile();
      await db.playerProfile.put(profile);
    }
    const today = formatDate();
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    if (profile.lastTrainedDate && profile.lastTrainedDate !== today && profile.lastTrainedDate !== yesterday) {
      profile.currentStreak = 0;
      await db.playerProfile.put(profile);
    }
    return profile;
  },

  async recordResult(game: GameType, score: number, level: number, accuracy: number, duration: number): Promise<{ result: GameResult; profile: PlayerProfile; leveledUp: boolean; newBrainLevel: boolean }> {
    const today = formatDate();
    const profile = await this.getProfile();
    const xpEarned = calcXP(score, level, accuracy);
    const result: GameResult = {
      id: uuidv4(), game, score, level, xpEarned, accuracy, duration, date: today,
      createdAt: new Date().toISOString(),
    };
    await db.gameResults.put(result);

    const oldBrainLevel = profile.brainLevel;
    profile.totalXP += xpEarned;
    profile.brainLevel = getBrainLevel(profile.totalXP);
    profile.gamesPlayed++;
    profile.gamePlays[game] = (profile.gamePlays[game] || 0) + 1;
    if (score > (profile.gameHighScores[game] || 0)) profile.gameHighScores[game] = score;

    let leveledUp = false;
    if (accuracy >= 60 && level >= (profile.gameLevels[game] || 1)) {
      profile.gameLevels[game] = Math.min(level + 1, 50);
      leveledUp = true;
    } else if (accuracy < 30 && level > 1) {
      profile.gameLevels[game] = Math.max(level - 1, 1);
    }

    const yesterday = formatDate(new Date(Date.now() - 86400000));
    if (profile.lastTrainedDate !== today) {
      profile.currentStreak = profile.lastTrainedDate === yesterday ? profile.currentStreak + 1 : 1;
      profile.lastTrainedDate = today;
    }
    if (profile.currentStreak > profile.bestStreak) profile.bestStreak = profile.currentStreak;
    await db.playerProfile.put(profile);

    return { result, profile, leveledUp, newBrainLevel: profile.brainLevel > oldBrainLevel };
  },

  async getTodayResults(): Promise<GameResult[]> {
    const today = formatDate();
    return db.gameResults.where('date').equals(today).toArray();
  },

  async getGameHistory(game: GameType, limit = 30): Promise<GameResult[]> {
    return db.gameResults.where('game').equals(game).reverse().limit(limit).toArray();
  },

  async getStats(): Promise<{
    brainLevel: number; totalXP: number; streak: number; bestStreak: number;
    gamesPlayed: number; trainedToday: boolean; todayGames: number; avgAccuracy: number;
  }> {
    const profile = await this.getProfile();
    const today = formatDate();
    const todayResults = await this.getTodayResults();
    const avgAcc = todayResults.length > 0
      ? Math.round(todayResults.reduce((s, r) => s + r.accuracy, 0) / todayResults.length) : 0;
    return {
      brainLevel: profile.brainLevel, totalXP: profile.totalXP,
      streak: profile.currentStreak, bestStreak: profile.bestStreak,
      gamesPlayed: profile.gamesPlayed, trainedToday: profile.lastTrainedDate === today,
      todayGames: todayResults.length, avgAccuracy: avgAcc,
    };
  },

  async isDailyComplete(): Promise<boolean> {
    return (await this.getTodayResults()).length >= 4;
  },

  async getWeeklyProgress(): Promise<{ date: string; games: number; xp: number; accuracy: number }[]> {
    const results = await db.gameResults.toArray();
    const days: Record<string, { games: number; xp: number; totalAcc: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days[formatDate(d)] = { games: 0, xp: 0, totalAcc: 0 };
    }
    results.forEach(r => {
      if (days[r.date] !== undefined) {
        days[r.date].games++;
        days[r.date].xp += r.xpEarned;
        days[r.date].totalAcc += r.accuracy;
      }
    });
    return Object.entries(days).map(([date, d]) => ({
      date, games: d.games, xp: d.xp,
      accuracy: d.games > 0 ? Math.round(d.totalAcc / d.games) : 0,
    }));
  },
};

/* ═════════════════════════════════════════════════════════════════════
   DAILY RECALL — Evening Memory Journal
   ═════════════════════════════════════════════════════════════════════ */
export const RECALL_PROMPTS = [
  'What did you have for breakfast today?',
  'Who did you talk to today? What about?',
  'What was the most interesting thing you learned?',
  'What emotions did you feel most strongly?',
  'Describe something you saw on your way today.',
  'What did you eat for lunch/dinner?',
  'What tasks did you complete today?',
  'What was the highlight of your day?',
  'What was challenging or frustrating today?',
  'Name 3 specific details about a conversation you had.',
  'What were you wearing today?',
  'What sounds do you remember hearing?',
  'What was the weather like?',
  'What time did you wake up and what did you do first?',
  'Recall a specific moment that made you smile.',
];

export const dailyRecallAPI = {
  async getTodayRecall(): Promise<DailyRecall | null> {
    const today = formatDate();
    const recall = await db.dailyRecalls.get(today);
    return recall || null;
  },

  async saveRecall(entries: string[], mood: DailyRecall['mood'], clarityScore: number): Promise<DailyRecall> {
    const today = formatDate();
    const recall: DailyRecall = {
      id: today,
      entries,
      mood,
      clarityScore,
      date: today,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    await db.dailyRecalls.put(recall);
    return recall;
  },

  async getRecallHistory(limit = 30): Promise<DailyRecall[]> {
    return db.dailyRecalls.orderBy('date').reverse().limit(limit).toArray();
  },

  async getRecallStreak(): Promise<number> {
    const recalls = await db.dailyRecalls.orderBy('date').reverse().toArray();
    if (recalls.length === 0) return 0;
    let streak = 0;
    let checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = formatDate(checkDate);
      if (recalls.find(r => r.date === dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  },

  async getAvgClarity(days = 7): Promise<number> {
    const recalls = await db.dailyRecalls.orderBy('date').reverse().limit(days).toArray();
    if (recalls.length === 0) return 0;
    return Math.round(recalls.reduce((s, r) => s + r.clarityScore, 0) / recalls.length * 10) / 10;
  },

  getDailyPrompts(): string[] {
    const day = new Date().getDate();
    const shuffled = [...RECALL_PROMPTS].sort((a, b) => {
      return ((day * 13 + a.charCodeAt(0)) % 47) - ((day * 13 + b.charCodeAt(0)) % 47);
    });
    return shuffled.slice(0, 5);
  },

  isRecallTime(): boolean {
    const hour = new Date().getHours();
    return hour >= 20 || hour <= 1; // 8 PM to 1 AM
  },
};
