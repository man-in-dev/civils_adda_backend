import express from 'express';
import {
  purchaseTests,
  getPurchasedTests,
  checkPurchase,
  createPaymentOrder,
  verifyPayment,
  paymentWebhook,
} from '../controllers/purchaseController.js';
import { protect } from '../middleware/auth.js';
import { validateRequest, checkoutValidation } from '../validations/testValidation.js';

const router = express.Router();

// Payment webhook (public route - Cashfree will call this)
router.post('/payment-webhook', paymentWebhook);

// All other routes require authentication
router.use(protect);

router.post('/create-order', validateRequest(checkoutValidation), createPaymentOrder);
router.post('/verify-payment', verifyPayment);
router.post('/', validateRequest(checkoutValidation), purchaseTests);
router.get('/', getPurchasedTests);
router.get('/check/:testId', checkPurchase);

export default router;

