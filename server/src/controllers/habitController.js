import Habit from '../models/Habit.js';
import { calculateStreak, isFuture } from '../utils/calculateStreak.js';

// @desc    Get all habits for logged in user
// @route   GET /api/habits
// @access  Private
export const getHabits = async (req, res, next) => {
  try {
    const habits = await Habit.find({ 
      user: req.user._id, 
      isTrashed: false 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: habits.length,
      data: habits
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
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    res.status(200).json({
      success: true,
      data: habit
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
      user: req.user._id,
      name,
      icon: icon || '✨',
      category: category || 'Wellness',
      color: color || 'violet',
      target: target || 1,
      streak: 0,
      completedDates: []
    });

    res.status(201).json({
      success: true,
      message: 'Habit created successfully',
      data: habit
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

    let habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    // Update fields
    if (name !== undefined) habit.name = name;
    if (icon !== undefined) habit.icon = icon;
    if (category !== undefined) habit.category = category;
    if (color !== undefined) habit.color = color;
    if (target !== undefined) habit.target = target;

    await habit.save();

    res.status(200).json({
      success: true,
      message: 'Habit updated successfully',
      data: habit
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

    console.log('Toggle habit - ID:', req.params.id, 'User:', req.user._id, 'Date:', date);

    // Validate date is not in future
    if (isFuture(date)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete habits for future dates'
      });
    }

    let habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id,
      isTrashed: false
    });

    console.log('Habit found:', habit ? 'yes' : 'no');

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    // Toggle the date
    habit.toggleDate(date);

    // Recalculate streak
    habit.streak = calculateStreak(habit.completedDates);

    await habit.save();

    const wasCompleted = habit.completedDates.includes(date);

    res.status(200).json({
      success: true,
      message: wasCompleted ? 'Habit marked as complete' : 'Habit marked as incomplete',
      data: habit
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
    let habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    // Move to trash instead of deleting
    habit.moveToTrash();
    await habit.save();

    res.status(200).json({
      success: true,
      message: 'Habit moved to trash',
      data: habit
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
    let habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id,
      isTrashed: true
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found in trash'
      });
    }

    // Restore from trash (clears history)
    habit.restore();
    await habit.save();

    res.status(200).json({
      success: true,
      message: 'Habit restored successfully',
      data: habit
    });
  } catch (error) {
    next(error);
  }
};
