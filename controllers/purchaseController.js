import dotenv from 'dotenv';
dotenv.config();

import Purchase from '../models/Purchase.js';
import Test from '../models/Test.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

// Cashfree API configuration
const CASHFREE_BASE_URL = process.env.CASHFREE_ENVIRONMENT === 'production'
  ? 'https://api.cashfree.com'
  : 'https://sandbox.cashfree.com';
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

// Helper function to make Cashfree API requests
const cashfreeRequest = async (endpoint, method = 'GET', body = null) => {
  // Validate credentials
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    throw new Error('Cashfree credentials are not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in your environment variables.');
  }

  const url = `${CASHFREE_BASE_URL}${endpoint}`;
  const headers = {
    'x-client-id': CASHFREE_APP_ID,
    'x-client-secret': CASHFREE_SECRET_KEY,
    'x-api-version': '2023-08-01',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const options = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      // Log detailed error for debugging
      console.error('Cashfree API Error:', {
        status: response.status,
        statusText: response.statusText,
        endpoint: url,
        error: data,
        hasCredentials: !!(CASHFREE_APP_ID && CASHFREE_SECRET_KEY),
        environment: process.env.CASHFREE_ENVIRONMENT,
      });

      // Provide more specific error messages
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Cashfree authentication failed. Please check your CASHFREE_APP_ID and CASHFREE_SECRET_KEY. Make sure you're using ${process.env.CASHFREE_ENVIRONMENT || 'sandbox'} credentials.`);
      }

      throw new Error(data.message || data.error?.message || `Cashfree API error: ${response.status} ${response.statusText}`);
    }

    return data;
  } catch (error) {
    // Re-throw with more context if it's not already an Error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Cashfree API request failed: ${error}`);
  }
};

// @desc    Create payment order for tests
// @route   POST /api/purchases/create-order
// @access  Private
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { testIds } = req.body;
  const userId = req.user._id;

  if (!testIds || !Array.isArray(testIds) || testIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide test IDs',
    });
  }

  // Validate all tests exist
  const tests = await Test.find({
    _id: { $in: testIds },
    isActive: true,
  });

  if (tests.length !== testIds.length) {
    return res.status(400).json({
      success: false,
      message: 'One or more tests not found',
    });
  }

  // Check for existing successful purchases
  const existingPurchases = await Purchase.find({
    user: userId,
    test: { $in: testIds },
    paymentStatus: 'success',
  });

  const existingTestIds = existingPurchases.map((p) => p.test.toString());
  const newTestIds = testIds.filter((id) => !existingTestIds.includes(id));

  if (newTestIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'All selected tests are already purchased',
    });
  }

  // Calculate total amount
  const newTests = tests.filter((test) => newTestIds.includes(test._id.toString()));
  const totalAmount = newTests.reduce((sum, test) => sum + (test.price || 0), 0);

  // If all tests are free, create purchases directly
  if (totalAmount === 0) {
    const purchases = await Purchase.insertMany(
      newTestIds.map((testId) => ({
        user: userId,
        test: testId,
        amount: 0,
        paymentStatus: 'success',
      }))
    );

    return res.status(201).json({
      success: true,
      count: purchases.length,
      message: `Successfully purchased ${purchases.length} test(s)`,
      data: purchases.map((p) => ({
        id: p._id.toString(),
        testId: p.test.toString(),
        purchasedAt: p.purchasedAt,
      })),
    });
  }

  // Get user details
  const user = await User.findById(userId);

  // Generate unique order ID
  const orderId = `ORDER_${Date.now()}_${userId.toString().slice(-6)}`;

  // Create payment session with Cashfree
  try {
    // Log configuration for debugging (without exposing secrets)
    console.log('Cashfree Configuration:', {
      baseUrl: CASHFREE_BASE_URL,
      hasAppId: !!CASHFREE_APP_ID,
      hasSecretKey: !!CASHFREE_SECRET_KEY,
      environment: process.env.CASHFREE_ENVIRONMENT,
      appIdPrefix: CASHFREE_APP_ID ? CASHFREE_APP_ID.substring(0, 8) + '...' : 'NOT SET',
    });

    const orderRequest = {
      order_id: orderId,
      order_amount: totalAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: userId.toString(),
        customer_name: user.name,
        customer_email: user.email,
        customer_phone: user.phone || '9999999999',
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?order_id={order_id}`,
        notify_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/purchases/payment-webhook`,
      },
      order_note: `Purchase of ${newTestIds.length} mock test(s)`,
    };

    console.log('Creating Cashfree order:', {
      orderId,
      amount: totalAmount,
      endpoint: `${CASHFREE_BASE_URL}/pg/orders`,
    });

    // Create order and get payment session
    // Cashfree API endpoint: /pg/orders
    const orderResponse = await cashfreeRequest('/pg/orders', 'POST', orderRequest);

    // Cashfree returns payment_session_id in the response
    const paymentSessionId = orderResponse.payment_session_id || orderResponse.paymentSessionId;

    if (!paymentSessionId) {
      console.error('Cashfree order response:', orderResponse);
      throw new Error('Failed to create payment session. Payment session ID not found in response.');
    }

    // Create pending purchase records
    const purchases = await Purchase.insertMany(
      newTestIds.map((testId) => {
        const test = tests.find((t) => t._id.toString() === testId);
        return {
          user: userId,
          test: testId,
          orderId: orderId,
          amount: test.price || 0,
          paymentStatus: 'pending',
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        paymentSessionId: paymentSessionId,
        orderId: orderId,
        amount: totalAmount,
        testIds: newTestIds,
      },
    });
  } catch (error) {
    console.error('Cashfree payment order creation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order',
    });
  }
});

