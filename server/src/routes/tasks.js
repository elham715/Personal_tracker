import express from 'express';
import {
  getTasks,
  getTask,
  getTasksByDate,
  createTask,
  updateTask,
  toggleTaskCompletion,
  deleteTask
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';
import {
  createTaskValidator,
  updateTaskValidator,
  idValidator,
  dateValidator
} from '../middleware/validators.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTaskValidator, createTask);

router.get('/date/:date', dateValidator, getTasksByDate);

router.route('/:id')
  .get(idValidator, getTask)
  .put([idValidator, updateTaskValidator], updateTask)
  .delete(idValidator, deleteTask);

router.patch('/:id/toggle', idValidator, toggleTaskCompletion);

export default router;
