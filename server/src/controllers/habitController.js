import Habit from '../models/Habit.js';
import { calculateStreak, isFuture } from '../utils/calculateStreak.js';

// @desc    Get all habits for logged in user
// @route   GET /api/habits
// @access  Private
export const getHabits = async (req, res, next) => {
  try {
    const habits = await Habit.findByUser(req.user.id, false);

    res.status(200).json({
      success: true,
      count: habits.length,
      data: habits,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single habit
// @route   GET /api/habits/:id
// @access  Private
export const getHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne(req.params.id, req.user.id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    res.status(200).json({
      success: true,
      data: habit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new habit
// @route   POST /api/habits
// @access  Private
export const createHabit = async (req, res, next) => {
  try {
    const { name, icon, category, color, target } = req.body;

    const habit = await Habit.create({
      userId: req.user.id,
      name,
      icon: icon || '✨',
      category: category || 'Health',
      color: color || 'purple',
      target: target || 1,
    });

    res.status(201).json({
      success: true,
      message: 'Habit created successfully',
      data: habit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update habit
// @route   PUT /api/habits/:id
// @access  Private
export const updateHabit = async (req, res, next) => {
  try {
    const { name, icon, category, color, target } = req.body;

    // Check habit exists
    const existing = await Habit.findOne(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    const habit = await Habit.update(req.params.id, req.user.id, {
      name,
      icon,
      category,
      color,
      target,
    });

    res.status(200).json({
      success: true,
      message: 'Habit updated successfully',
      data: habit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle habit completion for a date
// @route   PATCH /api/habits/:id/toggle
// @access  Private
export const toggleHabitCompletion = async (req, res, next) => {
  try {
    const { date } = req.body;

    console.log('Toggle habit - ID:', req.params.id, 'User:', req.user.id, 'Date:', date);

    // Validate date is not in future
    if (isFuture(date)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete habits for future dates',
      });
    }

    // Check habit exists and is active
    const existing = await Habit.findOneActive(req.params.id, req.user.id);

    console.log('Habit found:', existing ? 'yes' : 'no');

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    // Toggle the date
    let habit = await Habit.toggleDate(req.params.id, date);

    // Recalculate streak
    const streak = calculateStreak(habit.completedDates);
    habit = await Habit.updateStreak(req.params.id, streak);

    const wasCompleted = habit.completedDates.includes(date);

    res.status(200).json({
      success: true,
      message: wasCompleted ? 'Habit marked as complete' : 'Habit marked as incomplete',
      data: habit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete habit (move to trash)
// @route   DELETE /api/habits/:id
// @access  Private
export const deleteHabit = async (req, res, next) => {
  try {
    const existing = await Habit.findOne(req.params.id, req.user.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    const habit = await Habit.moveToTrash(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Habit moved to trash',
      data: habit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore habit from trash
// @route   PATCH /api/habits/:id/restore
// @access  Private
export const restoreHabit = async (req, res, next) => {
  try {
    const existing = await Habit.findOneTrashed(req.params.id, req.user.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found in trash',
      });
    }

    const habit = await Habit.restore(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Habit restored successfully',
      data: habit,
    });
  } catch (error) {
    next(error);
  }
};
