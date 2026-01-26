const ChatHistory = require('../models/ChatHistory');
const aiService = require('../services/aiService');
const { v4: uuidv4 } = require('uuid');

// @desc    Send message to chatbot
// @route   POST /api/chatbot/message
exports.sendMessage = async (req, res, next) => {
    try {
        const { message, sessionId, language = 'English', subject } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a message'
            });
        }

        let chatHistory;

        if (sessionId) {
            chatHistory = await ChatHistory.findOne({
                sessionId,
                user: req.user.id
            });
        }

        if (!chatHistory) {
            chatHistory = await ChatHistory.create({
                user: req.user.id,
                sessionId: sessionId || uuidv4(),
                title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
                messages: [],
                language,
                subject
            });
        }

        chatHistory.messages.push({
            role: 'user',
            content: message,
            language
        });

        const aiResponse = await aiService.answerQuestion(message, {
            language,
            chatHistory: chatHistory.messages,
            subject
        });

        chatHistory.messages.push({
            role: 'assistant',
            content: aiResponse.answer,
            language
        });

        await chatHistory.save();

        res.status(200).json({
            success: true,
            data: {
                sessionId: chatHistory.sessionId,
                message: {
                    role: 'assistant',
                    content: aiResponse.answer,
                    language: aiResponse.language
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get chat history
// @route   GET /api/chatbot/history
exports.getChatHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const sessions = await ChatHistory.find({ user: req.user.id })
            .select('sessionId title language createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ChatHistory.countDocuments({ user: req.user.id });

        res.status(200).json({
            success: true,
            data: {
                sessions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single chat session
// @route   GET /api/chatbot/session/:sessionId
exports.getChatSession = async (req, res, next) => {
    try {
        const chatHistory = await ChatHistory.findOne({
            sessionId: req.params.sessionId,
            user: req.user.id
        });

        if (!chatHistory) {
            return res.status(404).json({
                success: false,
                error: 'Chat session not found'
            });
        }

        res.status(200).json({
            success: true,
            data: chatHistory
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new chat session
// @route   POST /api/chatbot/session
exports.createSession = async (req, res, next) => {
    try {
        const { language = 'English', subject } = req.body;

        const chatHistory = await ChatHistory.create({
            user: req.user.id,
            sessionId: uuidv4(),
            title: 'New Conversation',
            messages: [],
            language,
            subject
        });

        res.status(201).json({
            success: true,
            data: {
                sessionId: chatHistory.sessionId,
                language: chatHistory.language
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete chat session
// @route   DELETE /api/chatbot/session/:sessionId
exports.deleteSession = async (req, res, next) => {
    try {
        const chatHistory = await ChatHistory.findOne({
            sessionId: req.params.sessionId,
            user: req.user.id
        });

        if (!chatHistory) {
            return res.status(404).json({
                success: false,
                error: 'Chat session not found'
            });
        }

        await chatHistory.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Clear all chat history
// @route   DELETE /api/chatbot/history
exports.clearHistory = async (req, res, next) => {
    try {
        await ChatHistory.deleteMany({ user: req.user.id });

        res.status(200).json({
            success: true,
            message: 'All chat history cleared'
        });
    } catch (error) {
        next(error);
    }
};