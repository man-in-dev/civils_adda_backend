import express from 'express';
import {
  createAttempt,
  getAttempt,
  updateAttempt,
  startAttempt,
  submitAttempt,
  getUserAttempts,
  getLeaderboard,
} from '../controllers/attemptController.js';
import { protect } from '../middleware/auth.js';
import {
  validateRequest,
  createAttemptValidation,
  submitAttemptValidation,
} from '../validations/testValidation.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', validateRequest(createAttemptValidation), createAttempt);
router.get('/', getUserAttempts);
router.get('/leaderboard', getLeaderboard);
router.get('/:id', getAttempt);
router.put('/:id', updateAttempt);
router.post('/:id/start', startAttempt);
router.post('/:id/submit', submitAttempt);

export default router;

