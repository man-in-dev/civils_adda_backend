import express from 'express';
import { getTests, getTest } from '../controllers/testController.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = express.Router();

router.get('/', optionalAuth, getTests);
router.get('/:id', optionalAuth, getTest);

export default router;

