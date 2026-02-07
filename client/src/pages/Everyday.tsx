import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate, getDatesRange, isFuture, isToday } from '@/utils/helpers';
import { Check, Flame, Trophy, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

/* ── Color map: habit.color → Tailwind classes for streak intensity ── */
const COLOR_INTENSITY: Record<string, string[]> = {
  purple: ['bg-gray-100', 'bg-purple-200', 'bg-purple-400', 'bg-purple-500', 'bg-purple-600'],
  blue:   ['bg-gray-100', 'bg-blue-200',   'bg-blue-400',   'bg-blue-500',   'bg-blue-600'],
  green:  ['bg-gray-100', 'bg-green-200',  'bg-green-400',  'bg-green-500',  'bg-green-600'],
  pink:   ['bg-gray-100', 'bg-pink-200',   'bg-pink-400',   'bg-pink-500',   'bg-pink-600'],
  orange: ['bg-gray-100', 'bg-orange-200', 'bg-orange-400', 'bg-orange-500', 'bg-orange-600'],
  cyan:   ['bg-gray-100', 'bg-cyan-200',   'bg-cyan-400',   'bg-cyan-500',   'bg-cyan-600'],
};

const RING_MAP: Record<string, string> = {
  purple: 'ring-purple-400', blue: 'ring-blue-400', green: 'ring-green-400',
  pink: 'ring-pink-400', orange: 'ring-orange-400', cyan: 'ring-cyan-400',
};

const COLOR_HEX: Record<string, string> = {
  purple: '#8b5cf6', blue: '#3b82f6', green: '#22c55e',
  pink: '#ec4899', orange: '#f97316', cyan: '#06b6d4',
};

const Everyday: React.FC = () => {
  const { habits, toggleHabitDate } = useApp();
  const dates = getDatesRange(14);

  /* per-cell streak for intensity colouring */
  const getStreak = (habit: any, date: Date): number => {
    const key = formatDate(date);
    if (!habit.completedDates.includes(key)) return 0;
    let s = 1;
    const d = new Date(date);
    for (let i = 1; i <= 30; i++) {
      d.setDate(d.getDate() - 1);
      if (habit.completedDates.includes(formatDate(d))) s++;
      else break;
    }
    return s;
  };

  const intensity = (streak: number, color: string): string => {
    const levels = COLOR_INTENSITY[color] || COLOR_INTENSITY.purple;
    if (streak === 0) return levels[0];
    if (streak <= 1) return levels[1];
    if (streak <= 3) return levels[2];
    if (streak <= 5) return levels[3];
    return levels[4];
  };

  /* ═══════════════  Analytics (auto-updates on every toggle)  ═══════════════ */
  const analytics = useMemo(() => {
    if (habits.length === 0) return null;
    const dateKeys = dates.map(d => formatDate(d));

    /* ── per-habit stats ── */
    const habitStats = habits.map(h => {
      const col = h.color || 'purple';
      const completionsInRange = dateKeys.filter(dk => h.completedDates.includes(dk)).length;
      const rate = (completionsInRange / dateKeys.length) * 100;

      // best streak (all-time)
      const sorted = [...h.completedDates].sort();
      let best = 0, run = 0;
      for (let i = 0; i < sorted.length; i++) {
        if (i === 0) { run = 1; } else {
          const diff = Math.round(
            (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000,
          );
          run = diff === 1 ? run + 1 : 1;
        }
        best = Math.max(best, run);
      }

      // current streak
      let cur = 0;
      const d = new Date();
      if (h.completedDates.includes(formatDate(d))) {
        cur = 1; d.setDate(d.getDate() - 1);
        while (h.completedDates.includes(formatDate(d))) { cur++; d.setDate(d.getDate() - 1); }
      } else {
        d.setDate(d.getDate() - 1);
        if (h.completedDates.includes(formatDate(d))) {
          cur = 1; d.setDate(d.getDate() - 1);
          while (h.completedDates.includes(formatDate(d))) { cur++; d.setDate(d.getDate() - 1); }
        }
      }

      return { id: h.id, name: h.name, icon: h.icon, color: col,
               completionsInRange, rate, total: h.completedDates.length,
               currentStreak: cur, bestStreak: best };
    });

    /* ── daily progress (for line chart) ── */
    const dailyProgress = dateKeys.map((key, i) => {
      const done = habits.filter(h => h.completedDates.includes(key)).length;
      return { date: dates[i], key, done, total: habits.length,
               pct: (done / habits.length) * 100 };
    });

    /* ── boxplot quartiles ── */
    const pcts = dailyProgress.map(d => d.pct).sort((a, b) => a - b);
    const q = (arr: number[], p: number) => {
      if (arr.length <= 1) return arr[0] ?? 0;
      const idx = (arr.length - 1) * p;
      const lo = Math.floor(idx);
      return arr[lo] + (arr[Math.ceil(idx)] - arr[lo]) * (idx - lo);
    };
    const boxplot = {
      min: pcts[0] ?? 0, q1: q(pcts, 0.25), median: q(pcts, 0.5),
      q3: q(pcts, 0.75), max: pcts[pcts.length - 1] ?? 0,
      avg: pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : 0,
    };

    return { habitStats, dailyProgress, boxplot };
  }, [habits, dates]);

  /* ── SVG line chart ── */
  const renderLineChart = () => {
    if (!analytics) return null;
    const { dailyProgress } = analytics;
    const W = 380, H = 180;
    const PAD = { t: 20, r: 15, b: 32, l: 38 };
    const pw = W - PAD.l - PAD.r, ph = H - PAD.t - PAD.b;
    const pts = dailyProgress.map((d, i) => ({
      x: PAD.l + (i / Math.max(dailyProgress.length - 1, 1)) * pw,
      y: PAD.t + ph - (d.pct / 100) * ph,
      pct: d.pct,
      dayLabel: d.date.toLocaleDateString('en-US', { weekday: 'narrow' }),
      dateNum: String(d.date.getDate()),
    }));
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = line + ` L${pts[pts.length - 1].x.toFixed(1)},${(PAD.t + ph).toFixed(1)} L${pts[0].x.toFixed(1)},${(PAD.t + ph).toFixed(1)} Z`;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {/* horizontal grid */}
        {[0, 25, 50, 75, 100].map(v => {
          const y = PAD.t + ph - (v / 100) * ph;
          return (
            <g key={v}>
              <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y}
                stroke="#e5e7eb" strokeWidth="0.7" strokeDasharray={v === 0 ? '' : '4,3'} />
              <text x={PAD.l - 5} y={y + 3} textAnchor="end" fill="#9ca3af" fontSize="8">{v}%</text>
            </g>
          );
        })}
        {/* gradient fill */}
        <path d={area} fill="url(#areaGrad)" />
        {/* line */}
        <path d={line} fill="none" stroke="#6366f1" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        {/* dots + x-labels */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#6366f1" strokeWidth="2" />
            <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#6366f1" fontSize="7.5"
              fontWeight="600">{Math.round(p.pct)}%</text>
            {(i % 2 === 0 || pts.length <= 7) && (
              <text x={p.x} y={H - 5} textAnchor="middle" fill="#9ca3af" fontSize="7.5">
                {p.dayLabel}{p.dateNum}
              </text>
            )}
          </g>
        ))}
      </svg>
    );
  };

  /* ── SVG boxplot ── */
  const renderBoxplot = () => {
    if (!analytics) return null;
    const { boxplot: bp, dailyProgress } = analytics;
    const W = 380, H = 70;
    const PAD = { l: 38, r: 15, t: 15, b: 20 };
    const pw = W - PAD.l - PAD.r;
    const x = (v: number) => PAD.l + (v / 100) * pw;
    const cy = PAD.t + (H - PAD.t - PAD.b) / 2;
    const boxH = 24;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* axis ticks */}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={x(v)} y1={cy - boxH / 2 - 4} x2={x(v)} y2={cy + boxH / 2 + 4}
              stroke="#f3f4f6" strokeWidth="0.7" />
            <text x={x(v)} y={H - 3} textAnchor="middle" fill="#9ca3af" fontSize="7.5">{v}%</text>
          </g>
        ))}
        {/* whisker line */}
        <line x1={x(bp.min)} y1={cy} x2={x(bp.max)} y2={cy}
          stroke="#6366f1" strokeWidth="1.5" />
        {/* whisker caps */}
        <line x1={x(bp.min)} y1={cy - 8} x2={x(bp.min)} y2={cy + 8}
          stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
        <line x1={x(bp.max)} y1={cy - 8} x2={x(bp.max)} y2={cy + 8}
          stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
        {/* box Q1–Q3 */}
        <rect x={x(bp.q1)} y={cy - boxH / 2} width={Math.max(x(bp.q3) - x(bp.q1), 2)} height={boxH}
          rx="5" fill="#eef2ff" stroke="#6366f1" strokeWidth="1.5" />
        {/* median line */}
        <line x1={x(bp.median)} y1={cy - boxH / 2} x2={x(bp.median)} y2={cy + boxH / 2}
          stroke="#4338ca" strokeWidth="2.5" strokeLinecap="round" />
        {/* individual day dots */}
        {dailyProgress.map((d, i) => (
          <circle key={i} cx={x(d.pct)} cy={cy + (i % 3 - 1) * 3} r="2.5"
            fill="#6366f1" fillOpacity="0.25" />
        ))}
        {/* mean diamond */}
        <polygon
          points={`${x(bp.avg)},${cy - 6} ${x(bp.avg) + 5},${cy} ${x(bp.avg)},${cy + 6} ${x(bp.avg) - 5},${cy}`}
          fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
      </svg>
    );
  };

  return (
    <div className="page-container max-w-4xl mx-auto pb-8">
      <div className="flex items-center justify-between pt-4 mb-4 animate-fade-up">
        <h1 className="text-[22px] font-bold text-gray-900">Calendar</h1>
      </div>

      {/* ── Calendar grid ── */}
      {habits.length > 0 ? (
        <div className="bg-white rounded-2xl overflow-x-auto animate-fade-up" style={{ animationDelay: '60ms' }}>
          <table className="w-full min-w-[560px]">
            <thead>
              <tr>
                <th className="text-left py-2.5 px-3 text-[11px] font-medium text-gray-400 uppercase tracking-wide sticky left-0 bg-white z-10 w-[120px]">
                  Habit
                </th>
                {dates.map((date, i) => {
                  const t = isToday(formatDate(date));
                  return (
                    <th key={i} className="p-1 text-center">
                      <span className={`text-[10px] font-medium block ${t ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                      </span>
                      <span className={`text-[11px] font-semibold inline-flex items-center justify-center ${
                        t ? 'w-5 h-5 rounded-full bg-indigo-600 text-white' : 'text-gray-600'
                      }`}>
                        {date.getDate()}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {habits.map(habit => {
                const hColor = habit.color || 'purple';
                const ringClass = RING_MAP[hColor] || RING_MAP.purple;
                return (
                  <tr key={habit.id} className="border-t border-gray-50">
                    <td className="py-2 px-3 sticky left-0 bg-white z-10">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{habit.icon}</span>
                        <span className="text-[12px] text-gray-800 font-medium truncate max-w-[80px]">{habit.name}</span>
                      </div>
                    </td>
                    {dates.map((date, i) => {
                      const key = formatDate(date);
                      const done = habit.completedDates.includes(key);
                      const streak = getStreak(habit, date);
                      const future = isFuture(key);
                      const t = isToday(key);
                      return (
                        <td key={i} className="p-0.5 text-center">
                          <button onClick={() => !future && toggleHabitDate(habit.id, key)}
                            disabled={future}
                            className={`w-7 h-7 rounded-md flex items-center justify-center mx-auto transition-all ${
                              future ? 'bg-gray-50 cursor-default' : intensity(streak, hColor)
                            } ${t && !future ? `ring-1.5 ${ringClass} ring-offset-1` : ''}`}>
                            {done && <Check size={11} className="text-white" strokeWidth={3} />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center animate-fade-up">
          <p className="text-3xl mb-2">📅</p>
          <p className="text-[14px] font-semibold text-gray-900 mb-1">No habits to track</p>
          <Link to="/habit-manager" className="inline-block text-[13px] bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg mt-3">
            Create Habit
          </Link>
        </div>
      )}

      {/* ═══════════════  Analytics Section  ═══════════════ */}
      {analytics && (
        <>
          {/* ── Streak Stats Cards ── */}
          <div className="mt-5 animate-fade-up" style={{ animationDelay: '120ms' }}>
            <h2 className="text-[15px] font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <Flame size={16} className="text-orange-500" /> Streak Stats
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {analytics.habitStats.map(h => (
                <div key={h.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <span className="text-base">{h.icon}</span>
                    <span className="text-[12px] font-semibold text-gray-800 truncate">{h.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <div className="text-center">
                      <span className="text-gray-400 block leading-tight">Current</span>
                      <span className="font-bold text-indigo-600 text-[13px]">{h.currentStreak}<span className="text-[10px]">🔥</span></span>
                    </div>
                    <div className="text-center">
                      <span className="text-gray-400 block leading-tight">Best</span>
                      <span className="font-bold text-amber-500 text-[13px]">{h.bestStreak}<span className="text-[10px]">🏆</span></span>
                    </div>
                    <div className="text-center">
                      <span className="text-gray-400 block leading-tight">Total</span>
                      <span className="font-bold text-gray-700 text-[13px]">{h.total}d</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 14-Day Habit Completion Bars ── */}
          <div className="mt-5 bg-white rounded-2xl p-4 shadow-sm animate-fade-up" style={{ animationDelay: '180ms' }}>
            <h2 className="text-[15px] font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <Trophy size={16} className="text-amber-500" /> 14-Day Completion
            </h2>
            <div className="space-y-2.5">
              {analytics.habitStats.map(h => (
                <div key={h.id} className="flex items-center gap-2">
                  <span className="text-sm w-5 shrink-0 text-center">{h.icon}</span>
                  <span className="text-[11px] font-medium text-gray-600 w-16 truncate">{h.name}</span>
                  <div className="flex-1 h-[18px] bg-gray-100 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.max(h.rate, 2)}%`,
                        background: `linear-gradient(90deg, ${COLOR_HEX[h.color] || COLOR_HEX.purple}cc, ${COLOR_HEX[h.color] || COLOR_HEX.purple})`,
                      }}
                    />
                    {h.rate >= 15 && (
                      <span className="absolute inset-y-0 left-2 flex items-center text-[9px] font-bold text-white">
                        {h.completionsInRange}/14
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold w-10 text-right"
                    style={{ color: COLOR_HEX[h.color] || COLOR_HEX.purple }}>
                    {Math.round(h.rate)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Daily Progress Line Chart ── */}
          <div className="mt-5 bg-white rounded-2xl p-4 shadow-sm animate-fade-up" style={{ animationDelay: '240ms' }}>
            <h2 className="text-[15px] font-bold text-gray-900 mb-1 flex items-center gap-1.5">
              <TrendingUp size={16} className="text-indigo-500" /> Daily Progress
            </h2>
            <p className="text-[11px] text-gray-400 mb-2">Percentage of habits completed each day</p>
            {renderLineChart()}
          </div>

          {/* ── Boxplot: Completion Distribution ── */}
          <div className="mt-5 bg-white rounded-2xl p-4 shadow-sm mb-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <h2 className="text-[15px] font-bold text-gray-900 mb-1 flex items-center gap-1.5">
              📊 Completion Distribution
            </h2>
            <p className="text-[11px] text-gray-400 mb-2">Spread of daily completion rates over 14 days</p>
            {renderBoxplot()}
            <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-indigo-50 border border-indigo-500" /> Q1–Q3 box
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-0.5 h-3 bg-indigo-900 rounded" /> Median
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 bg-amber-400 border border-amber-600"
                  style={{ transform: 'rotate(45deg)' }} /> Mean
              </span>
            </div>
            {/* summary numbers */}
            <div className="flex justify-center gap-4 mt-3 text-[11px]">
              <div className="text-center">
                <span className="text-gray-400 block">Min</span>
                <span className="font-bold text-gray-700">{Math.round(analytics.boxplot.min)}%</span>
              </div>
              <div className="text-center">
                <span className="text-gray-400 block">Median</span>
                <span className="font-bold text-indigo-600">{Math.round(analytics.boxplot.median)}%</span>
              </div>
              <div className="text-center">
                <span className="text-gray-400 block">Mean</span>
                <span className="font-bold text-amber-500">{Math.round(analytics.boxplot.avg)}%</span>
              </div>
              <div className="text-center">
                <span className="text-gray-400 block">Max</span>
                <span className="font-bold text-green-600">{Math.round(analytics.boxplot.max)}%</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Everyday;
