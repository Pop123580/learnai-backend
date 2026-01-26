const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    originalText: {
        type: String,
        required: true
    },
    summarizedText: {
        type: String,
        required: true
    },
    keyPoints: [{
        type: String
    }],
    sourceType: {
        type: String,
        enum: ['text', 'pdf'],
        required: true
    },
    originalFileName: {
        type: String
    },
    wordCountOriginal: {
        type: Number
    },
    wordCountSummary: {
        type: Number
    },
    compressionRatio: {
        type: Number
    },
    subject: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

summarySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Summary', summarySchema);