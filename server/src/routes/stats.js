import express from 'express';
import { getStats, getDashboardStats } from '../controllers/statsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getStats);
router.get('/dashboard', getDashboardStats);

export default router;
