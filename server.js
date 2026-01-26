const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Import Routes
const chatbotRoutes = require('./src/routes/chatbotRoutes');
const summarizerRoutes = require('./src/routes/summarizerRoutes');
const studyPlanRoutes = require('./src/routes/studyPlanRoutes');
const examPrepRoutes = require('./src/routes/examPrepRoutes');

// Use Routes
app.use('/api/chat', chatbotRoutes);
app.use('/api/summarizer', summarizerRoutes);
app.use('/api/study-plan', studyPlanRoutes);
app.use('/api/exam-prep', examPrepRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'LearnAI Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  🚀 LearnAI Backend Server Running!
  
  📍 Local:    http://localhost:${PORT}
  📍 API:      http://localhost:${PORT}/api
  📍 Health:   http://localhost:${PORT}/api/health
  
  📚 Endpoints:
     • POST /api/chat/ask          - AI Chatbot
     • POST /api/summarizer/text   - Summarize Text
     • POST /api/summarizer/pdf    - Summarize PDF
     • POST /api/study-plan        - Create Study Plan
     • POST /api/exam-prep         - Create Exam Plan
  `);
});