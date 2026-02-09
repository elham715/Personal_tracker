import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/utils/helpers';
import { Flame, Zap, Leaf, Plus, Check, Sun, CalendarDays, ListChecks, Calendar, Target, ChevronDown } from 'lucide-react';
import SwipeToDelete from '@/components/SwipeToDelete';

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

const getWeekLabel = (weekKeyStr?: string) => {
  const monday = weekKeyStr ? new Date(weekKeyStr + 'T12:00:00') : (() => {
    const now = new Date();
    const day = now.getDay();
    const m = new Date(now);
    m.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
    return m;
  })();
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(monday)} – ${fmt(sunday)}`;
};

const getMonthLabel = (monthKeyStr?: string) => {
  const d = monthKeyStr ? new Date(monthKeyStr + 'T12:00:00') : new Date();
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const getWeekRelativeLabel = (weekKeyStr: string, currentWeekKey: string) => {
  if (weekKeyStr === currentWeekKey) return 'This Week';
  const d1 = new Date(currentWeekKey + 'T12:00:00');
  const d2 = new Date(weekKeyStr + 'T12:00:00');
  const weeksAgo = Math.round((d1.getTime() - d2.getTime()) / (7 * 86400000));
  if (weeksAgo === 1) return 'Last Week';
  return `${weeksAgo} Weeks Ago`;
};

const getMonthRelativeLabel = (monthKeyStr: string, currentMonthKey: string) => {
  if (monthKeyStr === currentMonthKey) return 'This Month';
  const d1 = new Date(currentMonthKey + 'T12:00:00');
  const d2 = new Date(monthKeyStr + 'T12:00:00');
  const monthsAgo = (d1.getFullYear() - d2.getFullYear()) * 12 + (d1.getMonth() - d2.getMonth());
  if (monthsAgo === 1) return 'Last Month';
  return `${monthsAgo} Months Ago`;
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
  const [expandedPastWeeks, setExpandedPastWeeks] = useState<Set<string>>(new Set());
  const [expandedPastMonths, setExpandedPastMonths] = useState<Set<string>>(new Set());
  const today = formatDate();
  const weekKey = getWeekKey();
  const monthKey = getMonthKey();
  const toggleExpandWeek = (key: string) => {
    setExpandedPastWeeks(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };
  const toggleExpandMonth = (key: string) => {
    setExpandedPastMonths(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  useEffect(() => {
    if (composing) setTimeout(() => inputRef.current?.focus(), 120);
  }, [composing]);

  useEffect(() => {
    setComposing(false);
    setNewText('');
  }, [scope]);

  /* ── Data helpers ── */
  const getWeekDays = () => {
    // Show past 6 days + today (7 days total), oldest first
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i)); // 6 days ago → today
      const key = formatDate(d);
      const daysAgo = 6 - i;
      let short: string;
      if (daysAgo === 0) short = 'Today';
      else if (daysAgo === 1) short = 'Yesterday';
      else short = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      return { key, short, daysAgo };
    });
  };

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

  // Group past weekly tasks by week key
  const pastWeekGroups = (() => {
    const weekTasks = tasks.filter(t => !t.isHabit && t.scope === 'weekly' && t.date !== weekKey);
    const groups: Record<string, typeof weekTasks> = {};
    weekTasks.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a)) // newest first
      .map(([key, items]) => ({
        key,
        label: getWeekRelativeLabel(key, weekKey),
        range: getWeekLabel(key),
        items: sortByUrgencyThenNewest(items),
        done: items.filter(t => t.completed).length,
      }));
  })();

  // Group past monthly tasks by month key
  const pastMonthGroups = (() => {
    const monthTasks = tasks.filter(t => !t.isHabit && t.scope === 'monthly' && t.date !== monthKey);
    const groups: Record<string, typeof monthTasks> = {};
    monthTasks.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => ({
        key,
        label: getMonthRelativeLabel(key, monthKey),
        monthName: getMonthLabel(key),
        items: sortByUrgencyThenNewest(items),
        done: items.filter(t => t.completed).length,
      }));
  })();

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
        <SwipeToDelete onDelete={() => deleteTask(task.id)} disabled={task.isHabit}>
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
          </div>
        </SwipeToDelete>
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

  // Group all daily tasks by date for the "All" view
  const allDailyGrouped = (() => {
    const all = tasks.filter(t => !t.isHabit && (t.scope === 'daily' || !t.scope));
    const groups: Record<string, typeof all> = {};
    all.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    // Sort dates newest first
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateStr, items]) => {
        const d = new Date(dateStr + 'T12:00:00');
        const todayStr = formatDate();
        const yesterdayD = new Date(); yesterdayD.setDate(yesterdayD.getDate() - 1);
        const yesterdayStr = formatDate(yesterdayD);
        let label: string;
        if (dateStr === todayStr) label = 'Today';
        else if (dateStr === yesterdayStr) label = 'Yesterday';
        else label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        return { dateStr, label, isToday: dateStr === todayStr, items: sortByUrgencyThenNewest(items) };
      });
  })();

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
    <div className="page-container max-w-lg lg:max-w-3xl mx-auto">
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

      {/* ── Inline Add Task Bar / Composer ── */}
      {!composing ? (
        <button onClick={() => setComposing(true)}
          className="w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group active:scale-[0.98] animate-fade-up">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${SCOPE_HERO[scope]} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow`}>
            <Plus size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[14px] text-gray-400 group-hover:text-indigo-500 font-medium transition-colors">
            {composerPlaceholder[scope]}
          </span>
        </button>
      ) : (
        <div className="animate-scale-in mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100" style={{ boxShadow: composerUrgency.glow }}>
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
            <div className="flex items-center gap-1.5 flex-wrap">
              {(Object.entries(URGENCY) as [Priority, typeof URGENCY[Priority]][]).map(([key, val]) => {
                const ChipIcon = val.icon;
                return (
                  <button key={key} onClick={() => setSelectedUrgency(key)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                      selectedUrgency === key
                        ? `bg-gradient-to-r ${val.gradient} text-white shadow-sm scale-105`
                        : `${val.lightBg} ${val.text} hover:scale-105`
                    }`}>
                    <ChipIcon size={10} />
                    {val.label}
                  </button>
                );
              })}
              <div className="flex-1" />
              <button onClick={() => { setComposing(false); setNewText(''); }}
                className="text-[11px] font-medium text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleAdd} disabled={!newText.trim()}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold text-white transition-all active:scale-95 ${
                  newText.trim()
                    ? `bg-gradient-to-r ${composerUrgency.gradient} shadow-sm hover:shadow-md`
                    : 'bg-gray-200 cursor-not-allowed'
                }`}>
                Add
              </button>
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
              <p className="text-[13px] text-gray-400 mt-1">Add a task above to get started</p>
            </div>
          ) : (
            todayItems.map((t, i) => renderTaskCard(t, i))
          )
        )}

        {scope === 'daily' && dailyView === 'week' && getWeekDays().reverse().map(day => {
          const items = dailyTasksFor(day.key);
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
          allDailyGrouped.length === 0 && !composing ? (
            <div className="text-center py-20 animate-fade-up">
              <p className="text-[14px] text-gray-400">No tasks created yet</p>
            </div>
          ) : (
            allDailyGrouped.map(group => (
              <div key={group.dateStr} className="mb-5">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className={`text-[12px] font-bold uppercase tracking-wider ${group.isToday ? 'text-indigo-500' : 'text-gray-400'}`}>
                    {group.label}
                  </span>
                  <span className="text-[10px] text-gray-300 font-medium">
                    {group.items.filter(t => t.completed).length}/{group.items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.items.map((t, i) => renderTaskCard(t, i))}
                </div>
              </div>
            ))
          )
        )}

        {/* WEEKLY */}
        {scope === 'weekly' && (
          <>
            {/* Current week tasks */}
            {weekItems.length === 0 && !composing && pastWeekGroups.length === 0 ? (
              <div className="text-center py-20 animate-fade-up">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center mx-auto mb-4">
                  <Target size={32} className="text-blue-300" />
                </div>
                <p className="text-[16px] font-semibold text-gray-800">No weekly goals yet</p>
                <p className="text-[13px] text-gray-400 mt-1">Plan what you want to accomplish this week</p>
              </div>
            ) : (
              <>
                {weekItems.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-indigo-500">This Week</span>
                      <span className="text-[10px] text-gray-300 font-medium">
                        {weekItems.filter(t => t.completed).length}/{weekItems.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {weekItems.map((t, i) => renderTaskCard(t, i))}
                    </div>
                  </div>
                )}

                {/* Past week cards */}
                {pastWeekGroups.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider px-1">Previous Weeks</p>
                    {pastWeekGroups.map(group => {
                      const isOpen = expandedPastWeeks.has(group.key);
                      const pctDone = group.items.length > 0 ? Math.round((group.done / group.items.length) * 100) : 0;
                      return (
                        <div key={group.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up">
                          <button onClick={() => toggleExpandWeek(group.key)}
                            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/50 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                              <CalendarDays size={16} className="text-white" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-[13px] font-semibold text-gray-800">{group.label}</p>
                              <p className="text-[11px] text-gray-400">{group.range}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${pctDone === 100 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                {group.done}/{group.items.length}
                              </span>
                              <ChevronDown size={16} className={`text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </div>
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-3 space-y-2 border-t border-gray-50">
                              <div className="pt-2" />
                              {group.items.map((t, i) => renderTaskCard(t, i))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* MONTHLY */}
        {scope === 'monthly' && (
          <>
            {/* Current month tasks */}
            {monthItems.length === 0 && !composing && pastMonthGroups.length === 0 ? (
              <div className="text-center py-20 animate-fade-up">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-50 to-fuchsia-50 flex items-center justify-center mx-auto mb-4">
                  <Calendar size={32} className="text-purple-300" />
                </div>
                <p className="text-[16px] font-semibold text-gray-800">No monthly goals yet</p>
                <p className="text-[13px] text-gray-400 mt-1">Set big goals for the month ahead</p>
              </div>
            ) : (
              <>
                {monthItems.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-violet-500">This Month</span>
                      <span className="text-[10px] text-gray-300 font-medium">
                        {monthItems.filter(t => t.completed).length}/{monthItems.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {monthItems.map((t, i) => renderTaskCard(t, i))}
                    </div>
                  </div>
                )}

                {/* Past month cards */}
                {pastMonthGroups.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider px-1">Previous Months</p>
                    {pastMonthGroups.map(group => {
                      const isOpen = expandedPastMonths.has(group.key);
                      const pctDone = group.items.length > 0 ? Math.round((group.done / group.items.length) * 100) : 0;
                      return (
                        <div key={group.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up">
                          <button onClick={() => toggleExpandMonth(group.key)}
                            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/50 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                              <Calendar size={16} className="text-white" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-[13px] font-semibold text-gray-800">{group.label}</p>
                              <p className="text-[11px] text-gray-400">{group.monthName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${pctDone === 100 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                {group.done}/{group.items.length}
                              </span>
                              <ChevronDown size={16} className={`text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </div>
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-3 space-y-2 border-t border-gray-50">
                              <div className="pt-2" />
                              {group.items.map((t, i) => renderTaskCard(t, i))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default TaskManager;
