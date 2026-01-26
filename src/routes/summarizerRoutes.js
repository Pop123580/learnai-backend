const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdf = require('pdf-parse');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/text', async function(req, res) {
  try {
    var text = req.body.text;
    var len = req.body.length || 'medium';
    var sty = req.body.style || 'bullet';

    if (!text || text.length < 50) {
      return res.status(400).json({ 
        success: false, 
        message: 'Text must be at least 50 characters' 
      });
    }

    var prompt = 'Summarize the following text. Length: ' + len + '. Style: ' + sty + '.\n\n' + text;

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
            content: 'You are an expert summarizer. Create clear summaries for students.'
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
      throw new Error(data.error?.message || 'API request failed');
    }

    res.json({
      success: true,
      data: { 
        summary: data.choices[0].message.content
      }
    });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to summarize'
    });
  }
});

router.post('/pdf', upload.single('file'), async function(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    var len = req.body.length || 'medium';
    var sty = req.body.style || 'bullet';
    var text = '';
    
    if (req.file.originalname.endsWith('.txt')) {
      text = req.file.buffer.toString('utf-8');
    } else if (req.file.originalname.endsWith('.pdf')) {
      try {
        var pdfData = await pdf(req.file.buffer);
        text = pdfData.text;
      } catch (pdfError) {
        console.error('PDF error:', pdfError);
        return res.status(400).json({
          success: false,
          message: 'Could not read PDF. Please paste text instead.'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please upload PDF or TXT files only.'
      });
    }

    if (!text || text.length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Not enough text in file.'
      });
    }

    if (text.length > 15000) {
      text = text.substring(0, 15000);
    }

    var prompt = 'Summarize this document. Length: ' + len + '. Style: ' + sty + '.\n\n' + text;

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
            content: 'You summarize documents for students.'
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
        summary: data.choices[0].message.content,
        fileName: req.file.originalname
      }
    });
  } catch (error) {
    console.error('PDF error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to process file'
    });
  }
});

module.exports = router;