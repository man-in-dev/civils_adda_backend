import Attempt from '../models/Attempt.js';
import Test from '../models/Test.js';
import Purchase from '../models/Purchase.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

// @desc    Create new attempt
// @route   POST /api/attempts
// @access  Private
export const createAttempt = asyncHandler(async (req, res) => {
  const { testId } = req.body;
  const userId = req.user._id;

  // Verify test exists
  const test = await Test.findById(testId);

  if (!test || !test.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Test not found',
    });
  }

  // Check if user has purchased the test
  const purchase = await Purchase.findOne({
    user: userId,
    test: testId,
  });

  if (!purchase) {
    return res.status(403).json({
      success: false,
      message: 'You must purchase this test before attempting it',
    });
  }

  // Check if there's an ongoing attempt
  const ongoingAttempt = await Attempt.findOne({
    user: userId,
    test: testId,
    submittedAt: null,
  });

  if (ongoingAttempt) {
    return res.json({
      success: true,
      data: {
        attemptId: ongoingAttempt._id.toString(),
        testId: ongoingAttempt.test.toString(),
        startedAt: ongoingAttempt.startedAt,
      },
      message: 'Existing attempt found',
    });
  }

  // Create new attempt
  const attempt = await Attempt.create({
    user: userId,
    test: testId,
  });

  res.status(201).json({
    success: true,
    data: {
      attemptId: attempt._id.toString(),
      testId: attempt.test.toString(),
      startedAt: attempt.startedAt,
    },
    message: 'Attempt created successfully',
  });
});

// @desc    Get attempt details
// @route   GET /api/attempts/:id
// @access  Private
export const getAttempt = asyncHandler(async (req, res) => {
  const attemptId = req.params.id;
  const userId = req.user._id;

  const attempt = await Attempt.findOne({
    _id: attemptId,
    user: userId,
  }).populate('test', 'title questions durationMinutes instructions');

  if (!attempt) {
    return res.status(404).json({
      success: false,
      message: 'Attempt not found',
    });
  }

  const test = attempt.test;
  const questions = test.questions.map((q, index) => ({
    id: index.toString(),
    text: q.text,
    options: q.options,
    selectedAnswer: attempt.answers.get(index.toString()) ?? null,
  }));

  res.json({
    success: true,
    data: {
      attempt: {
        id: attempt._id.toString(),
        testId: attempt.test._id.toString(),
        testTitle: test.title,
        durationMinutes: test.durationMinutes,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        score: attempt.score,
        percentage: attempt.percentage,
        totalQuestions: test.questions.length,
        markedQuestions: attempt.markedQuestions || [],
        currentQuestionIndex: attempt.currentQuestionIndex || 0,
        visitedQuestions: attempt.visitedQuestions || [],
      },
      test: {
        instructions: test.instructions || [],
      },
      questions,
    },
  });
});

