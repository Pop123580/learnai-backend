const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

// In-memory storage
const examPlans = [];

// Create exam plan
router.post('/', async (req, res) => {
  try {
    const { examName, subject, examDate, topics } = req.body;

    if (!examName || !subject || !examDate || !topics) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const topicsArray = Array.isArray(topics) 
      ? topics 
      : topics.split(',').map(t => t.trim());

    // Generate AI exam plan
    const aiPlan = await aiService.generateExamPlan(
      examName, subject, examDate, topicsArray
    );

    const plan = {
      id: Date.now().toString(),
      examName,
      subject,
      examDate,
      topics: topicsArray,
      aiPlan: aiPlan.plan,
      daysUntilExam: aiPlan.daysUntilExam,
      createdAt: new Date().toISOString()
    };

    examPlans.push(plan);

    res.status(201).json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Create Exam Plan Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create exam plan'
    });
  }
});

// Get all exam plans
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: examPlans.sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
  });
});

// Delete exam plan
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const planIndex = examPlans.findIndex(p => p.id === id);

  if (planIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Exam plan not found'
    });
  }

  examPlans.splice(planIndex, 1);

  res.json({
    success: true,
    message: 'Exam plan deleted'
  });
});

module.exports = router;