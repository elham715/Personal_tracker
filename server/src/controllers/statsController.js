import Habit from '../models/Habit.js';
import Task from '../models/Task.js';
import { formatDate } from '../utils/calculateStreak.js';

// @desc    Get user statistics
// @route   GET /api/stats
// @access  Private
export const getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = formatDate();

    // Get all active habits
    const habits = await Habit.findByUser(userId, false);

    // Get all tasks
    const allTasks = await Task.findByUser(userId);
    const todayTasks = await Task.findByUser(userId, { date: today });

    // Calculate statistics
    const stats = {
      // Habit stats
      totalHabits: habits.length,
      habitsCompletedToday: habits.filter((h) => h.completedDates.includes(today)).length,
      totalCheckIns: habits.reduce((sum, h) => sum + h.completedDates.length, 0),
      bestStreak: habits.reduce((max, h) => Math.max(max, h.streak), 0),
      averageStreak:
        habits.length > 0
          ? Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / habits.length)
          : 0,

      // Task stats
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter((t) => t.completed).length,
      pendingTasks: allTasks.filter((t) => !t.completed).length,
      todayTasks: todayTasks.length,
      todayCompletedTasks: todayTasks.filter((t) => t.completed).length,

      // Activity stats
      activeDays: new Set(habits.flatMap((h) => h.completedDates)).size,

      // Category breakdown
      categoryBreakdown: habits.reduce((acc, habit) => {
        acc[habit.category] = (acc[habit.category] || 0) + 1;
        return acc;
      }, {}),

      // Recent activity (last 7 days)
      recentActivity: (() => {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = formatDate(date);
          const count = habits.filter((h) => h.completedDates.includes(dateStr)).length;
          last7Days.push({ date: dateStr, completions: count });
        }
        return last7Days;
      })(),

      // Longest streaks
      topStreaks: habits
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 5)
        .map((h) => ({
          habitId: h.id,
          name: h.name,
          icon: h.icon,
          streak: h.streak,
        })),
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard summary
// @route   GET /api/stats/dashboard
// @access  Private
export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = formatDate();

    const habits = await Habit.findByUser(userId, false);
    const todayTasks = await Task.findByUser(userId, { date: today });

    const summary = {
      date: today,
      habitsTotal: habits.length,
      habitsCompleted: habits.filter((h) => h.completedDates.includes(today)).length,
      tasksTotal: todayTasks.length,
      tasksCompleted: todayTasks.filter((t) => t.completed).length,
      bestStreak: habits.reduce((max, h) => Math.max(max, h.streak), 0),
      totalCheckIns: habits.reduce((sum, h) => sum + h.completedDates.length, 0),
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
