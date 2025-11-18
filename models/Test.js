import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Question text is required'],
    },
    options: {
        type: [String],
        required: [true, 'Options are required'],
        validate: {
            validator: function (options) {
                return options.length >= 2 && options.length <= 6;
            },
            message: 'Question must have between 2 and 6 options',
        },
    },
    correctAnswer: {
        type: Number,
        required: [true, 'Correct answer index is required'],
        min: [0, 'Correct answer must be a valid option index'],
    },
});

const highlightSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            maxlength: [120, 'Highlight title cannot exceed 120 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [200, 'Highlight description cannot exceed 200 characters'],
        },
        icon: {
            type: String,
            trim: true,
            maxlength: [10, 'Highlight icon must be an emoji or short label'],
        },
    },
    { _id: false }
);

const testSchema = new mongoose.Schema(
    {
        testId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        title: {
            type: String,
            required: [true, 'Test title is required'],
            trim: true,
            maxlength: [200, 'Title cannot be more than 200 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot be more than 1000 characters'],
        },
        category: {
            type: String,
            enum: ['polity', 'history', 'geography', 'economy', 'science', 'current-affairs'],
            default: 'polity',
        },
        durationMinutes: {
            type: Number,
            required: [true, 'Duration is required'],
            min: [1, 'Duration must be at least 1 minute'],
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
            default: 0,
        },
        highlights: {
            type: [highlightSchema],
            default: undefined,
        },
        instructions: {
            type: [String],
            default: undefined,
        },
        questions: {
            type: [questionSchema],
            required: [true, 'Questions are required'],
            validate: {
                validator: function (questions) {
                    return questions.length > 0;
                },
                message: 'Test must have at least one question',
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Virtual for total questions count
testSchema.virtual('totalQuestions').get(function () {
    return this.questions.length;
});

// Ensure virtuals are included in JSON
testSchema.set('toJSON', { virtuals: true });
testSchema.set('toObject', { virtuals: true });

const Test = mongoose.model('Test', testSchema);

export default Test;

