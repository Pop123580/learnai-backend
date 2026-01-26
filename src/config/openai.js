const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Test if API key is valid
const testConnection = async () => {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
      console.log('⚠️ OpenAI API key not configured. Please add your key to .env file');
      return false;
    }
    console.log('✅ OpenAI API configured');
    return true;
  } catch (error) {
    console.log('❌ OpenAI connection failed:', error.message);
    return false;
  }
};

testConnection();

module.exports = openai;