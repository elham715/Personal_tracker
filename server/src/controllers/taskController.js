import Task from '../models/Task.js';
import { formatDate } from '../utils/calculateStreak.js';

// @desc    Get all tasks for logged in user
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res, next) => {
  try {
    const { date, completed, scope } = req.query;

    const filters = {};
    if (date) filters.date = date;
    if (completed !== undefined) filters.completed = completed === 'true';
    if (scope) filters.scope = scope;

    const tasks = await Task.findByUser(req.user.id, filters);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
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

    const tasks = await Task.findByDate(req.user.id, date);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
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
    const task = await Task.findOne(req.params.id, req.user.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      data: task,
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
    console.log('Create task - Body:', req.body, 'User:', req.user.id);
    const { text, priority, isHabit, habitId, createdDate, date, scope } = req.body;

    const task = await Task.create({
      userId: req.user.id,
      text,
      priority: priority || 'medium',
      isHabit: isHabit || false,
      habitId: habitId || null,
      createdDate: date || createdDate || formatDate(),
      scope: scope || 'daily',
    });

    console.log('Task created:', task.id);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
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

    const task = await Task.update(req.params.id, req.user.id, {
      text,
      priority,
      completed,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
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
    const task = await Task.toggle(req.params.id, req.user.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      message: task.completed ? 'Task marked as complete' : 'Task marked as incomplete',
      data: task,
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
    const deleted = await Task.deleteOne(req.params.id, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
