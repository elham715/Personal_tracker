import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Brain, ChevronLeft, ChevronRight, Flame, Zap, Star, TrendingUp, Moon, Check, BookOpen, Pencil, X } from 'lucide-react';
import { GameType, PlayerProfile, DailyRecall } from '@/types';
import {
  memoryAPI, GAMES, getGameParams, xpProgress, getDailyGames,
  WORD_BANK, PALACE_ROOMS, PALACE_ITEMS, SPEED_SYMBOLS,
  dailyRecallAPI, getMasteryInfo, MASTERY_RANKS, type GameDef,
} from '@/services/memoryApi';

/* ═══════════════════════════════════════════════════════════════════════
   BRAIN TRAINING — Memory Improvement Platform
   8 games · Daily Recall journal · Auto-difficulty · Level progression
   ═══════════════════════════════════════════════════════════════════════ */

type View = 'hub' | 'games' | 'playing' | 'countdown' | 'result' | 'progress' | 'recall' | 'recall-history' | 'handbook';

/* ── Countdown overlay before game starts ── */
const Countdown: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (count === 0) { onDone(); return; }
    const t = setTimeout(() => setCount(c => c - 1), 700);
    return () => clearTimeout(t);
  }, [count, onDone]);
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div key={count} className="animate-pop-in">
        {count > 0 ? (
          <span className="text-7xl font-black text-white drop-shadow-lg">{count}</span>
        ) : (
          <span className="text-4xl font-black text-emerald-400 drop-shadow-lg">GO!</span>
        )}
      </div>
    </div>
  );
};

