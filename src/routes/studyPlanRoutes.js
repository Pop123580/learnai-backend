@'
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const studySessions = [];

router.post('/', async (req, res) => {
  try {
    const { subject, topic, duration, deadline, priority } = req.body;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert study planner.' },
        { role: 'user', content: `Create a study plan for: Subject: ${subject}, Topic: ${topic}, Duration: ${duration} min, Deadline: ${deadline}, Priority: ${priority}` }
      ],
      max_tokens: 1200
    });

    const session = {
      id: Date.now().toString(),
      subject, topic, duration, deadline, priority,
      aiPlan: response.choices[0].message.content,
      completed: false,
      createdAt: new Date().toISOString()
    };

    studySessions.push(session);
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', (req, res) => {
  res.json({ success: true, data: studySessions });
});

router.delete('/:id', (req, res) => {
  const index = studySessions.findIndex(s => s.id === req.params.id);
  if (index > -1) studySessions.splice(index, 1);
  res.json({ success: true });
});

module.exports = router;
'@ | Out-File -FilePath "src/routes/studyPlanRoutes.js" -Encoding UTF8