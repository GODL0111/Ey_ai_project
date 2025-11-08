const express = require('express');
const router = express.Router();
const MasterAgent = require('../agents/MasterAgent');
const SalesAgent = require('../agents/SalesAgent');
const VerificationAgent = require('../agents/VerificationAgent');
const UnderwritingAgent = require('../agents/UnderwritingAgent');
const DocumentGenerator = require('../agents/DocumentGenerator');

// Route for individual agent testing (useful for development)
router.post('/sales/message', async (req, res) => {
  try {
    const salesAgent = new SalesAgent();
    const { session, message, context } = req.body;
    
    const response = await salesAgent.handleMessage(session, message, context);
    res.json(response);
  } catch (error) {
    console.error('Sales agent error:', error);
    res.status(500).json({ error: 'Sales agent processing failed' });
  }
});

router.post('/verification/message', async (req, res) => {
  try {
    const verificationAgent = new VerificationAgent();
    const { session, message, context } = req.body;
    
    const response = await verificationAgent.handleMessage(session, message, context);
    res.json(response);
  } catch (error) {
    console.error('Verification agent error:', error);
    res.status(500).json({ error: 'Verification agent processing failed' });
  }
});

router.post('/underwriting/message', async (req, res) => {
  try {
    const underwritingAgent = new UnderwritingAgent();
    const { session, message, context } = req.body;
    
    const response = await underwritingAgent.handleMessage(session, message, context);
    res.json(response);
  } catch (error) {
    console.error('Underwriting agent error:', error);
    res.status(500).json({ error: 'Underwriting agent processing failed' });
  }
});

router.post('/document-generator/message', async (req, res) => {
  try {
    const documentGenerator = new DocumentGenerator();
    const { session, message, context } = req.body;
    
    const response = await documentGenerator.handleMessage(session, message, context);
    res.json(response);
  } catch (error) {
    console.error('Document generator error:', error);
    res.status(500).json({ error: 'Document generator processing failed' });
  }
});

// Agent health check endpoints
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    agents: {
      master: 'active',
      sales: 'active',
      verification: 'active',
      underwriting: 'active',
      documentGenerator: 'active'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;