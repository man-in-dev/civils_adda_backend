import express from 'express';
import {
  register,
  login,
  getMe,
  getGoogleAuthUrl,
  googleCallback,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateRequest, registerValidation, loginValidation } from '../validations/authValidation.js';

const router = express.Router();

router.post('/register', validateRequest(registerValidation), register);
router.post('/login', validateRequest(loginValidation), login);
router.get('/me', protect, getMe);
router.get('/google', getGoogleAuthUrl);
router.get('/google/callback', googleCallback);

export default router;