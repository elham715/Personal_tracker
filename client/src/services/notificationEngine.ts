/**
 * Notification Engine
 *
 * Generates contextual, smart prompts based on user activity:
 * - Morning habit reminders
 * - Task deadline nudges
 * - Memory review prompts
 * - Money logging reminders
 * - Streak celebrations & warnings
 * - Milestone achievements
 */
import { v4 as uuidv4 } from 'uuid';
import { db } from './offlineDb';
import { AppNotification, Habit, Task } from '@/types';
import { formatDate } from '@/utils/helpers';
import { transactionAPI, moneyProfileAPI, formatMoney } from './moneyApi';

// ── Generate smart notifications based on current state ──
export async function generateNotifications(
  habits: Habit[],
  tasks: Task[],
): Promise<AppNotification[]> {
  const notifs: AppNotification[] = [];
  const today = formatDate();
  const hour = new Date().getHours();

  // 1. Habit nudges
  const unfinishedHabits = habits.filter(h => !h.completedDates?.includes(today));
  if (unfinishedHabits.length > 0 && hour >= 9) {
    if (hour < 12) {
      notifs.push(makeNotif('habit', '🌅 Morning Check-in',
        `${unfinishedHabits.length} habit${unfinishedHabits.length > 1 ? 's' : ''} waiting — start your day strong!`,
        '☀️', 'text-amber-600', '/'));
    } else if (hour >= 18) {
      notifs.push(makeNotif('habit', '🌙 Evening Review',
        `${unfinishedHabits.length} habit${unfinishedHabits.length > 1 ? 's' : ''} left — wrap up before bed!`,
        '🌙', 'text-indigo-600', '/'));
    }
  }

  // All habits done today!
  if (habits.length > 0 && unfinishedHabits.length === 0) {
    notifs.push(makeNotif('milestone', '🎉 All Habits Done!',
      'You completed every habit today. Keep the streak alive!',
      '🏆', 'text-amber-600', '/'));
  }

  // 2. Streak alerts
  for (const h of habits) {
    if ((h.streak || 0) > 0 && !h.completedDates?.includes(today) && hour >= 17) {
      notifs.push(makeNotif('streak', `🔥 ${h.streak}-day streak at risk!`,
        `"${h.name}" — don't break the chain!`,
        '🔥', 'text-orange-600', '/'));
      break; // only show one streak warning
    }
    // Milestone celebrations
    if ([7, 14, 30, 50, 100].includes(h.streak || 0)) {
      notifs.push(makeNotif('milestone', `🏆 ${h.streak}-Day Streak!`,
        `"${h.name}" — incredible consistency!`,
        '🏆', 'text-amber-600', '/'));
    }
  }

  // 3. Task reminders
  const todayTasks = tasks.filter(t => t.date === today && !t.isHabit && !t.completed);
  const highPriority = todayTasks.filter(t => t.priority === 'high');
  if (highPriority.length > 0) {
    notifs.push(makeNotif('task', '🔴 Urgent Tasks',
      `${highPriority.length} urgent task${highPriority.length > 1 ? 's' : ''} need attention`,
      '🚨', 'text-rose-600', '/tasks'));
  }

  // 4. Brain training nudge
  try {
    const todayResults = await db.gameResults.where('date').equals(today).count();
    if (todayResults < 4 && hour >= 9) {
      notifs.push(makeNotif('memory', '🧠 Train Your Brain',
        `${4 - todayResults} game${4 - todayResults > 1 ? 's' : ''} left today — build your memory!`,
        '🧠', 'text-purple-600', '/memory'));
    }
  } catch {}

  // 4b. Daily Recall journal nudge (evening)
  try {
    const todayRecall = await db.dailyRecalls.get(today);
    if (!todayRecall && hour >= 20 && hour <= 23) {
      notifs.push(makeNotif('memory', '🌙 Daily Recall Time',
        'Recall your day before bed — strengthen your memory while you sleep!',
        '📝', 'text-violet-600', '/memory'));
    }
  } catch {}

  // 5. Money system — comprehensive alerts
  try {
    const todayTxCount = await db.transactions.filter(t => t.date === today).count();

    // 5a. No expenses logged nudge
    if (todayTxCount === 0 && hour >= 12) {
      notifs.push(makeNotif('money', '💰 Log Your Spending',
        'No expenses logged today — keep your logging streak going!',
        '💰', 'text-emerald-600', '/money'));
    }

    // 5b. Spending velocity warning
    const vel = await transactionAPI.getSpendingVelocity(3);
    if (vel.trend === 'fast' && vel.total > 0) {
      notifs.push(makeNotif('money', '⚡ Spending Fast!',
        `${formatMoney(vel.total)} in ${vel.days} days (${formatMoney(vel.avg)}/day avg). Slow down!`,
        '⚡', 'text-red-600', '/money'));
    }

    // 5c. Daily budget exceeded warning
    const daily = await transactionAPI.getDailyRemaining();
    if (daily.remaining < 0) {
      notifs.push(makeNotif('money', '🚫 Over Daily Budget!',
        `Spent ${formatMoney(daily.spent)} of ${formatMoney(daily.budget)} today. Pause non-essentials!`,
        '🚫', 'text-red-600', '/money'));
    } else if (daily.pct >= 80 && daily.pct < 100 && todayTxCount > 0) {
      notifs.push(makeNotif('money', '⚠️ Budget Almost Gone',
        `Only ${formatMoney(daily.remaining)} left today. Be mindful!`,
        '⚠️', 'text-amber-600', '/money'));
    }

    // 5d. No-spend day celebration
    const todayExpenses = await db.transactions.filter(t => t.date === today && t.type === 'expense').count();
    if (todayExpenses === 0 && hour >= 20) {
      notifs.push(makeNotif('milestone', '🛡️ No-Spend Day!',
        'Zero expenses today — amazing discipline! +15 XP',
        '🛡️', 'text-emerald-600', '/money'));
    }

    // 5e. Challenge progress
    const profile = await moneyProfileAPI.get();
    const activeChallenges = profile.activeChallenges.filter((c: any) => !c.completed);
    for (const ch of activeChallenges) {
      const pct = ch.target > 0 ? Math.round((ch.progress / ch.target) * 100) : 0;
      if (pct >= 75 && pct < 100) {
        notifs.push(makeNotif('money', `🏆 Almost There!`,
          `"${ch.title}" — ${ch.progress}/${ch.target} (${pct}%). Keep pushing!`,
          '🏆', 'text-amber-600', '/money'));
        break;
      }
    }
  } catch {}

  // 6. General encouragement (if nothing else)
  if (notifs.length === 0 && hour >= 8 && hour <= 22) {
    const msgs = [
      { t: '💪 Stay Focused', m: 'Small progress is still progress. Keep going!' },
      { t: '🎯 One Step at a Time', m: 'Pick one thing and give it your full attention.' },
      { t: '✨ You\'re On Track', m: 'Consistency beats perfection. Show up today.' },
    ];
    const pick = msgs[new Date().getDate() % msgs.length];
    notifs.push(makeNotif('nudge', pick.t, pick.m, '✨', 'text-indigo-600'));
  }

  return notifs;
}

function makeNotif(
  type: AppNotification['type'],
  title: string,
  message: string,
  icon: string,
  color: string,
  action?: string,
): AppNotification {
  return {
    id: uuidv4(),
    type,
    title,
    message,
    icon,
    color,
    action,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

// ── Persist / read notifications ──
export async function saveNotifications(notifs: AppNotification[]) {
  // Keep only the latest 30
  await db.notifications.clear();
  await db.notifications.bulkPut(notifs.slice(0, 30));
}

export async function getStoredNotifications(): Promise<AppNotification[]> {
  return db.notifications.orderBy('createdAt').reverse().toArray();
}

export async function markRead(id: string) {
  await db.notifications.update(id, { read: true });
}

export async function clearNotifications() {
  await db.notifications.clear();
}
