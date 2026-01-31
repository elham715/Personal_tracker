import express from 'express';
import {
  getTrashedHabits,
  permanentlyDeleteHabit,
  emptyTrash
} from '../controllers/trashController.js';
import { protect } from '../middleware/auth.js';
import { idValidator } from '../middleware/validators.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getTrashedHabits);
router.delete('/empty', emptyTrash);
router.delete('/:id', idValidator, permanentlyDeleteHabit);

export default router;
