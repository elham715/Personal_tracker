import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/utils/helpers';
import { Flame, Zap, Leaf, Plus, Trash2, Check, Sun, CalendarDays, ListChecks, Calendar, Target } from 'lucide-react';

/* ── Urgency system — original themed labels ──────────── */
const URGENCY = {
  high:   { icon: Flame, label: 'Urgent',    gradient: 'from-rose-500 to-pink-500',   bg: 'bg-rose-500',   ring: 'ring-rose-200',   text: 'text-rose-600',   lightBg: 'bg-rose-50',   glow: '0 4px 20px -4px rgba(244,63,94,0.35)',  cardBg: 'bg-rose-50/80 border-rose-200/60',     cardShadow: '0 2px 12px -3px rgba(244,63,94,0.15)' },
  medium: { icon: Zap,   label: 'Important', gradient: 'from-amber-400 to-orange-400', bg: 'bg-amber-400',  ring: 'ring-amber-200',  text: 'text-amber-600',  lightBg: 'bg-amber-50',  glow: '0 4px 20px -4px rgba(251,191,36,0.35)', cardBg: 'bg-amber-50/80 border-amber-200/60',    cardShadow: '0 2px 12px -3px rgba(251,191,36,0.15)' },
  low:    { icon: Leaf,  label: 'Chill',     gradient: 'from-teal-400 to-emerald-400', bg: 'bg-emerald-400', ring: 'ring-emerald-200', text: 'text-emerald-600', lightBg: 'bg-emerald-50', glow: '0 4px 20px -4px rgba(52,211,153,0.3)',  cardBg: 'bg-emerald-50/70 border-emerald-200/50', cardShadow: '0 2px 12px -3px rgba(52,211,153,0.12)' },
} as const;

type Priority = keyof typeof URGENCY;
type Scope = 'daily' | 'weekly' | 'monthly';

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

const sortByUrgencyThenNewest = (items: any[]) =>
  items.slice().sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 2;
    const pb = PRIORITY_ORDER[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return 0;
  });

/* ── Date helpers ── */
const getWeekKey = (d = new Date()) => {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toLocaleDateString('en-CA');
};

const getMonthKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
};