/* ── Timer bar component ── */
const TimerBar: React.FC<{ duration: number; running: boolean; color?: string }> = ({ duration, running, color = 'bg-indigo-500' }) => {
  const [pct, setPct] = useState(100);
  const startRef = useRef(Date.now());
  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    setPct(100);
    const iv = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setPct(remaining);
      if (remaining <= 0) clearInterval(iv);
    }, 50);
    return () => clearInterval(iv);
  }, [duration, running]);
  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
      <div className={`h-full rounded-full transition-none ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

/* ── Score pop animation ── */
const ScorePop: React.FC<{ value: string; correct: boolean }> = ({ value, correct }) => (
  <div className={`absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold pointer-events-none animate-pop-in ${correct ? 'text-emerald-500' : 'text-red-400'}`}>
    {value}
  </div>
);

const Memory: React.FC = () => {
  const [view, setView] = useState<View>('hub');
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [todayGames, setTodayGames] = useState<string[]>([]);
  const [dailyGames] = useState<GameType[]>(getDailyGames());
  const [selectedGame, setSelectedGame] = useState<GameDef | null>(null);
  const [weeklyData, setWeeklyData] = useState<{ date: string; games: number; xp: number; accuracy: number }[]>([]);
  const [recallDone, setRecallDone] = useState(false);
  const [recallStreak, setRecallStreak] = useState(0);

  // Game result state
  const [lastScore, setLastScore] = useState(0);
  const [lastAccuracy, setLastAccuracy] = useState(0);
  const [lastXP, setLastXP] = useState(0);
  const [lastDuration, setLastDuration] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [newBrainLevel, setNewBrainLevel] = useState(false);

  const refresh = useCallback(async () => {
    const [p, today, weekly, todayRecall, rStreak] = await Promise.all([
      memoryAPI.getProfile(),
      memoryAPI.getTodayResults(),
      memoryAPI.getWeeklyProgress(),
      dailyRecallAPI.getTodayRecall(),
      dailyRecallAPI.getRecallStreak(),
    ]);
    setProfile(p);
    setTodayGames(today.map(r => r.game));
    setWeeklyData(weekly);
    setRecallDone(!!todayRecall);
    setRecallStreak(rStreak);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const startGame = (game: GameDef) => {
    setSelectedGame(game);
    setView('countdown');
  };

  const onCountdownDone = () => setView('playing');

  const finishGame = async (score: number, accuracy: number, duration: number) => {
    if (!selectedGame || !profile) return;
    const level = profile.gameLevels[selectedGame.id] || 1;
    const res = await memoryAPI.recordResult(selectedGame.id, score, level, accuracy, duration);
    setLastScore(score);
    setLastAccuracy(accuracy);
    setLastXP(res.result.xpEarned);
    setLastDuration(duration);
    setLeveledUp(res.leveledUp);
    setNewBrainLevel(res.newBrainLevel);
    setProfile(res.profile);
    await refresh();
    setView('result');
  };

  if (!profile) return (
    <div className="page-container max-w-lg lg:max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const xp = xpProgress(profile.totalXP);
  const dailyComplete = todayGames.length >= 4;
  const isRecallTime = dailyRecallAPI.isRecallTime();

  /* ═══════════════════════════════════════════════════════════════
     COUNTDOWN SCREEN
     ═══════════════════════════════════════════════════════════════ */
  if (view === 'countdown' && selectedGame) {
    return <Countdown onDone={onCountdownDone} />;
  }

  /* ═══════════════════════════════════════════════════════════════
     RESULT SCREEN — polished with star rating
     ═══════════════════════════════════════════════════════════════ */
  if (view === 'result' && selectedGame) {
    const stars = lastAccuracy >= 90 ? 3 : lastAccuracy >= 60 ? 2 : lastAccuracy >= 30 ? 1 : 0;
    return (
      <div className="page-container max-w-lg lg:max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center">
        {newBrainLevel && (
          <div className="mb-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-5 py-2.5 rounded-full text-sm lg:text-base font-bold animate-pop-in shadow-lg shadow-amber-400/30">
            🧠 Brain Level Up! → Level {profile.brainLevel}
          </div>
        )}

        <div className="text-5xl lg:text-6xl mb-2 animate-float">{selectedGame.icon}</div>
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">{selectedGame.name}</h2>
        <p className="text-xs text-gray-400 mb-4">Level {profile.gameLevels[selectedGame.id] || 1}</p>

        {/* Star Rating */}
        <div className="flex gap-1 mb-4">
          {[1, 2, 3].map(s => (
            <div key={s} className={`transition-all duration-300 ${s <= stars ? 'animate-pop-in' : 'opacity-20'}`}
              style={{ animationDelay: `${s * 150}ms` }}>
              <Star size={28} className={s <= stars ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4 w-full max-w-sm lg:max-w-lg">
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Score</p>
            <p className="text-2xl font-black text-indigo-600">{lastScore}</p>
          </div>
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Accuracy</p>
            <p className="text-2xl font-black text-emerald-600">{lastAccuracy}%</p>
          </div>
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">XP Earned</p>
            <p className="text-2xl font-black text-amber-600">+{lastXP}</p>
          </div>
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Time</p>
            <p className="text-2xl font-black text-gray-700">{lastDuration}s</p>
          </div>
        </div>

        {leveledUp && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 mb-3 animate-pop-in">
            <p className="text-sm font-bold text-purple-700">
              ⬆️ Level Up! Now Level {profile.gameLevels[selectedGame.id]}
            </p>
          </div>
        )}

        {(profile.gameHighScores[selectedGame.id] || 0) === lastScore && lastScore > 0 && (
          <p className="text-xs text-amber-600 font-bold mb-3">🏆 New High Score!</p>
        )}

        <div className="flex gap-3 mt-3 w-full max-w-sm">
          <button onClick={() => { setView('countdown'); }}
            className="flex-1 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl active:scale-95 transition-transform shadow-md shadow-indigo-600/30">
            Play Again
          </button>
          <button onClick={() => { setView('hub'); refresh(); }}
            className="flex-1 py-3 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl active:scale-95 transition-transform">
            Done
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     GAME PLAY SCREEN
     ═══════════════════════════════════════════════════════════════ */
  if (view === 'playing' && selectedGame) {
    const level = profile.gameLevels[selectedGame.id] || 1;
    return (
      <div className="page-container max-w-lg lg:max-w-2xl mx-auto">
        {/* Game Header */}
        <div className="flex items-center justify-between pt-2 mb-4">
          <button onClick={() => setView('hub')} className="flex items-center gap-1 text-gray-400 text-sm font-medium">
            <ChevronLeft size={16} /> Quit
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">{selectedGame.icon}</span>
            <span className="text-sm font-bold text-gray-800">{selectedGame.name}</span>
          </div>
          <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Lv.{level}</span>
        </div>
        <GamePlayer game={selectedGame} level={level} onFinish={finishGame} />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     HANDBOOK — The Memory Master's Guide
     ═══════════════════════════════════════════════════════════════ */
  if (view === 'handbook') {
    return <HandbookView onBack={() => setView('hub')} profile={profile} />;
  }

  /* ═══════════════════════════════════════════════════════════════
     DAILY RECALL JOURNAL
     ═══════════════════════════════════════════════════════════════ */
  if (view === 'recall') {
    return <DailyRecallView onBack={() => { setView('hub'); refresh(); }} />;
  }

  /* ═══════════════════════════════════════════════════════════════
     RECALL HISTORY
     ═══════════════════════════════════════════════════════════════ */
  if (view === 'recall-history') {
    return <RecallHistoryView onBack={() => setView('hub')} />;
  }

  /* ═══════════════════════════════════════════════════════════════
     PROGRESS VIEW
     ═══════════════════════════════════════════════════════════════ */
  if (view === 'progress') {
    return (
      <div className="page-container max-w-lg lg:max-w-4xl mx-auto">
        <div className="flex items-center gap-3 pt-4 mb-5">
          <button onClick={() => setView('hub')} className="p-1"><ChevronLeft size={20} className="text-gray-400" /></button>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Your Progress</h1>
        </div>

        {/* Brain Level Card */}
        <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-2xl p-5 mb-4 text-white shadow-lg shadow-purple-600/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Brain Level</p>
              <p className="text-4xl font-black">{profile.brainLevel}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center animate-float">
              <Brain size={32} className="text-white" />
            </div>
          </div>
          <div className="bg-white/20 rounded-full h-3 overflow-hidden mb-1">
            <div className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full rounded-full transition-all duration-700" style={{ width: `${xp.pct}%` }} />
          </div>
          <div className="flex justify-between">
            <p className="text-[10px] text-white/40">{profile.totalXP.toLocaleString()} total XP</p>
            <p className="text-[10px] text-white/40">{xp.current}/{xp.needed} to next</p>
          </div>
        </div>

        {/* Mastery Rank Ladder */}
        {(() => { const mastery = getMasteryInfo(profile.brainLevel); return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
            <span>🏆</span> Mastery Ranks
          </h3>
          <div className="space-y-1.5">
            {MASTERY_RANKS.map((rank, i) => {
              const isActive = rank.title === mastery.current.title;
              const isLocked = profile.brainLevel < rank.minLevel;
              const isAchieved = profile.brainLevel >= rank.minLevel && !isActive;
              return (
                <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                  isActive ? `bg-gradient-to-r ${rank.color} ${rank.colorTo} shadow-md` : isAchieved ? 'bg-gray-50' : 'bg-gray-50/50 opacity-50'
                }`}>
                  <span className={`text-lg ${isLocked ? 'grayscale' : ''}`}>{rank.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${isActive ? 'text-white' : isAchieved ? 'text-gray-700' : 'text-gray-400'}`}>{rank.title}</p>
                    <p className={`text-[10px] ${isActive ? 'text-white/60' : 'text-gray-400'}`}>{rank.description}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className={`text-[10px] font-bold ${isActive ? 'text-white/80' : 'text-gray-400'}`}>Lv.{rank.minLevel}+</p>
                    {isAchieved && <span className="text-[9px] text-emerald-500 font-bold">✓</span>}
                    {isActive && <span className="text-[9px] text-white font-bold">NOW</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        ); })()}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          {[
            { label: 'Games', value: profile.gamesPlayed, color: 'text-gray-800' },
            { label: 'Streak', value: `${profile.currentStreak}d`, color: 'text-indigo-600' },
            { label: 'Best', value: `${profile.bestStreak}d`, color: 'text-orange-500' },
            { label: 'Recall', value: `${recallStreak}d`, color: 'text-violet-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-2.5 text-center shadow-sm border border-gray-100">
              <p className="text-[9px] text-gray-400 font-semibold">{s.label}</p>
              <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Weekly Activity */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-indigo-500" /> This Week
          </h3>
          <div className="flex gap-1.5">
            {weeklyData.map((d, i) => {
              const dayLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'narrow' });
              const maxGames = Math.max(...weeklyData.map(w => w.games), 1);
              const h = d.games > 0 ? Math.max(16, (d.games / maxGames) * 72) : 4;
              const isToday = i === weeklyData.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: 80 }}>
                    <div className={`w-full max-w-[20px] rounded-t-md transition-all ${
                      d.games > 0
                        ? isToday ? 'bg-gradient-to-t from-indigo-600 to-purple-500' : 'bg-gradient-to-t from-indigo-400 to-purple-300'
                        : 'bg-gray-100'
                    }`} style={{ height: h }} />
                  </div>
                  <span className={`text-[9px] font-semibold ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>{dayLabel}</span>
                  {d.games > 0 && <span className="text-[8px] text-indigo-500 font-bold">{d.xp}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-Game Levels */}
        <h3 className="text-sm font-bold text-gray-800 mb-3">Game Mastery</h3>
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {GAMES.map(g => {
            const lvl = profile.gameLevels[g.id] || 1;
            const pct = (lvl / 50) * 100;
            const hs = profile.gameHighScores[g.id] || 0;
            const plays = profile.gamePlays[g.id] || 0;
            return (
              <button key={g.id} onClick={() => startGame(g)}
                className="w-full bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-left active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${g.color} ${g.colorTo} flex items-center justify-center text-lg`}>
                    {g.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800">{g.name}</p>
                    <p className="text-[10px] text-gray-400">{plays} plays · Best: {hs}</p>
                  </div>
                  <span className="text-sm font-black text-indigo-600">Lv.{lvl}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${g.color} ${g.colorTo}`} style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     ALL GAMES VIEW
     ═══════════════════════════════════════════════════════════════ */
  if (view === 'games') {
    return (
      <div className="page-container max-w-lg lg:max-w-4xl mx-auto">
        <div className="flex items-center gap-3 pt-4 mb-5">
          <button onClick={() => setView('hub')} className="p-1"><ChevronLeft size={20} className="text-gray-400" /></button>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">All Games</h1>
        </div>
        <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {GAMES.map((g, idx) => {
            const lvl = profile.gameLevels[g.id] || 1;
            const hs = profile.gameHighScores[g.id] || 0;
            return (
              <button key={g.id} onClick={() => startGame(g)}
                className="w-full text-left rounded-2xl overflow-hidden active:scale-[0.98] transition-transform animate-fade-up"
                style={{ animationDelay: `${idx * 40}ms` }}>
                <div className={`bg-gradient-to-r ${g.color} ${g.colorTo} p-4 flex items-center gap-3`}>
                  <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-2xl flex-shrink-0">
                    {g.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold">{g.name}</p>
                    <p className="text-white/50 text-[10px]">{g.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">Lv.{lvl}</span>
                      <span className="text-[10px] text-white/40">{g.skill}</span>
                      {hs > 0 && <span className="text-[10px] text-white/40">· Best: {hs}</span>}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-white/30 flex-shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     HUB — Main Training Screen
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="page-container max-w-lg lg:max-w-4xl mx-auto">
      {/* Header */}
      <div className="pt-4 mb-4 animate-fade-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Brain Training</p>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Memory Lab</h1>
          </div>
          <button onClick={() => setView('progress')} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-bold active:bg-indigo-100 transition-colors">
            <TrendingUp size={14} /> Progress
          </button>
        </div>
      </div>

      {/* Brain Level + XP Bar + Rank */}
      {(() => { const mastery = getMasteryInfo(profile.brainLevel); return (
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-2xl p-4 mb-4 shadow-lg shadow-indigo-600/20 animate-fade-up" style={{ animationDelay: '40ms' }}>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-2xl">
            {mastery.current.emoji}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">{mastery.current.title}</p>
              <div className="flex items-center gap-1">
                <Flame size={12} className="text-orange-400" />
                <span className="text-white text-xs font-bold">{profile.currentStreak}d</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-white text-3xl font-black leading-tight">{profile.brainLevel}</p>
              <p className="text-white/30 text-xs font-bold">/ 100</p>
            </div>
            <div className="bg-white/20 rounded-full h-2.5 mt-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full rounded-full transition-all duration-700" style={{ width: `${xp.pct}%` }} />
            </div>
            <div className="flex justify-between mt-0.5">
              <p className="text-[9px] text-white/40">{xp.current}/{xp.needed} XP to level {profile.brainLevel + 1}</p>
              {mastery.next && <p className="text-[9px] text-amber-300/60">{mastery.next.emoji} {mastery.next.title} at Lv.{mastery.next.minLevel}</p>}
            </div>
          </div>
        </div>
        {mastery.isMemoryMaster && (
          <div className="mt-3 bg-amber-400/20 rounded-xl px-3 py-2 text-center">
            <p className="text-xs font-black text-amber-300">🧠 MEMORY MASTER 🧠</p>
            <p className="text-[10px] text-white/50">You have reached the pinnacle of memory mastery!</p>
          </div>
        )}
      </div>
      ); })()}

      {/* Daily Recall Banner — prominent at night */}
      <div className="animate-fade-up" style={{ animationDelay: '70ms' }}>
        {recallDone ? (
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-3 mb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center"><Moon size={18} className="text-violet-600" /></div>
            <div className="flex-1">
              <p className="text-xs font-bold text-violet-800">Today's Recall Done ✓</p>
              <p className="text-[10px] text-violet-500">{recallStreak}d recall streak</p>
            </div>
            <button onClick={() => setView('recall-history')} className="text-[10px] text-violet-600 font-bold px-2 py-1 bg-violet-100 rounded-lg">History</button>
          </div>
        ) : (
          <button onClick={() => setView('recall')}
            className={`w-full text-left rounded-2xl p-3.5 mb-4 flex items-center gap-3 active:scale-[0.98] transition-transform ${
              isRecallTime
                ? 'bg-gradient-to-r from-violet-600 to-indigo-700 shadow-lg shadow-violet-600/20 animate-pulse-glow'
                : 'bg-gradient-to-r from-slate-700 to-slate-800'
            }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRecallTime ? 'bg-white/20' : 'bg-white/10'}`}>
              <Moon size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-bold">
                {isRecallTime ? '🌙 Daily Recall Time!' : 'Daily Recall'}
              </p>
              <p className="text-white/50 text-[10px]">
                {isRecallTime ? 'Recall your day before bed — tap to start' : 'Available at 8 PM · strengthens long-term memory'}
              </p>
            </div>
            {isRecallTime && <ChevronRight size={16} className="text-white/40" />}
          </button>
        )}
      </div>

      {/* Daily Training */}
      <div className="mb-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <Star size={14} className="text-amber-500 fill-amber-500" /> Today's Training
          </h2>
          {dailyComplete ? (
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Check size={10} /> Complete!
            </span>
          ) : (
            <span className="text-[10px] text-gray-400 font-medium">{todayGames.length}/4 done</span>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {dailyGames.map((gameId) => {
            const g = GAMES.find(x => x.id === gameId)!;
            const done = todayGames.includes(gameId);
            const lvl = profile.gameLevels[gameId] || 1;
            return (
              <button key={gameId} onClick={() => startGame(g)}
                className={`relative text-left rounded-2xl p-3.5 active:scale-95 transition-all ${
                  done ? 'bg-white border-2 border-emerald-200 shadow-sm' : `bg-gradient-to-br ${g.color} ${g.colorTo} shadow-md`
                }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-lg ${done ? '' : 'animate-float'}`} style={{ animationDelay: `${Math.random() * 2}s` }}>{g.icon}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    done ? 'bg-emerald-100 text-emerald-700' : 'bg-white/20 text-white'
                  }`}>Lv.{lvl}</span>
                </div>
                <p className={`text-sm font-bold ${done ? 'text-gray-800' : 'text-white'}`}>{g.name}</p>
                <p className={`text-[10px] mt-0.5 ${done ? 'text-gray-400' : 'text-white/60'}`}>{g.skill}</p>
                {done && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                    <Check size={10} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-3 gap-2 lg:gap-3 mb-4 animate-fade-up" style={{ animationDelay: '140ms' }}>
        <div className="bg-white rounded-xl p-2.5 text-center shadow-sm border border-gray-100">
          <p className="text-[9px] text-gray-400 font-semibold">Today</p>
          <p className="text-lg font-black text-indigo-600">{todayGames.length}<span className="text-xs text-gray-300 font-bold">/4</span></p>
        </div>
        <div className="bg-white rounded-xl p-2.5 text-center shadow-sm border border-gray-100">
          <p className="text-[9px] text-gray-400 font-semibold">Total</p>
          <p className="text-lg font-black text-gray-800">{profile.gamesPlayed}</p>
        </div>
        <div className="bg-white rounded-xl p-2.5 text-center shadow-sm border border-gray-100">
          <p className="text-[9px] text-gray-400 font-semibold">Best Streak</p>
          <p className="text-lg font-black text-orange-500">{profile.bestStreak}<span className="text-sm">🔥</span></p>
        </div>
      </div>

      {/* All Games */}
      <button onClick={() => setView('games')}
        className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 active:bg-gray-50 transition-colors animate-fade-up" style={{ animationDelay: '180ms' }}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <Zap size={20} className="text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-gray-800">All 8 Games</p>
          <p className="text-[11px] text-gray-400">Free play any brain exercise</p>
        </div>
        <ChevronRight size={16} className="text-gray-300" />
      </button>

      {/* Mastery Roadmap */}
      {(() => { const mastery = getMasteryInfo(profile.brainLevel); return (
      <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-fade-up" style={{ animationDelay: '200ms' }}>
        <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-1.5">
          <span className="text-sm">🏆</span> Road to Memory Master
        </h3>
        <p className="text-[10px] text-gray-400 mb-3">
          {mastery.isMemoryMaster
            ? 'You\'ve achieved Memory Master status — legendary!'
            : `Reach Brain Level 90 to become a Memory Master`}
        </p>
        {/* Rank Progress Bar */}
        <div className="relative mb-3">
          <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${mastery.current.color} ${mastery.current.colorTo} transition-all duration-700`}
              style={{ width: `${Math.max(2, (profile.brainLevel / 90) * 100)}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-gray-400">Lv.{profile.brainLevel}</span>
            <span className="text-[9px] text-gray-400">Lv.90 🧠</span>
          </div>
        </div>
        {/* Current & Next Rank */}
        <div className="flex gap-2 lg:gap-3">
          <div className={`flex-1 rounded-xl p-2.5 bg-gradient-to-br ${mastery.current.color} ${mastery.current.colorTo}`}>
            <p className="text-[9px] text-white/60 font-bold">Current Rank</p>
            <p className="text-sm font-bold text-white">{mastery.current.emoji} {mastery.current.title}</p>
          </div>
          {mastery.next ? (
            <div className="flex-1 rounded-xl p-2.5 bg-gray-50 border border-gray-200 border-dashed">
              <p className="text-[9px] text-gray-400 font-bold">Next Rank</p>
              <p className="text-sm font-bold text-gray-700">{mastery.next.emoji} {mastery.next.title}</p>
              <p className="text-[9px] text-gray-400">{mastery.levelsToNext} levels away</p>
            </div>
          ) : (
            <div className="flex-1 rounded-xl p-2.5 bg-amber-50 border border-amber-200">
              <p className="text-[9px] text-amber-500 font-bold">Max Rank!</p>
              <p className="text-sm font-bold text-amber-700">🧠 Memory Master</p>
            </div>
          )}
        </div>
      </div>
      ); })()}

      {/* Handbook Button */}
      <button onClick={() => setView('handbook')}
        className="mt-4 w-full bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200/60 flex items-center gap-3 active:scale-[0.98] transition-transform animate-fade-up" style={{ animationDelay: '240ms' }}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20">
          <BookOpen size={20} className="text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-gray-800">The Memory Handbook</p>
          <p className="text-[11px] text-gray-400">How these games make you a memory master</p>
        </div>
        <ChevronRight size={16} className="text-amber-400" />
      </button>

      {/* Memory Tip */}
      <div className="mt-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 animate-fade-up" style={{ animationDelay: '280ms' }}>
        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1.5">💡 Memory Tip</p>
        <p className="text-[13px] text-white/80 leading-relaxed">
          {MEMORY_TIPS[Math.floor(new Date().getDate() % MEMORY_TIPS.length)]}
        </p>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   MEMORY TIPS
   ═══════════════════════════════════════════════════════════════════════ */
const MEMORY_TIPS = [
  'Sleep consolidates memories. Train before bed for stronger retention.',
  'Spaced practice beats cramming — short daily sessions build lasting neural pathways.',
  'The Memory Palace technique uses spatial memory, our most powerful memory system.',
  'Exercise increases BDNF, a protein that strengthens memory connections.',
  'Teaching others doubles your retention — explain what you learn out loud.',
  'Chunking: group information into sets of 3-4 to bypass working memory limits.',
  'Emotional connections make memories 3× stronger than neutral ones.',
  'Active recall (testing yourself) is 50% more effective than re-reading notes.',
  'Your brain forms new neurons throughout life — training accelerates this.',
  'Meditation improves working memory by reducing mental noise.',
  'Multi-sensory learning creates richer, more retrievable memories.',
  'You remember beginnings and endings best — the serial position effect.',
  'Brain training can improve processing speed by up to 30% in 8 weeks.',
  'Even mild dehydration impairs memory — drink water while you train.',
  'Daily practice rewires neural pathways in as little as 21 days.',
];

/* ═══════════════════════════════════════════════════════════════════════
   THE MEMORY HANDBOOK — Your Guide to Becoming a Memory Master
   ═══════════════════════════════════════════════════════════════════════ */
const HandbookView: React.FC<{ onBack: () => void; profile: PlayerProfile }> = ({ onBack, profile }) => {
  const [openChapter, setOpenChapter] = useState<number | null>(null);
  const mastery = getMasteryInfo(profile.brainLevel);

  const toggle = (i: number) => setOpenChapter(openChapter === i ? null : i);

  return (
    <div className="page-container max-w-lg lg:max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4 mb-2">
        <button onClick={onBack} className="p-1"><ChevronLeft size={20} className="text-gray-400" /></button>
        <div className="flex-1">
          <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">The Handbook</p>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Memory Mastery</h1>
        </div>
        <BookOpen size={20} className="text-amber-500" />
      </div>

      {/* Hero Quote */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 rounded-2xl p-5 mb-5 shadow-lg shadow-orange-500/20">
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-2">📖 Core Principle</p>
        <p className="text-white text-lg font-bold leading-snug italic">
          "Your memory is not fixed. It is a skill — and like any skill, it grows stronger with deliberate, daily practice."
        </p>
        <div className="mt-3 bg-white/15 rounded-xl px-3 py-2">
          <p className="text-white/80 text-[11px] leading-relaxed">
            You are currently <span className="font-bold text-white">{mastery.current.emoji} {mastery.current.title}</span> at Brain Level {profile.brainLevel}.
            {mastery.next ? ` Your next milestone: ${mastery.next.emoji} ${mastery.next.title} at Level ${mastery.next.minLevel}.` : ' You have reached the highest rank!'}
          </p>
        </div>
      </div>

      {/* Chapters */}
      <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">

        {/* Chapter 1 */}
        <HandbookChapter index={0} open={openChapter === 0} onToggle={() => toggle(0)}
          emoji="🧠" title="Why This Works" subtitle="The neuroscience behind memory training">
          <p>Your brain has roughly 86 billion neurons. Every time you practice remembering, you strengthen the synaptic connections between them — a process called <b>long-term potentiation</b>.</p>
          <p className="mt-3">This isn't a metaphor. Brain scans of people who train memory daily for 8 weeks show measurable increases in:</p>
          <ul className="mt-2 space-y-1.5">
            <li className="flex gap-2"><span className="text-emerald-500 font-bold">→</span> <span><b>Hippocampal volume</b> — the brain's memory center physically grows</span></li>
            <li className="flex gap-2"><span className="text-emerald-500 font-bold">→</span> <span><b>Working memory capacity</b> — you can hold more information at once</span></li>
            <li className="flex gap-2"><span className="text-emerald-500 font-bold">→</span> <span><b>Processing speed</b> — you think and recall faster</span></li>
            <li className="flex gap-2"><span className="text-emerald-500 font-bold">→</span> <span><b>BDNF production</b> — a protein that protects neurons and builds new ones</span></li>
          </ul>
          <div className="mt-3 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
            <p className="text-xs text-amber-800">💡 <b>The Compound Effect:</b> Just like compound interest, small daily training sessions stack. 15 minutes today doesn't feel like much — but 15 minutes × 365 days = a fundamentally different brain.</p>
          </div>
        </HandbookChapter>

        {/* Chapter 2 */}
        <HandbookChapter index={1} open={openChapter === 1} onToggle={() => toggle(1)}
          emoji="🎮" title="The 8 Games & What They Build" subtitle="Each game targets a different memory system">
          <p className="text-gray-500 text-xs mb-3">Your brain doesn't have one "memory." It has multiple memory systems. These 8 games train each one:</p>

          <div className="space-y-3">
            <GameExplainer emoji="🔢" name="Number Memory" skill="Working Memory"
              desc="Holding information in your mind while using it. This is the RAM of your brain — the workspace where thinking happens."
              benefit="Improves your ability to do mental math, follow conversations, and keep multiple ideas in mind at once."
              science="Engages the dorsolateral prefrontal cortex. Studies show working memory training transfers to fluid intelligence." />

            <GameExplainer emoji="🎯" name="Sequence Memory" skill="Sequential Processing"
              desc="Remembering ordered patterns. This is how you learn dance moves, musical pieces, and complex procedures."
              benefit="Better at following multi-step instructions, learning routines, and remembering sequences of events."
              science="Activates the basal ganglia and supplementary motor area — the brain's sequencing engine." />

            <GameExplainer emoji="🐵" name="Chimp Test" skill="Short-term Visual Memory"
              desc="Briefly flash information and recall positions. Chimps actually outperform most humans on this — until you train."
              benefit="Faster at absorbing visual information — reading faster, noticing details, quick comprehension."
              science="Trains iconic memory and the visuospatial sketchpad — your brain's visual notepad." />

            <GameExplainer emoji="📝" name="Word Recall" skill="Verbal Recognition Memory"
              desc="'Have I seen this before?' Distinguishing familiar from new. Critical for studying and learning."
              benefit="Better at recognizing what you've already learned, reducing re-study time. Strengthens 'feeling of knowing.'"
              science="Engages the perirhinal cortex — the brain's familiarity detector. Essential for exam performance." />

            <GameExplainer emoji="🃏" name="Visual Pairs" skill="Associative Memory"
              desc="Linking two things together in memory — faces to names, concepts to definitions."
              benefit="Dramatically better at remembering names, vocabulary, and paired associations in studying."
              science="Strengthens hippocampal binding — the process of linking separate items into one memory." />

            <GameExplainer emoji="🟦" name="Pattern Matrix" skill="Spatial Memory"
              desc="Remembering where things are in space. Humans evolved this for survival — it's our most powerful system."
              benefit="Better navigation, better at finding things, and improved ability to mentally visualize information."
              science="Activates the parietal cortex and hippocampal place cells — the brain's internal GPS." />

            <GameExplainer emoji="⚡" name="Speed Match" skill="Processing Speed"
              desc="How fast can you compare, decide, and react? Speed of thought is trainable."
              benefit="Faster reactions, quicker reading, more efficient thinking. You process the world faster."
              science="Trains myelination — the fatty coating on neural pathways that makes signals travel faster." />

            <GameExplainer emoji="🏛️" name="Memory Palace" skill="Long-term Encoding"
              desc="The loci method — the most powerful memorization technique in history, used by memory champions."
              benefit="Can memorize lectures, book chapters, speeches, lists of 100+ items in order."
              science="Leverages spatial memory (your strongest system) to encode abstract info. Hippocampal supercharger." />
          </div>
        </HandbookChapter>

        {/* Chapter 3 */}
        <HandbookChapter index={2} open={openChapter === 2} onToggle={() => toggle(2)}
          emoji="📈" title="How Levels Make You Stronger" subtitle="The auto-difficulty system explained">
          <p>Each game has its own level (1–50). The system works like a personal trainer:</p>

          <div className="mt-3 space-y-2.5">
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <p className="text-xs font-bold text-emerald-700">⬆️ Score 60%+ accuracy → Level Up</p>
              <p className="text-[11px] text-emerald-600 mt-1">More digits, bigger grids, faster timers. The game pushes you beyond your comfort zone — that's where growth happens.</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
              <p className="text-xs font-bold text-red-600">⬇️ Score below 30% → Level Down</p>
              <p className="text-[11px] text-red-500 mt-1">No shame. The system drops difficulty so you can rebuild confidence. Even world memory champions have off days.</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs font-bold text-blue-700">🎯 Sweet Spot = 60-80% accuracy</p>
              <p className="text-[11px] text-blue-600 mt-1">This is the "desirable difficulty" zone — hard enough to grow, easy enough to stay motivated. The system keeps you here automatically.</p>
            </div>
          </div>

          <div className="mt-4 bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-bold text-gray-700 mb-2">What changes as you level up:</p>
            <div className="space-y-1">
              <p className="text-[11px] text-gray-500">🔢 <b>Number Memory:</b> 3 digits → 52 digits, display time shrinks</p>
              <p className="text-[11px] text-gray-500">🎯 <b>Sequence:</b> 3-tile sequence → 52-tile, grid grows to 5×5</p>
              <p className="text-[11px] text-gray-500">🐵 <b>Chimp Test:</b> 4 numbers → 25, grid grows to 6×6</p>
              <p className="text-[11px] text-gray-500">📝 <b>Word Recall:</b> 7 words / 11 rounds → 40 words / 30 rounds</p>
              <p className="text-[11px] text-gray-500">🃏 <b>Visual Pairs:</b> 3 pairs → 15 pairs, preview time shrinks</p>
              <p className="text-[11px] text-gray-500">🟦 <b>Pattern Matrix:</b> 3×3 grid → 6×6, more cells highlighted</p>
              <p className="text-[11px] text-gray-500">⚡ <b>Speed Match:</b> 3 symbols → 12, rounds double</p>
              <p className="text-[11px] text-gray-500">🏛️ <b>Memory Palace:</b> 2 rooms → 12 rooms, study time shrinks</p>
            </div>
          </div>
        </HandbookChapter>

        {/* Chapter 4 */}
        <HandbookChapter index={3} open={openChapter === 3} onToggle={() => toggle(3)}
          emoji="🏆" title="The 9 Ranks of Mastery" subtitle="Your journey from beginner to legend">
          <p>As you earn XP from games, your Brain Level rises. Each level milestone unlocks a new rank title — proof of real cognitive growth.</p>
          <div className="mt-3 space-y-1.5">
            {MASTERY_RANKS.map((rank, i) => {
              const isActive = rank.title === mastery.current.title;
              const isAchieved = profile.brainLevel >= rank.minLevel;
              return (
                <div key={i} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                  isActive ? `bg-gradient-to-r ${rank.color} ${rank.colorTo}` : isAchieved ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-50'
                }`}>
                  <span className={`text-lg ${!isAchieved ? 'grayscale opacity-40' : ''}`}>{rank.emoji}</span>
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${isActive ? 'text-white' : isAchieved ? 'text-gray-700' : 'text-gray-400'}`}>{rank.title}</p>
                    <p className={`text-[10px] ${isActive ? 'text-white/70' : 'text-gray-400'}`}>{rank.description}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-bold ${isActive ? 'text-white/80' : 'text-gray-400'}`}>Lv.{rank.minLevel}</p>
                    {isAchieved && !isActive && <span className="text-emerald-500 text-xs">✓</span>}
                    {isActive && <span className="text-[9px] text-white bg-white/20 px-1.5 py-0.5 rounded-full font-bold">YOU</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
            <p className="text-xs text-amber-800">🧠 <b>Memory Master (Level 90)</b> is the final rank. At this level, your working memory capacity, pattern recognition speed, and long-term encoding are significantly above average. This typically takes 4–6 months of daily training.</p>
          </div>
        </HandbookChapter>

        {/* Chapter 5 */}
        <HandbookChapter index={4} open={openChapter === 4} onToggle={() => toggle(4)}
          emoji="🌙" title="Daily Recall — Your Secret Weapon" subtitle="Why remembering your day changes everything">
          <p>Every night, this app asks you to recall your day from memory — <b>without looking at photos, messages, or calendars</b>.</p>
          <p className="mt-2">This isn't just journaling. It's the most powerful memory exercise that exists:</p>
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <span className="text-violet-500 font-bold text-sm mt-0.5">1</span>
              <div>
                <p className="text-xs font-bold text-gray-700">Retrieval Practice</p>
                <p className="text-[11px] text-gray-500">Actively pulling memories out strengthens them 3× more than just re-experiencing them. Each recall creates a stronger neural trace.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-violet-500 font-bold text-sm mt-0.5">2</span>
              <div>
                <p className="text-xs font-bold text-gray-700">Sleep Consolidation Trigger</p>
                <p className="text-[11px] text-gray-500">Recalling before bed "flags" those memories for consolidation. Your hippocampus replays them during deep sleep, moving them into long-term storage.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-violet-500 font-bold text-sm mt-0.5">3</span>
              <div>
                <p className="text-xs font-bold text-gray-700">Attention Training</p>
                <p className="text-[11px] text-gray-500">When you know you'll need to recall your day tonight, you start paying more attention during the day. Your brain shifts from autopilot to engaged mode.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-violet-500 font-bold text-sm mt-0.5">4</span>
              <div>
                <p className="text-xs font-bold text-gray-700">Clarity Score Tracking</p>
                <p className="text-[11px] text-gray-500">The mood & clarity score you rate each night creates a personal dataset. Over weeks, you'll see your average clarity climbing — measurable proof your memory is improving.</p>
              </div>
            </div>
          </div>
          <div className="mt-3 bg-violet-50 rounded-xl px-3 py-2.5 border border-violet-100">
            <p className="text-xs text-violet-800">🌟 <b>Pro tip:</b> Try to recall events in chronological order — from waking up to now. Chronological recall is harder and trains episodic memory more deeply.</p>
          </div>
        </HandbookChapter>

        {/* Chapter 6 */}
        <HandbookChapter index={5} open={openChapter === 5} onToggle={() => toggle(5)}
          emoji="⚡" title="The 15-Minute Rule" subtitle="Why short daily sessions beat long ones">
          <p>Your brain learns best in <b>short, focused bursts</b> followed by rest. This is called the <b>spacing effect</b> — one of the most replicated findings in all of psychology.</p>
          <div className="mt-3 bg-indigo-50 rounded-xl p-3 border border-indigo-100">
            <p className="text-xs font-bold text-indigo-700 mb-1">The Ideal Daily Routine:</p>
            <div className="space-y-1">
              <p className="text-[11px] text-indigo-600 flex items-center gap-1.5">☀️ <b>Morning (5 min):</b> 1-2 speed games to wake up your brain</p>
              <p className="text-[11px] text-indigo-600 flex items-center gap-1.5">📚 <b>After study (5 min):</b> Memory Palace or Word Recall to reinforce what you learned</p>
              <p className="text-[11px] text-indigo-600 flex items-center gap-1.5">🌙 <b>Before bed (5 min):</b> Daily Recall journal + 1 game</p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-500"><b>Week 1-2:</b> It feels hard. Your brain is building new pathways. Scores will be low. This is normal.</p>
            <p className="text-xs text-gray-500"><b>Week 3-4:</b> You start noticing patterns. Games feel slightly easier. Your first level-ups happen. The brain is adapting.</p>
            <p className="text-xs text-gray-500"><b>Month 2-3:</b> Real-world effects appear. You remember names better. Study sessions feel more productive. Reading comprehension improves.</p>
            <p className="text-xs text-gray-500"><b>Month 4-6:</b> Your brain has physically changed. Higher processing speed, larger working memory, stronger encoding. You are becoming a Memory Master.</p>
          </div>
          <div className="mt-3 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
            <p className="text-xs text-amber-800">🔥 <b>Streaks matter:</b> Your training streak tracks consecutive days. Research shows 21 consecutive days creates a habit, and 66 days makes it automatic. Never break the chain.</p>
          </div>
        </HandbookChapter>

        {/* Chapter 7 */}
        <HandbookChapter index={6} open={openChapter === 6} onToggle={() => toggle(6)}
          emoji="🧬" title="The XP System Explained" subtitle="How points turn into brain power">
          <p>XP isn't just a number — it reflects genuine cognitive effort:</p>
          <div className="mt-3 space-y-2">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-bold text-gray-700">How XP is calculated:</p>
              <p className="text-[11px] text-gray-500 mt-1">Base XP = Score × (1 + Level × 0.1)</p>
              <p className="text-[11px] text-gray-500">90%+ accuracy → <span className="text-emerald-600 font-bold">1.5× bonus</span></p>
              <p className="text-[11px] text-gray-500">70-89% accuracy → <span className="text-blue-600 font-bold">1.2× bonus</span></p>
              <p className="text-[11px] text-gray-500 mt-1">Higher game levels generate more XP because harder challenges = more growth.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-bold text-gray-700">Brain Level formula:</p>
              <p className="text-[11px] text-gray-500 mt-1">XP needed for each level = 100 × level<sup>1.5</sup></p>
              <p className="text-[11px] text-gray-500">Level 2 → 283 XP  ·  Level 10 → 3,162 XP  ·  Level 50 → 35,355 XP</p>
              <p className="text-[11px] text-gray-500">Each level takes progressively more effort — just like real mastery.</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500"><b>Why this works:</b> The XP system gives your brain a dopamine reward loop. Earn XP → feel progress → want to train more → actually get smarter. It turns neuroscience into a game you want to play.</p>
        </HandbookChapter>

        {/* Chapter 8 */}
        <HandbookChapter index={7} open={openChapter === 7} onToggle={() => toggle(7)}
          emoji="🎓" title="Memory Tips for Students" subtitle="Using these skills in real life">
          <p>These games aren't just games. Here's how each skill transfers to your studies:</p>
          <div className="mt-3 space-y-2.5">
            <div className="flex gap-2">
              <span className="text-lg">🔢</span>
              <div>
                <p className="text-xs font-bold text-gray-700">Number Memory → Formulas & Dates</p>
                <p className="text-[11px] text-gray-500">Your trained working memory can hold longer number sequences. Memorizing phone numbers, dates, and formulas becomes effortless.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-lg">📝</span>
              <div>
                <p className="text-xs font-bold text-gray-700">Word Recall → Exam Recognition</p>
                <p className="text-[11px] text-gray-500">The SEEN/NEW mechanic mirrors multiple-choice exams. You're training the same brain circuit: "Have I encountered this before?"</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-lg">🏛️</span>
              <div>
                <p className="text-xs font-bold text-gray-700">Memory Palace → Entire Chapters</p>
                <p className="text-[11px] text-gray-500">Once you master the loci technique in-app, apply it to textbooks: walk through your mental palace and place key concepts in each room. Memory champions memorize 1,000+ digits this way.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-lg">⚡</span>
              <div>
                <p className="text-xs font-bold text-gray-700">Speed Match → Faster Reading</p>
                <p className="text-[11px] text-gray-500">Your trained processing speed means you can read and comprehend faster. Students who train processing speed read 20-30% faster within weeks.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-lg">🌙</span>
              <div>
                <p className="text-xs font-bold text-gray-700">Daily Recall → Never Forget a Lecture</p>
                <p className="text-[11px] text-gray-500">After each class, spend 2 minutes recalling what was taught. This single habit can improve retention by 40-60% compared to re-reading notes.</p>
              </div>
            </div>
          </div>
          <div className="mt-3 bg-emerald-50 rounded-xl px-3 py-2.5 border border-emerald-100">
            <p className="text-xs text-emerald-800">🌱 <b>The Atomic Habits connection:</b> "You do not rise to the level of your goals. You fall to the level of your systems." This app is your system. Train daily, trust the process, and your memory will transform — not because of willpower, but because of the system you've built.</p>
          </div>
        </HandbookChapter>

      </div>

      {/* Footer inspiration */}
      <div className="mt-6 text-center">
        <p className="text-3xl mb-2">🧠</p>
        <p className="text-sm font-bold text-gray-700">Your brain is the most powerful computer on Earth.</p>
        <p className="text-xs text-gray-400 mt-1">You're not just playing games — you're upgrading the hardware.</p>
        <p className="text-[10px] text-gray-300 mt-3">Train daily. Trust the process. Become the master.</p>
      </div>
    </div>
  );
};

/* ── Handbook Chapter Accordion ── */
const HandbookChapter: React.FC<{
  index: number; open: boolean; onToggle: () => void;
  emoji: string; title: string; subtitle: string;
  children: React.ReactNode;
}> = ({ index, open, onToggle, emoji, title, subtitle, children }) => (
  <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-fade-up" style={{ animationDelay: `${index * 50}ms` }}>
    <button onClick={onToggle}
      className="w-full text-left p-4 flex items-center gap-3 active:bg-gray-50 transition-colors bg-white">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-lg flex-shrink-0">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800">{title}</p>
        <p className="text-[10px] text-gray-400">{subtitle}</p>
      </div>
      <ChevronRight size={16} className={`text-gray-300 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-90' : ''}`} />
    </button>
    {open && (
      <div className="px-4 pb-4 bg-white border-t border-gray-50">
        <div className="text-[12px] text-gray-600 leading-relaxed">
          {children}
        </div>
      </div>
    )}
  </div>
);

/* ── Game Explainer Card (for Chapter 2) ── */
const GameExplainer: React.FC<{
  emoji: string; name: string; skill: string;
  desc: string; benefit: string; science: string;
}> = ({ emoji, name, skill, desc, benefit, science }) => (
  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-lg">{emoji}</span>
      <div>
        <p className="text-xs font-bold text-gray-800">{name}</p>
        <p className="text-[9px] text-gray-400 uppercase tracking-wider">{skill}</p>
      </div>
    </div>
    <p className="text-[11px] text-gray-600 mb-1.5">{desc}</p>
    <p className="text-[11px] text-emerald-700 mb-1">✅ <b>Real-world benefit:</b> {benefit}</p>
    <p className="text-[10px] text-indigo-500/70">🔬 {science}</p>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   DAILY RECALL VIEW
   ═══════════════════════════════════════════════════════════════════════ */
const DailyRecallView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<DailyRecall['mood'] | null>(null);
  const [clarity, setClarity] = useState(5);
  const [phase, setPhase] = useState<'write' | 'rate' | 'done'>('write');
  const [saving, setSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setWordCount(content.trim() ? content.trim().split(/\s+/).length : 0);
  }, [content]);

  // Auto-grow textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.max(200, el.scrollHeight) + 'px';
  };

  const canContinue = content.trim().length >= 10;

  const save = async () => {
    if (!mood || !canContinue) return;
    setSaving(true);
    await dailyRecallAPI.saveRecall(content.trim(), mood, clarity);
    setPhase('done');
    setSaving(false);
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  if (phase === 'done') {
    return (
      <div className="page-container max-w-lg lg:max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-up">
        <div className="text-5xl mb-3 animate-pop-in">📖</div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Day Recorded!</h2>
        <p className="text-sm text-gray-400 mb-1">{wordCount} words captured from today</p>
        <p className="text-xs text-violet-600 font-medium mb-6">Your memory of today is now preserved. Recalling strengthens your brain while you sleep 💤</p>
        <button onClick={onBack} className="px-6 py-2.5 bg-violet-600 text-white font-bold rounded-xl active:scale-95 shadow-md shadow-violet-600/30">
          Done
        </button>
      </div>
    );
  }

  if (phase === 'rate') {
    const moods: { val: DailyRecall['mood']; emoji: string; label: string; bg: string }[] = [
      { val: 'great', emoji: '🌟', label: 'Crystal clear', bg: 'bg-amber-50 border-amber-200' },
      { val: 'good', emoji: '😊', label: 'Pretty good', bg: 'bg-emerald-50 border-emerald-200' },
      { val: 'okay', emoji: '😐', label: 'Okay', bg: 'bg-blue-50 border-blue-200' },
      { val: 'foggy', emoji: '🌫️', label: 'Foggy', bg: 'bg-gray-50 border-gray-200' },
    ];

    return (
      <div className="page-container max-w-lg lg:max-w-2xl mx-auto">
        <div className="flex items-center gap-3 pt-4 mb-6">
          <button onClick={() => setPhase('write')} className="p-1"><ChevronLeft size={20} className="text-gray-400" /></button>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">How clear is today?</h1>
        </div>

        <p className="text-sm text-gray-500 mb-5">How well do you feel you remembered your day?</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-6">
          {moods.map(m => (
            <button key={m.val} onClick={() => setMood(m.val)}
              className={`p-4 rounded-2xl text-center transition-all active:scale-95 border-2 ${
                mood === m.val ? 'bg-violet-100 border-violet-400 shadow-md scale-[1.02]' : m.bg
              }`}>
              <span className="text-3xl">{m.emoji}</span>
              <p className={`text-xs font-bold mt-1.5 ${mood === m.val ? 'text-violet-700' : 'text-gray-600'}`}>{m.label}</p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-700">Clarity Score</p>
            <div className="bg-violet-100 px-3 py-1 rounded-full">
              <span className="text-sm font-black text-violet-700">{clarity}<span className="text-violet-400 font-medium">/10</span></span>
            </div>
          </div>
          <input type="range" min={1} max={10} value={clarity} onChange={e => setClarity(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-violet-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md" />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-gray-300">Foggy</span>
            <span className="text-[9px] text-gray-300">Perfect recall</span>
          </div>
        </div>

        <button onClick={save} disabled={!mood || saving}
          className="w-full py-3.5 bg-violet-600 text-white font-bold rounded-xl active:scale-95 disabled:opacity-40 transition-all shadow-md shadow-violet-600/30 text-sm">
          {saving ? 'Saving...' : '✨ Save Today\'s Recall'}
        </button>
      </div>
    );
  }

  return (
    <div className="page-container max-w-lg lg:max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4 mb-2">
        <button onClick={onBack} className="p-1"><ChevronLeft size={20} className="text-gray-400" /></button>
        <div className="flex-1">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Daily Recall</h1>
        </div>
        <Moon size={20} className="text-violet-400" />
      </div>

      {/* Date badge */}
      <div className="flex items-center gap-2 mb-5">
        <div className="h-px flex-1 bg-gradient-to-r from-violet-200 to-transparent" />
        <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">{todayStr}</p>
        <div className="h-px flex-1 bg-gradient-to-l from-violet-200 to-transparent" />
      </div>

      {/* Gentle nudge */}
      <div className="bg-gradient-to-br from-violet-50/80 to-indigo-50/80 rounded-2xl p-3.5 mb-5 border border-violet-100/60">
        <p className="text-xs text-violet-600/80 leading-relaxed">
          ✍️ Write about your day — what happened, what you did, conversations, feelings, details. 
          It's your personal diary. Write as little or as much as you want.
        </p>
      </div>

      {/* Free-form journal textarea */}
      <div className="relative mb-4">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          placeholder="Today I..."
          rows={10}
          className="w-full text-sm text-gray-800 bg-white border border-gray-200 rounded-2xl px-4 py-4 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 resize-none placeholder:text-gray-300 leading-relaxed"
          style={{ minHeight: '200px' }}
          autoFocus
        />
        {/* Word count badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {wordCount > 0 && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              wordCount >= 50 ? 'bg-emerald-100 text-emerald-600' : wordCount >= 20 ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {wordCount} words
            </span>
          )}
        </div>
      </div>

      {/* Continue button */}
      <button onClick={() => canContinue && setPhase('rate')} disabled={!canContinue}
        className="w-full py-3.5 bg-violet-600 text-white font-bold rounded-xl active:scale-95 disabled:opacity-40 transition-all shadow-md shadow-violet-600/30 text-sm">
        Continue →
      </button>

      {!canContinue && content.length > 0 && (
        <p className="text-center text-[10px] text-gray-300 mt-2">Write a bit more to continue</p>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   RECALL HISTORY VIEW
   ═══════════════════════════════════════════════════════════════════════ */
const RecallHistoryView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [history, setHistory] = useState<DailyRecall[]>([]);
  const [avgClarity, setAvgClarity] = useState(0);
  const [streak, setStreak] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState<DailyRecall['mood']>('good');
  const [editClarity, setEditClarity] = useState(5);
  const [saving, setSaving] = useState(false);
  const editRef = useRef<HTMLTextAreaElement | null>(null);

  const loadHistory = useCallback(async () => {
    const [h, avg, s] = await Promise.all([
      dailyRecallAPI.getRecallHistory(90),
      dailyRecallAPI.getAvgClarity(),
      dailyRecallAPI.getRecallStreak(),
    ]);
    setHistory(h);
    setAvgClarity(avg);
    setStreak(s);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const moodMap: Record<DailyRecall['mood'], { emoji: string; label: string; color: string; bg: string }> = {
    great:  { emoji: '🌟', label: 'Crystal clear', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    good:   { emoji: '😊', label: 'Pretty good',   color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    okay:   { emoji: '😐', label: 'Okay',           color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    foggy:  { emoji: '🌫️', label: 'Foggy',          color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' },
  };

  const moodOptions: DailyRecall['mood'][] = ['great', 'good', 'okay', 'foggy'];

  const getRelativeDay = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return null;
  };

  const getWordCount = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0;

  const startEdit = (r: DailyRecall) => {
    setEditingId(r.id);
    setEditContent(r.content);
    setEditMood(r.mood);
    setEditClarity(r.clarityScore);
    setExpandedId(null);
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.focus();
        editRef.current.style.height = 'auto';
        editRef.current.style.height = Math.max(150, editRef.current.scrollHeight) + 'px';
      }
    }, 100);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async () => {
    if (!editingId || editContent.trim().length < 5) return;
    setSaving(true);
    await dailyRecallAPI.updateRecall(editingId, editContent.trim(), editMood, editClarity);
    await loadHistory();
    setEditingId(null);
    setEditContent('');
    setSaving(false);
  };

  const handleEditTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.max(150, el.scrollHeight) + 'px';
  };

  return (
    <div className="page-container max-w-lg lg:max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4 mb-5">
        <button onClick={onBack} className="p-1"><ChevronLeft size={20} className="text-gray-400" /></button>
        <div className="flex-1">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">My Journal</h1>
          <p className="text-[10px] text-gray-400">Your daily memories, preserved forever</p>
        </div>
        <BookOpen size={18} className="text-violet-400" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-violet-50 rounded-xl p-3 text-center border border-violet-100">
          <p className="text-[10px] text-violet-500 font-semibold">Entries</p>
          <p className="text-xl font-black text-violet-700">{history.length}</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
          <p className="text-[10px] text-indigo-500 font-semibold">Streak</p>
          <p className="text-xl font-black text-indigo-700">{streak}<span className="text-xs text-indigo-400">d</span></p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
          <p className="text-[10px] text-amber-500 font-semibold">Avg Clarity</p>
          <p className="text-xl font-black text-amber-700">{avgClarity}<span className="text-xs text-amber-400">/10</span></p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📖</div>
          <p className="text-sm font-medium text-gray-500 mb-1">No entries yet</p>
          <p className="text-xs text-gray-300">Your daily journal cards will appear here<br />once you start recording your days</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((r, idx) => {
            const d = new Date(r.date + 'T00:00:00');
            const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
            const dateLabel = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            const relDay = getRelativeDay(r.date);
            const moodInfo = moodMap[r.mood];
            const isExpanded = expandedId === r.id;
            const isEditing = editingId === r.id;
            const words = getWordCount(r.content);
            const isLong = r.content.length > 200;
            const preview = isLong && !isExpanded && !isEditing ? r.content.slice(0, 200).trim() + '...' : r.content;

            return (
              <div key={r.id}
                className="animate-fade-up"
                style={{ animationDelay: `${idx * 40}ms` }}>
                {/* Timeline connector */}
                {idx > 0 && (
                  <div className="flex justify-center -mt-3 mb-0">
                    <div className="w-px h-3 bg-gradient-to-b from-violet-200 to-transparent" />
                  </div>
                )}

                <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-all ${
                  isEditing ? 'border-violet-400 shadow-lg shadow-violet-100/60 ring-1 ring-violet-400/30' :
                  isExpanded ? 'border-violet-200 shadow-md shadow-violet-100/50' : 'border-gray-100'
                }`}>
                  {/* Date header strip */}
                  <div className={`px-4 py-2.5 flex items-center justify-between ${
                    isEditing ? 'bg-gradient-to-r from-violet-700 to-indigo-700' : 'bg-gradient-to-r from-slate-800 to-slate-700'
                  }`}>
                    <div>
                      <p className="text-white text-xs font-bold">{dayName}</p>
                      <p className="text-white/50 text-[10px]">{dateLabel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {relDay && !isEditing && (
                        <span className="text-[9px] bg-white/15 text-white/70 px-2 py-0.5 rounded-full font-medium">{relDay}</span>
                      )}
                      {isEditing ? (
                        <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">Editing</span>
                      ) : (
                        <span className="text-lg">{moodInfo.emoji}</span>
                      )}
                    </div>
                  </div>

                  {/* Content — reading or editing mode */}
                  {isEditing ? (
                    <div className="px-4 py-3.5">
                      <textarea
                        ref={editRef}
                        value={editContent}
                        onChange={handleEditTextChange}
                        className="w-full text-sm text-gray-800 bg-violet-50/50 border border-violet-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 resize-none leading-relaxed"
                        style={{ minHeight: '150px' }}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-gray-400">{getWordCount(editContent)} words</span>
                      </div>

                      {/* Mood & Clarity editors */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Mood</p>
                        <div className="flex gap-1.5 mb-3">
                          {moodOptions.map(m => (
                            <button key={m} onClick={() => setEditMood(m)}
                              className={`flex-1 py-1.5 rounded-lg text-center transition-all active:scale-95 ${
                                editMood === m ? 'bg-violet-100 border-2 border-violet-400 shadow-sm' : 'bg-gray-50 border-2 border-transparent'
                              }`}>
                              <span className="text-sm">{moodMap[m].emoji}</span>
                              <p className="text-[8px] font-medium text-gray-500 mt-0.5">{moodMap[m].label}</p>
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Clarity</p>
                          <span className="text-[10px] font-bold text-violet-600">{editClarity}/10</span>
                        </div>
                        <input type="range" min={1} max={10} value={editClarity} onChange={e => setEditClarity(Number(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-violet-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md" />
                      </div>

                      {/* Save / Cancel */}
                      <div className="flex gap-2 mt-4">
                        <button onClick={cancelEdit}
                          className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl active:scale-95 flex items-center justify-center gap-1">
                          <X size={12} /> Cancel
                        </button>
                        <button onClick={saveEdit} disabled={saving || editContent.trim().length < 5}
                          className="flex-1 py-2.5 bg-violet-600 text-white text-xs font-bold rounded-xl active:scale-95 disabled:opacity-40 shadow-md shadow-violet-600/20 flex items-center justify-center gap-1">
                          <Check size={12} /> {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-3.5">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{preview}</p>

                      {isLong && (
                        <button onClick={() => setExpandedId(isExpanded ? null : r.id)}
                          className="text-[11px] font-bold text-violet-600 mt-2 flex items-center gap-0.5 active:opacity-70">
                          {isExpanded ? 'Show less' : 'Read more'}
                          <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  {!isEditing && (
                    <div className="px-4 pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${moodInfo.bg}`}>
                          {moodInfo.label}
                        </span>
                        <span className="text-[10px] text-gray-300 font-medium">{words} words</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-300">clarity {r.clarityScore}/10</span>
                        <button onClick={() => startEdit(r)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-violet-500 hover:bg-violet-50 active:scale-90 transition-all"
                          title="Edit this entry">
                          <Pencil size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* End marker */}
          <div className="text-center py-6">
            <div className="flex justify-center mb-2">
              <div className="w-px h-4 bg-gradient-to-b from-violet-200 to-transparent" />
            </div>
            <p className="text-[10px] text-gray-300 font-medium">📖 {history.length} days recorded</p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   GAME PLAYER — routes to the correct game component
   ═══════════════════════════════════════════════════════════════════════ */
interface GamePlayerProps {
  game: GameDef;
  level: number;
  onFinish: (score: number, accuracy: number, duration: number) => void;
}

const GamePlayer: React.FC<GamePlayerProps> = ({ game, level, onFinish }) => {
  switch (game.id) {
    case 'number-memory': return <NumberMemoryGame level={level} onFinish={onFinish} />;
    case 'sequence-memory': return <SequenceMemoryGame level={level} onFinish={onFinish} />;
    case 'chimp-test': return <ChimpTestGame level={level} onFinish={onFinish} />;
    case 'word-recall': return <WordRecallGame level={level} onFinish={onFinish} />;
    case 'visual-pairs': return <VisualPairsGame level={level} onFinish={onFinish} />;
    case 'pattern-matrix': return <PatternMatrixGame level={level} onFinish={onFinish} />;
    case 'speed-match': return <SpeedMatchGame level={level} onFinish={onFinish} />;
    case 'memory-palace': return <MemoryPalaceGame level={level} onFinish={onFinish} />;
    default: return null;
  }
};

interface GProps { level: number; onFinish: (score: number, accuracy: number, duration: number) => void; }

/* ═══════════════════════════════════════════════════════════════════════
   GAME 1: NUMBER MEMORY — enhanced with proper timer + better feedback
   ═══════════════════════════════════════════════════════════════════════ */
const NumberMemoryGame: React.FC<GProps> = ({ level, onFinish }) => {
  const params = getGameParams('number-memory', level);
  const startDigits = (params.digits as number) || 4;
  const [phase, setPhase] = useState<'show' | 'input' | 'feedback'>('show');
  const [number, setNumber] = useState('');
  const [input, setInput] = useState('');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [currentDigits, setCurrentDigits] = useState(startDigits);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const startTime = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const generateNumber = useCallback((digits: number) => {
    let n = '';
    for (let i = 0; i < digits; i++) n += Math.floor(Math.random() * 10).toString();
    return n;
  }, []);

  const startRound = useCallback((digits: number) => {
    const n = generateNumber(digits);
    setNumber(n);
    setInput('');
    setPhase('show');
    setShowTimer(true);
    setTimeout(() => {
      setPhase('input');
      setShowTimer(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }, params.displayMs as number);
  }, [generateNumber, params.displayMs]);

  useEffect(() => { startRound(currentDigits); }, []); // eslint-disable-line

  const submit = () => {
    if (!input) return;
    const ok = input === number;
    setIsCorrect(ok);
    setTotal(t => t + 1);
    if (ok) {
      setCorrect(c => c + 1);
      setScore(s => s + currentDigits * 10);
    }
    setPhase('feedback');
  };

  const next = () => {
    if (isCorrect && round < 5) {
      setRound(r => r + 1);
      const nextDigits = currentDigits + 1;
      setCurrentDigits(nextDigits);
      startRound(nextDigits);
    } else {
      const finalScore = score + (isCorrect ? currentDigits * 10 : 0);
      const finalCorrect = correct + (isCorrect ? 1 : 0);
      onFinish(finalScore, total > 0 ? Math.round((finalCorrect / total) * 100) : 0, Math.round((Date.now() - startTime.current) / 1000));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
      {/* Round indicator */}
      <div className="flex gap-1.5 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`w-8 h-1.5 rounded-full transition-all ${
            i < round - 1 ? 'bg-emerald-400' : i === round - 1 ? 'bg-indigo-500' : 'bg-gray-200'
          }`} />
        ))}
      </div>

      {phase === 'show' && (
        <div className="animate-scale-in">
          <div className="bg-white rounded-3xl px-8 py-10 shadow-xl border border-gray-100 min-w-[260px] lg:min-w-[340px]">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">Memorize</p>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-mono font-black text-indigo-600 tracking-[0.15em] leading-none">{number}</p>
            <div className="mt-4 w-full">
              <TimerBar duration={params.displayMs as number} running={showTimer} />
            </div>
          </div>
        </div>
      )}

      {phase === 'input' && (
        <div className="animate-fade-up w-full max-w-xs lg:max-w-sm">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">What was the number?</p>
            <input ref={inputRef} type="tel" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-full text-center text-3xl font-mono font-bold border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors" autoFocus />
            <button onClick={submit} disabled={!input}
              className="mt-4 w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-40 active:scale-95 transition-transform shadow-md shadow-indigo-600/30">
              Check
            </button>
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div className={`animate-scale-in ${isCorrect ? '' : 'animate-shake'}`}>
          <div className={`rounded-3xl p-6 min-w-[260px] lg:min-w-[340px] ${isCorrect ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-red-50 border-2 border-red-200'}`}>
            <p className="text-4xl mb-2">{isCorrect ? '✅' : '❌'}</p>
            <p className={`text-lg font-bold ${isCorrect ? 'text-emerald-700' : 'text-red-600'}`}>
              {isCorrect ? 'Correct!' : 'Wrong'}
            </p>
            {!isCorrect && (
              <div className="mt-2 bg-white/60 rounded-xl px-3 py-2">
                <p className="text-[10px] text-gray-400">Correct answer</p>
                <p className="text-lg font-mono font-bold text-gray-700 tracking-wider">{number}</p>
              </div>
            )}
            {isCorrect && <p className="text-sm text-emerald-600 font-medium mt-1">+{currentDigits * 10} pts</p>}
            <button onClick={next}
              className={`mt-4 w-full py-2.5 font-bold rounded-xl active:scale-95 transition-transform ${
                isCorrect ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-red-500 text-white shadow-md shadow-red-500/30'
              }`}>
              {isCorrect && round < 5 ? 'Next Round →' : 'See Results'}
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-300 mt-6">{currentDigits} digits · {Math.round((params.displayMs as number) / 1000 * 10) / 10}s display</p>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   GAME 2: SEQUENCE MEMORY (Simon-like) — polished with colors & sounds
   ═══════════════════════════════════════════════════════════════════════ */
const SEQ_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-orange-500',
  'bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-orange-500',
  'bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500'];

const SequenceMemoryGame: React.FC<GProps> = ({ level, onFinish }) => {
  const params = getGameParams('sequence-memory', level);
  const gridSize = params.gridSize as number;
  const totalCells = gridSize * gridSize;
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [phase, setPhase] = useState<'showing' | 'input'>('showing');
  const [activeCell, setActiveCell] = useState(-1);
  const [seqLen, setSeqLen] = useState(params.sequenceLength as number);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrongCell, setWrongCell] = useState(-1);
  const startTime = useRef(Date.now());
  const flashMs = params.flashMs as number;

  const showSequence = useCallback((seq: number[]) => {
    setPhase('showing');
    setActiveCell(-1);
    seq.forEach((cell, i) => {
      setTimeout(() => setActiveCell(cell), (i + 1) * flashMs);
      setTimeout(() => setActiveCell(-1), (i + 1) * flashMs + Math.min(200, flashMs - 50));
    });
    setTimeout(() => { setPhase('input'); setPlayerSeq([]); }, (seq.length + 1) * flashMs + 300);
  }, [flashMs]);

  const newSequence = useCallback((len: number) => {
    const seq: number[] = [];
    for (let i = 0; i < len; i++) seq.push(Math.floor(Math.random() * totalCells));
    setSequence(seq);
    showSequence(seq);
  }, [totalCells, showSequence]);

  useEffect(() => { newSequence(seqLen); }, []); // eslint-disable-line

  const handleCellClick = (idx: number) => {
    if (phase !== 'input') return;
    const newPlayerSeq = [...playerSeq, idx];
    setPlayerSeq(newPlayerSeq);
    setActiveCell(idx);
    setTimeout(() => setActiveCell(-1), 120);

    const pos = newPlayerSeq.length - 1;
    if (newPlayerSeq[pos] !== sequence[pos]) {
      setWrongCell(idx);
      setTimeout(() => {
        onFinish(score, round > 1 ? Math.round((correct / (round - 1)) * 100) : 0, Math.round((Date.now() - startTime.current) / 1000));
      }, 600);
      return;
    }

    if (newPlayerSeq.length === sequence.length) {
      setCorrect(c => c + 1);
      setScore(s => s + seqLen * 10);
      if (round < 5) {
        setRound(r => r + 1);
        const nextLen = seqLen + 1;
        setSeqLen(nextLen);
        setTimeout(() => newSequence(nextLen), 600);
      } else {
        onFinish(score + seqLen * 10, Math.round(((correct + 1) / round) * 100), Math.round((Date.now() - startTime.current) / 1000));
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh]">
      {/* Round indicator */}
      <div className="flex gap-1.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`w-8 h-1.5 rounded-full transition-all ${i < round - 1 ? 'bg-emerald-400' : i === round - 1 ? 'bg-purple-500' : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-xs text-gray-400 mb-4 font-medium">
        {phase === 'showing' ? `Watch carefully... (${seqLen} tiles)` : `Your turn! ${playerSeq.length}/${sequence.length}`}
      </p>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {Array.from({ length: totalCells }).map((_, i) => (
          <button key={i} onClick={() => handleCellClick(i)} disabled={phase !== 'input'}
            className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl transition-all duration-150 border-2 ${
              wrongCell === i ? 'bg-red-500 border-red-600 animate-shake'
              : activeCell === i ? `${SEQ_COLORS[i % SEQ_COLORS.length]} border-transparent scale-90 shadow-lg`
              : 'bg-gray-100 border-gray-200 active:bg-gray-200'
            }`} />
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   GAME 3: CHIMP TEST — enhanced with progressive reveal
   ═══════════════════════════════════════════════════════════════════════ */
const ChimpTestGame: React.FC<GProps> = ({ level, onFinish }) => {
  const params = getGameParams('chimp-test', level);
  const gridSize = params.gridSize as number;
  const numCount = params.numbers as number;
  const totalCells = gridSize * gridSize;
  const [cells, setCells] = useState<(number | null)[]>([]);
  const [hidden, setHidden] = useState(false);
  const [nextExpected, setNextExpected] = useState(1);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrongIdx, setWrongIdx] = useState(-1);
  const [showTimer, setShowTimer] = useState(false);
  const startTime = useRef(Date.now());

  const setup = useCallback(() => {
    const c: (number | null)[] = new Array(totalCells).fill(null);
    const positions = new Set<number>();
    while (positions.size < Math.min(numCount, totalCells)) {
      positions.add(Math.floor(Math.random() * totalCells));
    }
    let num = 1;
    positions.forEach(pos => { c[pos] = num++; });
    setCells(c);
    setHidden(false);
    setNextExpected(1);
    setWrongIdx(-1);
    setShowTimer(true);
    setTimeout(() => { setHidden(true); setShowTimer(false); }, params.displayMs as number);
  }, [totalCells, numCount, params.displayMs]);

  useEffect(() => { setup(); }, []); // eslint-disable-line

  const handleClick = (idx: number) => {
    if (!hidden || cells[idx] === null) return;
    if (cells[idx] === nextExpected) {
      const newCells = [...cells];
      newCells[idx] = null;
      setCells(newCells);
      if (nextExpected >= numCount) {
        setCorrect(c => c + 1);
        setScore(s => s + numCount * 15);
        if (round < 3) {
          setRound(r => r + 1);
          setTimeout(setup, 500);
        } else {
          onFinish(score + numCount * 15, Math.round(((correct + 1) / round) * 100), Math.round((Date.now() - startTime.current) / 1000));
        }
      } else {
        setNextExpected(n => n + 1);
      }
    } else {
      setWrongIdx(idx);
      setTimeout(() => {
        onFinish(score, round > 1 ? Math.round((correct / round) * 100) : 0, Math.round((Date.now() - startTime.current) / 1000));
      }, 600);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh]">
      <div className="flex gap-1.5 mb-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`w-10 h-1.5 rounded-full ${i < round - 1 ? 'bg-emerald-400' : i === round - 1 ? 'bg-amber-500' : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-xs text-gray-400 mb-4 font-medium">
        {hidden ? (
          <span>Tap <span className="bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">{nextExpected}</span> next</span>
        ) : 'Memorize the positions!'}
      </p>

      {!hidden && <div className="mb-2"><TimerBar duration={params.displayMs as number} running={showTimer} color="bg-amber-500" /></div>}

      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {cells.map((val, i) => (
          <button key={i} onClick={() => handleClick(i)}
            className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl text-sm font-bold transition-all duration-150 ${
              wrongIdx === i ? 'bg-red-500 text-white animate-shake'
              : val !== null
                ? hidden
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-transparent active:from-amber-500 active:to-orange-600 shadow-md'
                  : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md'
                : 'bg-gray-100'
            }`}>
            {!hidden && val ? val : ''}
          </button>
        ))}
      </div>

      <p className="text-[10px] text-gray-300 mt-4">{numCount} numbers · Round {round}/3</p>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   GAME 4: WORD RECALL — enhanced with lives, visual feedback
   ═══════════════════════════════════════════════════════════════════════ */
const WordRecallGame: React.FC<GProps> = ({ level, onFinish }) => {
  const params = getGameParams('word-recall', level);
  const wordCount = params.wordCount as number;
  const totalRounds = params.rounds as number;
  const [pool] = useState(() => [...WORD_BANK].sort(() => Math.random() - 0.5).slice(0, wordCount));
  const [shown, setShown] = useState<Set<string>>(new Set());
  const [currentWord, setCurrentWord] = useState('');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const startTime = useRef(Date.now());

  const pickWord = useCallback(() => {
    if (shown.size > 0 && Math.random() < 0.4) {
      const seenArr = Array.from(shown);
      return seenArr[Math.floor(Math.random() * seenArr.length)];
    }
    const available = pool.filter(w => !shown.has(w));
    if (available.length === 0) return Array.from(shown)[Math.floor(Math.random() * shown.size)];
    return available[Math.floor(Math.random() * available.length)];
  }, [pool, shown]);

  useEffect(() => { setCurrentWord(pickWord()); }, []); // eslint-disable-line

  const answer = (isSeen: boolean) => {
    if (feedback) return;
    const wasSeen = shown.has(currentWord);
    const ok = isSeen === wasSeen;
    setFeedback(ok ? 'correct' : 'wrong');

    if (ok) {
      setScore(s => s + 10);
    } else {
      setLives(l => l - 1);
      if (lives <= 1) {
        setTimeout(() => onFinish(score, round > 0 ? Math.round((score / (round * 10)) * 100) : 0, Math.round((Date.now() - startTime.current) / 1000)), 600);
        return;
      }
    }
    setShown(prev => new Set(prev).add(currentWord));
    if (round + 1 >= totalRounds) {
      const finalScore = score + (ok ? 10 : 0);
      setTimeout(() => onFinish(finalScore, Math.round((finalScore / ((round + 1) * 10)) * 100), Math.round((Date.now() - startTime.current) / 1000)), 600);
      return;
    }
    setTimeout(() => {
      setRound(r => r + 1);
      setFeedback(null);
      setCurrentWord(pickWord());
    }, 500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
      {/* Progress bar */}
      <div className="w-full max-w-xs mb-3">
        <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${(round / totalRounds) * 100}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-gray-400">{round}/{totalRounds}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`text-sm transition-all ${i < lives ? '' : 'opacity-20 grayscale'}`}>❤️</span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className={`bg-white rounded-3xl px-10 py-8 shadow-xl border-2 mb-6 min-w-[240px] lg:min-w-[320px] transition-all ${
          feedback === 'correct' ? 'border-emerald-400 animate-flash-correct' : feedback === 'wrong' ? 'border-red-400 animate-shake' : 'border-gray-100'
        }`}>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
            {shown.size} words seen
          </p>
          <p className="text-3xl font-bold text-gray-900">{currentWord}</p>
        </div>
        {feedback && (
          <ScorePop value={feedback === 'correct' ? '+10' : '-1 ❤️'} correct={feedback === 'correct'} />
        )}
      </div>

      <p className="text-xs text-gray-400 mb-3">Have you seen this word?</p>
      <div className="flex gap-3 w-full max-w-xs lg:max-w-sm">
        <button onClick={() => answer(true)} disabled={!!feedback}
          className="flex-1 py-3.5 bg-emerald-500 text-white font-bold rounded-xl active:scale-95 transition-transform shadow-md shadow-emerald-500/30 disabled:opacity-70">
          SEEN
        </button>
        <button onClick={() => answer(false)} disabled={!!feedback}
          className="flex-1 py-3.5 bg-blue-500 text-white font-bold rounded-xl active:scale-95 transition-transform shadow-md shadow-blue-500/30 disabled:opacity-70">
          NEW
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   GAME 5: VISUAL PAIRS — enhanced with flip animation + move counter
   ═══════════════════════════════════════════════════════════════════════ */
const PAIR_EMOJIS = ['🍎','🍋','🍇','🌺','🌈','⭐','🎸','🏀','🚀','🎯','💎','🦋','🌙','🔥','🎭'];

const VisualPairsGame: React.FC<GProps> = ({ level, onFinish }) => {
  const params = getGameParams('visual-pairs', level);
  const pairCount = params.pairCount as number;
  const [cards, setCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [previewing, setPreviewing] = useState(true);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const emojis = PAIR_EMOJIS.slice(0, pairCount);
    const deck = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    setCards(deck);
    const all = new Set(deck.map((_, i) => i));
    setFlipped(all);
    setTimeout(() => { setFlipped(new Set()); setPreviewing(false); }, params.previewMs as number);
  }, []); // eslint-disable-line

  const handleFlip = (idx: number) => {
    if (locked || previewing || flipped.has(idx) || matched.has(idx) || selected.includes(idx)) return;
    const newSel = [...selected, idx];
    setSelected(newSel);
    setFlipped(f => new Set(f).add(idx));

    if (newSel.length === 2) {
      setAttempts(a => a + 1);
      setLocked(true);
      if (cards[newSel[0]] === cards[newSel[1]]) {
        const newMatched = new Set(matched);
        newMatched.add(newSel[0]);
        newMatched.add(newSel[1]);
        setMatched(newMatched);
        setSelected([]);
        setLocked(false);
        if (newMatched.size >= cards.length) {
          const att = attempts + 1;
          const acc = Math.min(100, Math.round((pairCount / att) * 100));
          const sc = Math.max(10, Math.round(pairCount * 20 * (pairCount / att)));
          setTimeout(() => onFinish(sc, acc, Math.round((Date.now() - startTime.current) / 1000)), 400);
        }
      } else {
        setTimeout(() => {
          setFlipped(f => { const n = new Set(f); n.delete(newSel[0]); n.delete(newSel[1]); return n; });
          setSelected([]);
          setLocked(false);
        }, 700);
      }
    }
  };

  const cols = cards.length <= 8 ? 4 : cards.length <= 12 ? 4 : cards.length <= 20 ? 5 : 6;

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh]">
      <div className="flex items-center gap-4 mb-4">
        <span className="text-[10px] text-gray-400 font-medium">Moves: <span className="font-bold text-gray-700">{attempts}</span></span>
        <span className="text-[10px] text-gray-400 font-medium">Pairs: <span className="font-bold text-emerald-600">{matched.size / 2}/{pairCount}</span></span>
      </div>

      {previewing && (
        <div className="mb-2">
          <TimerBar duration={params.previewMs as number} running={previewing} color="bg-pink-500" />
          <p className="text-[10px] text-gray-400 text-center mt-1">Memorize the positions!</p>
        </div>
      )}

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map((emoji, i) => {
          const isFlipped = flipped.has(i) || matched.has(i);
          const isMatched = matched.has(i);
          return (
            <button key={i} onClick={() => handleFlip(i)}
              className={`rounded-xl text-xl flex items-center justify-center transition-all duration-200 w-11 h-11 sm:w-13 sm:h-13 lg:w-14 lg:h-14 ${
                isMatched ? 'bg-emerald-100 border-2 border-emerald-300 scale-90'
                : isFlipped ? 'bg-white shadow-lg border-2 border-gray-200 scale-105'
                : 'bg-gradient-to-br from-pink-500 to-rose-600 shadow-md active:scale-95'
              }`}>
              {isFlipped ? emoji : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   GAME 6: PATTERN MATRIX — enhanced with grid feedback
   ═══════════════════════════════════════════════════════════════════════ */
const PatternMatrixGame: React.FC<GProps> = ({ level, onFinish }) => {
  const params = getGameParams('pattern-matrix', level);
  const gridSize = params.gridSize as number;
  const highlightCount = params.highlightCount as number;
  const totalCells = gridSize * gridSize;
  const [pattern, setPattern] = useState<Set<number>>(new Set());
  const [playerPattern, setPlayerPattern] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<'show' | 'input' | 'reveal'>('show');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const startTime = useRef(Date.now());

  const setup = useCallback(() => {
    const p = new Set<number>();
    while (p.size < Math.min(highlightCount, totalCells)) {
      p.add(Math.floor(Math.random() * totalCells));
    }
    setPattern(p);
    setPlayerPattern(new Set());
    setPhase('show');
    setShowTimer(true);
    setTimeout(() => { setPhase('input'); setShowTimer(false); }, params.displayMs as number);
  }, [highlightCount, totalCells, params.displayMs]);

  useEffect(() => { setup(); }, []); // eslint-disable-line

  const toggleCell = (idx: number) => {
    if (phase !== 'input') return;
    setPlayerPattern(prev => {
      const n = new Set(prev);
      if (n.has(idx)) n.delete(idx); else n.add(idx);
      return n;
    });
  };

  const submitPattern = () => {
    setPhase('reveal');
    const patArr = Array.from(pattern);
    const playerArr = Array.from(playerPattern);
    const correctCells = patArr.filter(c => playerPattern.has(c)).length;
    const wrongCells = playerArr.filter(c => !pattern.has(c)).length;
    const acc = Math.round((correctCells / Math.max(patArr.length, 1)) * 100);
    const roundScore = Math.max(0, correctCells * 15 - wrongCells * 10);
    setScore(s => s + roundScore);
    if (acc >= 60) setCorrect(c => c + 1);

    setTimeout(() => {
      if (round < 3) {
        setRound(r => r + 1);
        setup();
      } else {
        onFinish(score + roundScore, round > 0 ? Math.round(((correct + (acc >= 60 ? 1 : 0)) / round) * 100) : 0, Math.round((Date.now() - startTime.current) / 1000));
      }
    }, 1200);
  };

  const cellColor = (i: number) => {
    if (phase === 'show') return pattern.has(i) ? 'bg-cyan-500 shadow-md shadow-cyan-500/30 scale-95' : 'bg-gray-100';
    if (phase === 'input') return playerPattern.has(i) ? 'bg-cyan-500 shadow-md scale-95' : 'bg-gray-100 active:bg-gray-200';
    // Reveal phase
    const inPattern = pattern.has(i);
    const inPlayer = playerPattern.has(i);
    if (inPattern && inPlayer) return 'bg-emerald-400 shadow-md scale-95'; // correct
    if (inPattern && !inPlayer) return 'bg-amber-400 shadow-md scale-95 animate-pulse'; // missed
    if (!inPattern && inPlayer) return 'bg-red-400 shadow-md scale-95'; // wrong
    return 'bg-gray-100';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh]">
      <div className="flex gap-1.5 mb-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`w-10 h-1.5 rounded-full ${i < round - 1 ? 'bg-emerald-400' : i === round - 1 ? 'bg-cyan-500' : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-xs text-gray-400 mb-2 font-medium">
        {phase === 'show' ? `Memorize! (${highlightCount} cells)` : phase === 'input' ? `Tap the cells · ${playerPattern.size} selected` : 'Checking...'}
      </p>

      {phase === 'show' && <div className="w-48 mb-3"><TimerBar duration={params.displayMs as number} running={showTimer} color="bg-cyan-500" /></div>}

      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {Array.from({ length: totalCells }).map((_, i) => (
          <button key={i} onClick={() => toggleCell(i)} disabled={phase !== 'input'}
            className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl transition-all duration-200 ${cellColor(i)}`} />
        ))}
      </div>

      {phase === 'input' && (
        <button onClick={submitPattern}
          className="mt-5 px-8 py-2.5 bg-cyan-600 text-white font-bold rounded-xl active:scale-95 shadow-md shadow-cyan-600/30">
          Submit ({playerPattern.size})
        </button>
      )}

      {phase === 'reveal' && (
        <div className="mt-3 flex gap-3 text-[10px] font-medium">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400"></span> Correct</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400"></span> Missed</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400"></span> Wrong</span>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   GAME 7: SPEED MATCH — enhanced with streak counter + per-round timer
   ═══════════════════════════════════════════════════════════════════════ */
const SpeedMatchGame: React.FC<GProps> = ({ level, onFinish }) => {
  const params = getGameParams('speed-match', level);
  const symbolCount = params.symbolCount as number;
  const totalRounds = params.rounds as number;
  const [symbols] = useState(() => SPEED_SYMBOLS.slice(0, symbolCount));
  const [prev, setPrev] = useState('');
  const [current, setCurrent] = useState('');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    setPrev(symbols[Math.floor(Math.random() * symbols.length)]);
    setCurrent(symbols[Math.floor(Math.random() * symbols.length)]);
    setRound(1);
  }, []); // eslint-disable-line

  const answer = (same: boolean) => {
    if (feedback) return;
    const isMatch = current === prev;
    const ok = same === isMatch;
    setFeedback(ok ? 'correct' : 'wrong');

    if (ok) {
      setScore(s => s + 10 + streak * 2);
      setCorrect(c => c + 1);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (round >= totalRounds) {
        onFinish(score + (ok ? 10 + streak * 2 : 0), Math.round(((correct + (ok ? 1 : 0)) / round) * 100), Math.round((Date.now() - startTime.current) / 1000));
        return;
      }
      setPrev(current);
      setCurrent(symbols[Math.floor(Math.random() * symbols.length)]);
      setRound(r => r + 1);
      setFeedback(null);
    }, 300);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
      {/* Progress */}
      <div className="w-full max-w-xs mb-3">
        <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div className="bg-red-500 h-full rounded-full transition-all" style={{ width: `${(round / totalRounds) * 100}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-gray-400">{round}/{totalRounds}</span>
          {streak >= 3 && (
            <span className="text-[9px] text-amber-600 font-bold animate-pop-in">🔥 {streak} streak!</span>
          )}
        </div>
      </div>

      <div className="relative mb-2">
        <div className={`bg-white rounded-3xl w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 flex items-center justify-center shadow-xl border-2 transition-all duration-150 ${
          feedback === 'correct' ? 'border-emerald-400 shadow-emerald-200' : feedback === 'wrong' ? 'border-red-400 animate-shake shadow-red-200' : 'border-gray-100'
        }`}>
          <span className="text-5xl sm:text-6xl lg:text-7xl text-gray-800 select-none">{current}</span>
        </div>
        {feedback && (
          <ScorePop value={feedback === 'correct' ? `+${10 + (streak - 1) * 2}` : 'Miss'} correct={feedback === 'correct'} />
        )}
      </div>

      <p className="text-[10px] text-gray-300 mb-1">Previous: <span className="text-gray-500 font-medium">{prev}</span></p>
      <p className="text-xs text-gray-400 font-medium mb-5">Same as previous?</p>

      <div className="flex gap-3 w-full max-w-xs lg:max-w-sm">
        <button onClick={() => answer(true)} disabled={!!feedback}
          className="flex-1 py-3.5 bg-emerald-500 text-white font-bold rounded-xl active:scale-95 transition-transform text-lg shadow-md shadow-emerald-500/30 disabled:opacity-80">
          YES
        </button>
        <button onClick={() => answer(false)} disabled={!!feedback}
          className="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-xl active:scale-95 transition-transform text-lg shadow-md shadow-red-500/30 disabled:opacity-80">
          NO
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   GAME 8: MEMORY PALACE — enhanced with walking animation + review
   ═══════════════════════════════════════════════════════════════════════ */
const MemoryPalaceGame: React.FC<GProps> = ({ level, onFinish }) => {
  const params = getGameParams('memory-palace', level);
  const roomCount = params.rooms as number;
  const [rooms] = useState(() => PALACE_ROOMS.slice(0, roomCount));
  const [assignments] = useState(() => {
    const shuffledItems = [...PALACE_ITEMS].sort(() => Math.random() - 0.5);
    return rooms.map((r, i) => ({ room: r, item: shuffledItems[i % shuffledItems.length] }));
  });
  const [phase, setPhase] = useState<'study' | 'test'>('study');
  const [studyIndex, setStudyIndex] = useState(0);
  const [testIndex, setTestIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showTimer, setShowTimer] = useState(true);
  const startTime = useRef(Date.now());
  const studyMs = params.studyMs as number;

  useEffect(() => {
    if (phase === 'study') {
      setShowTimer(true);
      const timer = setTimeout(() => {
        if (studyIndex < assignments.length - 1) {
          setStudyIndex(i => i + 1);
        } else {
          setPhase('test');
          prepareTest(0);
        }
      }, studyMs);
      return () => clearTimeout(timer);
    }
  }, [phase, studyIndex]); // eslint-disable-line

  const prepareTest = (idx: number) => {
    const correctItem = assignments[idx].item;
    const others = PALACE_ITEMS.filter(it => it !== correctItem).sort(() => Math.random() - 0.5).slice(0, 3);
    setOptions([correctItem, ...others].sort(() => Math.random() - 0.5));
    setTestIndex(idx);
    setFeedback(null);
  };

  const answerTest = (item: string) => {
    if (feedback) return;
    const ok = item === assignments[testIndex].item;
    setFeedback(ok ? 'correct' : 'wrong');
    if (ok) {
      setScore(s => s + 20);
      setCorrect(c => c + 1);
    }

    setTimeout(() => {
      if (testIndex < assignments.length - 1) {
        prepareTest(testIndex + 1);
      } else {
        const totalQ = assignments.length;
        const finalCorrect = correct + (ok ? 1 : 0);
        onFinish(score + (ok ? 20 : 0), Math.round((finalCorrect / totalQ) * 100), Math.round((Date.now() - startTime.current) / 1000));
      }
    }, 800);
  };

  if (phase === 'study') {
    const a = assignments[studyIndex];
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
        {/* Room progress dots */}
        <div className="flex gap-1 mb-4">
          {assignments.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${
              i < studyIndex ? 'bg-indigo-400' : i === studyIndex ? 'bg-indigo-600 scale-125' : 'bg-gray-200'
            }`} />
          ))}
        </div>

        <div key={studyIndex} className="animate-scale-in">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 text-center min-w-[280px] lg:min-w-[360px]">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Room {studyIndex + 1}</p>
            <p className="text-4xl mb-1 animate-float">{a.room.emoji}</p>
            <p className="text-sm font-bold text-gray-800 mb-3">{a.room.name}</p>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100">
              <p className="text-[10px] text-gray-400 mb-1">Item placed here:</p>
              <p className="text-lg font-medium">{a.item}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 w-48">
          <TimerBar duration={studyMs} running={showTimer} color="bg-indigo-500" />
        </div>
        <p className="text-[10px] text-gray-300 mt-2">Visualize this item in the room 🧠</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
      {/* Test progress */}
      <div className="flex gap-1 mb-4">
        {assignments.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${
            i < testIndex ? 'bg-emerald-400' : i === testIndex ? 'bg-violet-600 scale-125' : 'bg-gray-200'
          }`} />
        ))}
      </div>

      <div key={testIndex} className="animate-fade-up">
        <div className={`bg-white rounded-3xl p-5 shadow-xl border-2 text-center mb-4 min-w-[280px] lg:min-w-[360px] transition-all ${
          feedback === 'correct' ? 'border-emerald-400' : feedback === 'wrong' ? 'border-red-400 animate-shake' : 'border-gray-100'
        }`}>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">What was in this room?</p>
          <p className="text-4xl mb-1">{assignments[testIndex].room.emoji}</p>
          <p className="text-sm font-bold text-gray-800">{assignments[testIndex].room.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full max-w-xs lg:max-w-sm">
          {options.map((item, i) => {
            let btnClass = 'bg-white border-2 border-gray-100 shadow-sm active:scale-95';
            if (feedback) {
              if (item === assignments[testIndex].item) btnClass = 'bg-emerald-50 border-2 border-emerald-400';
              else if (feedback === 'wrong') btnClass = 'bg-gray-50 border-2 border-gray-100 opacity-50';
            }
            return (
              <button key={i} onClick={() => answerTest(item)} disabled={!!feedback}
                className={`rounded-xl p-3 text-sm font-medium transition-all ${btnClass}`}>
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-gray-300 mt-4">{correct}/{testIndex + (feedback ? 1 : 0)} correct</p>
    </div>
  );
};

export default Memory;
