import express from 'express';
import { getPerformance } from '../controllers/performanceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/', getPerformance);

export default router;