// @desc    Update attempt (save answers)
// @route   PUT /api/attempts/:id
// @access  Private
export const updateAttempt = asyncHandler(async (req, res) => {
  const attemptId = req.params.id;
  const userId = req.user._id;
  const { answers, markedQuestions, currentQuestionIndex, visitedQuestions } = req.body;

  const attempt = await Attempt.findOne({
    _id: attemptId,
    user: userId,
  }).populate('test', 'questions');

  if (!attempt) {
    return res.status(404).json({
      success: false,
      message: 'Attempt not found',
    });
  }

  if (attempt.submittedAt) {
    return res.status(400).json({
      success: false,
      message: 'Cannot update a submitted attempt',
    });
  }

  // Update answers if provided
  if (answers) {
    const answersMap = new Map();
    Object.entries(answers).forEach(([key, value]) => {
      answersMap.set(key, value);
    });
    attempt.answers = answersMap;
  }

  // Update marked questions if provided
  if (markedQuestions !== undefined) {
    attempt.markedQuestions = Array.isArray(markedQuestions) ? markedQuestions : [];
  }

  // Update current question index if provided
  if (currentQuestionIndex !== undefined) {
    const maxIndex = attempt.test.questions.length - 1;
    attempt.currentQuestionIndex = Math.max(0, Math.min(currentQuestionIndex, maxIndex));

    // Auto-add current question to visited questions if not already there
    // Use index as string to match the question ID format
    const currentQuestionId = attempt.currentQuestionIndex.toString();

    if (!attempt.visitedQuestions.includes(currentQuestionId)) {
      attempt.visitedQuestions.push(currentQuestionId);
    }
  }

  // Update visited questions if provided (merge with existing)
  if (visitedQuestions !== undefined && Array.isArray(visitedQuestions)) {
    const uniqueVisited = [...new Set([...attempt.visitedQuestions, ...visitedQuestions])];
    attempt.visitedQuestions = uniqueVisited;
  }

  await attempt.save();

  res.json({
    success: true,
    data: {
      attemptId: attempt._id.toString(),
      answers: Object.fromEntries(attempt.answers),
      markedQuestions: attempt.markedQuestions,
      currentQuestionIndex: attempt.currentQuestionIndex,
      visitedQuestions: attempt.visitedQuestions,
    },
    message: 'Attempt updated successfully',
  });
});

// @desc    Start attempt (mark as started)
// @route   POST /api/attempts/:id/start
// @access  Private
export const startAttempt = asyncHandler(async (req, res) => {
  const attemptId = req.params.id;
  const userId = req.user._id;

  const attempt = await Attempt.findOne({
    _id: attemptId,
    user: userId,
  });

  if (!attempt) {
    return res.status(404).json({
      success: false,
      message: 'Attempt not found',
    });
  }

  if (attempt.submittedAt) {
    return res.status(400).json({
      success: false,
      message: 'Cannot start a submitted attempt',
    });
  }

  // Only set startedAt if it hasn't been set yet
  if (!attempt.startedAt) {
    attempt.startedAt = new Date();
    await attempt.save();
  }

  res.json({
    success: true,
    data: {
      startedAt: attempt.startedAt,
    },
    message: 'Attempt started successfully',
  });
});

// @desc    Submit attempt
// @route   POST /api/attempts/:id/submit
// @access  Private
export const submitAttempt = asyncHandler(async (req, res) => {
  const attemptId = req.params.id;
  const userId = req.user._id;

  const attempt = await Attempt.findOne({
    _id: attemptId,
    user: userId,
  }).populate('test', 'questions');

  if (!attempt) {
    return res.status(404).json({
      success: false,
      message: 'Attempt not found',
    });
  }

  if (attempt.submittedAt) {
    return res.status(400).json({
      success: false,
      message: 'Attempt already submitted',
    });
  }

  // Calculate score
  const test = attempt.test;
  let correctAnswers = 0;
  const totalQuestions = test.questions.length;

  test.questions.forEach((question, index) => {
    const selectedAnswer = attempt.answers.get(index.toString());
    if (selectedAnswer === question.correctAnswer) {
      correctAnswers++;
    }
  });

  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  // Update attempt
  attempt.score = correctAnswers;
  attempt.percentage = percentage;
  attempt.submittedAt = new Date();

  await attempt.save();

  res.json({
    success: true,
    data: {
      attemptId: attempt._id.toString(),
      score: correctAnswers,
      totalQuestions,
      percentage,
      submittedAt: attempt.submittedAt,
    },
    message: 'Attempt submitted successfully',
  });
});

// @desc    Get user's attempts
// @route   GET /api/attempts
// @access  Private
export const getUserAttempts = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const attempts = await Attempt.find({ user: userId })
    .populate('test', 'title questions')
    .sort('-submittedAt')
    .lean();

  // Filter out attempts where test is null (deleted tests) and format the rest
  const formattedAttempts = attempts
    .filter((attempt) => attempt.test !== null && attempt.test !== undefined)
    .map((attempt) => ({
      attemptId: attempt._id.toString(),
      testId: attempt.test._id.toString(),
      testTitle: attempt.test.title || 'Unknown Test',
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      score: attempt.score,
      percentage: attempt.percentage,
      totalQuestions: attempt.test.questions?.length || 0,
    }));

  res.json({
    success: true,
    count: formattedAttempts.length,
    data: formattedAttempts,
  });
});

