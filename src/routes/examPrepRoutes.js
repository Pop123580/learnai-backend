@'
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const examPlans = [];

router.post('/', async (req, res) => {
  try {
    const { examName, subject, examDate, topics } = req.body;
    const topicsArray = Array.isArray(topics) ? topics : topics.split(',').map(t => t.trim());

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert exam preparation coach.' },
        { role: 'user', content: `Create exam prep plan for: ${examName}, Subject: ${subject}, Date: ${examDate}, Topics: ${topicsArray.join(', ')}` }
      ],
      max_tokens: 1500
    });

    const plan = {
      id: Date.now().toString(),
      examName, subject, examDate, topics: topicsArray,
      aiPlan: response.choices[0].message.content,
      createdAt: new Date().toISOString()
    };

    examPlans.push(plan);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', (req, res) => {
  res.json({ success: true, data: examPlans });
});

router.delete('/:id', (req, res) => {
  const index = examPlans.findIndex(p => p.id === req.params.id);
  if (index > -1) examPlans.splice(index, 1);
  res.json({ success: true });
});

module.exports = router;
'@ | Out-File -FilePath "src/routes/examPrepRoutes.js" -Encoding UTF8