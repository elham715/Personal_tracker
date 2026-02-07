import Habit from '../models/Habit.js';

// @desc    Get all trashed habits
// @route   GET /api/trash
// @access  Private
export const getTrashedHabits = async (req, res, next) => {
  try {
    const habits = await Habit.findByUser(req.user.id, true);

    res.status(200).json({
      success: true,
      count: habits.length,
      data: habits,
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
    const habit = await Habit.findOneTrashed(req.params.id, req.user.id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found in trash',
      });
    }

    await Habit.deleteOne(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Habit permanently deleted',
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
    const deletedCount = await Habit.deleteManyTrashed(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Trash emptied successfully',
      deletedCount,
    });
  } catch (error) {
    next(error);
  }
};
