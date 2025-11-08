const CreditBureauService = require('../mock-apis/CreditBureauService');
const OfferService = require('../mock-apis/OfferService');

class UnderwritingAgent {
  constructor() {
    this.creditBureauService = new CreditBureauService();
    this.offerService = new OfferService();
  }
  
  async handleMessage(session, message, context) {
    // Auto-trigger credit assessment if just entering underwriting state
    if (!session.context.creditAssessmentStarted) {
      return await this.startCreditAssessment(session);
    }
    
    const messageType = this.classifyMessage(message);
    
    switch (messageType) {
      case 'STATUS_CHECK':
        return await this.handleStatusCheck(session, message);
      
      case 'OFFER_ACCEPTANCE':
        return await this.handleOfferAcceptance(session, message);
      
      case 'OFFER_MODIFICATION':
        return await this.handleOfferModification(session, message);
      
      case 'CREDIT_INQUIRY':
        return await this.handleCreditInquiry(session, message);
      
      default:
        return await this.handleGeneralUnderwriting(session, message);
    }
  }
  
  async startCreditAssessment(session) {
    session.context.creditAssessmentStarted = true;
    
    // Simulate credit check delay
    setTimeout(async () => {
      try {
        await this.performCreditAssessment(session);
      } catch (error) {
        console.error('Credit assessment error:', error);
      }
    }, 3000);
    
    return {
      id: Date.now(),
      content: "🔍 **Credit Assessment in Progress**\n\nI'm now checking your credit profile with the credit bureau to determine your loan eligibility and terms. This includes:\n\n• Credit score verification\n• Payment history analysis\n• Debt-to-income ratio calculation\n• Risk assessment\n\nThis will take just a moment...",
      sender: 'bot',
      timestamp: new Date().toISOString(),
      agentType: 'underwriting',
      isProcessing: true
    };
  }
  
  async performCreditAssessment(session) {
    try {
      if (!session.customerData || !session.customerData.panCard) {
        throw new Error('Missing customer PAN card for credit check');
      }
      
      // Perform credit bureau check
      const creditResponse = await this.creditBureauService.performCreditCheck(
        session.customerData.id,
        session.customerData.panCard
      );
      
      if (!creditResponse.success) {
        // Send failure message
        const failureMessage = {
          id: Date.now(),
          content: "I apologize, but I'm having trouble accessing your credit information right now. Our underwriting team will manually review your application. You should hear back within 24 hours. Is there anything else I can help you with?",
          sender: 'bot',
          timestamp: new Date().toISOString(),
          agentType: 'underwriting',
          suggestions: ['Check back later', 'Contact customer service', 'Apply with different details']
        };
        
        // In a real implementation, this would be sent via WebSocket or polling
        session.conversationHistory.push(failureMessage);
        return;
      }
      
      session.context.creditAssessment = creditResponse.data;
      
      // Generate personalized offer based on credit assessment
      const requestedAmount = session.context.requestedAmount || 500000;
      const tenure = session.context.requestedTenure || 36;
      
      const offerResponse = await this.offerService.generatePersonalizedOffer(
        session.customerData,
        creditResponse.data,
        requestedAmount,
        tenure
      );
      
      if (offerResponse.success) {
        session.context.finalOffer = offerResponse.data;
        
        const approvalMessage = {
          id: Date.now(),
          content: this.generateApprovalMessage(creditResponse.data, offerResponse.data),
          sender: 'bot',
          timestamp: new Date().toISOString(),
          agentType: 'underwriting',
          suggestions: ['Accept this offer', 'Modify loan terms', 'I have questions', 'See detailed breakdown']
        };
        
        session.conversationHistory.push(approvalMessage);
      } else {
        const rejectionMessage = {
          id: Date.now(),
          content: this.generateRejectionMessage(creditResponse.data),
          sender: 'bot',
          timestamp: new Date().toISOString(),
          agentType: 'underwriting',
          suggestions: ['Why was I rejected?', 'Apply for smaller amount', 'Improve credit score tips']
        };
        
        session.conversationHistory.push(rejectionMessage);
      }
    } catch (error) {
      console.error('Credit assessment error:', error);
      
      const errorMessage = {
        id: Date.now(),
        content: "I encountered an issue during the credit assessment. Our team will review your application manually and get back to you within 24 hours. Thank you for your patience!",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'underwriting'
      };
      
      session.conversationHistory.push(errorMessage);
    }
  }
  
