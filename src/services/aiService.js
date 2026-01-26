const openai = require('../config/openai');

class AIService {
  // Chat with AI
  async chat(message, language = 'English', conversationHistory = []) {
    try {
      const systemPrompt = `You are LearnAI, an intelligent educational assistant. You help students with:
- Answering academic questions clearly and thoroughly
- Explaining complex concepts in simple terms
- Providing study tips and learning strategies
- Helping with homework and assignments

IMPORTANT: Always respond in ${language}. Be friendly, encouraging, and educational.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      });

      return {
        success: true,
        message: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw new Error(error.message || 'Failed to get AI response');
    }
  }

  // Summarize Text
  async summarizeText(text, options = {}) {
    try {
      const { length = 'medium', style = 'bullet' } = options;

      const lengthInstructions = {
        short: 'Create a very brief summary in 2-3 sentences.',
        medium: 'Create a comprehensive summary with key points.',
        long: 'Create a detailed summary covering all important aspects.'
      };

      const styleInstructions = {
        bullet: 'Use bullet points for clarity.',
        paragraph: 'Write in paragraph form.',
        outline: 'Create an outline format with main topics and subtopics.'
      };

      const prompt = `Summarize the following text for a student studying this material.

${lengthInstructions[length]}
${styleInstructions[style]}

Include:
- Main concepts and ideas
- Key terms and definitions
- Important facts and figures
- Relationships between concepts

TEXT TO SUMMARIZE:
${text}

Provide the summary in a clear, educational format:`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert academic summarizer. Create clear, concise summaries that help students learn and retain information effectively.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.5
      });

      return {
        success: true,
        summary: response.choices[0].message.content,
        originalLength: text.length,
        usage: response.usage
      };
    } catch (error) {
      console.error('Summarize Error:', error);
      throw new Error(error.message || 'Failed to summarize text');
    }
  }

  // Generate Study Plan
  async generateStudyPlan(subject, topic, duration, deadline, priority) {
    try {
      const prompt = `Create a detailed study plan for a student with the following requirements:

Subject: ${subject}
Topic: ${topic}
Available Study Time: ${duration} minutes
Deadline: ${deadline}
Priority Level: ${priority}

Generate a structured study plan that includes:
1. Session breakdown (how to divide the time)
2. Specific learning objectives
3. Recommended study techniques
4. Practice activities
5. Self-assessment checkpoints
6. Tips for effective learning

Format the response in a clear, actionable way.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert educational planner. Create effective, personalized study plans that maximize learning efficiency.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1200,
        temperature: 0.7
      });

      return {
        success: true,
        plan: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error) {
      console.error('Study Plan Error:', error);
      throw new Error(error.message || 'Failed to generate study plan');
    }
  }

  // Generate Exam Preparation Plan
  async generateExamPlan(examName, subject, examDate, topics) {
    try {
      const daysUntilExam = Math.ceil(
        (new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)
      );

      const prompt = `Create a comprehensive exam preparation plan:

Exam: ${examName}
Subject: ${subject}
Days Until Exam: ${daysUntilExam} days
Topics to Cover: ${topics.join(', ')}

Generate a detailed preparation strategy that includes:
1. Day-by-day study schedule
2. Topic prioritization (based on complexity and importance)
3. Recommended study methods for each topic
4. Practice test schedule
5. Revision strategy for final days
6. Tips for exam day
7. Common mistakes to avoid

Make the plan realistic and achievable within the timeframe.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert exam preparation coach. Create strategic, comprehensive exam prep plans that help students succeed.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.7
      });

      return {
        success: true,
        plan: response.choices[0].message.content,
        daysUntilExam,
        usage: response.usage
      };
    } catch (error) {
      console.error('Exam Plan Error:', error);
      throw new Error(error.message || 'Failed to generate exam plan');
    }
  }
}

module.exports = new AIService();