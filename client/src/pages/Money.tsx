import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet, Plus, X, ArrowUpRight, ArrowDownRight, Trash2, ChevronLeft,
  TrendingUp, TrendingDown, Zap, Target, Award, Shield, ChevronRight,
} from 'lucide-react';
import { Transaction, SavingsGoal, MoneyProfile } from '@/types';
import {
  transactionAPI, budgetAPI, savingsAPI, moneyProfileAPI,
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, CURRENCY, formatMoney,
  getMoneyRank, getMoneyXPProgress, PERSONALITY_INFO,
} from '@/services/moneyApi';
import { formatDate } from '@/utils/helpers';

/* ═══════════════════════════════════════════════════════════════════════
   MONEY SYSTEM — Gamified Bangladeshi Finance Manager
   Dynamic money pool · Personality engine · Challenges · XP levels
   ═══════════════════════════════════════════════════════════════════════ */

type View = 'hub' | 'transactions' | 'budgets' | 'savings' | 'insights' | 'settings';

const Money: React.FC = () => {
  const [view, setView] = useState<View>('hub');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [profile, setProfile] = useState<MoneyProfile | null>(null);
  const [monthStats, setMonthStats] = useState({ income: 0, expenses: 0, net: 0, needs: 0, wants: 0, byCategory: {} as Record<string, number>, dailySpending: {} as Record<string, number>, transactionCount: 0 });
  const [dailyBudget, setDailyBudget] = useState({ spent: 0, remaining: 0, budget: 500, pct: 0 });
  const [velocity, setVelocity] = useState({ total: 0, avg: 0, days: 3, trend: 'normal' as 'fast' | 'normal' | 'slow' });
  const [lastIncome, setLastIncome] = useState<string | null>(null);

  // Modals
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddSavings, setShowAddSavings] = useState(false);
  const [addToSavingsId, setAddToSavingsId] = useState<string | null>(null);
  const [showSetBudgetLimit, setShowSetBudgetLimit] = useState(false);

  // Add transaction form
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Food');
  const [txNote, setTxNote] = useState('');
  const [txDate, setTxDate] = useState(formatDate());
  const [txIsNeed, setTxIsNeed] = useState(true);

  // Budget form
  const [budgetCategory, setBudgetCategory] = useState('Food');
  const [budgetLimit, setBudgetLimit] = useState('');

  // Savings form
  const [savingsName, setSavingsName] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [savingsIcon, setSavingsIcon] = useState('🎯');
  const [savingsColor, setSavingsColor] = useState('#6366f1');
  const [savingsDeadline, setSavingsDeadline] = useState('');

  const [addAmount, setAddAmount] = useState('');
  const [dailyBudgetInput, setDailyBudgetInput] = useState('');

  const currentMonth = formatDate().slice(0, 7);
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const refresh = useCallback(async () => {
    const [txs, stats, budgetAlerts, goals, prof, daily, vel, li] = await Promise.all([
      transactionAPI.getByMonth(currentMonth),
      transactionAPI.getMonthStats(),
      budgetAPI.getAlerts(),
      savingsAPI.getAll(),
      moneyProfileAPI.get(),
      transactionAPI.getDailyRemaining(),
      transactionAPI.getSpendingVelocity(3),
      transactionAPI.getLastIncomeDate(),
    ]);
    setTransactions(txs.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)));
    setMonthStats(stats);
    setBudgets(budgetAlerts);
    setSavings(goals);
    setProfile(prof);
    setDailyBudget(daily);
    setVelocity(vel);
    setLastIncome(li);

    // Update challenges in background
    await moneyProfileAPI.updateChallenges();
    setProfile(await moneyProfileAPI.get());
  }, [currentMonth]);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Handlers ──
  const handleAddTx = async () => {
    const amount = parseFloat(txAmount);
    if (!amount || amount <= 0) return;
    await transactionAPI.create({ amount, type: txType, category: txCategory, note: txNote.trim(), isNeed: txIsNeed, date: txDate });
    setTxAmount(''); setTxNote(''); setShowAddTx(false);
    await refresh();
  };

  const handleAddBudget = async () => {
    const limit = parseFloat(budgetLimit);
    if (!limit || limit <= 0) return;
    await budgetAPI.create({ category: budgetCategory, limit, month: currentMonth });
    setBudgetLimit(''); setShowAddBudget(false);
    await refresh();
  };

  const handleAddSavings = async () => {
    const target = parseFloat(savingsTarget);
    if (!savingsName.trim() || !target || target <= 0) return;
    await savingsAPI.create({ name: savingsName.trim(), icon: savingsIcon, targetAmount: target, deadline: savingsDeadline || formatDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)), color: savingsColor });
    setSavingsName(''); setSavingsTarget(''); setShowAddSavings(false);
    await refresh();
  };

  const handleAddToSavings = async () => {
    if (!addToSavingsId || !addAmount) return;
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0) return;
    await savingsAPI.addMoney(addToSavingsId, amount);
    setAddToSavingsId(null); setAddAmount('');
    await refresh();
  };

  const handleSetDailyBudget = async () => {
    const amount = parseFloat(dailyBudgetInput);
    if (!amount || amount <= 0) return;
    await moneyProfileAPI.setDailyBudget(amount);
    setShowSetBudgetLimit(false); setDailyBudgetInput('');
    await refresh();
  };

  const handleStartChallenge = async () => {
    await moneyProfileAPI.startChallenge();
    await refresh();
  };

  const cats = txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  if (!profile) return (
    <div className="page-container max-w-lg lg:max-w-3xl mx-auto flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  const rank = getMoneyRank(profile.moneyLevel);
  const xpProg = getMoneyXPProgress(profile.totalXP);
  const pInfo = PERSONALITY_INFO[profile.personality];
  const activeChallenges = profile.activeChallenges.filter(c => !c.completed);
  const topCategories = Object.entries(monthStats.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // ══════════════════════════════════════════════════════════════
  //  SUB VIEWS
  // ══════════════════════════════════════════════════════════════

  // ── TRANSACTIONS VIEW ──
  if (view === 'transactions') return (
    <div className="page-container max-w-lg lg:max-w-3xl mx-auto">
      <div className="flex items-center gap-3 pt-4 mb-4">
        <button onClick={() => setView('hub')} className="p-1"><ChevronLeft size={20} className="text-gray-400" /></button>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex-1">Transactions</h1>
        <button onClick={() => setShowAddTx(true)}
          className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl active:scale-95 transition-transform">
          <Plus size={14} /> Log
        </button>
      </div>

      {/* Needs vs Wants Summary */}
      {monthStats.transactionCount > 0 && (
        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Needs</p>
            <p className="text-lg font-bold text-emerald-700">{formatMoney(monthStats.needs)}</p>
          </div>
          <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Wants</p>
            <p className="text-lg font-bold text-amber-700">{formatMoney(monthStats.wants)}</p>
          </div>
        </div>
      )}

      <div className="space-y-1.5 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
        {transactions.length === 0 ? (
          <div className="text-center py-12 lg:col-span-2">
            <p className="text-3xl mb-2">📝</p>
            <p className="text-sm text-gray-400">No transactions this month</p>
            <button onClick={() => setShowAddTx(true)} className="mt-3 text-emerald-600 text-sm font-semibold">+ Add one</button>
          </div>
        ) : transactions.map(tx => {
          const catInfo = (tx.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).find(c => c.name === tx.category);
          return (
            <div key={tx.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ backgroundColor: `${catInfo?.color || '#6b7280'}15` }}>
                {catInfo?.icon || '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{tx.note || tx.category}</p>
                <p className="text-[10px] text-gray-400">
                  {tx.category} · {tx.type === 'expense' ? (tx.isNeed ? '🎯 Need' : '💸 Want') : '💵 Income'} · {new Date(tx.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
              </span>
              <button onClick={async () => { await transactionAPI.delete(tx.id); await refresh(); }} className="p-1 rounded-lg hover:bg-red-50">
                <Trash2 size={13} className="text-gray-300" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── BUDGETS VIEW ──
  if (view === 'budgets') return (
    <div className="page-container max-w-lg lg:max-w-3xl mx-auto">
      <div className="flex items-center gap-3 pt-4 mb-4">
        <button onClick={() => setView('hub')} className="p-1"><ChevronLeft size={20} className="text-gray-400" /></button>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex-1">Category Budgets</h1>
        <button onClick={() => setShowAddBudget(true)} className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><Plus size={14} /> Add</button>
      </div>

      {budgets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm text-gray-400 mb-3">No budgets set</p>
          <button onClick={() => setShowAddBudget(true)} className="text-emerald-600 text-sm font-semibold">+ Create Budget</button>
        </div>
      ) : (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {budgets.map((b: any) => {
            const catInfo = EXPENSE_CATEGORIES.find(c => c.name === b.category);
            return (
              <div key={b.id} className="bg-white rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{catInfo?.icon || '📦'}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{b.category}</p>
                      <p className="text-[10px] text-gray-400">Monthly limit</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-bold ${b.exceeded ? 'text-red-500' : 'text-gray-900'}`}>{formatMoney(b.spent)}</p>
                    <p className="text-[10px] text-gray-400">of {formatMoney(b.limit)}</p>
                  </div>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${b.exceeded ? 'bg-red-500' : b.pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(b.pct, 100)}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-gray-400">{b.pct}% used</span>
                  <span className={`text-[10px] font-medium ${b.remaining >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {b.remaining >= 0 ? `${formatMoney(b.remaining)} left` : `${formatMoney(Math.abs(b.remaining))} over`}
                  </span>
                </div>
                <button onClick={async () => { await budgetAPI.delete(b.id); await refresh(); }} className="mt-2 text-[10px] text-red-400 font-medium">Remove</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── SAVINGS VIEW ──
  if (view === 'savings') return (
    <div className="page-container max-w-lg lg:max-w-3xl mx-auto">
      <div className="flex items-center gap-3 pt-4 mb-4">
        <button onClick={() => setView('hub')} className="p-1"><ChevronLeft size={20} className="text-gray-400" /></button>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex-1">Savings Goals</h1>
        <button onClick={() => setShowAddSavings(true)} className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><Plus size={14} /> New</button>
      </div>

      {savings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">🐷</p>
          <p className="text-sm text-gray-400 mb-3">No savings goals yet</p>
          <button onClick={() => setShowAddSavings(true)} className="text-emerald-600 text-sm font-semibold">+ Create Goal</button>
        </div>
      ) : (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {savings.map(goal => {
            const pct = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
            const daysLeft = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            return (
              <div key={goal.id} className="bg-white rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${goal.color}15` }}>
                    {goal.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-gray-900">{goal.name}</p>
                    <p className="text-[10px] text-gray-400">{daysLeft} days left</p>
                  </div>
                  <p className="text-lg font-bold" style={{ color: goal.color }}>{pct}%</p>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: goal.color }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)}</span>
                  <button onClick={() => { setAddToSavingsId(goal.id); setAddAmount(''); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                    style={{ backgroundColor: `${goal.color}15`, color: goal.color }}>+ Add Money</button>
                </div>
                <button onClick={async () => { await savingsAPI.delete(goal.id); await refresh(); }} className="mt-2 text-[10px] text-red-400 font-medium">Delete goal</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── INSIGHTS VIEW ──
  if (view === 'insights') return (
    <div className="page-container max-w-lg lg:max-w-3xl mx-auto">
      <div className="flex items-center gap-3 pt-4 mb-5">
        <button onClick={() => setView('hub')} className="p-1"><ChevronLeft size={20} className="text-gray-400" /></button>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Money Insights</h1>
      </div>

      {/* Personality Card */}
      <div className={`bg-gradient-to-br ${pInfo.bg} rounded-2xl p-5 text-white mb-4 shadow-lg`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{pInfo.emoji}</span>
          <div>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Your Money Personality</p>
            <h2 className="text-xl font-bold">{pInfo.title}</h2>
          </div>
        </div>
        <p className="text-sm text-white/70 mb-3">{pInfo.desc}</p>
        <div className="bg-white/15 rounded-xl p-3">
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">💡 Tip for You</p>
          <p className="text-sm text-white/90">{pInfo.tip}</p>
        </div>
      </div>

      {/* Needs vs Wants */}
      {monthStats.transactionCount > 0 && (
        <div className="bg-white rounded-2xl p-4 mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Needs vs Wants</h3>
          <div className="flex gap-3 mb-3">
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-emerald-600">{formatMoney(monthStats.needs)}</p>
              <p className="text-[10px] text-gray-400 font-medium">🎯 Needed</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-amber-600">{formatMoney(monthStats.wants)}</p>
              <p className="text-[10px] text-gray-400 font-medium">💸 Wanted</p>
            </div>
          </div>
          {monthStats.expenses > 0 && (
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.round((monthStats.needs / monthStats.expenses) * 100)}%` }} />
              <div className="h-full bg-amber-400 transition-all" style={{ width: `${Math.round((monthStats.wants / monthStats.expenses) * 100)}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Top Spending */}
      {topCategories.length > 0 && (
        <div className="bg-white rounded-2xl p-4 mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Top Spending</h3>
          <div className="space-y-3">
            {topCategories.map(([cat, amount]) => {
              const catInfo = EXPENSE_CATEGORIES.find(c => c.name === cat);
              const pct = monthStats.expenses > 0 ? Math.round((amount / monthStats.expenses) * 100) : 0;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center">{catInfo?.icon || '📦'}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{cat}</span>
                      <span className="text-sm font-semibold text-gray-900">{formatMoney(amount)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: catInfo?.color || '#6b7280' }} />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spending Velocity */}
      <div className="bg-white rounded-2xl p-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Spending Pace (Last 3 Days)</h3>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${velocity.trend === 'fast' ? 'bg-red-100' : velocity.trend === 'slow' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
            {velocity.trend === 'fast' ? <TrendingUp size={20} className="text-red-500" /> : velocity.trend === 'slow' ? <TrendingDown size={20} className="text-emerald-500" /> : <TrendingUp size={20} className="text-blue-500" />}
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-gray-900">{formatMoney(velocity.avg)}/day avg</p>
            <p className="text-[10px] text-gray-400">{formatMoney(velocity.total)} in last {velocity.days} days</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${velocity.trend === 'fast' ? 'bg-red-100 text-red-600' : velocity.trend === 'slow' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
            {velocity.trend === 'fast' ? '⚡ Fast' : velocity.trend === 'slow' ? '🐢 Slow' : '⚖️ Normal'}
          </span>
        </div>
        {velocity.trend === 'fast' && (
          <p className="text-xs text-red-500 mt-2 bg-red-50 rounded-lg px-3 py-2">
            ⚠️ You've spent {formatMoney(velocity.total)} in {velocity.days} days. Consider slowing down.
          </p>
        )}
      </div>

      {/* Last Income */}
      <div className="bg-white rounded-2xl p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Income Timeline</h3>
        <div className="flex items-center gap-3">
          <span className="text-xl">💵</span>
          <div>
            <p className="text-sm font-medium text-gray-700">
              Last income: {lastIncome ? new Date(lastIncome + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'None yet'}
            </p>
            <p className="text-[10px] text-gray-400">Next expected: Unknown</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  //  MAIN HUB
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="page-container max-w-lg lg:max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 mb-4 animate-fade-up">
        <div>
          <p className="text-xs text-gray-400 font-medium">Finance</p>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet size={22} className="text-emerald-600" /> Money
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {profile.loggingStreak > 0 && (
            <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full">
              🔥 {profile.loggingStreak}d
            </span>
          )}
          <button onClick={() => setShowAddTx(true)}
            className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl active:scale-95 transition-transform shadow-sm shadow-emerald-200">
            <Plus size={15} /> Log
          </button>
        </div>
      </div>

      {/* ── Money Pool Card — Dynamic Balance ── */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-5 mb-4 shadow-lg shadow-emerald-200/40 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-white/60 font-medium uppercase tracking-wider">{monthName}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{rank.icon}</span>
            <span className="text-xs text-white/70 font-semibold">Lv.{profile.moneyLevel} {rank.rank}</span>
          </div>
        </div>

        {/* Main Balance */}
        <p className={`text-3xl lg:text-4xl font-bold mb-0.5 ${monthStats.net >= 0 ? 'text-white' : 'text-red-200'}`}>
          {monthStats.net >= 0 ? '+' : '-'}{formatMoney(monthStats.net)}
        </p>
        <p className="text-[10px] text-white/40 mb-4">Remaining Balance</p>

        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <ArrowUpRight size={14} className="text-emerald-200" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{formatMoney(monthStats.income)}</p>
              <p className="text-white/50 text-[10px]">Income</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <ArrowDownRight size={14} className="text-red-200" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{formatMoney(monthStats.expenses)}</p>
              <p className="text-white/50 text-[10px]">Expenses</p>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-white/40 font-medium">{xpProg.xpInLevel}/{xpProg.xpNeeded} XP</p>
            <p className="text-[10px] text-white/40 font-medium">Level {xpProg.level}</p>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white/50 rounded-full transition-all duration-500" style={{ width: `${xpProg.pct}%` }} />
          </div>
        </div>
      </div>

      {/* ── Daily Budget Bar ── */}
      <div className="bg-white rounded-2xl p-4 mb-3 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield size={16} className={`${dailyBudget.pct > 90 ? 'text-red-500' : dailyBudget.pct > 70 ? 'text-amber-500' : 'text-emerald-500'}`} />
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Budget</h3>
          </div>
          <button onClick={() => { setShowSetBudgetLimit(true); setDailyBudgetInput(String(profile.dailyBudget)); }}
            className="text-[10px] text-gray-400 font-medium">Edit →</button>
        </div>
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className={`text-2xl font-bold ${dailyBudget.remaining >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
              {dailyBudget.remaining >= 0 ? formatMoney(dailyBudget.remaining) : `-${formatMoney(Math.abs(dailyBudget.remaining))}`}
            </p>
            <p className="text-[10px] text-gray-400">remaining of {formatMoney(dailyBudget.budget)}</p>
          </div>
          <p className="text-xs font-medium text-gray-400">{formatMoney(dailyBudget.spent)} spent</p>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${
            dailyBudget.pct > 90 ? 'bg-red-500' : dailyBudget.pct > 70 ? 'bg-amber-400' : 'bg-emerald-500'
          }`} style={{ width: `${Math.min(dailyBudget.pct, 100)}%` }} />
        </div>
        {dailyBudget.remaining < 0 && (
          <p className="text-[10px] text-red-500 font-medium mt-1.5">⚠️ Over budget today! Consider stopping non-essential spending.</p>
        )}
      </div>

      {/* ── Quick Actions Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4 animate-fade-up" style={{ animationDelay: '140ms' }}>
        <button onClick={() => { setTxType('expense'); setShowAddTx(true); }}
          className="bg-white rounded-xl p-3 text-left active:scale-95 transition-transform">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mb-1.5">
            <ArrowDownRight size={16} className="text-red-500" />
          </div>
          <p className="text-xs font-semibold text-gray-800">Expense</p>
          <p className="text-[10px] text-gray-400">Log spending</p>
        </button>
        <button onClick={() => { setTxType('income'); setTxCategory('Allowance'); setShowAddTx(true); }}
          className="bg-white rounded-xl p-3 text-left active:scale-95 transition-transform">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-1.5">
            <ArrowUpRight size={16} className="text-emerald-500" />
          </div>
          <p className="text-xs font-semibold text-gray-800">Income</p>
          <p className="text-[10px] text-gray-400">Add money</p>
        </button>
        <button onClick={() => setView('insights')}
          className="bg-white rounded-xl p-3 text-left active:scale-95 transition-transform">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center mb-1.5">
            <TrendingUp size={16} className="text-violet-500" />
          </div>
          <p className="text-xs font-semibold text-gray-800">Insights</p>
          <p className="text-[10px] text-gray-400">Patterns</p>
        </button>
        <button onClick={() => setView('savings')}
          className="bg-white rounded-xl p-3 text-left active:scale-95 transition-transform">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-1.5">
            <Target size={16} className="text-amber-500" />
          </div>
          <p className="text-xs font-semibold text-gray-800">Savings</p>
          <p className="text-[10px] text-gray-400">{savings.length} goal{savings.length !== 1 ? 's' : ''}</p>
        </button>
      </div>

      {/* ── Spending Velocity Warning ── */}
      {velocity.trend === 'fast' && monthStats.transactionCount > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-4 mb-3 border border-red-100 animate-fade-up" style={{ animationDelay: '160ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Zap size={20} className="text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Spending Fast ⚡</p>
              <p className="text-xs text-gray-500">{formatMoney(velocity.total)} in {velocity.days} days · {formatMoney(velocity.avg)}/day avg</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Personality Mini Card ── */}
      <button onClick={() => setView('insights')}
        className={`w-full bg-gradient-to-br ${pInfo.bg} rounded-2xl p-4 mb-3 text-left shadow-md active:scale-[0.98] transition-transform animate-fade-up`}
        style={{ animationDelay: '180ms' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{pInfo.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Money Personality</p>
            <p className="text-base font-bold text-white">{pInfo.title}</p>
            <p className="text-[11px] text-white/60 truncate">{pInfo.tip}</p>
          </div>
          <ChevronRight size={16} className="text-white/40" />
        </div>
      </button>

      {/* ── Active Challenges ── */}
      <div className="mb-4 animate-fade-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Award size={14} className="text-amber-500" /> Challenges
          </h3>
          {activeChallenges.length < 2 && (
            <button onClick={handleStartChallenge} className="text-[10px] text-emerald-600 font-semibold">+ New Challenge</button>
          )}
        </div>

        {activeChallenges.length === 0 ? (
          <button onClick={handleStartChallenge}
            className="w-full bg-white rounded-xl p-4 text-center active:bg-gray-50 transition-colors border border-dashed border-gray-200">
            <p className="text-2xl mb-1">🏆</p>
            <p className="text-sm font-semibold text-gray-700">Start a Money Challenge</p>
            <p className="text-[10px] text-gray-400">Earn XP and build better habits</p>
          </button>
        ) : (
          <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
            {activeChallenges.map(ch => {
              const pct = ch.target > 0 ? Math.round((Math.min(ch.progress, ch.target) / ch.target) * 100) : 0;
              return (
                <div key={ch.id} className="bg-white rounded-xl p-3.5">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-lg">{ch.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{ch.title}</p>
                      <p className="text-[10px] text-gray-400 truncate">{ch.description}</p>
                    </div>
                    <span className="text-[10px] text-amber-600 font-bold">+{ch.xpReward} XP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">{ch.progress}/{ch.target}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Category Health Bars ── */}
      {budgets.length > 0 && (
        <div className="bg-white rounded-2xl p-4 mb-3 animate-fade-up" style={{ animationDelay: '220ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget Health</h3>
            <button onClick={() => setView('budgets')} className="text-[10px] text-emerald-600 font-semibold">All →</button>
          </div>
          <div className="space-y-2.5">
            {budgets.slice(0, 4).map((b: any) => {
              const catInfo = EXPENSE_CATEGORIES.find(c => c.name === b.category);
              return (
                <div key={b.id} className="flex items-center gap-2.5">
                  <span className="text-sm w-6 text-center">{catInfo?.icon || '📦'}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-medium text-gray-700">{b.category}</span>
                      <span className={`text-[10px] font-semibold ${b.exceeded ? 'text-red-500' : b.pct >= 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {formatMoney(b.spent)}/{formatMoney(b.limit)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${b.exceeded ? 'bg-red-500' : b.pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(b.pct, 100)}%` }} />
                    </div>
                  </div>
                  {b.exceeded && <span className="text-xs">☠️</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Nav Buttons ── */}
      <div className="grid grid-cols-3 gap-2 mb-3 animate-fade-up" style={{ animationDelay: '240ms' }}>
        <button onClick={() => setView('transactions')} className="bg-white rounded-xl py-3 text-center active:bg-gray-50 transition-colors">
          <p className="text-sm font-semibold text-gray-700">📝</p>
          <p className="text-[10px] text-gray-400">{monthStats.transactionCount} txns</p>
        </button>
        <button onClick={() => setView('budgets')} className="bg-white rounded-xl py-3 text-center active:bg-gray-50 transition-colors">
          <p className="text-sm font-semibold text-gray-700">📊</p>
          <p className="text-[10px] text-gray-400">{budgets.length} budgets</p>
        </button>
        <button onClick={() => { setShowAddBudget(true); }} className="bg-white rounded-xl py-3 text-center active:bg-gray-50 transition-colors">
          <p className="text-sm font-semibold text-gray-700">➕</p>
          <p className="text-[10px] text-gray-400">Set Budget</p>
        </button>
      </div>

      {/* ── Recent Transactions ── */}
      {transactions.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: '260ms' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Recent</h3>
            <button onClick={() => setView('transactions')} className="text-[10px] text-emerald-600 font-semibold">All →</button>
          </div>
          <div className="space-y-1.5">
            {transactions.slice(0, 5).map(tx => {
              const catInfo = (tx.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).find(c => c.name === tx.category);
              return (
                <div key={tx.id} className="flex items-center gap-3 bg-white rounded-xl px-3.5 py-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: `${catInfo?.color || '#6b7280'}15` }}>
                    {catInfo?.icon || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{tx.note || tx.category}</p>
                    <p className="text-[10px] text-gray-400">
                      {tx.type === 'expense' ? (tx.isNeed ? '🎯' : '💸') : '💵'} {new Date(tx.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {monthStats.transactionCount === 0 && budgets.length === 0 && savings.length === 0 && (
        <div className="text-center py-12 animate-fade-up">
          <div className="w-20 h-20 rounded-full bg-emerald-50 mx-auto flex items-center justify-center mb-4">
            <Wallet size={36} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Start Your Money Journey</h3>
          <p className="text-sm text-gray-400 mb-2 max-w-xs mx-auto">
            Log expenses, track income, level up your financial awareness
          </p>
          <p className="text-xs text-gray-300 mb-5">Earn XP for every action · Unlock ranks · Build streaks</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => { setTxType('expense'); setShowAddTx(true); }}
              className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl active:scale-95 transition-transform">
              <Plus size={16} /> Log Expense
            </button>
            <button onClick={() => { setTxType('income'); setTxCategory('Allowance'); setShowAddTx(true); }}
              className="inline-flex items-center gap-1.5 bg-white text-gray-700 text-sm font-semibold px-5 py-2.5 rounded-xl active:scale-95 transition-transform border border-gray-200">
              <Plus size={16} /> Add Income
            </button>
          </div>
        </div>
      )}

      {/* ══ ADD TRANSACTION MODAL ══ */}
      {showAddTx && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center" onClick={() => setShowAddTx(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Log Transaction</h3>
              <button onClick={() => setShowAddTx(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              {/* Type Toggle */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                <button onClick={() => { setTxType('expense'); setTxCategory('Food'); }}
                  className={`flex-1 text-xs font-semibold py-2.5 rounded-lg transition-all ${txType === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'}`}>💸 Expense</button>
                <button onClick={() => { setTxType('income'); setTxCategory('Allowance'); }}
                  className={`flex-1 text-xs font-semibold py-2.5 rounded-lg transition-all ${txType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>💵 Income</button>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{CURRENCY}</span>
                  <input type="number" value={txAmount} onChange={e => setTxAmount(e.target.value)}
                    className="w-full text-lg font-bold border border-gray-200 rounded-xl pl-7 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="0" inputMode="decimal" autoFocus />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {cats.map(cat => (
                    <button key={cat.name} onClick={() => setTxCategory(cat.name)}
                      className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${txCategory === cat.name ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500'}`}
                      style={txCategory === cat.name ? { backgroundColor: cat.color } : {}}>
                      <span className="text-sm">{cat.icon}</span> {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Need vs Want Toggle (expense only) */}
              {txType === 'expense' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Need or Want?</label>
                  <div className="flex gap-2 mt-1.5">
                    <button onClick={() => setTxIsNeed(true)}
                      className={`flex-1 text-xs font-semibold py-2.5 rounded-xl transition-all ${txIsNeed ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400' : 'bg-gray-100 text-gray-400'}`}>
                      🎯 Needed It
                    </button>
                    <button onClick={() => setTxIsNeed(false)}
                      className={`flex-1 text-xs font-semibold py-2.5 rounded-xl transition-all ${!txIsNeed ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' : 'bg-gray-100 text-gray-400'}`}>
                      💸 Wanted It
                    </button>
                  </div>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Note (optional)</label>
                <input value={txNote} onChange={e => setTxNote(e.target.value)}
                  className="w-full mt-1.5 text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="What was this for?" />
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</label>
                <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)}
                  className="w-full mt-1.5 text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>

              <button onClick={handleAddTx}
                className={`w-full text-white text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-transform shadow-sm mt-2 ${txType === 'expense' ? 'bg-red-500 shadow-red-200' : 'bg-emerald-600 shadow-emerald-200'}`}>
                Log {txType === 'expense' ? 'Expense' : 'Income'} {txAmount && `· ${CURRENCY}${txAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ SET DAILY BUDGET MODAL ══ */}
      {showSetBudgetLimit && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center" onClick={() => setShowSetBudgetLimit(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Daily Budget Limit</h3>
              <button onClick={() => setShowSetBudgetLimit(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-400 mb-4">How much can you spend per day?</p>
            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{CURRENCY}</span>
                <input type="number" value={dailyBudgetInput} onChange={e => setDailyBudgetInput(e.target.value)}
                  className="w-full text-lg font-bold border border-gray-200 rounded-xl pl-7 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="500" inputMode="decimal" autoFocus />
              </div>
              <div className="flex flex-wrap gap-2">
                {[200, 300, 500, 700, 1000].map(n => (
                  <button key={n} onClick={() => setDailyBudgetInput(String(n))}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${dailyBudgetInput === String(n) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {CURRENCY}{n}
                  </button>
                ))}
              </div>
              <button onClick={handleSetDailyBudget}
                className="w-full bg-emerald-600 text-white text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-transform shadow-sm shadow-emerald-200">
                Set Limit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ADD BUDGET MODAL ══ */}
      {showAddBudget && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center" onClick={() => setShowAddBudget(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Set Category Budget</h3>
              <button onClick={() => setShowAddBudget(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button key={cat.name} onClick={() => setBudgetCategory(cat.name)}
                      className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${budgetCategory === cat.name ? 'text-white' : 'bg-gray-100 text-gray-500'}`}
                      style={budgetCategory === cat.name ? { backgroundColor: cat.color } : {}}>
                      <span className="text-sm">{cat.icon}</span> {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Limit</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{CURRENCY}</span>
                  <input type="number" value={budgetLimit} onChange={e => setBudgetLimit(e.target.value)}
                    className="w-full text-lg font-bold border border-gray-200 rounded-xl pl-7 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="5000" inputMode="decimal" />
                </div>
              </div>
              <button onClick={handleAddBudget}
                className="w-full bg-emerald-600 text-white text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-transform shadow-sm shadow-emerald-200">
                Set Budget
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ADD SAVINGS GOAL MODAL ══ */}
      {showAddSavings && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center" onClick={() => setShowAddSavings(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">New Savings Goal</h3>
              <button onClick={() => setShowAddSavings(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Goal Name</label>
                <input value={savingsName} onChange={e => setSavingsName(e.target.value)}
                  className="w-full mt-1.5 text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="e.g. New Phone" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Icon</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {['🎯', '📱', '💻', '✈️', '🏠', '🎓', '🎮', '👟', '📚', '🎸'].map(icon => (
                    <button key={icon} onClick={() => setSavingsIcon(icon)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${savingsIcon === icon ? 'bg-indigo-100 ring-2 ring-indigo-400 scale-110' : 'bg-gray-50'}`}>{icon}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Amount</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{CURRENCY}</span>
                  <input type="number" value={savingsTarget} onChange={e => setSavingsTarget(e.target.value)}
                    className="w-full text-lg font-bold border border-gray-200 rounded-xl pl-7 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="10000" inputMode="decimal" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deadline</label>
                <input type="date" value={savingsDeadline} onChange={e => setSavingsDeadline(e.target.value)}
                  className="w-full mt-1.5 text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Color</label>
                <div className="flex gap-2 mt-1.5">
                  {['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#22c55e', '#06b6d4', '#3b82f6'].map(c => (
                    <button key={c} onClick={() => setSavingsColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${savingsColor === c ? 'ring-2 ring-offset-2 scale-110' : ''}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <button onClick={handleAddSavings}
                className="w-full bg-emerald-600 text-white text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-transform shadow-sm shadow-emerald-200">
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ADD TO SAVINGS MODAL ══ */}
      {addToSavingsId && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center" onClick={() => setAddToSavingsId(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Add Money</h3>
              <button onClick={() => setAddToSavingsId(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{CURRENCY}</span>
                <input type="number" value={addAmount} onChange={e => setAddAmount(e.target.value)}
                  className="w-full text-lg font-bold border border-gray-200 rounded-xl pl-7 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="100" inputMode="decimal" autoFocus />
              </div>
              <button onClick={handleAddToSavings}
                className="w-full bg-emerald-600 text-white text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-transform">
                Add to Savings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Money;