// @desc    Verify payment and complete purchase
// @route   POST /api/purchases/verify-payment
// @access  Private
export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const userId = req.user._id;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: 'Order ID is required',
    });
  }

  // Find pending purchases for this order
  const purchases = await Purchase.find({
    orderId: orderId,
    user: userId,
    paymentStatus: 'pending',
  });

  if (purchases.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Order not found or already processed',
    });
  }

  try {
    // Verify payment with Cashfree
    const orderResponse = await cashfreeRequest(`/pg/orders/${orderId}`, 'GET');

    if (!orderResponse || !orderResponse.order_status) {
      throw new Error('Failed to verify payment');
    }

    const paymentStatus = orderResponse.order_status.toLowerCase();
    const paymentId = orderResponse.payment_details?.payment_id || null;

    if (paymentStatus === 'paid') {
      // Update purchases to success
      await Purchase.updateMany(
        { orderId: orderId, user: userId },
        {
          paymentStatus: 'success',
          paymentId: paymentId,
          purchasedAt: new Date(),
        }
      );

      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          orderId: orderId,
          paymentId: paymentId,
          status: 'success',
        },
      });
    } else {
      // Update purchases to failed
      await Purchase.updateMany(
        { orderId: orderId, user: userId },
        {
          paymentStatus: 'failed',
          paymentId: paymentId,
        }
      );

      return res.status(400).json({
        success: false,
        message: 'Payment not completed',
        data: {
          orderId: orderId,
          status: paymentStatus,
        },
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment',
    });
  }
});

// @desc    Payment webhook handler
// @route   POST /api/purchases/payment-webhook
// @access  Public (Cashfree will call this)
export const paymentWebhook = asyncHandler(async (req, res) => {
  const { orderId, orderStatus, paymentId } = req.body;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: 'Order ID is required',
    });
  }

  try {
    // Find purchases for this order
    const purchases = await Purchase.find({
      orderId: orderId,
      paymentStatus: 'pending',
    });

    if (purchases.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Order already processed',
      });
    }

    const userId = purchases[0].user;

    if (orderStatus === 'PAID' || orderStatus === 'paid') {
      // Update purchases to success
      await Purchase.updateMany(
        { orderId: orderId },
        {
          paymentStatus: 'success',
          paymentId: paymentId,
          purchasedAt: new Date(),
        }
      );
    } else if (orderStatus === 'FAILED' || orderStatus === 'failed') {
      // Update purchases to failed
      await Purchase.updateMany(
        { orderId: orderId },
        {
          paymentStatus: 'failed',
          paymentId: paymentId,
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
});

// @desc    Purchase tests (legacy - for free tests only)
// @route   POST /api/purchases
// @access  Private
export const purchaseTests = asyncHandler(async (req, res) => {
  const { testIds } = req.body;
  const userId = req.user._id;

  // Validate all tests exist
  const tests = await Test.find({
    _id: { $in: testIds },
    isActive: true,
  });

  if (tests.length !== testIds.length) {
    return res.status(400).json({
      success: false,
      message: 'One or more tests not found',
    });
  }

  // Check if all tests are free
  const totalAmount = tests.reduce((sum, test) => sum + (test.price || 0), 0);
  if (totalAmount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Please use payment gateway for paid tests',
    });
  }

  // Check for existing purchases
  const existingPurchases = await Purchase.find({
    user: userId,
    test: { $in: testIds },
    paymentStatus: 'success',
  });

  const existingTestIds = existingPurchases.map((p) => p.test.toString());
  const newTestIds = testIds.filter((id) => !existingTestIds.includes(id));

  if (newTestIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'All selected tests are already purchased',
    });
  }

  // Create purchases
  const purchases = await Purchase.insertMany(
    newTestIds.map((testId) => ({
      user: userId,
      test: testId,
      amount: 0,
      paymentStatus: 'success',
    }))
  );

  res.status(201).json({
    success: true,
    count: purchases.length,
    message: `Successfully purchased ${purchases.length} test(s)`,
    data: purchases.map((p) => ({
      id: p._id.toString(),
      testId: p.test.toString(),
      purchasedAt: p.purchasedAt,
    })),
  });
});

// @desc    Get user's purchased tests
// @route   GET /api/purchases
// @access  Private
export const getPurchasedTests = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const purchases = await Purchase.find({
    user: userId,
    paymentStatus: 'success'
  })
    .populate('test', 'title description category durationMinutes price questions')
    .sort('-purchasedAt')
    .lean();

  const purchasedTests = purchases
    .filter((purchase) => purchase.test !== null && purchase.test !== undefined)
    .map((purchase) => {
      const test = purchase.test;
      return {
        id: test._id.toString(),
        title: test.title,
        description: test.description,
        category: test.category,
        durationMinutes: test.durationMinutes,
        price: test.price,
        totalQuestions: test.questions?.length || 0,
        purchasedAt: purchase.purchasedAt,
      };
    });

  res.json({
    success: true,
    count: purchasedTests.length,
    data: purchasedTests,
  });
});

// @desc    Check if test is purchased
// @route   GET /api/purchases/check/:testId
// @access  Private
export const checkPurchase = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const testId = req.params.testId;

  const purchase = await Purchase.findOne({
    user: userId,
    test: testId,
    paymentStatus: 'success',
  });

  res.json({
    success: true,
    data: {
      isPurchased: !!purchase,
    },
  });
});