const getWeekLabel = () => {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(monday)} – ${fmt(sunday)}`;
};

const getMonthLabel = () => {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

/* ── Scope tab config ── */
const SCOPE_TABS = [
  { key: 'daily' as Scope,   label: 'Daily',   icon: Sun },
  { key: 'weekly' as Scope,  label: 'Weekly',  icon: CalendarDays },
  { key: 'monthly' as Scope, label: 'Monthly', icon: Calendar },
];

const SCOPE_HERO: Record<Scope, string> = {
  daily:   'from-indigo-600 via-indigo-500 to-violet-500',
  weekly:  'from-cyan-600 via-blue-500 to-indigo-500',
  monthly: 'from-violet-600 via-purple-500 to-fuchsia-500',
};

const SCOPE_LABEL: Record<Scope, string> = {
  daily:   "TODAY'S PROGRESS",
  weekly:  'WEEKLY PROGRESS',
  monthly: 'MONTHLY PROGRESS',
};

const TaskManager: React.FC = () => {
  const { habits, tasks, addTask, toggleTask, deleteTask, toggleHabitDate } = useApp();
  const [scope, setScope] = useState<Scope>('daily');
  const [dailyView, setDailyView] = useState<'today' | 'week' | 'all'>('today');
  const [composing, setComposing] = useState(false);
  const [newText, setNewText] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState<Priority>('low');
  const inputRef = useRef<HTMLInputElement>(null);
  const today = formatDate();
  const weekKey = getWeekKey();
  const monthKey = getMonthKey();

  useEffect(() => {
    if (composing) setTimeout(() => inputRef.current?.focus(), 120);
  }, [composing]);

  useEffect(() => {
    setComposing(false);
    setNewText('');
  }, [scope]);

  /* ── Data helpers ── */
  const getWeekDays = () => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return {
      key: formatDate(d),
      short: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
  });

  const dailyTasksFor = (dateStr: string) => {
    const fromHabits = habits.filter(h => h?.id && Array.isArray(h.completedDates)).map(h => ({
      id: `habit_${h.id}_${dateStr}`, text: h.name, icon: h.icon,
      completed: h.completedDates.includes(dateStr),
      priority: 'high' as Priority, isHabit: true, habitId: h.id, date: dateStr, createdAt: '', scope: 'daily' as Scope,
    }));
    const dateTasks = tasks.filter(t => t.date === dateStr && !t.isHabit && (t.scope === 'daily' || !t.scope)).slice().reverse();
    return [...fromHabits, ...sortByUrgencyThenNewest(dateTasks)];
  };

  const scopedTasks = (s: Scope) => {
    const key = s === 'weekly' ? weekKey : s === 'monthly' ? monthKey : today;
    return sortByUrgencyThenNewest(
      tasks.filter(t => !t.isHabit && t.scope === s && t.date === key).slice().reverse()
    );
  };

  const handleAdd = async () => {
    if (!newText.trim()) return;
    const dateKey = scope === 'weekly' ? weekKey : scope === 'monthly' ? monthKey : today;
    await addTask({ text: newText, completed: false, priority: selectedUrgency, isHabit: false, date: dateKey, scope });
    setNewText('');
    setSelectedUrgency('low');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleToggle = useCallback((task: any) => {
    if (task.isHabit && task.habitId) toggleHabitDate(task.habitId, task.date);
    else toggleTask(task.id);
  }, [toggleHabitDate, toggleTask]);

  /* ── Stats per scope ── */
  const todayItems = dailyTasksFor(today);
  const weekItems = scopedTasks('weekly');
  const monthItems = scopedTasks('monthly');

  const getStatsForScope = () => {
    if (scope === 'daily') {
      const items = todayItems;
      return { done: items.filter(t => t.completed).length, total: items.length };
    }
    if (scope === 'weekly') {
      return { done: weekItems.filter(t => t.completed).length, total: weekItems.length };
    }
    return { done: monthItems.filter(t => t.completed).length, total: monthItems.length };
  };

  const { done, total } = getStatsForScope();
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  /* ── Render helpers ── */
  const renderTaskCard = (task: any, i: number) => {
    const u = URGENCY[task.priority as Priority] || URGENCY.low;
    const UIcon = u.icon;
    const isDone = task.completed;
    return (
      <div key={task.id} className="animate-fade-up group" style={{ animationDelay: `${i * 35}ms` }}>
        <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
          ${isDone ? `${u.cardBg} opacity-70` : `${u.cardBg} hover:shadow-md`}
          active:scale-[0.99]`}
          style={{ boxShadow: u.cardShadow }}>
          <button onClick={() => handleToggle(task)} className="flex-shrink-0">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
              isDone ? `bg-gradient-to-br ${u.gradient}` : 'border-2 border-gray-200 hover:border-gray-300'
            }`}>
              {isDone && <Check size={13} className="text-white" strokeWidth={3} />}
            </div>
          </button>
          {task.isHabit && task.icon && <span className="text-base flex-shrink-0 -ml-1">{task.icon}</span>}
          <div className="flex-1 min-w-0">
            <p className={`text-[14px] leading-snug truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>
              {task.text}
            </p>
            {task.isHabit && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded mt-0.5">
                ✦ HABIT
              </span>
            )}
          </div>
          {!task.isHabit && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${u.lightBg} flex-shrink-0`}>
              <UIcon size={10} className={u.text} />
              <span className={`text-[9px] font-bold ${u.text} uppercase`}>{u.label}</span>
            </div>
          )}
          {!task.isHabit && (
            <button onClick={() => deleteTask(task.id)}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 transition-all">
              <Trash2 size={13} className="text-gray-300 hover:text-red-400" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const composerUrgency = URGENCY[selectedUrgency];
  const ComposerIcon = composerUrgency.icon;

  const r = 32; const stroke = 5; const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const dailyViews = [
    { key: 'today' as const, label: 'Today', icon: Sun, count: todayItems.length },
    { key: 'week' as const,  label: 'Week',  icon: CalendarDays },
    { key: 'all' as const,   label: 'All',   icon: ListChecks, count: tasks.filter(t => !t.isHabit && (t.scope === 'daily' || !t.scope)).length },
  ];

  const allDailyTasks = sortByUrgencyThenNewest(tasks.filter(t => !t.isHabit && (t.scope === 'daily' || !t.scope)).slice().reverse());

  const scopeSubtext = scope === 'daily'
    ? (total === 0 ? 'No tasks yet — add one!' : done === total ? '🎉 All done!' : `${total - done} remaining`)
    : scope === 'weekly'
    ? (total === 0 ? 'Plan your week!' : done === total ? '🎉 Week crushed!' : `${total - done} to go`)
    : (total === 0 ? 'Set monthly goals!' : done === total ? '🎉 Month complete!' : `${total - done} remaining`);

  const composerPlaceholder: Record<Scope, string> = {
    daily: 'What needs to be done today?',
    weekly: 'Add a weekly goal...',
    monthly: 'Add a monthly goal...',
  };

  return (
    <div className="page-container max-w-lg mx-auto">
      {/* Title */}
      <div className="pt-4 mb-4 animate-fade-up">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight -mt-0.5">Tasks</h1>
      </div>

      {/* ── Scope switcher (Daily / Weekly / Monthly) ── */}
      <div className="flex items-center bg-white rounded-2xl p-1 mb-4 shadow-sm animate-fade-up" style={{ animationDelay: '20ms' }}>
        {SCOPE_TABS.map(tab => (
          <button key={tab.key} onClick={() => setScope(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
              scope === tab.key
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-600'
            }`}>
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Progress banner ── */}
      {total > 0 && (
        <div className={`bg-gradient-to-br ${SCOPE_HERO[scope]} rounded-2xl p-5 mb-5 text-white animate-fade-up`} style={{ animationDelay: '30ms' }}>
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <svg width={76} height={76}>
                <circle cx={38} cy={38} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
                <circle cx={38} cy={38} r={r} fill="none" stroke="white" strokeWidth={stroke}
                  strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                  className="progress-ring-circle" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[18px] font-bold">{pct}%</span>
            </div>
            <div>
              <p className="text-white/60 text-[11px] font-medium uppercase tracking-wider">{SCOPE_LABEL[scope]}</p>
              <p className="text-[22px] font-bold leading-tight">{done} of {total}</p>
              <p className="text-white/50 text-[12px] mt-0.5">{scopeSubtext}</p>
              {scope === 'weekly' && <p className="text-white/40 text-[10px] mt-0.5">{getWeekLabel()}</p>}
              {scope === 'monthly' && <p className="text-white/40 text-[10px] mt-0.5">{getMonthLabel()}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Daily sub-tabs (Today / Week / All) ── */}
      {scope === 'daily' && (
        <div className="flex items-center bg-white rounded-2xl p-1 mb-5 shadow-sm animate-fade-up" style={{ animationDelay: '50ms' }}>
          {dailyViews.map(v => (
            <button key={v.key} onClick={() => setDailyView(v.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all ${
                dailyView === v.key ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}>
              <v.icon size={14} />
              {v.label}
              {v.count !== undefined && v.count > 0 && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  dailyView === v.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>{v.count}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Period label for weekly/monthly when empty ── */}
      {scope === 'weekly' && total === 0 && (
        <div className="text-center mb-2 animate-fade-up" style={{ animationDelay: '40ms' }}>
          <p className="text-[11px] text-gray-400 font-medium">{getWeekLabel()}</p>
        </div>
      )}
      {scope === 'monthly' && total === 0 && (
        <div className="text-center mb-2 animate-fade-up" style={{ animationDelay: '40ms' }}>
          <p className="text-[11px] text-gray-400 font-medium">{getMonthLabel()}</p>
        </div>
      )}

      {/* ── Composer ── */}
      {composing && (
        <div className="animate-scale-in mb-5">
          <div className="bg-white rounded-2xl p-4 shadow-md" style={{ boxShadow: composerUrgency.glow }}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${composerUrgency.gradient} flex items-center justify-center flex-shrink-0`}>
                <ComposerIcon size={16} className="text-white" />
              </div>
              <input ref={inputRef} value={newText}
                onChange={e => setNewText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newText.trim()) handleAdd(); if (e.key === 'Escape') { setComposing(false); setNewText(''); } }}
                placeholder={composerPlaceholder[scope]}
                className="flex-1 text-[15px] text-gray-800 font-medium placeholder:text-gray-300 outline-none bg-transparent" />
            </div>
            <div className="flex items-center gap-2">
              {(Object.entries(URGENCY) as [Priority, typeof URGENCY[Priority]][]).map(([key, val]) => {
                const ChipIcon = val.icon;
                return (
                  <button key={key} onClick={() => setSelectedUrgency(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                      selectedUrgency === key
                        ? `bg-gradient-to-r ${val.gradient} text-white shadow-sm scale-105`
                        : `${val.lightBg} ${val.text} hover:scale-105`
                    }`}>
                    <ChipIcon size={11} />
                    {val.label}
                  </button>
                );
              })}
              <div className="flex-1" />
              {newText.trim() ? (
                <button onClick={handleAdd}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-bold text-white bg-gradient-to-r ${composerUrgency.gradient} shadow-sm hover:shadow-md transition-all active:scale-95`}>
                  Add →
                </button>
              ) : (
                <button onClick={() => { setComposing(false); setNewText(''); }}
                  className="text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors">
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Task lists ── */}
      <div className="space-y-2">
        {/* DAILY */}
        {scope === 'daily' && dailyView === 'today' && (
          todayItems.length === 0 && !composing ? (
            <div className="text-center py-20 animate-fade-up">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center mx-auto mb-4">
                <Sun size={32} className="text-indigo-300" />
              </div>
              <p className="text-[16px] font-semibold text-gray-800">Your day is clear</p>
              <p className="text-[13px] text-gray-400 mt-1">Tap the button below to plan something</p>
            </div>
          ) : (
            todayItems.map((t, i) => renderTaskCard(t, i))
          )
        )}

        {scope === 'daily' && dailyView === 'week' && getWeekDays().map(day => {
          const items = dailyTasksFor(day.key);
          if (items.length === 0 && day.key !== today) return null;
          const dayDone = items.filter(t => t.completed).length;
          return (
            <div key={day.key} className="mb-5">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className={`text-[12px] font-bold uppercase tracking-wider ${day.key === today ? 'text-indigo-500' : 'text-gray-400'}`}>
                  {day.short}
                </span>
                {items.length > 0 && (
                  <span className="text-[10px] text-gray-300 font-medium">{dayDone}/{items.length}</span>
                )}
                {day.key === today && dayDone === items.length && items.length > 0 && (
                  <span className="text-[10px]">✨</span>
                )}
              </div>
              <div className="space-y-2">
                {items.length > 0 ? items.map((t, i) => renderTaskCard(t, i)) : (
                  <p className="text-[12px] text-gray-300 pl-1 italic">Nothing planned</p>
                )}
              </div>
            </div>
          );
        })}

        {scope === 'daily' && dailyView === 'all' && (
          allDailyTasks.length === 0 && !composing ? (
            <div className="text-center py-20 animate-fade-up">
              <p className="text-[14px] text-gray-400">No tasks created yet</p>
            </div>
          ) : (
            allDailyTasks.map((t, i) => renderTaskCard(t, i))
          )
        )}

        {/* WEEKLY */}
        {scope === 'weekly' && (
          weekItems.length === 0 && !composing ? (
            <div className="text-center py-20 animate-fade-up">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center mx-auto mb-4">
                <Target size={32} className="text-blue-300" />
              </div>
              <p className="text-[16px] font-semibold text-gray-800">No weekly goals yet</p>
              <p className="text-[13px] text-gray-400 mt-1">Plan what you want to accomplish this week</p>
            </div>
          ) : (
            weekItems.map((t, i) => renderTaskCard(t, i))
          )
        )}

        {/* MONTHLY */}
        {scope === 'monthly' && (
          monthItems.length === 0 && !composing ? (
            <div className="text-center py-20 animate-fade-up">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-50 to-fuchsia-50 flex items-center justify-center mx-auto mb-4">
                <Calendar size={32} className="text-purple-300" />
              </div>
              <p className="text-[16px] font-semibold text-gray-800">No monthly goals yet</p>
              <p className="text-[13px] text-gray-400 mt-1">Set big goals for the month ahead</p>
            </div>
          ) : (
            monthItems.map((t, i) => renderTaskCard(t, i))
          )
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setComposing(c => !c)}
        className={`fixed bottom-24 right-5 lg:bottom-8 lg:right-8 z-30
          w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center 
          transition-all active:scale-90 hover:shadow-2xl
          ${composing
            ? 'bg-gray-900 rotate-[135deg] shadow-gray-400/30'
            : `bg-gradient-to-br ${SCOPE_HERO[scope]} shadow-indigo-300/50 hover:shadow-indigo-400/60`
          }`}>
        <Plus size={22} className="text-white" strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default TaskManager;
