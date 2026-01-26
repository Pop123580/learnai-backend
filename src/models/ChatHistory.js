const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    language: {
        type: String,
        default: 'English'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const chatHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionId: {
    type: String,
    required: true
},
    title: {
        type: String,
        default: 'New Conversation'
    },
    messages: [messageSchema],
    subject: {
        type: String
    },
    language: {
        type: String,
        enum: ['English', 'Spanish', 'French', 'German', 'Hindi', 'Mandarin', 'Japanese'],
        default: 'English'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

chatHistorySchema.index({ user: 1, createdAt: -1 });
chatHistorySchema.index({ sessionId: 1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
