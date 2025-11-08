const OfferService = require('../mock-apis/OfferService');

class SalesAgent {
  constructor() {
    this.offerService = new OfferService();
  }
  
  async handleMessage(session, message, context) {
    const messageType = this.classifyMessage(message);
    
    switch (messageType) {
      case 'AMOUNT_INQUIRY':
        return await this.handleAmountInquiry(session, message);
      
      case 'RATE_INQUIRY':
        return await this.handleRateInquiry(session, message);
      
      case 'PRODUCT_COMPARISON':
        return await this.handleProductComparison(session, message);
      
      case 'LOAN_APPLICATION':
        return await this.handleLoanApplication(session, message, context);
      
      default:
        return await this.handleGeneralSalesInquiry(session, message);
    }
  }
  
  async handleAmountInquiry(session, message) {
    // Extract amount from message
    const amountMatch = message.match(/(\d+)\s*(lakh|lakhs|₹|rs)/i);
    let requestedAmount = 0;
    
    if (amountMatch) {
      const number = parseInt(amountMatch[1]);
      if (message.toLowerCase().includes('lakh')) {
        requestedAmount = number * 100000;
      } else {
        requestedAmount = number;
      }
    }
    
    if (requestedAmount > 0) {
      // Store requested amount in session
      session.context.requestedAmount = requestedAmount;
      
      // Get customer offers
      if (session.customerData) {
        try {
          const offersResponse = await this.offerService.getPreApprovedOffers(session.customerData.id);
          
          if (offersResponse.success && offersResponse.data.length > 0) {
            const personalLoanOffers = offersResponse.data.filter(offer => 
              offer.productType === 'PERSONAL_LOAN'
            );
            
            if (personalLoanOffers.length > 0) {
              const bestOffer = personalLoanOffers[0];
              
              if (requestedAmount <= bestOffer.maxAmount) {
                // Calculate EMI for requested amount
                const emiResponse = await this.offerService.calculateEMI(
                  requestedAmount, 
                  bestOffer.interestRate, 
                  36 // default 3 years
                );
                
                if (emiResponse.success) {
                  session.state = 'LOAN_APPLICATION';
                  session.context.selectedOffer = {
                    ...bestOffer,
                    approvedAmount: requestedAmount,
                    monthlyEmi: emiResponse.data.emi,
                    totalAmount: emiResponse.data.totalAmount,
                    totalInterest: emiResponse.data.totalInterest
                  };
                  
                  return {
                    id: Date.now(),
                    content: `Perfect! For a loan of ₹${(requestedAmount/100000).toFixed(1)} lakhs at ${bestOffer.interestRate}% interest rate:\n\n📊 Monthly EMI: ₹${emiResponse.data.emi.toLocaleString()}\n⏱️ Tenure: 36 months\n💰 Total Amount: ₹${emiResponse.data.totalAmount.toLocaleString()}\n\nThis offer is valid for 30 days. Would you like to proceed with this application?`,
                    sender: 'bot',
                    timestamp: new Date().toISOString(),
                    agentType: 'sales',
                    suggestions: ['Yes, proceed', 'Show me other tenure options', 'I have questions']
                  };
                }
              } else {
                return {
                  id: Date.now(),
                  content: `I understand you're looking for ₹${(requestedAmount/100000).toFixed(1)} lakhs. Based on your profile, you're pre-approved for up to ₹${(bestOffer.maxAmount/100000).toFixed(1)} lakhs at ${bestOffer.interestRate}% interest rate. Would you like to proceed with the maximum approved amount?`,
                  sender: 'bot',
                  timestamp: new Date().toISOString(),
                  agentType: 'sales',
                  suggestions: ['Accept max amount', 'Tell me why limit is lower', 'Check other options']
                };
              }
            }
          }
        } catch (error) {
          console.error('Offer retrieval error:', error);
        }
      }
      
      // Fallback for customers without pre-approved offers
      return {
        id: Date.now(),
        content: `You're looking for ₹${(requestedAmount/100000).toFixed(1)} lakhs. Let me check your eligibility and get you the best rates. To proceed, I'll need to verify a few details. Shall we start with the application process?`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'sales',
        suggestions: ['Yes, let\'s start', 'What documents do I need?', 'Tell me about interest rates']
      };
    } else {
      return {
        id: Date.now(),
        content: "I'd be happy to help you find the right loan amount! Could you specify how much you're looking to borrow? For example, ₹2 lakhs, ₹5 lakhs, or ₹10 lakhs?",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'sales',
        suggestions: ['₹2 lakhs', '₹5 lakhs', '₹10 lakhs', 'I need help deciding']
      };
    }
  }
  
