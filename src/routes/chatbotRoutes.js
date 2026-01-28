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

    // Strong language instruction for Indian languages
    const systemPrompt = `You are LearnAI, a helpful educational assistant for Indian students.

CRITICAL INSTRUCTION - LANGUAGE REQUIREMENT:
You MUST respond ONLY in ${language}. 
- If the language is Hindi, respond in Hindi (हिंदी में जवाब दें)
- If the language is Bengali, respond in Bengali (বাংলায় উত্তর দিন)
- If the language is Tamil, respond in Tamil (தமிழில் பதிலளிக்கவும்)
- If the language is Telugu, respond in Telugu (తెలుగులో సమాధానం ఇవ్వండి)
- If the language is Marathi, respond in Marathi (मराठीत उत्तर द्या)
- If the language is Gujarati, respond in Gujarati (ગુજરાતીમાં જવાબ આપો)
- If the language is Kannada, respond in Kannada (ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ)
- If the language is Malayalam, respond in Malayalam (മലയാളത്തിൽ മറുപടി നൽകുക)
- If the language is Punjabi, respond in Punjabi (ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ)
- If the language is Odia, respond in Odia (ଓଡ଼ିଆରେ ଉତ୍ତର ଦିଅନ୍ତୁ)
- If the language is Urdu, respond in Urdu (اردو میں جواب دیں)
- If the language is Assamese, respond in Assamese (অসমীয়াত উত্তৰ দিয়ক)
- For any other Indian language, respond in that language only.
- Only use English if specifically asked or if language is set to English.

DO NOT respond in English unless the selected language is English.
Your entire response must be in ${language}.

Be friendly, educational, and helpful. Explain concepts clearly for students.`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://learnai-backend-1.onrender.com',
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