const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },
    topic: {
        type: String,
        required: [true, 'Topic is required'],
        trim: true
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: [5, 'Duration must be at least 5 minutes'],
        max: [480, 'Duration cannot exceed 8 hours']
    },
    deadline: {
        type: Date,
        required: [true, 'Deadline is required']
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'missed'],
        default: 'pending'
    },
    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    completedAt: {
        type: Date
    },
    aiSuggestions: {
        type: String
    }
}, {
    timestamps: true
});

studySessionSchema.index({ user: 1, deadline: 1 });
studySessionSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('StudySession', studySessionSchema);