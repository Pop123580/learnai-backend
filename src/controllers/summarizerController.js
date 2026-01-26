const Summary = require('../models/Summary');
const aiService = require('../services/aiService');
const pdfService = require('../services/pdfService');

// @desc    Summarize text
// @route   POST /api/summarizer/text
exports.summarizeText = async (req, res, next) => {
    try {
        const { text, title, subject, maxLength } = req.body;

        if (!text || text.trim().length < 100) {
            return res.status(400).json({
                success: false,
                error: 'Please provide at least 100 characters of text'
            });
        }

        const result = await aiService.summarizeText(text, { maxLength });

        const compressionRatio = Math.round((1 - result.summaryLength / result.originalLength) * 100);

        const summary = await Summary.create({
            user: req.user.id,
            title: title || 'Untitled Summary',
            originalText: text,
            summarizedText: result.summary,
            keyPoints: result.keyPoints,
            sourceType: 'text',
            wordCountOriginal: result.originalLength,
            wordCountSummary: result.summaryLength,
            compressionRatio,
            subject
        });

        res.status(201).json({
            success: true,
            data: {
                id: summary._id,
                title: summary.title,
                summary: result.summary,
                keyPoints: result.keyPoints,
                stats: {
                    originalWords: result.originalLength,
                    summaryWords: result.summaryLength,
                    compressionRatio: `${compressionRatio}%`
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Summarize PDF
// @route   POST /api/summarizer/pdf
exports.summarizePDF = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Please upload a PDF file'
            });
        }

        const { title, subject, maxLength } = req.body;

        const pdfData = await pdfService.extractText(req.file.path);

        if (!pdfData.text || pdfData.text.trim().length < 100) {
            await pdfService.deleteFile(req.file.path);
            return res.status(400).json({
                success: false,
                error: 'Could not extract enough text from PDF'
            });
        }

        const result = await aiService.summarizeText(pdfData.text, { maxLength });

        const compressionRatio = Math.round((1 - result.summaryLength / result.originalLength) * 100);

        const summary = await Summary.create({
            user: req.user.id,
            title: title || req.file.originalname,
            originalText: pdfData.text,
            summarizedText: result.summary,
            keyPoints: result.keyPoints,
            sourceType: 'pdf',
            originalFileName: req.file.originalname,
            wordCountOriginal: result.originalLength,
            wordCountSummary: result.summaryLength,
            compressionRatio,
            subject
        });

        await pdfService.deleteFile(req.file.path);

        res.status(201).json({
            success: true,
            data: {
                id: summary._id,
                title: summary.title,
                summary: result.summary,
                keyPoints: result.keyPoints,
                pdfInfo: {
                    pages: pdfData.pages,
                    filename: req.file.originalname
                },
                stats: {
                    originalWords: result.originalLength,
                    summaryWords: result.summaryLength,
                    compressionRatio: `${compressionRatio}%`
                }
            }
        });
    } catch (error) {
        if (req.file) {
            await pdfService.deleteFile(req.file.path);
        }
        next(error);
    }
};

// @desc    Get all summaries
// @route   GET /api/summarizer
exports.getSummaries = async (req, res, next) => {
    try {
        const { subject, sourceType, page = 1, limit = 10 } = req.query;

        const query = { user: req.user.id };
        if (subject) query.subject = subject;
        if (sourceType) query.sourceType = sourceType;

        const skip = (page - 1) * limit;

        const summaries = await Summary.find(query)
            .select('-originalText')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Summary.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                summaries,
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

// @desc    Get single summary
// @route   GET /api/summarizer/:id
exports.getSummary = async (req, res, next) => {
    try {
        const summary = await Summary.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!summary) {
            return res.status(404).json({
                success: false,
                error: 'Summary not found'
            });
        }

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete summary
// @route   DELETE /api/summarizer/:id
exports.deleteSummary = async (req, res, next) => {
    try {
        const summary = await Summary.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!summary) {
            return res.status(404).json({
                success: false,
                error: 'Summary not found'
            });
        }

        await summary.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};