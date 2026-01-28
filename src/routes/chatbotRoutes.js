const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const chatSessions = new Map();

// Language mapping for better AI understanding
const languageMap = {
  'English': 'English',
  'Hindi': 'Hindi (हिंदी)',
  'Bengali': 'Bengali (বাংলা)',
  'Telugu': 'Telugu (తెలుగు)',
  'Marathi': 'Marathi (मराठी)',
  'Tamil': 'Tamil (தமிழ்)',
  'Gujarati': 'Gujarati (ગુજરાતી)',
  'Kannada': 'Kannada (ಕನ್ನಡ)',
  'Malayalam': 'Malayalam (മലയാളം)',
  'Odia': 'Odia (ଓଡ଼ିଆ)',
  'Punjabi': 'Punjabi (ਪੰਜਾਬੀ)',
  'Assamese': 'Assamese (অসমীয়া)',
  'Urdu': 'Urdu (اردو)',
  'Sanskrit': 'Sanskrit (संस्कृतम्)'
};

router.post('/ask', async (req, res) => {
  try {
    const { message, language = 'English', sessionId } = req.body;

    console.log('Received request - Message:', message, 'Language:', language);

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
      return res.status(500).json({
        success: false,
        message: 'OpenAI API key not configured. Add your key to .env file.'
      });
    }

    // Get full language name
    const fullLanguage = languageMap[language] || language;

    let history = chatSessions.get(sessionId) || [];

    // Strong language instruction in system prompt
    const systemPrompt = `You are LearnAI, a helpful educational assistant for Indian students.

CRITICAL INSTRUCTION: You MUST respond ONLY in ${fullLanguage}. 
- Do NOT use any other language.
- Even if the user asks in English or any other language, your response MUST be in ${fullLanguage}.
- Use proper script/characters for ${fullLanguage}.
- Be friendly, educational, and helpful.
- Explain concepts clearly with examples.

Remember: Your ENTIRE response must be in ${fullLanguage} only!`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    console.log('Sending to OpenAI with language:', fullLanguage);

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7
    });

    const aiMessage = response.choices[0].message.content;

    // Save to history
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: aiMessage });
    chatSessions.set(sessionId, history.slice(-20));

    console.log('Response sent in language:', language);

    res.json({
      success: true,
      data: { 
        message: aiMessage, 
        sessionId: sessionId || Date.now().toString(),
        language: language
      }
    });
  } catch (error) {
    console.error('Chat Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

router.delete('/history/:sessionId', (req, res) => {
  chatSessions.delete(req.params.sessionId);
  res.json({ success: true, message: 'History cleared' });
});

module.exports = router;