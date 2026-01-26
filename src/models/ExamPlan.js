const mongoose = require('mongoose');

const studyTaskSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    completed: {
        type: Boolean,
        default: false
    },
    notes: String
});

const examPlanSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    examName: {
        type: String,
        required: [true, 'Exam name is required'],
        trim: true
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },
    examDate: {
        type: Date,
        required: [true, 'Exam date is required']
    },
    topics: [{
        type: String,
        trim: true
    }],
    syllabus: {
        type: String
    },
    studyTasks: [studyTaskSchema],
    aiGeneratedPlan: {
        type: String
    },
    tips: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['active', 'completed', 'paused'],
        default: 'active'
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});

examPlanSchema.index({ user: 1, examDate: 1 });

module.exports = mongoose.model('ExamPlan', examPlanSchema);