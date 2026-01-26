const express = require('express');
const router = express.Router();

var examPlans = [];

router.post('/', async function(req, res) {
  try {
    var examName = req.body.examName;
    var subject = req.body.subject;
    var examDate = req.body.examDate;
    var topics = req.body.topics;

    if (!examName || !subject || !examDate || !topics) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    var topicsStr = Array.isArray(topics) ? topics.join(', ') : topics;

    var daysLeft = Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));

    var prompt = 'Create an exam preparation plan:\nExam: ' + examName + '\nSubject: ' + subject + '\nExam Date: ' + examDate + ' (' + daysLeft + ' days left)\nTopics: ' + topicsStr + '\n\nProvide:\n1. Day-by-day study schedule\n2. Topic prioritization (most important first)\n3. Recommended study methods for each topic\n4. Practice and revision strategy\n5. Tips for exam day\n6. Common mistakes to avoid';

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
            content: 'You are an expert exam preparation coach. Create strategic, achievable exam prep plans.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500
      })
    });

    var data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API failed');
    }

    var plan = {
      id: Date.now().toString(),
      examName: examName,
      subject: subject,
      examDate: examDate,
      topics: Array.isArray(topics) ? topics : topics.split(',').map(function(t) { return t.trim(); }),
      aiPlan: data.choices[0].message.content,
      daysLeft: daysLeft,
      createdAt: new Date().toISOString()
    };

    examPlans.push(plan);

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Exam prep error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create exam plan'
    });
  }
});

router.post('/timetable', async function(req, res) {
  try {
    var subjects = req.body.subjects;
    var examDate = req.body.examDate;
    var hoursPerDay = req.body.hoursPerDay || 4;

    if (!subjects || !examDate) {
      return res.status(400).json({
        success: false,
        message: 'Subjects and exam date are required'
      });
    }

    var subjectsStr = Array.isArray(subjects) ? subjects.join(', ') : subjects;
    var daysLeft = Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));

    var prompt = 'Create a detailed study timetable:\nSubjects: ' + subjectsStr + '\nDays until exam: ' + daysLeft + '\nStudy hours per day: ' + hoursPerDay + '\n\nCreate a day-by-day timetable with specific time slots for each subject. Include breaks and revision time.';

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
            content: 'You are an expert at creating study timetables. Create practical, balanced schedules.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500
      })
    });

    var data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API failed');
    }

    res.json({
      success: true,
      data: {
        timetable: data.choices[0].message.content,
        subjects: subjects,
        examDate: examDate,
        daysLeft: daysLeft
      }
    });
  } catch (error) {
    console.error('Timetable error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate timetable'
    });
  }
});

router.get('/', function(req, res) {
  res.json({
    success: true,
    data: examPlans
  });
});

router.delete('/:id', function(req, res) {
  examPlans = examPlans.filter(function(p) {
    return p.id !== req.params.id;
  });
  res.json({ success: true });
});

module.exports = router;