  generateApprovalMessage(creditData, offer) {
    return `🎉 **Congratulations! Your loan is APPROVED!**\n\n📊 **Your Credit Profile:**\n• Credit Score: ${creditData.creditScore} (${creditData.creditGrade})\n• Risk Level: ${creditData.riskAssessment}\n\n💰 **Final Loan Offer:**\n• **Approved Amount:** ₹${offer.approvedAmount.toLocaleString()}\n• **Interest Rate:** ${offer.interestRate}% p.a.\n• **Monthly EMI:** ₹${offer.monthlyEmi.toLocaleString()}\n• **Tenure:** ${offer.tenure} months\n• **Processing Fee:** ${offer.processingFee}% (₹${(offer.approvedAmount * offer.processingFee / 100).toLocaleString()})\n\n⏰ **Total Payable:** ₹${offer.totalAmount.toLocaleString()}\n💵 **Total Interest:** ₹${offer.totalInterest.toLocaleString()}\n\n✅ **Next Steps:**\n• Offer valid until: ${new Date(offer.validUntil).toLocaleDateString()}\n• Funds will be disbursed in ${offer.terms.disbursementTime}\n\nWould you like to accept this offer and proceed to loan sanction?`;
  }
  
  generateRejectionMessage(creditData) {
    let reason = '';
    if (creditData.creditScore < 550) {
      reason = 'credit score below minimum requirement';
    } else if (creditData.riskAssessment === 'HIGH') {
      reason = 'high risk profile detected';
    } else {
      reason = 'current credit profile assessment';
    }
    
    return `😔 **Application Status Update**\n\nAfter careful review of your credit profile, we're unable to approve your loan application at this time due to ${reason}.\n\n📊 **Your Credit Details:**\n• Credit Score: ${creditData.creditScore}\n• Assessment: ${creditData.riskAssessment} risk\n\n💡 **What you can do:**\n• Apply for a smaller loan amount\n• Improve your credit score and reapply in 3-6 months\n• Consider a secured loan option\n• Speak with our credit counselor\n\nWould you like to explore alternative options or get tips to improve your credit score?`;
  }
  
  async handleStatusCheck(session, message) {
    if (session.context.finalOffer) {
      return {
        id: Date.now(),
        content: `Your loan application status: **APPROVED** ✅\n\nApproved Amount: ₹${session.context.finalOffer.approvedAmount.toLocaleString()}\nInterest Rate: ${session.context.finalOffer.interestRate}%\nMonthly EMI: ₹${session.context.finalOffer.monthlyEmi.toLocaleString()}\n\nThis offer is valid until ${new Date(session.context.finalOffer.validUntil).toLocaleDateString()}. Would you like to accept it?`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'underwriting',
        suggestions: ['Accept offer', 'Modify terms', 'Get more details']
      };
    } else if (session.context.creditAssessmentStarted) {
      return {
        id: Date.now(),
        content: "Your credit assessment is still in progress. I'm analyzing your credit profile and calculating the best possible terms for you. This should complete shortly.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'underwriting',
        suggestions: ['Wait for results', 'I have questions', 'Check back later']
      };
    } else {
      return {
        id: Date.now(),
        content: "Let me check your application status and start the credit assessment process.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'underwriting'
      };
    }
  }
  
  async handleOfferAcceptance(session, message) {
    if (!session.context.finalOffer) {
      return {
        id: Date.now(),
        content: "I don't see a current offer to accept. Let me complete your credit assessment first.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'underwriting'
      };
    }
    
    // Move to document generation
    session.state = 'DOCUMENT_GENERATION';
    session.currentAgent = 'document_generator';
    session.context.offerAccepted = true;
    session.context.acceptedAt = new Date().toISOString();
    
    return {
      id: Date.now(),
      content: "🎉 **Offer Accepted Successfully!**\n\nThank you for accepting our loan offer. I'm now generating your loan sanction letter and setting up the disbursement process.\n\nYou'll receive:\n✅ Loan sanction letter\n✅ Repayment schedule\n✅ Terms and conditions\n✅ Disbursement details\n\nProcessing your documents now...",
      sender: 'bot',
      timestamp: new Date().toISOString(),
      agentType: 'underwriting',
      handover: true
    };
  }
  
