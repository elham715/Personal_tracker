import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet, Plus, X, ArrowUpRight, ArrowDownRight, Trash2, ChevronLeft,
  Award, Calendar, CreditCard, BarChart3,
} from 'lucide-react';
import { Transaction, SavingsGoal, MoneyProfile } from '@/types';
import {
  transactionAPI, budgetAPI, savingsAPI, moneyProfileAPI,
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, CURRENCY, formatMoney,
  getMoneyRank, getMoneyXPProgress, PERSONALITY_INFO,
} from '@/services/moneyApi';
import { formatDate } from '@/utils/helpers';

/* ═══════════════════════════════════════════════════════════════════════
   MONEY — Personal Finance Dashboard
   Clean, organized, user-friendly money tracking
   ═══════════════════════════════════════════════════════════════════════ */

type View = 'hub' | 'today' | 'transactions' | 'budgets' | 'savings' | 'insights';

const Money: React.FC = () => {
  const [view, setView] = useState<View>('hub');

  // Sync sub-views with browser history so back button works
  const navigateTo = useCallback((v: View) => {
    if (v !== 'hub') {
      window.history.pushState({ moneyView: v }, '');
    }
    setView(v);
  }, []);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (view !== 'hub') {
        setView(e.state?.moneyView || 'hub');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [view]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [profile, setProfile] = useState<MoneyProfile | null>(null);
  const [monthStats, setMonthStats] = useState({ income: 0, pendingIncome: 0, totalIncome: 0, expenses: 0, net: 0, needs: 0, wants: 0, byCategory: {} as Record<string, number>, dailySpending: {} as Record<string, number>, transactionCount: 0 });
  const [dailyBudget, setDailyBudget] = useState({ spent: 0, remaining: 0, budget: 500, pct: 0 });
  const [todayByCategory, setTodayByCategory] = useState<{ category: string; total: number; count: number }[]>([]);
  const [todayTxs, setTodayTxs] = useState<Transaction[]>([]);

  // Modals
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddSavings, setShowAddSavings] = useState(false);
  const [addToSavingsId, setAddToSavingsId] = useState<string | null>(null);
  const [showSetBudgetLimit, setShowSetBudgetLimit] = useState(false);

  // Form state
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Food');
  const [txNote, setTxNote] = useState('');
  const [txDate, setTxDate] = useState(formatDate());
  const [txIsNeed, setTxIsNeed] = useState(true);
  const [txIsPending, setTxIsPending] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState('Food');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [savingsName, setSavingsName] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [savingsIcon, setSavingsIcon] = useState('🎯');
  const [savingsColor, setSavingsColor] = useState('#6366f1');
  const [savingsDeadline, setSavingsDeadline] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [dailyBudgetInput, setDailyBudgetInput] = useState('');

  const currentMonth = formatDate().slice(0, 7);
  const remainingDays = transactionAPI.getRemainingDaysInMonth();
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const refresh = useCallback(async () => {
    const [txs, stats, budgetAlerts, goals, prof, daily, todayCats, todayList] = await Promise.all([
      transactionAPI.getByMonth(currentMonth),
      transactionAPI.getMonthStats(),
      budgetAPI.getAlerts(),
      savingsAPI.getAll(),
      moneyProfileAPI.get(),
      transactionAPI.getDailyRemaining(),
      transactionAPI.getTodayByCategory(),
      transactionAPI.getTodayTransactions(),
    ]);
    setTransactions(txs.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)));
    setMonthStats(stats);
    setBudgets(budgetAlerts);
    setSavings(goals);
    setProfile(prof);
    setDailyBudget(daily);
    setTodayByCategory(todayCats);
    setTodayTxs(todayList);

    await moneyProfileAPI.updateChallenges();
    setProfile(await moneyProfileAPI.get());
  }, [currentMonth]);

  useEffect(() => { refresh(); }, [refresh]);

  /* ── Handlers ── */
  const handleAddTx = async () => {
    const amount = parseFloat(txAmount);
    if (!amount || amount <= 0) return;
    await transactionAPI.create({ amount, type: txType, category: txCategory, note: txNote.trim(), isNeed: txIsNeed, isPending: txType === 'income' ? txIsPending : false, date: txDate });
    setTxAmount(''); setTxNote(''); setTxIsPending(false); setShowAddTx(false);
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
  const budgetPerDay = transactionAPI.getBudgetPerRemainingDay(Math.max(monthStats.net + monthStats.pendingIncome, 0));

  // ── Determine which view to render ──
  const renderContent = () => {

  // ═══════════════════════════════════════════════════════════════
  //  TODAY'S EXPENSES VIEW
  // ═══════════════════════════════════════════════════════════════
  if (view === 'today') return (
    <div className="page-container max-w-lg lg:max-w-3xl mx-auto">
      <div className="flex items-center gap-3 pt-4 mb-4">
        <button onClick={() => window.history.back()} className="p-1"><ChevronLeft size={20} className="text-gray-400" /></button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Today's Expenses</h1>
        <button onClick={() => { setTxType('expense'); setTxDate(formatDate()); setShowAddTx(true); }}
          className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl active:scale-95 transition-transform">
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Today's Total */}
      <div className="bg-white rounded-2xl p-4 mb-4">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">{todayDate}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900">{formatMoney(dailyBudget.spent)}</p>
            <p className="text-xs text-gray-400 mt-0.5">spent today</p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${dailyBudget.remaining >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {dailyBudget.remaining >= 0 ? formatMoney(dailyBudget.remaining) : `-${formatMoney(Math.abs(dailyBudget.remaining))}`}
            </p>
            <p className="text-[10px] text-gray-400">left of {formatMoney(dailyBudget.budget)}</p>
          </div>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mt-3">
          <div className={`h-full rounded-full transition-all duration-500 ${
            dailyBudget.pct > 90 ? 'bg-red-500' : dailyBudget.pct > 70 ? 'bg-amber-400' : 'bg-emerald-500'
          }`} style={{ width: `${Math.min(dailyBudget.pct, 100)}%` }} />
        </div>
      </div>

      {/* Today by Category */}
      {todayByCategory.length > 0 ? (
        <div className="bg-white rounded-2xl p-4 mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">By Category</h3>
          <div className="space-y-3">
            {todayByCategory.map(item => {
              const catInfo = EXPENSE_CATEGORIES.find(c => c.name === item.category);
              return (
                <div key={item.category} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${catInfo?.color || '#6b7280'}12` }}>
                    {catInfo?.icon || '📦'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-gray-800">{item.category}</span>
                      <span className="text-sm font-bold text-gray-900">{formatMoney(item.total)}</span>
                    </div>
                    <p className="text-[10px] text-gray-400">{item.count} transaction{item.count > 1 ? 's' : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-3xl mb-2">✨</p>
          <p className="text-sm font-medium text-gray-500">No expenses today</p>
          <p className="text-xs text-gray-400 mt-1">Tap + to log your first expense</p>
        </div>
      )}

      {/* Today's Transactions List */}
      {todayTxs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">All Today</h3>
          <div className="space-y-1.5">
            {todayTxs.map(tx => {
              const catInfo = (tx.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).find(c => c.name === tx.category);
              return (
                <div key={tx.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                    style={{ backgroundColor: `${catInfo?.color || '#6b7280'}12` }}>
                    {catInfo?.icon || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{tx.note || tx.category}</p>
                    <p className="text-[10px] text-gray-400">
                      {tx.type === 'expense' ? (tx.isNeed ? '🎯 Need' : '💸 Want') : '💵 Income'}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                  </span>
                  <button onClick={async () => { await transactionAPI.delete(tx.id); await refresh(); }}
                    className="p-1 rounded-lg hover:bg-red-50">
                    <Trash2 size={13} className="text-gray-300" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  //  ALL TRANSACTIONS VIEW
  // ═══════════════════════════════════════════════════════════════
  if (view === 'transactions') return (
    <div className="page-container max-w-lg lg:max-w-3xl mx-auto">
      <div className="flex items-center gap-3 pt-4 mb-4">
        <button onClick={() => window.history.back()} className="p-1"><ChevronLeft size={20} className="text-gray-400" /></button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">All Transactions</h1>
        <button onClick={() => setShowAddTx(true)}
          className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl active:scale-95 transition-transform">
          <Plus size={14} /> Log
        </button>
      </div>

      {/* Month Summary Bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Income</p>
          <p className="text-base font-bold text-emerald-700">{formatMoney(monthStats.income)}</p>
        </div>
        <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Expenses</p>
          <p className="text-base font-bold text-red-600">{formatMoney(monthStats.expenses)}</p>
        </div>
        <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Needs</p>
          <p className="text-base font-bold text-gray-700">{formatMoney(monthStats.needs)}</p>
        </div>
      </div>

      <div className="space-y-1.5 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
        {transactions.length === 0 ? (
          <div className="text-center py-12 lg:col-span-2">
            <p className="text-3xl mb-2">📝</p>
            <p className="text-sm text-gray-400">No transactions this month</p>
          </div>
        ) : transactions.map(tx => {
          const catInfo = (tx.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).find(c => c.name === tx.category);
          return (
            <div key={tx.id} className={`flex items-center gap-3 bg-white rounded-xl px-4 py-3 ${tx.isPending ? 'border border-dashed border-amber-200' : ''}`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                style={{ backgroundColor: `${catInfo?.color || '#6b7280'}12` }}>
                {catInfo?.icon || '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">
                  {tx.isPending && <span className="text-amber-500">⏳ </span>}{tx.note || tx.category}
                </p>
                <p className="text-[10px] text-gray-400">
                  {tx.category} · {tx.isPending ? 'Expected' : new Date(tx.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${tx.type === 'income' ? (tx.isPending ? 'text-amber-500' : 'text-emerald-600') : 'text-gray-900'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                </span>
                {tx.isPending ? (
                  <button onClick={async () => { await transactionAPI.markReceived(tx.id); await refresh(); }}
                    className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg active:scale-95 transition-transform whitespace-nowrap">
                    ✅ Got it
                  </button>
                ) : tx.type === 'income' ? (
                  <button onClick={async () => { await transactionAPI.markUnreceived(tx.id); await refresh(); }}
                    className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md active:scale-95 transition-transform whitespace-nowrap">
                    ⏳ Undo
                  </button>
                ) : null}
                <button onClick={async () => { await transactionAPI.delete(tx.id); await refresh(); }}
                  className="p-1 rounded-lg hover:bg-red-50">
                  <Trash2 size={13} className="text-gray-300" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  //  BUDGETS VIEW
  // ═══════════════════════════════════════════════════════════════
  if (view === 'budgets') return (
    <div className="page-container max-w-lg lg:max-w-3xl mx-auto">
      <div className="flex items-center gap-3 pt-4 mb-4">
        <button onClick={() => window.history.back()} className="p-1"><ChevronLeft size={20} className="text-gray-400" /></button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Category Budgets</h1>
        <button onClick={() => setShowAddBudget(true)} className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><Plus size={14} /> Add</button>
      </div>
      <p className="text-xs text-gray-400 mb-4">Set monthly spending limits for each category. See how much you've used.</p>
      {budgets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm text-gray-500 mb-1">No budgets set yet</p>
          <p className="text-xs text-gray-400 mb-4">Budget limits help you control spending in specific areas</p>
          <button onClick={() => setShowAddBudget(true)} className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl">+ Create Budget</button>
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

  // ═══════════════════════════════════════════════════════════════
  //  SAVINGS VIEW
  // ═══════════════════════════════════════════════════════════════
  if (view === 'savings') return (
    <div className="page-container max-w-lg lg:max-w-3xl mx-auto">
      <div className="flex items-center gap-3 pt-4 mb-4">
        <button onClick={() => window.history.back()} className="p-1"><ChevronLeft size={20} className="text-gray-400" /></button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Savings Goals</h1>
        <button onClick={() => setShowAddSavings(true)} className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><Plus size={14} /> New</button>
      </div>
      <p className="text-xs text-gray-400 mb-4">Save money towards something you want. Add money anytime you can.</p>
      {savings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">🐷</p>
          <p className="text-sm text-gray-500 mb-1">No savings goals yet</p>
          <p className="text-xs text-gray-400 mb-4">Set a target and save little by little</p>
          <button onClick={() => setShowAddSavings(true)} className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl">+ Create Goal</button>
        </div>
      ) : (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {savings.map(goal => {
            const pct = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
            const daysLeft = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            return (
              <div key={goal.id} className="bg-white rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${goal.color}12` }}>
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
                    style={{ backgroundColor: `${goal.color}12`, color: goal.color }}>+ Add Money</button>
                </div>
                <button onClick={async () => { await savingsAPI.delete(goal.id); await refresh(); }} className="mt-2 text-[10px] text-red-400 font-medium">Delete goal</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  //  INSIGHTS VIEW
  // ═══════════════════════════════════════════════════════════════
  if (view === 'insights') return (
    <div className="page-container max-w-lg lg:max-w-3xl mx-auto">
      <div className="flex items-center gap-3 pt-4 mb-5">
        <button onClick={() => window.history.back()} className="p-1"><ChevronLeft size={20} className="text-gray-400" /></button>
        <h1 className="text-xl font-bold text-gray-900">Insights & Patterns</h1>
      </div>

      {/* Personality */}
      <div className={`bg-gradient-to-br ${pInfo.bg} rounded-2xl p-5 text-white mb-4 shadow-lg`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{pInfo.emoji}</span>
          <div>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Your Spending Style</p>
            <h2 className="text-xl font-bold">{pInfo.title}</h2>
          </div>
        </div>
        <p className="text-sm text-white/70 mb-3">{pInfo.desc}</p>
        <div className="bg-white/15 rounded-xl p-3">
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">💡 Tip</p>
          <p className="text-sm text-white/90">{pInfo.tip}</p>
        </div>
      </div>

      {/* Needs vs Wants */}
      {monthStats.expenses > 0 && (
        <div className="bg-white rounded-2xl p-4 mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Where does your money go?</h3>
          <div className="flex gap-3 mb-3">
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-emerald-600">{formatMoney(monthStats.needs)}</p>
              <p className="text-[10px] text-gray-400">🎯 Things you needed</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-amber-500">{formatMoney(monthStats.wants)}</p>
              <p className="text-[10px] text-gray-400">💸 Things you wanted</p>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500" style={{ width: `${Math.round((monthStats.needs / monthStats.expenses) * 100)}%` }} />
            <div className="h-full bg-amber-400" style={{ width: `${Math.round((monthStats.wants / monthStats.expenses) * 100)}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Ideally, needs should be higher than wants</p>
        </div>
      )}

      {/* Top Spending Categories */}
      {Object.keys(monthStats.byCategory).length > 0 && (
        <div className="bg-white rounded-2xl p-4 mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Most Spent On</h3>
          <div className="space-y-3">
            {Object.entries(monthStats.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, amount]) => {
              const catInfo = EXPENSE_CATEGORIES.find(c => c.name === cat);
              const pct = monthStats.expenses > 0 ? Math.round((amount / monthStats.expenses) * 100) : 0;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center">{catInfo?.icon || '📦'}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{cat}</span>
                      <span className="text-sm font-semibold text-gray-900">{formatMoney(amount)} <span className="text-[10px] text-gray-400">({pct}%)</span></span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: catInfo?.color || '#6b7280' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* XP / Level Progress */}
      <div className="bg-white rounded-2xl p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Money Level</h3>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{rank.icon}</span>
          <div className="flex-1">
            <p className="text-base font-bold text-gray-900">Level {profile.moneyLevel} · {rank.rank}</p>
            <p className="text-[10px] text-gray-400">You earn XP by logging expenses, saving money, and completing challenges</p>
          </div>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${xpProg.pct}%` }} />
        </div>
        <p className="text-[10px] text-gray-400 mt-1">{xpProg.xpInLevel}/{xpProg.xpNeeded} XP to next level</p>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  //  MAIN HUB
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="page-container max-w-lg lg:max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-4 mb-4 animate-fade-up">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet size={22} className="text-emerald-600" /> Money
          </h1>
          <p className="text-xs text-gray-400">{todayDate} · {remainingDays} day{remainingDays !== 1 ? 's' : ''} left this month</p>
        </div>
        <div className="flex items-center gap-1.5">
          {profile.loggingStreak > 0 && (
            <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full">🔥 {profile.loggingStreak}d</span>
          )}
          <button onClick={() => { setTxType('income'); setTxCategory('Allowance'); setShowAddTx(true); }}
            className="flex items-center gap-1 bg-white text-emerald-700 text-xs font-semibold px-3 py-2 rounded-xl active:scale-95 transition-transform border border-emerald-200">
            <Plus size={14} /> Income
          </button>
          <button onClick={() => { setTxType('expense'); setShowAddTx(true); }}
            className="flex items-center gap-1 bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl active:scale-95 transition-transform shadow-sm shadow-emerald-200">
            <Plus size={14} /> Expense
          </button>
        </div>
      </div>

      {/* ══════════ SECTION 1: Current Balance ══════════ */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-3.5 lg:p-5 mb-3 shadow-lg shadow-emerald-200/40 animate-fade-up" style={{ animationDelay: '40ms' }}>
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Current Balance</p>
          {monthStats.pendingIncome > 0 && (
            <p className="text-[10px] text-amber-200/70">
              ⏳ <span className="font-semibold text-amber-200">{formatMoney(monthStats.pendingIncome)}</span> expected
            </p>
          )}
        </div>
        <p className={`text-2xl lg:text-4xl font-bold mb-1.5 ${monthStats.net >= 0 ? 'text-white' : 'text-red-200'}`}>
          {formatMoney(monthStats.net)}
        </p>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
              <ArrowUpRight size={12} className="text-emerald-200" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold leading-tight">{formatMoney(monthStats.income)}</p>
              <p className="text-white/40 text-[9px]">Income</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
              <ArrowDownRight size={12} className="text-red-200" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold leading-tight">{formatMoney(monthStats.expenses)}</p>
              <p className="text-white/40 text-[9px]">Spent</p>
            </div>
          </div>
        </div>

        {/* Month Planning Info */}
        {(monthStats.net + monthStats.pendingIncome) > 0 && remainingDays > 0 && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-[10px] text-white/50">
              <Calendar size={10} className="inline mr-1 -mt-0.5" />
              {remainingDays} days left → <span className="text-white font-semibold">{formatMoney(budgetPerDay)}/day</span>{monthStats.pendingIncome > 0 ? ' (incl. expected)' : ''}
            </p>
          </div>
        )}
      </div>

      {/* ══════════ SECTION 2: Today's Budget ══════════ */}
      <div className="bg-white rounded-2xl p-4 mb-3 animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard size={13} className="text-gray-400" /> Today's Budget
          </h3>
          <button onClick={() => { setShowSetBudgetLimit(true); setDailyBudgetInput(String(profile.dailyBudget)); }}
            className="text-[10px] text-emerald-600 font-semibold">Change →</button>
        </div>
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className={`text-2xl font-bold ${dailyBudget.remaining >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
              {dailyBudget.remaining >= 0 ? formatMoney(dailyBudget.remaining) : `-${formatMoney(Math.abs(dailyBudget.remaining))}`}
            </p>
            <p className="text-[10px] text-gray-400">remaining of {formatMoney(dailyBudget.budget)}</p>
          </div>
          <p className="text-sm font-semibold text-gray-400">{formatMoney(dailyBudget.spent)} spent</p>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${
            dailyBudget.pct > 90 ? 'bg-red-500' : dailyBudget.pct > 70 ? 'bg-amber-400' : 'bg-emerald-500'
          }`} style={{ width: `${Math.min(dailyBudget.pct, 100)}%` }} />
        </div>
        {dailyBudget.remaining < 0 && (
          <p className="text-[10px] text-red-500 font-medium mt-1.5">⚠️ You've gone over today's budget</p>
        )}
      </div>

      {/* ══════════ SECTION 3: Today's Expenses Preview ══════════ */}
      <button onClick={() => navigateTo('today')}
        className="w-full bg-white rounded-2xl p-4 mb-3 text-left active:bg-gray-50 transition-colors animate-fade-up" style={{ animationDelay: '120ms' }}>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Expenses</h3>
          <span className="text-[10px] text-emerald-600 font-semibold">See all →</span>
        </div>
        {todayByCategory.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {todayByCategory.map(item => {
              const catInfo = EXPENSE_CATEGORIES.find(c => c.name === item.category);
              return (
                <div key={item.category} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
                  <span className="text-sm">{catInfo?.icon || '📦'}</span>
                  <span className="text-xs font-semibold text-gray-700">{formatMoney(item.total)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No expenses yet today — tap to add</p>
        )}
      </button>

      {/* ══════════ SECTION 4: Quick Actions ══════════ */}
      <div className="grid grid-cols-2 gap-2 mb-3 animate-fade-up" style={{ animationDelay: '160ms' }}>
        <button onClick={() => navigateTo('savings')}
          className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-3.5 text-left active:scale-[0.98] transition-transform border border-purple-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🐷</span>
            <p className="text-sm font-bold text-purple-800">Savings</p>
          </div>
          <p className="text-[10px] text-purple-500">{savings.length > 0 ? `${savings.length} goal${savings.length > 1 ? 's' : ''} active` : 'Start saving today →'}</p>
        </button>
        <button onClick={() => navigateTo('insights')}
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-3.5 text-left active:scale-[0.98] transition-transform border border-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📊</span>
            <p className="text-sm font-bold text-amber-800">Insights</p>
          </div>
          <p className="text-[10px] text-amber-500">See spending patterns →</p>
        </button>
      </div>

      {/* ══════════ SECTION 5: Category Budgets (if set) ══════════ */}
      {budgets.length > 0 && (
        <div className="bg-white rounded-2xl p-4 mb-3 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 size={13} className="text-gray-400" /> Monthly Budgets
            </h3>
            <button onClick={() => navigateTo('budgets')} className="text-[10px] text-emerald-600 font-semibold">Manage →</button>
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
                      <span className={`text-[10px] font-semibold ${b.exceeded ? 'text-red-500' : 'text-gray-500'}`}>
                        {formatMoney(b.spent)} / {formatMoney(b.limit)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${b.exceeded ? 'bg-red-500' : b.pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(b.pct, 100)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {budgets.length > 4 && (
            <button onClick={() => navigateTo('budgets')} className="text-[10px] text-gray-400 mt-2">+{budgets.length - 4} more</button>
          )}
        </div>
      )}

      {/* ══════════ SECTION 6: Challenges ══════════ */}
      <div className="bg-white rounded-2xl p-4 mb-3 animate-fade-up" style={{ animationDelay: '240ms' }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Award size={13} className="text-amber-500" /> Money Challenges
          </h3>
          {activeChallenges.length < 2 && (
            <button onClick={handleStartChallenge} className="text-[10px] text-emerald-600 font-semibold">+ Start</button>
          )}
        </div>
        <p className="text-[10px] text-gray-400 mb-3">Complete challenges to earn XP and build better money habits</p>

        {activeChallenges.length === 0 ? (
          <button onClick={handleStartChallenge}
            className="w-full py-3 text-center border border-dashed border-gray-200 rounded-xl active:bg-gray-50 transition-colors">
            <p className="text-sm font-semibold text-gray-600">🎯 Start Your First Challenge</p>
            <p className="text-[10px] text-gray-400 mt-0.5">E.g. "Log expenses for 7 days" — earn 50 XP</p>
          </button>
        ) : (
          <div className="space-y-2.5">
            {activeChallenges.map(ch => {
              const pct = ch.target > 0 ? Math.round((Math.min(ch.progress, ch.target) / ch.target) * 100) : 0;
              return (
                <div key={ch.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-lg">{ch.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{ch.title}</p>
                      <p className="text-[10px] text-gray-400">{ch.description} · <span className="text-amber-600 font-semibold">+{ch.xpReward} XP reward</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-500 font-semibold">{ch.progress}/{ch.target}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════ SECTION 7: Navigation Row ══════════ */}
      <div className="grid grid-cols-3 gap-2 mb-3 animate-fade-up" style={{ animationDelay: '280ms' }}>
        <button onClick={() => navigateTo('transactions')} className="bg-white rounded-xl py-3 text-center active:bg-gray-50 transition-colors">
          <p className="text-sm font-semibold text-gray-700">📝</p>
          <p className="text-[10px] text-gray-400">{monthStats.transactionCount} transactions</p>
        </button>
        <button onClick={() => navigateTo('budgets')} className="bg-white rounded-xl py-3 text-center active:bg-gray-50 transition-colors">
          <p className="text-sm font-semibold text-gray-700">📊</p>
          <p className="text-[10px] text-gray-400">{budgets.length} budget{budgets.length !== 1 ? 's' : ''}</p>
        </button>
        <button onClick={() => setShowAddBudget(true)} className="bg-white rounded-xl py-3 text-center active:bg-gray-50 transition-colors">
          <p className="text-sm font-semibold text-gray-700">➕</p>
          <p className="text-[10px] text-gray-400">Set Budget</p>
        </button>
      </div>

      {/* ══════════ SECTION 8: Recent Transactions ══════════ */}
      {transactions.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: '320ms' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent</h3>
            <button onClick={() => navigateTo('transactions')} className="text-[10px] text-emerald-600 font-semibold">All →</button>
          </div>
          <div className="space-y-1.5">
            {transactions.slice(0, 5).map(tx => {
              const catInfo = (tx.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).find(c => c.name === tx.category);
              return (
                <div key={tx.id} className={`flex items-center gap-3 bg-white rounded-xl px-3.5 py-2.5 ${tx.isPending ? 'border border-dashed border-amber-200' : ''}`}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ backgroundColor: `${catInfo?.color || '#6b7280'}12` }}>
                    {catInfo?.icon || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {tx.isPending && <span className="text-amber-500">⏳ </span>}{tx.note || tx.category}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {tx.isPending ? 'Expected' : new Date(tx.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  {tx.isPending ? (
                    <button onClick={async () => { await transactionAPI.markReceived(tx.id); await refresh(); }}
                      className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg active:scale-95 transition-transform whitespace-nowrap">
                      ✅ Received
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                      </span>
                      {tx.type === 'income' && (
                        <button onClick={async () => { await transactionAPI.markUnreceived(tx.id); await refresh(); }}
                          className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md active:scale-95 transition-transform whitespace-nowrap">
                          ↩
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════ EMPTY STATE ══════════ */}
      {monthStats.transactionCount === 0 && budgets.length === 0 && savings.length === 0 && (
        <div className="text-center py-10 animate-fade-up">
          <div className="w-16 h-16 rounded-full bg-emerald-50 mx-auto flex items-center justify-center mb-4">
            <Wallet size={28} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Start Tracking Money</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
            Log what you spend and earn. See where your money goes.
          </p>
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

    </div>
  );
  }; // end renderContent

  return (
    <>
      {renderContent()}

      {/* ═══════════════════════════════════════════
          MODALS — always rendered regardless of view
      ═══════════════════════════════════════════ */}

      {/* ADD TRANSACTION */}
      {showAddTx && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center" onClick={() => setShowAddTx(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{txType === 'expense' ? 'Log Expense' : 'Add Income'}</h3>
              <button onClick={() => setShowAddTx(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-4">
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

              {/* Category Chips */}
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

              {/* Need vs Want */}
              {txType === 'expense' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Did you need this?</label>
                  <div className="flex gap-2 mt-1.5">
                    <button onClick={() => setTxIsNeed(true)}
                      className={`flex-1 text-xs font-semibold py-2.5 rounded-xl transition-all ${txIsNeed ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400' : 'bg-gray-100 text-gray-400'}`}>
                      🎯 Yes, needed it
                    </button>
                    <button onClick={() => setTxIsNeed(false)}
                      className={`flex-1 text-xs font-semibold py-2.5 rounded-xl transition-all ${!txIsNeed ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' : 'bg-gray-100 text-gray-400'}`}>
                      💸 No, just wanted
                    </button>
                  </div>
                </div>
              )}

              {/* Received vs Expected (income only) */}
              {txType === 'income' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Have you received it?</label>
                  <div className="flex gap-2 mt-1.5">
                    <button onClick={() => setTxIsPending(false)}
                      className={`flex-1 text-xs font-semibold py-2.5 rounded-xl transition-all ${!txIsPending ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400' : 'bg-gray-100 text-gray-400'}`}>
                      ✅ Yes, received
                    </button>
                    <button onClick={() => setTxIsPending(true)}
                      className={`flex-1 text-xs font-semibold py-2.5 rounded-xl transition-all ${txIsPending ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' : 'bg-gray-100 text-gray-400'}`}>
                      ⏳ Coming soon
                    </button>
                  </div>
                  {txIsPending && (
                    <p className="text-[10px] text-amber-600 mt-1.5">This won't count in your balance until you mark it as received</p>
                  )}
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
                className={`w-full text-white text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-transform shadow-sm mt-2 ${txType === 'expense' ? 'bg-red-500 shadow-red-200' : txIsPending ? 'bg-amber-500 shadow-amber-200' : 'bg-emerald-600 shadow-emerald-200'}`}>
                {txType === 'expense' ? 'Log Expense' : txIsPending ? 'Add Expected Income' : 'Add Income'} {txAmount && `· ${CURRENCY}${txAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SET DAILY BUDGET */}
      {showSetBudgetLimit && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center" onClick={() => setShowSetBudgetLimit(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Daily Budget</h3>
              <button onClick={() => setShowSetBudgetLimit(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Set the max you want to spend each day</p>
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
                className="w-full bg-emerald-600 text-white text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-transform">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CATEGORY BUDGET */}
      {showAddBudget && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center" onClick={() => setShowAddBudget(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Set Category Budget</h3>
              <button onClick={() => setShowAddBudget(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Limit how much you spend on a category each month</p>
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
                className="w-full bg-emerald-600 text-white text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-transform">
                Set Budget
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SAVINGS GOAL */}
      {showAddSavings && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center" onClick={() => setShowAddSavings(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">New Savings Goal</h3>
              <button onClick={() => setShowAddSavings(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">What are you saving for?</label>
                <input value={savingsName} onChange={e => setSavingsName(e.target.value)}
                  className="w-full mt-1.5 text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="e.g. New Phone, Trip, Course" />
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
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">How much do you need?</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{CURRENCY}</span>
                  <input type="number" value={savingsTarget} onChange={e => setSavingsTarget(e.target.value)}
                    className="w-full text-lg font-bold border border-gray-200 rounded-xl pl-7 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="10000" inputMode="decimal" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">By when?</label>
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
                className="w-full bg-emerald-600 text-white text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-transform">
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD TO SAVINGS */}
      {addToSavingsId && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center" onClick={() => setAddToSavingsId(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add Money to Savings</h3>
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
    </>
  );
};

export default Money;
