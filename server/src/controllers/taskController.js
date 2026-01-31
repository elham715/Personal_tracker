import Task from '../models/Task.js';
import { formatDate } from '../utils/calculateStreak.js';

// @desc    Get all tasks for logged in user
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res, next) => {
  try {
    const { date, completed } = req.query;

    const query = { user: req.user._id };

    // Filter by date if provided
    if (date) {
      query.createdDate = date;
    }

    // Filter by completion status if provided
    if (completed !== undefined) {
      query.completed = completed === 'true';
    }

    const tasks = await Task.find(query)
      .populate('habitId', 'name icon')
      .sort({ createdDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks for specific date
// @route   GET /api/tasks/date/:date
// @access  Private
export const getTasksByDate = async (req, res, next) => {
  try {
    const { date } = req.params;

    const tasks = await Task.find({
      user: req.user._id,
      createdDate: date
    })
      .populate('habitId', 'name icon')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
export const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('habitId', 'name icon');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res, next) => {
  try {
    console.log('Create task - Body:', req.body, 'User:', req.user._id);
    const { text, priority, isHabit, habitId, createdDate, date } = req.body;

    const task = await Task.create({
      user: req.user._id,
      text,
      priority: priority || 'medium',
      isHabit: isHabit || false,
      habitId: habitId || null,
      createdDate: date || createdDate || formatDate(),
      completed: false
    });

    console.log('Task created:', task._id);

    // Populate habit if referenced
    if (task.habitId) {
      await task.populate('habitId', 'name icon');
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res, next) => {
  try {
    const { text, priority, completed } = req.body;

    let task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update fields
    if (text !== undefined) task.text = text;
    if (priority !== undefined) task.priority = priority;
    if (completed !== undefined) {
      task.completed = completed;
      task.completedAt = completed ? new Date() : null;
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle task completion
// @route   PATCH /api/tasks/:id/toggle
// @access  Private
export const toggleTaskCompletion = async (req, res, next) => {
  try {
    let task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.toggle();
    await task.save();

    res.status(200).json({
      success: true,
      message: task.completed ? 'Task marked as complete' : 'Task marked as incomplete',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
