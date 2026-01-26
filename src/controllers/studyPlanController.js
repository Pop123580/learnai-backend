const StudySession = require('../models/StudySession');
const aiService = require('../services/aiService');

exports.getSessions = async (req, res) => {
    try {
        const { status, priority, page = 1, limit = 10 } = req.query;

        const query = { user: req.user.id };
        if (status) query.status = status;
        if (priority) query.priority = priority;

        const skip = (page - 1) * limit;

        const sessions = await StudySession.find(query)
            .sort({ deadline: 1, priority: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await StudySession.countDocuments(query);

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
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.createSession = async (req, res) => {
    try {
        const { subject, topic, duration, deadline, priority, notes } = req.body;

        const session = await StudySession.create({
            user: req.user.id,
            subject,
            topic,
            duration,
            deadline,
            priority,
            notes
        });

        aiService.generateStudySuggestions(session)
            .then(suggestions => {
                if (suggestions) {
                    StudySession.findByIdAndUpdate(session._id, { aiSuggestions: suggestions }).exec();
                }
            })
            .catch(console.error);

        res.status(201).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getSession = async (req, res) => {
    try {
        const session = await StudySession.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateSession = async (req, res) => {
    try {
        let session = await StudySession.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        if (req.body.status === 'completed' && session.status !== 'completed') {
            req.body.completedAt = new Date();
        }

        session = await StudySession.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteSession = async (req, res) => {
    try {
        const session = await StudySession.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        await session.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getTodaySessions = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const sessions = await StudySession.find({
            user: req.user.id,
            deadline: { $gte: today, $lt: tomorrow }
        }).sort({ priority: -1 });

        res.status(200).json({
            success: true,
            data: sessions
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getUpcomingSessions = async (req, res) => {
    try {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const sessions = await StudySession.find({
            user: req.user.id,
            deadline: { $gte: today, $lte: nextWeek },
            status: { $ne: 'completed' }
        }).sort({ deadline: 1, priority: -1 });

        res.status(200).json({
            success: true,
            data: sessions
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};