  async handleRateInquiry(session, message) {
    return {
      id: Date.now(),
      content: `Our personal loan interest rates are highly competitive:\n\n🏆 For Excellent Credit (750+): Starting from 10.5% p.a.\n⭐ For Good Credit (650-749): Starting from 12.0% p.a.\n📈 For Fair Credit (550-649): Starting from 14.0% p.a.\n\nYour actual rate depends on your credit profile and loan amount. Would you like me to check your personalized rate?`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      agentType: 'sales',
      suggestions: ['Check my rate', 'What affects interest rates?', 'Compare with other banks']
    };
  }
  
  async handleProductComparison(session, message) {
    return {
      id: Date.now(),
      content: `Here's why customers choose Tata Capital Personal Loans:\n\n✅ Quick approval in 24 hours\n✅ Minimal documentation\n✅ Flexible repayment options (12-60 months)\n✅ No hidden charges\n✅ Doorstep service available\n✅ Pre-payment allowed after 12 months\n\nLoan amounts: ₹50,000 to ₹35 lakhs\nProcessing fee: Just 1-2% of loan amount\n\nWould you like to check your eligibility?`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      agentType: 'sales',
      suggestions: ['Check eligibility', 'Apply now', 'Compare with competitors']
    };
  }
  
  async handleLoanApplication(session, message, context) {
    // Move to verification stage
    session.state = 'VERIFICATION';
    session.currentAgent = 'verification';
    
    return {
      id: Date.now(),
      content: "Excellent! I'm starting your loan application process. To ensure quick approval, I need to verify a few details first. Let me hand you over to our verification specialist.",
      sender: 'bot',
      timestamp: new Date().toISOString(),
      agentType: 'sales',
      handover: true
    };
  }
  
  async handleGeneralSalesInquiry(session, message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('eligibility') || lowerMessage.includes('qualify')) {
      return {
        id: Date.now(),
        content: `To check your eligibility, I need some basic information:\n\n📋 Requirements:\n• Age: 21-65 years\n• Monthly Income: ₹15,000+\n• Employment: Salaried/Self-employed\n• Credit Score: 550+ preferred\n\nSince you're already in our system, you likely meet these criteria! Shall I check your detailed eligibility?`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'sales',
        suggestions: ['Yes, check eligibility', 'What is credit score?', 'I want to apply']
      };
    }
    
    if (lowerMessage.includes('documents') || lowerMessage.includes('paperwork')) {
      return {
        id: Date.now(),
        content: `We've made documentation simple! Here's what you typically need:\n\n📄 Income Proof:\n• Last 3 months salary slips\n• Bank statements (6 months)\n\n🆔 Identity Proof:\n• Aadhaar Card\n• PAN Card\n\n📍 Address Proof:\n• Utility bill/Rental agreement\n\nFor pre-approved customers like you, we may need even fewer documents! Ready to start?`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'sales',
        suggestions: ['Start application', 'I have questions', 'Upload documents later']
      };
    }
    
    return {
      id: Date.now(),
      content: "I'm here to help you find the perfect personal loan! I can assist with loan amounts, interest rates, eligibility checks, or starting your application. What would you like to know?",
      sender: 'bot',
      timestamp: new Date().toISOString(),
      agentType: 'sales',
      suggestions: ['Check loan amount', 'See interest rates', 'Start application', 'Check eligibility']
    };
  }
  
  classifyMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.match(/\d+/) && (lowerMessage.includes('lakh') || lowerMessage.includes('₹'))) {
      return 'AMOUNT_INQUIRY';
    }
    
    if (lowerMessage.includes('rate') || lowerMessage.includes('interest') || lowerMessage.includes('percentage')) {
      return 'RATE_INQUIRY';
    }
    
    if (lowerMessage.includes('compare') || lowerMessage.includes('better') || lowerMessage.includes('versus')) {
      return 'PRODUCT_COMPARISON';
    }
    
    if (lowerMessage.includes('apply') || lowerMessage.includes('proceed') || lowerMessage.includes('yes')) {
      return 'LOAN_APPLICATION';
    }
    
    return 'GENERAL_SALES_INQUIRY';
  }
}

module.exports = SalesAgent;