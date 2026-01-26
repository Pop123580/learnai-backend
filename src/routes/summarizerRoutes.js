@'
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/text', async (req, res) => {
  try {
    const { text, length = 'medium', style = 'bullet' } = req.body;

    if (!text || text.length < 50) {
      return res.status(400).json({ success: false, message: 'Text must be at least 50 characters' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You create clear educational summaries.' },
        { role: 'user', content: `Summarize this text (${length} length, ${style} style):\n\n${text}` }
      ],
      max_tokens: 1500
    });

    res.json({
      success: true,
      data: { summary: response.choices[0].message.content, originalLength: text.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/pdf', (req, res) => {
  res.json({ success: true, data: { summary: 'PDF upload coming soon!' } });
});

module.exports = router;
'@ | Out-File -FilePath "src/routes/summarizerRoutes.js" -Encoding UTF8