  async handleOfferModification(session, message) {
    if (!session.context.finalOffer) {
      return {
        id: Date.now(),
        content: "I need to complete your credit assessment before we can discuss loan modifications. Let me do that first.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'underwriting'
      };
    }
    
    return {
      id: Date.now(),
      content: `I understand you'd like to modify the loan terms. Here are the current terms:\n\n💰 Amount: ₹${session.context.finalOffer.approvedAmount.toLocaleString()}\n📅 Tenure: ${session.context.finalOffer.tenure} months\n💳 EMI: ₹${session.context.finalOffer.monthlyEmi.toLocaleString()}\n\nWhat would you like to change? I can adjust the loan amount (within your approved limit) or tenure.`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      agentType: 'underwriting',
      suggestions: ['Reduce EMI amount', 'Change loan amount', 'Extend tenure', 'Show me options']
    };
  }
  
  async handleCreditInquiry(session, message) {
    if (session.context.creditAssessment) {
      const credit = session.context.creditAssessment;
      
      return {
        id: Date.now(),
        content: `📊 **Your Credit Profile Summary:**\n\n🏆 **Credit Score:** ${credit.creditScore} (${credit.creditGrade})\n⚖️ **Risk Assessment:** ${credit.riskAssessment}\n💰 **Max Eligible Amount:** ₹${credit.maxLoanAmount.toLocaleString()}\n📈 **Recommended Rate:** ${credit.recommendedInterestRate}% p.a.\n\nYour excellent credit profile qualifies you for our best rates! Any specific questions about your credit assessment?`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'underwriting',
        suggestions: ['How to improve credit score?', 'Why this interest rate?', 'Can I get better terms?']
      };
    } else {
      return {
        id: Date.now(),
        content: "I'm still processing your credit assessment. Once complete, I'll share detailed insights about your credit profile and how it affects your loan terms.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'underwriting'
      };
    }
  }
  
  async handleGeneralUnderwriting(session, message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('how long') || lowerMessage.includes('when') || lowerMessage.includes('time')) {
      return {
        id: Date.now(),
        content: "Our underwriting process is designed to be quick:\n\n⚡ **Credit Check:** 2-3 minutes\n📋 **Application Review:** 10-15 minutes\n✅ **Final Approval:** Within 24 hours\n💰 **Fund Disbursement:** 24-48 hours after acceptance\n\nYou're currently in the credit assessment phase. Almost done!",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'underwriting',
        suggestions: ['Check my status', 'What happens next?', 'I have questions']
      };
    }
    
    if (lowerMessage.includes('reject') || lowerMessage.includes('deny') || lowerMessage.includes('refuse')) {
      return {
        id: Date.now(),
        content: "Don't worry! Our approval rates are quite high, especially for customers with good credit profiles like yours. Even if the initial assessment needs adjustment, we often find alternative solutions like:\n\n• Different loan amounts\n• Adjusted tenure options\n• Co-applicant possibilities\n• Secured loan alternatives\n\nLet me complete your assessment first - I'm optimistic about your application!",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'underwriting',
        suggestions: ['Continue assessment', 'What affects approval?', 'Tell me about alternatives']
      };
    }
    
    return {
      id: Date.now(),
      content: "I'm here to guide you through the underwriting process. This involves analyzing your credit profile to determine the best loan terms for you. Do you have any specific questions about credit assessment or loan approval?",
      sender: 'bot',
      timestamp: new Date().toISOString(),
      agentType: 'underwriting',
      suggestions: ['Check assessment status', 'How does credit scoring work?', 'What determines my rate?']
    };
  }
  
  classifyMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('status') || lowerMessage.includes('progress') || lowerMessage.includes('update')) {
      return 'STATUS_CHECK';
    }
    
    if (lowerMessage.includes('accept') || lowerMessage.includes('yes') || lowerMessage.includes('proceed') || 
        lowerMessage.includes('agree')) {
      return 'OFFER_ACCEPTANCE';
    }
    
    if (lowerMessage.includes('modify') || lowerMessage.includes('change') || lowerMessage.includes('different') ||
        lowerMessage.includes('reduce') || lowerMessage.includes('increase') || lowerMessage.includes('tenure')) {
      return 'OFFER_MODIFICATION';
    }
    
    if (lowerMessage.includes('credit') || lowerMessage.includes('score') || lowerMessage.includes('rating') ||
        lowerMessage.includes('assessment')) {
      return 'CREDIT_INQUIRY';
    }
    
    return 'GENERAL_UNDERWRITING';
  }
}

module.exports = UnderwritingAgent;