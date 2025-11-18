import Test from '../models/Test.js';
import Attempt from '../models/Attempt.js';
import User from '../models/User.js';
import Purchase from '../models/Purchase.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

// @desc    Create a new test
// @route   POST /api/admin/tests
// @access  Admin only
export const createTest = asyncHandler(async (req, res) => {
  const { testId, title, description, category, durationMinutes, price, questions, highlights, instructions } = req.body;

  // Validation
  if (!testId || !title || !questions || questions.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Test ID, title, and questions are required',
    });
  }

  // Check if testId already exists
  const existingTest = await Test.findOne({ testId });
  if (existingTest) {
    return res.status(400).json({
      success: false,
      message: 'Test with this ID already exists',
    });
  }

  // Validate questions
  for (const q of questions) {
    if (!q.text || !q.options || q.options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Each question must have text and at least 2 options',
      });
    }
    if (q.answer === undefined || q.answer < 0 || q.answer >= q.options.length) {
      return res.status(400).json({
        success: false,
        message: 'Each question must have a valid correct answer index',
      });
    }
  }

  // Create test
  const sanitizedHighlights = Array.isArray(highlights)
    ? highlights
      .filter((item) => item && item.title && item.description)
      .map((item) => ({
        icon: item.icon || '',
        title: item.title,
        description: item.description,
      }))
    : undefined;

  const sanitizedInstructions = Array.isArray(instructions)
    ? instructions.filter((item) => typeof item === 'string' && item.trim().length > 0)
    : undefined;

  const test = await Test.create({
    testId,
    title,
    description,
    category,
    durationMinutes,
    price,
    highlights: sanitizedHighlights,
    instructions: sanitizedInstructions,
    questions: questions.map((q) => ({
      text: q.text,
      options: q.options,
      correctAnswer: q.answer,
    })),
    isActive: true,
  });

  res.status(201).json({
    success: true,
    message: 'Test created successfully',
    data: test,
  });
});

// @desc    Update a test
// @route   PUT /api/admin/tests/:id
// @access  Admin only
export const updateTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);

  if (!test) {
    return res.status(404).json({
      success: false,
      message: 'Test not found',
    });
  }

  const { title, description, category, durationMinutes, price, questions, isActive, highlights, instructions } = req.body;

  // Update fields
  if (title) test.title = title;
  if (description !== undefined) test.description = description;
  if (category) test.category = category;
  if (durationMinutes) test.durationMinutes = durationMinutes;
  if (price !== undefined) test.price = price;
  if (isActive !== undefined) test.isActive = isActive;

  if (highlights !== undefined) {
    test.highlights = Array.isArray(highlights)
      ? highlights
        .filter((item) => item && item.title && item.description)
        .map((item) => ({
          icon: item.icon || '',
          title: item.title,
          description: item.description,
        }))
      : undefined;
  }

  if (instructions !== undefined) {
    test.instructions = Array.isArray(instructions)
      ? instructions.filter((item) => typeof item === 'string' && item.trim().length > 0)
      : undefined;
  }

  // Update questions if provided
  if (questions && Array.isArray(questions)) {
    // Validate questions
    for (const q of questions) {
      if (!q.text || !q.options || q.options.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Each question must have text and at least 2 options',
        });
      }
      if (q.answer === undefined || q.answer < 0 || q.answer >= q.options.length) {
        return res.status(400).json({
          success: false,
          message: 'Each question must have a valid correct answer index',
        });
      }
    }
    test.questions = questions.map((q) => ({
      text: q.text,
      options: q.options,
      correctAnswer: q.answer,
    }));
  }

  await test.save();

  res.json({
    success: true,
    message: 'Test updated successfully',
    data: test,
  });
});

// @desc    Delete a test
// @route   DELETE /api/admin/tests/:id
// @access  Admin only
export const deleteTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);

  if (!test) {
    return res.status(404).json({
      success: false,
      message: 'Test not found',
    });
  }

  // Soft delete by setting isActive to false
  test.isActive = false;
  await test.save();

  res.json({
    success: true,
    message: 'Test deleted successfully',
  });
});

// @desc    Get all tests (admin view - includes inactive)
// @route   GET /api/admin/tests
// @access  Admin only
export const getAllTests = asyncHandler(async (req, res) => {
  const tests = await Test.find({}).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: tests.length,
    data: tests,
  });
});

// @desc    Get single test (admin view - includes inactive)
// @route   GET /api/admin/tests/:id
// @access  Admin only
export const getTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);

  if (!test) {
    return res.status(404).json({
      success: false,
      message: 'Test not found',
    });
  }

  res.json({
    success: true,
    data: test,
  });
});

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Admin only
export const getStats = asyncHandler(async (req, res) => {
  const [
    totalTests,
    activeTests,
    totalAttempts,
    totalUsers,
    totalPurchases,
  ] = await Promise.all([
    Test.countDocuments({}),
    Test.countDocuments({ isActive: true }),
    Attempt.countDocuments({}),
    User.countDocuments({}),
    Purchase.countDocuments({}),
  ]);

  res.json({
    success: true,
    data: {
      totalTests,
      activeTests,
      totalAttempts,
      totalUsers,
      totalPurchases,
    },
  });
});

// @desc    Get all attempts
// @route   GET /api/admin/attempts
// @access  Admin only
export const getAllAttempts = asyncHandler(async (req, res) => {
  const attempts = await Attempt.find({})
    .populate('user', 'name email')
    .populate('test', 'title testId')
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({
    success: true,
    count: attempts.length,
    data: attempts,
  });
});

