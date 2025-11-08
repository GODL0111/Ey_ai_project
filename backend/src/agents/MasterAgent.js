const SalesAgent = require('./SalesAgent');
const VerificationAgent = require('./VerificationAgent');
const UnderwritingAgent = require('./UnderwritingAgent');
const DocumentGenerator = require('./DocumentGenerator');

class MasterAgent {
  constructor() {
    this.salesAgent = new SalesAgent();
    this.verificationAgent = new VerificationAgent();
    this.underwritingAgent = new UnderwritingAgent();
    this.documentGenerator = new DocumentGenerator();
    
    // Session storage (in production, use Redis or a database)
    this.sessions = new Map();
  }
  
  async processMessage({ message, sessionId, context = {} }) {
    try {
      // Get or create session
      let session = this.sessions.get(sessionId) || {
        id: sessionId,
        state: 'INITIAL',
        customerData: null,
        conversationHistory: [],
        currentAgent: 'master',
        context: {}
      };
      
      // Add user message to history
      session.conversationHistory.push({
        id: Date.now(),
        content: message,
        sender: 'user',
        timestamp: new Date().toISOString()
      });
      
      // Determine the appropriate agent and route the message
      const response = await this.routeMessage(session, message, context);
      
      // Add bot response to history
      session.conversationHistory.push(response);
      
      // Update session
      this.sessions.set(sessionId, session);
      
      return {
        ...response,
        sessionId,
        conversationState: session.state,
        suggestions: this.generateSuggestions(session)
      };
    } catch (error) {
      console.error('Master Agent error:', error);
      return {
        id: Date.now(),
        content: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'master',
        error: true
      };
    }
  }
  
  async routeMessage(session, message, context) {
    const messageType = this.classifyMessage(message, session);
    
    switch (session.state) {
      case 'INITIAL':
        return await this.handleInitialInteraction(session, message, messageType);
      
      case 'CUSTOMER_IDENTIFICATION':
        return await this.handleCustomerIdentification(session, message, messageType);
      
      case 'PRODUCT_INQUIRY':
        return await this.salesAgent.handleMessage(session, message, context);
      
      case 'LOAN_APPLICATION':
        return await this.salesAgent.handleLoanApplication(session, message, context);
      
      case 'VERIFICATION':
        return await this.verificationAgent.handleMessage(session, message, context);
      
      case 'UNDERWRITING':
        return await this.underwritingAgent.handleMessage(session, message, context);
      
      case 'DOCUMENT_GENERATION':
        return await this.documentGenerator.handleMessage(session, message, context);
      
      case 'COMPLETED':
        return await this.handleCompletedFlow(session, message, messageType);
      
      default:
        return await this.handleUnknownState(session, message);
    }
  }
  
  async handleInitialInteraction(session, message, messageType) {
    const loanKeywords = ['loan', 'borrow', 'money', 'credit', 'finance', 'emi'];
    const isLoanInquiry = loanKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    
    if (isLoanInquiry) {
      session.state = 'CUSTOMER_IDENTIFICATION';
      session.currentAgent = 'master';
      
      return {
        id: Date.now(),
        content: "I'd be happy to help you explore our personal loan options! To get started, could you please provide your mobile number so I can check for any pre-approved offers?",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'master',
        suggestions: ['I want to apply for a personal loan', 'What are your interest rates?', 'Check my eligibility']
      };
    } else {
      return {
        id: Date.now(),
        content: "Welcome to Tata Capital! I'm Maya, your personal financial assistant. I can help you with personal loans, check your eligibility, and guide you through the application process. How can I assist you today?",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'master',
        suggestions: ['I need a personal loan', 'Check loan eligibility', 'What documents do I need?']
      };
    }
  }
  
