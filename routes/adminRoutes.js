import express from 'express';
import {
  createTest,
  updateTest,
  deleteTest,
  getAllTests,
  getTest,
  getStats,
  getAllAttempts,
} from '../controllers/adminController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// All admin routes require admin authentication (JWT + isAdmin check)
router.use(adminAuth);

// Test management routes
router.post('/tests', createTest);
router.get('/tests', getAllTests);
router.get('/tests/:id', getTest);
router.put('/tests/:id', updateTest);
router.delete('/tests/:id', deleteTest);

// Statistics and analytics
router.get('/stats', getStats);

// Attempts management
router.get('/attempts', getAllAttempts);

export default router;

