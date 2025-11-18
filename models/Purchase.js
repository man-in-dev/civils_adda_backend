import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema(
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
        orderId: {
            type: String,
            index: true,
        },
        paymentId: {
            type: String,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'success', 'failed', 'cancelled'],
            default: 'pending',
            index: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        purchasedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to prevent duplicate purchases (only for successful purchases)
purchaseSchema.index({ user: 1, test: 1, paymentStatus: 1 }, {
    unique: true,
    partialFilterExpression: { paymentStatus: 'success' }
});

const Purchase = mongoose.model('Purchase', purchaseSchema);

export default Purchase;

