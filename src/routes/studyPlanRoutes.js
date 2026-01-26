const express = require('express');
const router = express.Router();

var studySessions = [];

router.post('/', async function(req, res) {
  try {
    var subject = req.body.subject;
    var topic = req.body.topic;
    var duration = req.body.duration;
    var deadline = req.body.deadline;
    var priority = req.body.priority;

    if (!subject || !topic || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Subject, topic, and deadline are required'
      });
    }

    var prompt = 'Create a study plan for:\nSubject: ' + subject + '\nTopic: ' + topic + '\nDuration: ' + duration + ' minutes\nDeadline: ' + deadline + '\nPriority: ' + priority + '\n\nProvide:\n1. Step-by-step study approach\n2. Key concepts to focus on\n3. Recommended study techniques\n4. Time breakdown\n5. Tips for effective learning';

    var response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'LearnAI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert study planner. Create personalized, actionable study plans.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000
      })
    });

    var data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API failed');
    }

    var session = {
      id: Date.now().toString(),
      subject: subject,
      topic: topic,
      duration: duration,
      deadline: deadline,
      priority: priority,
      aiPlan: data.choices[0].message.content,
      completed: false,
      createdAt: new Date().toISOString()
    };

    studySessions.push(session);

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Study plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create study plan'
    });
  }
});

router.get('/', function(req, res) {
  res.json({
    success: true,
    data: studySessions
  });
});

router.delete('/:id', function(req, res) {
  studySessions = studySessions.filter(function(s) {
    return s.id !== req.params.id;
  });
  res.json({ success: true });
});

module.exports = router;