import express from 'express';
import {
  getHabits,
  getHabit,
  createHabit,
  updateHabit,
  toggleHabitCompletion,
  deleteHabit,
  restoreHabit
} from '../controllers/habitController.js';
import { protect } from '../middleware/auth.js';
import {
  createHabitValidator,
  updateHabitValidator,
  toggleHabitValidator,
  idValidator
} from '../middleware/validators.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getHabits)
  .post(createHabitValidator, createHabit);

router.route('/:id')
  .get(idValidator, getHabit)
  .put([idValidator, updateHabitValidator], updateHabit)
  .delete(idValidator, deleteHabit);

router.patch('/:id/toggle', [idValidator, toggleHabitValidator], toggleHabitCompletion);
router.patch('/:id/restore', idValidator, restoreHabit);

export default router;
