const express = require('express');
const router = express.Router();
const MasterAgent = require('../agents/MasterAgent');

// Initialize the Master Agent
const masterAgent = new MasterAgent();

// Main chat endpoint - handles all conversation with the Master Agent
router.post('/message', async (req, res) => {
  try {
    const { message, sessionId, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Process the message through the Master Agent
    const response = await masterAgent.processMessage({
      message,
      sessionId: sessionId || 'default-session',
      context: context || {}
    });
    
    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get conversation history
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await masterAgent.getConversationHistory(sessionId);
    res.json({ history });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation history' });
  }
});

// Reset conversation
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await masterAgent.resetSession(sessionId);
    res.json({ message: 'Session reset successfully' });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Failed to reset session' });
  }
});

module.exports = router;