import Habit from '../models/Habit.js';

// @desc    Get all trashed habits
// @route   GET /api/trash
// @access  Private
export const getTrashedHabits = async (req, res, next) => {
  try {
    const habits = await Habit.find({
      user: req.user._id,
      isTrashed: true
    }).sort({ trashedAt: -1 });

    res.status(200).json({
      success: true,
      count: habits.length,
      data: habits
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete a habit from trash
// @route   DELETE /api/trash/:id
// @access  Private
export const permanentlyDeleteHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({
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

    await habit.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Habit permanently deleted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Empty trash (delete all trashed habits)
// @route   DELETE /api/trash/empty
// @access  Private
export const emptyTrash = async (req, res, next) => {
  try {
    const result = await Habit.deleteMany({
      user: req.user._id,
      isTrashed: true
    });

    res.status(200).json({
      success: true,
      message: `Trash emptied successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};
