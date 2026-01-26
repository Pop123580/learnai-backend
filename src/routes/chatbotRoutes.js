@'
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const chatSessions = new Map();

router.post('/ask', async (req, res) => {
  try {
    const { message, language = 'English', sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
      return res.status(500).json({ 
        success: false, 
        message: 'OpenAI API key not configured. Add your key to .env file.' 
      });
    }

    let history = chatSessions.get(sessionId) || [];

    const messages = [
      { 
        role: 'system', 
        content: `You are LearnAI, a helpful educational assistant. Always respond in ${language}. Be friendly and educational.` 
      },
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7
    });

    const aiMessage = response.choices[0].message.content;

    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: aiMessage });
    chatSessions.set(sessionId, history.slice(-20));

    res.json({
      success: true,
      data: { message: aiMessage, sessionId: sessionId || Date.now().toString() }
    });
  } catch (error) {
    console.error('Chat Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/history/:sessionId', (req, res) => {
  chatSessions.delete(req.params.sessionId);
  res.json({ success: true, message: 'History cleared' });
});

module.exports = router;
'@ | Out-File -FilePath "src/routes/chatbotRoutes.js" -Encoding UTF8