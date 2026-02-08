import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, Plus, X, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { Transaction, SavingsGoal } from '@/types';
import { transactionAPI, budgetAPI, savingsAPI, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/services/moneyApi';
import { formatDate } from '@/utils/helpers';

/* ═══════════════════════════════════════════════════════════════════════
   MONEY SYSTEM — Budget Tracking + Savings Goals
   ═══════════════════════════════════════════════════════════════════════ */

type TabView = 'overview' | 'transactions' | 'budgets' | 'savings';

const Money: React.FC = () => {
  const [tab, setTab] = useState<TabView>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [monthStats, setMonthStats] = useState({ income: 0, expenses: 0, net: 0, byCategory: {} as Record<string, number>, dailySpending: {} as Record<string, number>, transactionCount: 0 });
  const [loggingStreak, setLoggingStreak] = useState(0);

  // Add transaction form
  const [showAddTx, setShowAddTx] = useState(false);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Food');
  const [txNote, setTxNote] = useState('');
  const [txDate, setTxDate] = useState(formatDate());

  // Add budget form
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState('Food');
  const [budgetLimit, setBudgetLimit] = useState('');

  // Add savings form
  const [showAddSavings, setShowAddSavings] = useState(false);
  const [savingsName, setSavingsName] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [savingsIcon, setSavingsIcon] = useState('🎯');
  const [savingsColor, setSavingsColor] = useState('#6366f1');
  const [savingsDeadline, setSavingsDeadline] = useState('');

  // Add money to savings
  const [addToSavingsId, setAddToSavingsId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');

  const currentMonth = formatDate().slice(0, 7);
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const refresh = useCallback(async () => {
    const [txs, stats, budgetAlerts, goals, streak] = await Promise.all([
      transactionAPI.getByMonth(currentMonth),
      transactionAPI.getMonthStats(),
      budgetAPI.getAlerts(),
      savingsAPI.getAll(),
      transactionAPI.getLoggingStreak(),
    ]);
    setTransactions(txs.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)));
    setMonthStats(stats);
    setBudgets(budgetAlerts);
    setSavings(goals);
    setLoggingStreak(streak);
  }, [currentMonth]);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Add Transaction ──
  const handleAddTx = async () => {
    const amount = parseFloat(txAmount);
    if (!amount || amount <= 0) return;
    await transactionAPI.create({
      amount,
      type: txType,
      category: txCategory,
      note: txNote.trim(),
      date: txDate,
    });
    setTxAmount('');
    setTxNote('');
    setShowAddTx(false);
    await refresh();
  };

  // ── Add Budget ──
  const handleAddBudget = async () => {
    const limit = parseFloat(budgetLimit);
    if (!limit || limit <= 0) return;
    await budgetAPI.create({
      category: budgetCategory,
      limit,
      month: currentMonth,
    });
    setBudgetLimit('');
    setShowAddBudget(false);
    await refresh();
  };

  // ── Add Savings Goal ──
  const handleAddSavings = async () => {
    const target = parseFloat(savingsTarget);
    if (!savingsName.trim() || !target || target <= 0) return;
    await savingsAPI.create({
      name: savingsName.trim(),
      icon: savingsIcon,
      targetAmount: target,
      deadline: savingsDeadline || formatDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
      color: savingsColor,
    });
    setSavingsName('');
    setSavingsTarget('');
    setShowAddSavings(false);
    await refresh();
  };

  // ── Add Money to Savings ──
  const handleAddToSavings = async () => {
    if (!addToSavingsId || !addAmount) return;
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0) return;
    await savingsAPI.addMoney(addToSavingsId, amount);
    setAddToSavingsId(null);
    setAddAmount('');
    await refresh();
  };

  const cats = txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const topCategories = Object.entries(monthStats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // ═══════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════
  return (
    <div className="page-container max-w-lg lg:max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 mb-4 animate-fade-up">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet size={22} className="text-emerald-600" /> Money
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{monthName}</p>
        </div>
        <div className="flex items-center gap-2">
          {loggingStreak > 0 && (
            <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full">
              🔥 {loggingStreak}d streak
            </span>
          )}
          <button onClick={() => setShowAddTx(true)}
            className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl active:scale-95 transition-transform shadow-sm shadow-emerald-200">
            <Plus size={15} /> Log
          </button>
        </div>
      </div>

      {/* Monthly Summary Card */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-5 mb-4 shadow-lg shadow-emerald-200/40 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <p className="text-xs text-white/60 font-medium uppercase tracking-wider mb-1">Net Balance</p>
        <p className={`text-3xl font-bold ${monthStats.net >= 0 ? 'text-white' : 'text-red-200'}`}>
          {monthStats.net >= 0 ? '+' : ''}{monthStats.net.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </p>
        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <ArrowUpRight size={14} className="text-emerald-200" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{monthStats.income.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
              <p className="text-white/50 text-[10px]">Income</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <ArrowDownRight size={14} className="text-red-200" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{monthStats.expenses.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
              <p className="text-white/50 text-[10px]">Expenses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4 animate-fade-up" style={{ animationDelay: '120ms' }}>
        {(['overview', 'transactions', 'budgets', 'savings'] as TabView[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg capitalize transition-all ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
            }`}>{t}</button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <div className="space-y-4 animate-fade-up">
          {/* Top Categories */}
          {topCategories.length > 0 && (
            <div className="bg-white rounded-2xl p-4">
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
                          <span className="text-sm font-semibold text-gray-900">
                            {amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: catInfo?.color || '#6b7280' }} />
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Budget Alerts */}
          {budgets.length > 0 && (
            <div className="bg-white rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Budget Status</h3>
              <div className="space-y-3">
                {budgets.map((b: any) => {
                  const catInfo = EXPENSE_CATEGORIES.find(c => c.name === b.category);
                  return (
                    <div key={b.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{catInfo?.icon || '📦'}</span>
                          <span className="text-sm font-medium text-gray-700">{b.category}</span>
                        </div>
                        <span className={`text-xs font-semibold ${b.exceeded ? 'text-red-500' : b.pct >= 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {b.spent.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} / {b.limit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${
                          b.exceeded ? 'bg-red-500' : b.pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'
                        }`} style={{ width: `${Math.min(b.pct, 100)}%` }} />
                      </div>
                      {b.exceeded && (
                        <p className="text-[10px] text-red-500 font-medium mt-0.5">
                          ⚠ Over budget by {Math.abs(b.remaining).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Savings Goals */}
          {savings.length > 0 && (
            <div className="bg-white rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Savings Goals</h3>
              <div className="space-y-3">
                {savings.map(goal => {
                  const pct = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
                  return (
                    <button key={goal.id} onClick={() => { setAddToSavingsId(goal.id); setAddAmount(''); }}
                      className="w-full text-left active:bg-gray-50 rounded-xl p-0.5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${goal.color}15` }}>
                          {goal.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-800">{goal.name}</span>
                            <span className="text-xs font-bold" style={{ color: goal.color }}>{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: goal.color }} />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {goal.currentAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} of {goal.targetAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {monthStats.transactionCount === 0 && budgets.length === 0 && savings.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-emerald-50 mx-auto flex items-center justify-center mb-4">
                <Wallet size={36} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Start Tracking Money</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                Log your expenses, set budgets, and build savings goals
              </p>
              <button onClick={() => setShowAddTx(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl active:scale-95 transition-transform">
                <Plus size={16} /> Log First Expense
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TRANSACTIONS TAB ── */}
      {tab === 'transactions' && (
        <div className="space-y-1.5 animate-fade-up">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-sm text-gray-400">No transactions this month</p>
              <button onClick={() => setShowAddTx(true)}
                className="mt-3 text-emerald-600 text-sm font-semibold">+ Add one</button>
            </div>
          ) : (
            <>
              {transactions.map(tx => {
                const catInfo = (tx.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).find(c => c.name === tx.category);
                return (
                  <div key={tx.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                      style={{ backgroundColor: `${catInfo?.color || '#6b7280'}15` }}>
                      {catInfo?.icon || '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{tx.note || tx.category}</p>
                      <p className="text-[10px] text-gray-400">{tx.category} · {new Date(tx.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                    <button onClick={async () => { await transactionAPI.delete(tx.id); await refresh(); }}
                      className="p-1 rounded-lg hover:bg-red-50">
                      <Trash2 size={13} className="text-gray-300" />
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── BUDGETS TAB ── */}
      {tab === 'budgets' && (
        <div className="animate-fade-up">
          <div className="flex justify-end mb-3">
            <button onClick={() => setShowAddBudget(true)}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <Plus size={14} /> Set Budget
            </button>
          </div>
          {budgets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm text-gray-400 mb-3">No budgets set</p>
              <button onClick={() => setShowAddBudget(true)}
                className="text-emerald-600 text-sm font-semibold">+ Create Budget</button>
            </div>
          ) : (
            <div className="space-y-3">
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
                        <p className={`text-base font-bold ${b.exceeded ? 'text-red-500' : 'text-gray-900'}`}>
                          {b.spent.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </p>
                        <p className="text-[10px] text-gray-400">of {b.limit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${
                        b.exceeded ? 'bg-red-500' : b.pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`} style={{ width: `${Math.min(b.pct, 100)}%` }} />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-gray-400">{b.pct}% used</span>
                      <span className={`text-[10px] font-medium ${b.remaining >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {b.remaining >= 0 ? `${b.remaining.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} left` : `${Math.abs(b.remaining).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} over`}
                      </span>
                    </div>
                    <button onClick={async () => { await budgetAPI.delete(b.id); await refresh(); }}
                      className="mt-2 text-[10px] text-red-400 font-medium">Remove budget</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SAVINGS TAB ── */}
      {tab === 'savings' && (
        <div className="animate-fade-up">
          <div className="flex justify-end mb-3">
            <button onClick={() => setShowAddSavings(true)}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <Plus size={14} /> New Goal
            </button>
          </div>
          {savings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">🏦</p>
              <p className="text-sm text-gray-400 mb-3">No savings goals yet</p>
              <button onClick={() => setShowAddSavings(true)}
                className="text-emerald-600 text-sm font-semibold">+ Create Goal</button>
            </div>
          ) : (
            <div className="space-y-3">
              {savings.map(goal => {
                const pct = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
                const daysLeft = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                return (
                  <div key={goal.id} className="bg-white rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${goal.color}15` }}>
                        {goal.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-gray-900">{goal.name}</p>
                        <p className="text-[10px] text-gray-400">{daysLeft} days left</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold" style={{ color: goal.color }}>{pct}%</p>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: goal.color }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {goal.currentAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} / {goal.targetAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </span>
                      <button onClick={() => { setAddToSavingsId(goal.id); setAddAmount(''); }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                        style={{ backgroundColor: `${goal.color}15`, color: goal.color }}>
                        + Add Money
                      </button>
                    </div>
                    <button onClick={async () => { await savingsAPI.delete(goal.id); await refresh(); }}
                      className="mt-2 text-[10px] text-red-400 font-medium">Delete goal</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ ADD TRANSACTION MODAL ══ */}
      {showAddTx && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center" onClick={() => setShowAddTx(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Log Transaction</h3>
              <button onClick={() => setShowAddTx(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type Toggle */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                <button onClick={() => { setTxType('expense'); setTxCategory('Food'); }}
                  className={`flex-1 text-xs font-semibold py-2.5 rounded-lg transition-all ${
                    txType === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'
                  }`}>Expense</button>
                <button onClick={() => { setTxType('income'); setTxCategory('Salary'); }}
                  className={`flex-1 text-xs font-semibold py-2.5 rounded-lg transition-all ${
                    txType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'
                  }`}>Income</button>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input type="number" value={txAmount} onChange={e => setTxAmount(e.target.value)}
                    className="w-full text-lg font-bold border border-gray-200 rounded-xl pl-7 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="0.00" inputMode="decimal" autoFocus />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {cats.map(cat => (
                    <button key={cat.name} onClick={() => setTxCategory(cat.name)}
                      className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                        txCategory === cat.name ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500'
                      }`}
                      style={txCategory === cat.name ? { backgroundColor: cat.color } : {}}>
                      <span className="text-sm">{cat.icon}</span> {cat.name}
                    </button>
                  ))}
                </div>
              </div>

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
                className={`w-full text-white text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-transform shadow-sm mt-2 ${
                  txType === 'expense' ? 'bg-red-500 shadow-red-200' : 'bg-emerald-600 shadow-emerald-200'
                }`}>
                Log {txType === 'expense' ? 'Expense' : 'Income'}
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
              <h3 className="text-lg font-bold text-gray-900">Set Budget</h3>
              <button onClick={() => setShowAddBudget(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button key={cat.name} onClick={() => setBudgetCategory(cat.name)}
                      className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                        budgetCategory === cat.name ? 'text-white' : 'bg-gray-100 text-gray-500'
                      }`} style={budgetCategory === cat.name ? { backgroundColor: cat.color } : {}}>
                      <span className="text-sm">{cat.icon}</span> {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Limit</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input type="number" value={budgetLimit} onChange={e => setBudgetLimit(e.target.value)}
                    className="w-full text-lg font-bold border border-gray-200 rounded-xl pl-7 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="500" inputMode="decimal" />
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
          <div className="relative bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">New Savings Goal</h3>
              <button onClick={() => setShowAddSavings(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Goal Name</label>
                <input value={savingsName} onChange={e => setSavingsName(e.target.value)}
                  className="w-full mt-1.5 text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="e.g. Vacation fund" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Icon</label>
                <div className="flex gap-2 mt-1.5">
                  {['🎯', '✈️', '🏠', '🚗', '💻', '📱', '🎓', '🏖️', '💍', '🎮'].map(icon => (
                    <button key={icon} onClick={() => setSavingsIcon(icon)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                        savingsIcon === icon ? 'bg-indigo-100 ring-2 ring-indigo-400 scale-110' : 'bg-gray-50'
                      }`}>{icon}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Amount</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input type="number" value={savingsTarget} onChange={e => setSavingsTarget(e.target.value)}
                    className="w-full text-lg font-bold border border-gray-200 rounded-xl pl-7 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="1000" inputMode="decimal" />
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
                      className={`w-8 h-8 rounded-full transition-all ${
                        savingsColor === c ? 'ring-2 ring-offset-2 scale-110' : ''
                      }`} style={{ backgroundColor: c }} />
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

      {/* ══ ADD MONEY TO SAVINGS MODAL ══ */}
      {addToSavingsId && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center" onClick={() => setAddToSavingsId(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Add Money</h3>
              <button onClick={() => setAddToSavingsId(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" value={addAmount} onChange={e => setAddAmount(e.target.value)}
                  className="w-full text-lg font-bold border border-gray-200 rounded-xl pl-7 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="50" inputMode="decimal" autoFocus />
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
