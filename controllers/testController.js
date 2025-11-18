import Test from '../models/Test.js';
import Purchase from '../models/Purchase.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

// @desc    Get all tests
// @route   GET /api/tests
// @access  Public
export const getTests = asyncHandler(async (req, res) => {
  const { category, search } = req.query;

  // Build query
  const query = { isActive: true };

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const tests = await Test.find(query).select('title description category durationMinutes price questions').lean();

  // Get purchased test IDs for authenticated users
  let purchasedTestIds = new Set();
  if (req.user) {
    const purchases = await Purchase.find({
      user: req.user._id,
      test: { $in: tests.map(t => t._id) },
      paymentStatus: 'success',
    }).select('test').lean();
    purchasedTestIds = new Set(purchases.map(p => p.test.toString()));
  }

  // Format response
  const formattedTests = tests.map((test) => ({
    id: test._id.toString(),
    title: test.title,
    description: test.description,
    category: test.category,
    durationMinutes: test.durationMinutes,
    price: test.price,
    totalQuestions: test.questions.length,
    isPurchased: purchasedTestIds.has(test._id.toString()),
  }));

  res.json({
    success: true,
    count: formattedTests.length,
    data: formattedTests,
  });
});

// @desc    Get single test
// @route   GET /api/tests/:id
// @access  Public
export const getTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);

  if (!test || !test.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Test not found',
    });
  }

  // Check if user has purchased (if authenticated)
  let isPurchased = false;
  if (req.user) {
    const purchase = await Purchase.findOne({
      user: req.user._id,
      test: test._id,
      paymentStatus: 'success',
    });
    isPurchased = !!purchase;
  }

  // Format questions (don't include correct answer for non-purchased tests)
  const questions = test.questions.map((q, index) => ({
    id: index.toString(),
    text: q.text,
    options: q.options,
    // Only include correct answer if user has purchased the test
    ...(isPurchased && { correctAnswer: q.correctAnswer }),
  }));

  const defaultHighlights = [
    {
      title: 'Comprehensive Question Bank',
      description: `${test.questions.length} carefully curated questions covering all important topics`,
      icon: '✅',
    },
    {
      title: 'Instant Results & Analytics',
      description: 'Get detailed performance analysis and track your progress',
      icon: '📊',
    },
    {
      title: 'Timed Practice',
      description: `Practice under real exam conditions with ${test.durationMinutes}-minute timer`,
      icon: '⏰',
    },
    {
      title: 'Detailed Solutions',
      description: 'Access comprehensive explanations for each question after submission',
      icon: '📖',
    },
  ];

  const defaultInstructions = [
    'Read each question carefully before selecting your answer.',
    'You can review and change your answers before submitting. Use the navigation to move between questions freely.',
    `The timer will start once you begin the test. You have ${test.durationMinutes} minutes to complete all ${test.questions.length} questions.`,
    'Make sure you have a stable internet connection throughout the test to avoid any interruptions.',
    'Once submitted, you cannot retake the test. Review your answers carefully before final submission.',
  ];

  res.json({
    success: true,
    data: {
      test: {
        id: test._id.toString(),
        title: test.title,
        description: test.description,
        category: test.category,
        durationMinutes: test.durationMinutes,
        price: test.price,
        totalQuestions: test.questions.length,
        isPurchased,
        highlights: test.highlights && test.highlights.length ? test.highlights : defaultHighlights,
        instructions: test.instructions && test.instructions.length ? test.instructions : defaultInstructions,
      },
      questions,
    },
  });
});

