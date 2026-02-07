import { body, param, query, validationResult } from 'express-validator';

// Validation middleware
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validators
export const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate
];

// Habit validators
export const createHabitValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Habit name is required')
    .isLength({ max: 100 }).withMessage('Habit name cannot exceed 100 characters'),
  body('icon')
    .optional()
    .isLength({ max: 10 }).withMessage('Icon cannot exceed 10 characters'),
  body('category')
    .optional()
    .isIn(['Health', 'Fitness', 'Learning', 'Productivity', 'Mindfulness', 'Creativity', 'Social', 'Finance', 'Other'])
    .withMessage('Invalid category'),
  body('color')
    .optional()
    .isIn(['purple', 'blue', 'green', 'orange', 'pink', 'cyan'])
    .withMessage('Invalid color'),
  body('target')
    .optional()
    .isInt({ min: 1 }).withMessage('Target must be at least 1'),
  validate
];

export const updateHabitValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Habit name cannot exceed 100 characters'),
  body('icon')
    .optional()
    .isLength({ max: 10 }).withMessage('Icon cannot exceed 10 characters'),
  body('category')
    .optional()
    .isIn(['Health', 'Fitness', 'Learning', 'Productivity', 'Mindfulness', 'Creativity', 'Social', 'Finance', 'Other'])
    .withMessage('Invalid category'),
  body('color')
    .optional()
    .isIn(['purple', 'blue', 'green', 'orange', 'pink', 'cyan'])
    .withMessage('Invalid color'),
  validate
];

export const toggleHabitValidator = [
  body('date')
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
  validate
];

// Task validators
export const createTaskValidator = [
  body('text')
    .trim()
    .notEmpty().withMessage('Task text is required')
    .isLength({ max: 500 }).withMessage('Task text cannot exceed 500 characters'),
  body('priority')
    .optional()
    .isIn(['high', 'medium', 'low']).withMessage('Invalid priority'),
  body('createdDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
  validate
];

export const updateTaskValidator = [
  body('text')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Task text cannot exceed 500 characters'),
  body('priority')
    .optional()
    .isIn(['high', 'medium', 'low']).withMessage('Invalid priority'),
  body('completed')
    .optional()
    .isBoolean().withMessage('Completed must be a boolean'),
  validate
];

// ID validator
export const idValidator = [
  param('id')
    .isUUID().withMessage('Invalid ID format'),
  validate
];

// Date validator
export const dateValidator = [
  param('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
  validate
];
