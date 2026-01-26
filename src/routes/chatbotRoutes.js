const express = require('express');
const router = express.Router();

const chatSessions = new Map();

router.post('/ask', async (req, res) => {
  try {
    const { message, language = 'English', sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: 'API key not configured' 
      });
    }

    let history = chatSessions.get(sessionId) || [];

    const messages = [
      { 
        role: 'system', 
        content: 'You are LearnAI, a helpful educational assistant. Respond in ' + language + '. Be friendly and educational.'
      },
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'LearnAI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: messages,
        max_tokens: 1000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API request failed');
    }

    const aiMessage = data.choices[0].message.content;

    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: aiMessage });
    chatSessions.set(sessionId, history.slice(-20));

    res.json({
      success: true,
      data: { message: aiMessage, sessionId: sessionId }
    });
  } catch (error) {
    console.error('Chat Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/history/:sessionId', (req, res) => {
  chatSessions.delete(req.params.sessionId);
  res.json({ success: true });
});

module.exports = router;