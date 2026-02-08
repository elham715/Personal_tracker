import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Plus, X, ChevronLeft, Zap, BookOpen, Trophy, Trash2, Edit3, Layers } from 'lucide-react';
import { MemoryCard } from '@/types';
import { memoryAPI } from '@/services/memoryApi';

/* ═══════════════════════════════════════════════════════════════════════
   MEMORY SYSTEM — Spaced Repetition Flashcard Review
   ═══════════════════════════════════════════════════════════════════════ */

type ViewMode = 'home' | 'review' | 'create' | 'browse';

const CATEGORIES = ['Vocabulary', 'Science', 'History', 'Math', 'Language', 'Code', 'Custom'];
const DIFFICULTIES: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];

const Memory: React.FC = () => {
  const [view, setView] = useState<ViewMode>('home');
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [dueCards, setDueCards] = useState<MemoryCard[]>([]);
  const [stats, setStats] = useState({ totalCards: 0, dueToday: 0, mastered: 0, totalReviews: 0, accuracy: 0, bestStreak: 0 });
  const [categories, setCategories] = useState<string[]>([]);

  // Review state
  const [reviewQueue, setReviewQueue] = useState<MemoryCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newCategory, setNewCategory] = useState('Vocabulary');
  const [newDifficulty, setNewDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Browse filter
  const [filterCat, setFilterCat] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');

  const refresh = useCallback(async () => {
    const [allCards, due, s, cats] = await Promise.all([
      memoryAPI.getAll(),
      memoryAPI.getDueCards(),
      memoryAPI.getStats(),
      memoryAPI.getCategories(),
    ]);
    setCards(allCards);
    setDueCards(due);
    setStats(s);
    setCategories(cats);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Create Card ──
  const handleCreate = async () => {
    if (!newFront.trim() || !newBack.trim()) return;
    await memoryAPI.create({
      front: newFront.trim(),
      back: newBack.trim(),
      category: newCategory,
      difficulty: newDifficulty,
    });
    setNewFront('');
    setNewBack('');
    setShowCreate(false);
    await refresh();
  };

  // ── Start Review ──
  const startReview = () => {
    if (dueCards.length === 0) return;
    setReviewQueue([...dueCards]);
    setCurrentIndex(0);
    setFlipped(false);
    setReviewDone(false);
    setSessionStats({ correct: 0, wrong: 0 });
    setView('review');
  };

  // ── Answer Card ──
  const answerCard = async (quality: number) => {
    const card = reviewQueue[currentIndex];
    await memoryAPI.review(card.id, quality);

    setSessionStats(prev => ({
      correct: prev.correct + (quality >= 3 ? 1 : 0),
      wrong: prev.wrong + (quality < 3 ? 1 : 0),
    }));

    if (currentIndex + 1 >= reviewQueue.length) {
      setReviewDone(true);
      await refresh();
    } else {
      setCurrentIndex(prev => prev + 1);
      setFlipped(false);
    }
  };

  // ── Delete Card ──
  const handleDelete = async (id: string) => {
    await memoryAPI.delete(id);
    await refresh();
  };

  // ── Save Edit ──
  const saveEdit = async (id: string) => {
    if (!editFront.trim() || !editBack.trim()) return;
    await memoryAPI.update(id, { front: editFront.trim(), back: editBack.trim() });
    setEditingId(null);
    await refresh();
  };

  const filteredCards = filterCat === 'all' ? cards : cards.filter(c => c.category === filterCat);

  // ═══════════════════════════════════════════════════
  //  REVIEW MODE
  // ═══════════════════════════════════════════════════
  if (view === 'review') {
    if (reviewDone) {
      const total = sessionStats.correct + sessionStats.wrong;
      const pct = total > 0 ? Math.round((sessionStats.correct / total) * 100) : 0;
      return (
        <div className="page-container max-w-lg mx-auto flex flex-col items-center justify-center min-h-[70vh]">
          <div className="bg-white rounded-3xl p-8 w-full text-center animate-fade-up">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 mx-auto flex items-center justify-center mb-4">
              <Trophy size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Session Complete!</h2>
            <p className="text-sm text-gray-500 mb-6">Great work reviewing your cards</p>
            <div className="flex justify-center gap-8 mb-6">
              <div>
                <p className="text-3xl font-bold text-emerald-600">{sessionStats.correct}</p>
                <p className="text-xs text-gray-400">Correct</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-500">{sessionStats.wrong}</p>
                <p className="text-xs text-gray-400">Wrong</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-indigo-600">{pct}%</p>
                <p className="text-xs text-gray-400">Accuracy</p>
              </div>
            </div>
            <button onClick={() => setView('home')}
              className="bg-indigo-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl active:scale-95 transition-transform">
              Back to Memory
            </button>
          </div>
        </div>
      );
    }

    const card = reviewQueue[currentIndex];
    const progress = ((currentIndex + 1) / reviewQueue.length) * 100;

    return (
      <div className="page-container max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 pt-3 mb-4">
          <button onClick={() => setView('home')} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-gray-400 font-medium">Card {currentIndex + 1} of {reviewQueue.length}</p>
            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="relative" style={{ perspective: '1000px' }}>
          <button onClick={() => setFlipped(!flipped)}
            className="w-full min-h-[280px] lg:min-h-[320px] active:scale-[0.98] transition-transform"
            style={{ transformStyle: 'preserve-3d' }}>
            <div className={`w-full min-h-[280px] lg:min-h-[320px] rounded-3xl p-8 flex flex-col items-center justify-center transition-all duration-500 ${
              flipped ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200'
            }`}>
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${flipped ? 'text-emerald-500' : 'text-indigo-400'}`}>
                {flipped ? '✦ Answer' : '✦ Question'}
              </div>
              <p className={`text-xl lg:text-2xl font-semibold text-center leading-relaxed ${flipped ? 'text-emerald-900' : 'text-gray-900'}`}>
                {flipped ? card.back : card.front}
              </p>
              <div className="mt-6 flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 text-gray-500 font-medium">
                  {card.category}
                </span>
                {card.streak > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">
                    🔥 {card.streak}
                  </span>
                )}
              </div>
              {!flipped && (
                <p className="text-[11px] text-gray-400 mt-4">Tap to reveal answer</p>
              )}
            </div>
          </button>
        </div>

        {/* Answer Buttons */}
        {flipped && (
          <div className="mt-5 space-y-2 animate-fade-up">
            <p className="text-center text-[11px] text-gray-400 font-medium mb-2">How well did you know this?</p>
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => answerCard(0)}
                className="flex flex-col items-center gap-0.5 py-3 rounded-xl bg-red-50 active:bg-red-100 transition-colors border border-red-100">
                <span className="text-lg">😵</span>
                <span className="text-[10px] font-semibold text-red-600">Forgot</span>
              </button>
              <button onClick={() => answerCard(2)}
                className="flex flex-col items-center gap-0.5 py-3 rounded-xl bg-orange-50 active:bg-orange-100 transition-colors border border-orange-100">
                <span className="text-lg">😬</span>
                <span className="text-[10px] font-semibold text-orange-600">Hard</span>
              </button>
              <button onClick={() => answerCard(3)}
                className="flex flex-col items-center gap-0.5 py-3 rounded-xl bg-blue-50 active:bg-blue-100 transition-colors border border-blue-100">
                <span className="text-lg">🙂</span>
                <span className="text-[10px] font-semibold text-blue-600">Good</span>
              </button>
              <button onClick={() => answerCard(5)}
                className="flex flex-col items-center gap-0.5 py-3 rounded-xl bg-emerald-50 active:bg-emerald-100 transition-colors border border-emerald-100">
                <span className="text-lg">🤩</span>
                <span className="text-[10px] font-semibold text-emerald-600">Easy</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  //  BROWSE MODE
  // ═══════════════════════════════════════════════════
  if (view === 'browse') {
    return (
      <div className="page-container max-w-lg lg:max-w-3xl mx-auto">
        <div className="flex items-center gap-3 pt-3 mb-4">
          <button onClick={() => setView('home')} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">All Cards</h1>
          <span className="text-xs text-gray-400 font-medium">{filteredCards.length} cards</span>
        </div>

        {/* Category Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 no-scrollbar mb-3">
          <button onClick={() => setFilterCat('all')}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              filterCat === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
            }`}>All</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                filterCat === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}>{cat}</button>
          ))}
        </div>

        {/* Cards List */}
        <div className="space-y-2">
          {filteredCards.map(card => (
            <div key={card.id} className="bg-white rounded-xl p-4">
              {editingId === card.id ? (
                <div className="space-y-2">
                  <input value={editFront} onChange={e => setEditFront(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="Front (question)" />
                  <input value={editBack} onChange={e => setEditBack(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="Back (answer)" />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(card.id)}
                      className="flex-1 text-xs font-semibold bg-indigo-600 text-white py-2 rounded-lg">Save</button>
                    <button onClick={() => setEditingId(null)}
                      className="flex-1 text-xs font-semibold bg-gray-100 text-gray-600 py-2 rounded-lg">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{card.front}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{card.back}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setEditingId(card.id); setEditFront(card.front); setEditBack(card.back); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100">
                        <Edit3 size={14} className="text-gray-400" />
                      </button>
                      <button onClick={() => handleDelete(card.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{card.category}</span>
                    <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${
                      card.difficulty === 'easy' ? 'bg-green-50 text-green-600' :
                      card.difficulty === 'hard' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}>{card.difficulty}</span>
                    {card.streak > 0 && (
                      <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-500">🔥 {card.streak}</span>
                    )}
                    <span className="text-[9px] text-gray-400 ml-auto">
                      {card.timesReviewed > 0 ? `${Math.round((card.timesCorrect / card.timesReviewed) * 100)}% accuracy` : 'New'}
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
          {filteredCards.length === 0 && (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm text-gray-400">No cards found</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  //  HOME MODE
  // ═══════════════════════════════════════════════════
  return (
    <div className="page-container max-w-lg lg:max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 mb-5 animate-fade-up">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Brain size={22} className="text-purple-600" /> Memory
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Spaced repetition flashcards</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-purple-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl active:scale-95 transition-transform shadow-sm shadow-purple-200">
          <Plus size={15} /> New Card
        </button>
      </div>

      {/* Review CTA Card */}
      <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
        <button onClick={startReview} disabled={dueCards.length === 0}
          className={`w-full rounded-2xl p-5 text-left transition-all active:scale-[0.98] ${
            dueCards.length > 0
              ? 'bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 shadow-lg shadow-purple-200/50'
              : 'bg-gray-100'
          }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              dueCards.length > 0 ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              <Zap size={28} className={dueCards.length > 0 ? 'text-white' : 'text-gray-400'} />
            </div>
            <div className="flex-1">
              <h3 className={`text-base font-bold ${dueCards.length > 0 ? 'text-white' : 'text-gray-400'}`}>
                {dueCards.length > 0 ? 'Start Review' : 'All caught up!'}
              </h3>
              <p className={`text-xs mt-0.5 ${dueCards.length > 0 ? 'text-white/70' : 'text-gray-400'}`}>
                {dueCards.length > 0 ? `${dueCards.length} card${dueCards.length > 1 ? 's' : ''} due today` : 'No cards to review right now'}
              </p>
            </div>
            {dueCards.length > 0 && (
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{dueCards.length}</span>
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5 mt-4 animate-fade-up" style={{ animationDelay: '120ms' }}>
        <div className="bg-white rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.totalCards}</p>
          <p className="text-[10px] text-gray-400 font-medium">Total Cards</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.mastered}</p>
          <p className="text-[10px] text-gray-400 font-medium">Mastered</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-indigo-600">{stats.accuracy}%</p>
          <p className="text-[10px] text-gray-400 font-medium">Accuracy</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2.5 mt-4 animate-fade-up" style={{ animationDelay: '180ms' }}>
        <button onClick={() => setView('browse')}
          className="flex-1 flex items-center justify-center gap-2 bg-white rounded-xl py-3 text-sm font-medium text-gray-700 active:bg-gray-50 transition-colors">
          <Layers size={16} className="text-gray-400" /> Browse All
        </button>
        <button onClick={() => setShowCreate(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-white rounded-xl py-3 text-sm font-medium text-gray-700 active:bg-gray-50 transition-colors">
          <Plus size={16} className="text-gray-400" /> Add Cards
        </button>
      </div>

      {/* Due Cards Preview */}
      {dueCards.length > 0 && (
        <div className="mt-5 animate-fade-up" style={{ animationDelay: '240ms' }}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Due Today</h3>
          <div className="space-y-1.5">
            {dueCards.slice(0, 5).map(card => (
              <div key={card.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                  card.difficulty === 'easy' ? 'bg-green-50' :
                  card.difficulty === 'hard' ? 'bg-red-50' : 'bg-amber-50'
                }`}>
                  <BookOpen size={16} className={
                    card.difficulty === 'easy' ? 'text-green-500' :
                    card.difficulty === 'hard' ? 'text-red-500' : 'text-amber-500'
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{card.front}</p>
                  <p className="text-[10px] text-gray-400">{card.category}</p>
                </div>
                {card.streak > 0 && (
                  <span className="text-[10px] font-semibold text-orange-500">🔥{card.streak}</span>
                )}
              </div>
            ))}
            {dueCards.length > 5 && (
              <p className="text-center text-xs text-gray-400 py-1">+{dueCards.length - 5} more</p>
            )}
          </div>
        </div>
      )}

      {/* Category Overview */}
      {categories.length > 0 && (
        <div className="mt-5 mb-24 animate-fade-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Categories</h3>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(cat => {
              const catCards = cards.filter(c => c.category === cat);
              const mastered = catCards.filter(c => c.repetitions >= 5).length;
              return (
                <button key={cat} onClick={() => { setFilterCat(cat); setView('browse'); }}
                  className="bg-white rounded-xl p-3 text-left active:bg-gray-50 transition-colors">
                  <p className="text-sm font-semibold text-gray-800">{cat}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{catCards.length} cards · {mastered} mastered</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {cards.length === 0 && (
        <div className="mt-12 text-center animate-fade-up">
          <div className="w-20 h-20 rounded-full bg-purple-50 mx-auto flex items-center justify-center mb-4">
            <Brain size={36} className="text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Start Your Memory Deck</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
            Create flashcards and review them with spaced repetition to remember anything forever
          </p>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 bg-purple-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl active:scale-95 transition-transform">
            <Plus size={16} /> Create Your First Card
          </button>
        </div>
      )}

      {/* ── Create Card Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-md p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">New Card</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Question / Front</label>
                <textarea value={newFront} onChange={e => setNewFront(e.target.value)}
                  className="w-full mt-1.5 text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  rows={2} placeholder="What is the capital of France?" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Answer / Back</label>
                <textarea value={newBack} onChange={e => setNewBack(e.target.value)}
                  className="w-full mt-1.5 text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  rows={2} placeholder="Paris" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setNewCategory(cat)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                        newCategory === cat ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>{cat}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Difficulty</label>
                <div className="flex gap-2 mt-1.5">
                  {DIFFICULTIES.map(d => (
                    <button key={d} onClick={() => setNewDifficulty(d)}
                      className={`flex-1 text-xs font-semibold py-2 rounded-lg capitalize transition-colors ${
                        newDifficulty === d
                          ? d === 'easy' ? 'bg-green-100 text-green-700 ring-1 ring-green-300' :
                            d === 'hard' ? 'bg-red-100 text-red-700 ring-1 ring-red-300' : 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                          : 'bg-gray-50 text-gray-400'
                      }`}>{d}</button>
                  ))}
                </div>
              </div>
              <button onClick={handleCreate}
                className="w-full bg-purple-600 text-white text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-transform shadow-sm shadow-purple-200 mt-2">
                Create Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Memory;