  async handleCustomerIdentification(session, message, messageType) {
    // Extract phone number from message
    const phoneMatch = message.match(/\b\d{10}\b/);
    
    if (phoneMatch) {
      const phoneNumber = phoneMatch[0];
      
      // Use CRM service to look up customer
      try {
        const customerResponse = await this.verificationAgent.lookupCustomer(phoneNumber);
        
        if (customerResponse.success) {
          session.customerData = customerResponse.data;
          session.state = 'PRODUCT_INQUIRY';
          session.currentAgent = 'sales';
          
          return {
            id: Date.now(),
            content: `Thank you! I found your profile, ${customerResponse.data.name}. I can see you have some excellent pre-approved loan offers. How much would you like to borrow?`,
            sender: 'bot',
            timestamp: new Date().toISOString(),
            agentType: 'sales',
            suggestions: ['₹2 lakhs', '₹5 lakhs', '₹10 lakhs', 'Show me all options']
          };
        } else {
          return {
            id: Date.now(),
            content: "I couldn't find your profile with this number. Don't worry, you can still apply for a loan! Could you please provide your full name and email address to get started?",
            sender: 'bot',
            timestamp: new Date().toISOString(),
            agentType: 'verification',
            suggestions: ['I\'ll provide my details', 'Try a different number', 'Start fresh application']
          };
        }
      } catch (error) {
        return {
          id: Date.now(),
          content: "I'm having trouble accessing your information right now. Could you please try again or provide your name and email to start a new application?",
          sender: 'bot',
          timestamp: new Date().toISOString(),
          agentType: 'master'
        };
      }
    } else {
      return {
        id: Date.now(),
        content: "I need your 10-digit mobile number to check for pre-approved offers. Please share your registered mobile number.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'master',
        suggestions: ['Let me enter my number', 'I don\'t remember my registered number']
      };
    }
  }
  
  async handleCompletedFlow(session, message, messageType) {
    const helpKeywords = ['help', 'question', 'issue', 'problem'];
    const newLoanKeywords = ['new loan', 'another loan', 'more money'];
    
    if (newLoanKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      // Reset for new loan application
      session.state = 'PRODUCT_INQUIRY';
      session.currentAgent = 'sales';
      
      return {
        id: Date.now(),
        content: "I'd be happy to help you with another loan application! How much are you looking to borrow this time?",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'sales'
      };
    } else if (helpKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      return {
        id: Date.now(),
        content: "I'm here to help! You can ask me about your loan status, EMI details, payment options, or start a new loan application. What would you like to know?",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'master',
        suggestions: ['Check loan status', 'EMI payment options', 'Apply for new loan', 'Contact support']
      };
    } else {
      return {
        id: Date.now(),
        content: "Your loan application has been successfully processed! Is there anything else I can help you with today?",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'master',
        suggestions: ['Track my application', 'Apply for another loan', 'Contact customer service']
      };
    }
  }
  
  async handleUnknownState(session, message) {
    // Reset to initial state for unknown states
    session.state = 'INITIAL';
    session.currentAgent = 'master';
    
    return {
      id: Date.now(),
      content: "I apologize for the confusion. Let me help you from the beginning. Are you looking for a personal loan today?",
      sender: 'bot',
      timestamp: new Date().toISOString(),
      agentType: 'master',
      suggestions: ['Yes, I need a personal loan', 'I have questions about loans', 'Help me with existing loan']
    };
  }
  
  classifyMessage(message, session) {
    const lowerMessage = message.toLowerCase();
    
    // Intent classification
    if (lowerMessage.includes('yes') || lowerMessage.includes('okay') || lowerMessage.includes('proceed')) {
      return 'CONFIRMATION';
    }
    
    if (lowerMessage.includes('no') || lowerMessage.includes('cancel')) {
      return 'REJECTION';
    }
    
    if (lowerMessage.match(/\d+/) && (lowerMessage.includes('lakh') || lowerMessage.includes('₹'))) {
      return 'AMOUNT_SPECIFICATION';
    }
    
    if (lowerMessage.match(/\b\d{10}\b/)) {
      return 'PHONE_NUMBER';
    }
    
    if (lowerMessage.includes('document') || lowerMessage.includes('upload') || lowerMessage.includes('file')) {
      return 'DOCUMENT_RELATED';
    }
    
    return 'GENERAL_INQUIRY';
  }
  
  generateSuggestions(session) {
    switch (session.state) {
      case 'INITIAL':
        return ['I need a personal loan', 'Check my eligibility', 'What are your rates?'];
      
      case 'CUSTOMER_IDENTIFICATION':
        return ['Let me provide my number', 'I\'m a new customer'];
      
      case 'PRODUCT_INQUIRY':
        return ['₹2 lakhs', '₹5 lakhs', '₹10 lakhs'];
      
      case 'VERIFICATION':
        return ['Upload documents', 'I have questions', 'Proceed with verification'];
      
      case 'UNDERWRITING':
        return ['Check my status', 'I have questions', 'Proceed'];
      
      default:
        return ['Help', 'Start over', 'Contact support'];
    }
  }
  
  async getConversationHistory(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? session.conversationHistory : [];
  }
  
  async resetSession(sessionId) {
    this.sessions.delete(sessionId);
    return true;
  }
}

module.exports = MasterAgent;