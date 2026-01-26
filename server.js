const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

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
    message: 'LearnAI Backend is running!'
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log('');
  console.log('==========================================');
  console.log('   LearnAI Backend Server Running!');
  console.log('==========================================');
  console.log('');
  console.log('   URL: http://localhost:' + PORT);
  console.log('');
});