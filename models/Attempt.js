import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User is required'],
            index: true,
        },
        test: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Test',
            required: [true, 'Test is required'],
            index: true,
        },
        answers: {
            type: Map,
            of: Number, // questionId -> selectedOptionIndex
            default: new Map(),
        },
        markedQuestions: {
            type: [String], // Array of question IDs that are marked for review
            default: [],
        },
        currentQuestionIndex: {
            type: Number,
            default: 0,
            min: [0, 'Current question index cannot be negative'],
        },
        visitedQuestions: {
            type: [String], // Array of question IDs that have been visited
            default: [],
        },
        startedAt: {
            type: Date,
            default: null,
        },
        submittedAt: {
            type: Date,
            default: null,
        },
        score: {
            type: Number,
            min: [0, 'Score cannot be negative'],
            default: null,
        },
        percentage: {
            type: Number,
            min: [0, 'Percentage cannot be negative'],
            max: [100, 'Percentage cannot exceed 100'],
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Index for finding user attempts
attemptSchema.index({ user: 1, submittedAt: -1 });

const Attempt = mongoose.model('Attempt', attemptSchema);

export default Attempt;

