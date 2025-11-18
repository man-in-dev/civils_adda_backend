import Attempt from '../models/Attempt.js';
import Purchase from '../models/Purchase.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

// @desc    Get user performance analytics
// @route   GET /api/performance
// @access  Private
export const getPerformance = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get all submitted attempts
  const attempts = await Attempt.find({
    user: userId,
    submittedAt: { $ne: null },
  }).populate('test', 'title category');

  // Get total purchased tests
  const totalPurchased = await Purchase.countDocuments({ user: userId });

  // Calculate statistics
  const totalAttempts = attempts.length;
  const totalQuestions = attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
  const totalCorrect = attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);

  // Calculate average score
  const averageScore = totalAttempts > 0 ? Math.round(totalCorrect / totalAttempts) : 0;
  const averagePercentage = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length)
    : 0;

  // Performance by category
  const categoryStats = {};
  attempts.forEach((attempt) => {
    const category = attempt.test.category || 'other';
    if (!categoryStats[category]) {
      categoryStats[category] = { attempts: 0, totalScore: 0, totalQuestions: 0 };
    }
    categoryStats[category].attempts++;
    categoryStats[category].totalScore += attempt.score || 0;
  });

  const categoryPerformance = Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    attempts: stats.attempts,
    averageScore: Math.round(stats.totalScore / stats.attempts),
  }));

  // Recent attempts (last 5)
  const recentAttempts = attempts
    .slice(0, 5)
    .map((attempt) => ({
      testTitle: attempt.test.title,
      score: attempt.score,
      percentage: attempt.percentage,
      submittedAt: attempt.submittedAt,
    }));

  res.json({
    success: true,
    data: {
      overview: {
        totalPurchasedTests: totalPurchased,
        totalAttempts,
        averageScore,
        averagePercentage,
      },
      categoryPerformance,
      recentAttempts,
    },
  });
});

