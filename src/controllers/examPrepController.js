const ExamPlan = require('../models/ExamPlan');
const aiService = require('../services/aiService');

// @desc    Create exam plan
// @route   POST /api/exam-prep
exports.createExamPlan = async (req, res, next) => {
    try {
        const { examName, subject, examDate, topics, syllabus } = req.body;

        const today = new Date();
        const exam = new Date(examDate);
        const daysUntilExam = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExam < 1) {
            return res.status(400).json({
                success: false,
                error: 'Exam date must be in the future'
            });
        }

        const topicsArray = typeof topics === 'string' 
            ? topics.split(',').map(t => t.trim()).filter(t => t)
            : topics;

        const aiPlan = await aiService.generateExamPlan({
            examName,
            subject,
            examDate,
            topics: topicsArray,
            daysUntilExam
        });

        const studyTasks = [];
        if (aiPlan.dailySchedule) {
            aiPlan.dailySchedule.forEach((day, index) => {
                const taskDate = new Date(today);
                taskDate.setDate(taskDate.getDate() + index);

                if (Array.isArray(day.topics)) {
                    day.topics.forEach(topic => {
                        studyTasks.push({
                            day: index + 1,
                            date: taskDate,
                            topic,
                            duration: Math.round(day.duration / day.topics.length),
                            priority: day.priority || 'Medium',
                            completed: false
                        });
                    });
                }
            });
        }

        const examPlan = await ExamPlan.create({
            user: req.user.id,
            examName,
            subject,
            examDate,
            topics: topicsArray,
            syllabus,
            studyTasks,
            aiGeneratedPlan: aiPlan.overview || JSON.stringify(aiPlan),
            tips: aiPlan.tips || [],
            status: 'active'
        });

        res.status(201).json({
            success: true,
            data: {
                examPlan,
                aiSuggestions: {
                    tips: aiPlan.tips,
                    overview: aiPlan.overview
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all exam plans
// @route   GET /api/exam-prep
exports.getExamPlans = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const query = { user: req.user.id };
        if (status) query.status = status;

        const skip = (page - 1) * limit;

        const examPlans = await ExamPlan.find(query)
            .sort({ examDate: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ExamPlan.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                examPlans,
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

// @desc    Get single exam plan
// @route   GET /api/exam-prep/:id
exports.getExamPlan = async (req, res, next) => {
    try {
        const examPlan = await ExamPlan.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!examPlan) {
            return res.status(404).json({
                success: false,
                error: 'Exam plan not found'
            });
        }

        const completedTasks = examPlan.studyTasks.filter(t => t.completed).length;
        const totalTasks = examPlan.studyTasks.length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        res.status(200).json({
            success: true,
            data: {
                ...examPlan.toObject(),
                progress,
                completedTasks,
                totalTasks
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update exam plan
// @route   PUT /api/exam-prep/:id
exports.updateExamPlan = async (req, res, next) => {
    try {
        let examPlan = await ExamPlan.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!examPlan) {
            return res.status(404).json({
                success: false,
                error: 'Exam plan not found'
            });
        }

        examPlan = await ExamPlan.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: examPlan
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update task status
// @route   PATCH /api/exam-prep/:id/tasks/:taskId
exports.updateTaskStatus = async (req, res, next) => {
    try {
        const { completed, notes } = req.body;

        const examPlan = await ExamPlan.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!examPlan) {
            return res.status(404).json({
                success: false,
                error: 'Exam plan not found'
            });
        }

        const task = examPlan.studyTasks.id(req.params.taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        if (typeof completed !== 'undefined') task.completed = completed;
        if (notes) task.notes = notes;

        const completedTasks = examPlan.studyTasks.filter(t => t.completed).length;
        examPlan.progress = Math.round((completedTasks / examPlan.studyTasks.length) * 100);

        await examPlan.save();

        res.status(200).json({
            success: true,
            data: examPlan
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete exam plan
// @route   DELETE /api/exam-prep/:id
exports.deleteExamPlan = async (req, res, next) => {
    try {
        const examPlan = await ExamPlan.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!examPlan) {
            return res.status(404).json({
                success: false,
                error: 'Exam plan not found'
            });
        }

        await examPlan.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};