// @desc    Get leaderboard
// @route   GET /api/attempts/leaderboard
// @access  Private
export const getLeaderboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const limit = parseInt(req.query.limit) || 10;

  // Get all submitted attempts with user and test info
  const allAttempts = await Attempt.find({
    submittedAt: { $ne: null },
    score: { $ne: null },
  })
    .populate('user', 'name email')
    .populate('test', 'title')
    .sort('-percentage -score')
    .lean();

  // Calculate user statistics
  const userAttempts = allAttempts.filter(
    (attempt) => attempt.user && attempt.user._id.toString() === userId.toString()
  );

  // Calculate average percentage per user
  const userStats = new Map();

  allAttempts.forEach((attempt) => {
    if (!attempt.user) return;
    const uid = attempt.user._id.toString();

    if (!userStats.has(uid)) {
      userStats.set(uid, {
        userId: uid,
        userName: attempt.user.name || 'Anonymous',
        userEmail: attempt.user.email || '',
        totalAttempts: 0,
        totalScore: 0,
        totalPercentage: 0,
        bestScore: 0,
        bestPercentage: 0,
      });
    }

    const stats = userStats.get(uid);
    stats.totalAttempts++;
    stats.totalScore += attempt.score || 0;
    stats.totalPercentage += attempt.percentage || 0;

    if ((attempt.percentage || 0) > stats.bestPercentage) {
      stats.bestPercentage = attempt.percentage || 0;
      stats.bestScore = attempt.score || 0;
    }
  });

  // Calculate average percentage for each user
  const leaderboard = Array.from(userStats.values())
    .map((stats) => ({
      ...stats,
      averagePercentage: stats.totalAttempts > 0
        ? Math.round(stats.totalPercentage / stats.totalAttempts)
        : 0,
    }))
    .sort((a, b) => {
      // Sort by best percentage first, then by average percentage
      if (b.bestPercentage !== a.bestPercentage) {
        return b.bestPercentage - a.bestPercentage;
      }
      return b.averagePercentage - a.averagePercentage;
    })
    .map((user, index) => ({
      rank: index + 1,
      ...user,
    }));

  // Get top performers
  const topPerformers = leaderboard.slice(0, limit);

  // Find current user's position
  const userRank = leaderboard.findIndex(
    (entry) => entry.userId === userId.toString()
  );
  const userPosition = userRank >= 0 ? userRank + 1 : null;
  const userEntry = userRank >= 0 ? leaderboard[userRank] : null;

  // Calculate user's stats
  const userStatsData = userEntry
    ? {
      rank: userPosition,
      userName: userEntry.userName,
      totalAttempts: userEntry.totalAttempts,
      averagePercentage: userEntry.averagePercentage,
      bestPercentage: userEntry.bestPercentage,
      bestScore: userEntry.bestScore,
    }
    : {
      rank: null,
      userName: req.user.name || 'You',
      totalAttempts: userAttempts.length,
      averagePercentage:
        userAttempts.length > 0
          ? Math.round(
            userAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) /
            userAttempts.length
          )
          : 0,
      bestPercentage:
        userAttempts.length > 0
          ? Math.max(...userAttempts.map((a) => a.percentage || 0))
          : 0,
      bestScore:
        userAttempts.length > 0
          ? Math.max(...userAttempts.map((a) => a.score || 0))
          : 0,
    };

  res.json({
    success: true,
    data: {
      topPerformers,
      userStats: userStatsData,
      totalUsers: leaderboard.length,
    },
  });
});

