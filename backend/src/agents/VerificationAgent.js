const CRMService = require('../mock-apis/CRMService');

class VerificationAgent {
  constructor() {
    this.crmService = new CRMService();
  }
  
  async handleMessage(session, message, context) {
    const messageType = this.classifyMessage(message);
    
    switch (messageType) {
      case 'IDENTITY_CONFIRMATION':
        return await this.handleIdentityConfirmation(session, message);
      
      case 'DOCUMENT_UPLOAD':
        return await this.handleDocumentUpload(session, message, context);
      
      case 'ADDRESS_VERIFICATION':
        return await this.handleAddressVerification(session, message);
      
      case 'INCOME_VERIFICATION':
        return await this.handleIncomeVerification(session, message);
      
      default:
        return await this.handleGeneralVerification(session, message);
    }
  }
  
  async handleIdentityConfirmation(session, message) {
    if (!session.customerData) {
      return {
        id: Date.now(),
        content: "I need to verify your identity first. Could you please provide your full name and date of birth?",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'verification',
        suggestions: ['I\'ll provide my details', 'Why do you need this?', 'Is my data safe?']
      };
    }
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('yes') || lowerMessage.includes('correct') || lowerMessage.includes('confirm')) {
      // Identity confirmed, proceed to address verification
      session.context.identityVerified = true;
      
      return {
        id: Date.now(),
        content: `Thank you for confirming your identity, ${session.customerData.name}. Now I need to verify your current address. Is your address still:\n\n${session.customerData.address}?\n\nPlease confirm if this is correct or provide your updated address.`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'verification',
        suggestions: ['Yes, address is correct', 'I have a new address', 'Why do you need address?']
      };
    } else if (lowerMessage.includes('no') || lowerMessage.includes('different') || lowerMessage.includes('changed')) {
      return {
        id: Date.now(),
        content: "I understand there might be some changes in your details. For security purposes, I need to update your information. Could you please provide your current full name and date of birth?",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'verification',
        suggestions: ['I\'ll provide updated details', 'Call me for verification', 'Upload ID proof']
      };
    } else {
      // First time asking for identity confirmation
      return {
        id: Date.now(),
        content: `To proceed with your loan application, I need to verify your identity. I have these details on file:\n\n👤 Name: ${session.customerData.name}\n📞 Phone: ${session.customerData.phone}\n📧 Email: ${session.customerData.email}\n\nIs this information correct?`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'verification',
        suggestions: ['Yes, all correct', 'Some details are wrong', 'I have questions']
      };
    }
  }
  
  async handleAddressVerification(session, message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('yes') || lowerMessage.includes('correct') || lowerMessage.includes('same')) {
      session.context.addressVerified = true;
      
      // Check if we have income information
      if (session.customerData.monthlyIncome) {
        return {
          id: Date.now(),
          content: `Great! Address verified. I can see your monthly income is ₹${session.customerData.monthlyIncome.toLocaleString()}. To complete the verification, could you please upload your latest salary slip or bank statement?`,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          agentType: 'verification',
          actionRequired: 'DOCUMENT_UPLOAD',
          suggestions: ['Upload salary slip', 'Upload bank statement', 'I don\'t have documents now']
        };
      } else {
        return {
          id: Date.now(),
          content: "Address verified successfully! Now I need to verify your income. What is your current monthly income?",
          sender: 'bot',
          timestamp: new Date().toISOString(),
          agentType: 'verification',
          suggestions: ['₹25,000 - ₹50,000', '₹50,000 - ₹1,00,000', 'More than ₹1,00,000']
        };
      }
    } else if (lowerMessage.includes('new') || lowerMessage.includes('different') || lowerMessage.includes('changed')) {
      return {
        id: Date.now(),
        content: "I understand you have a new address. Please provide your current complete address including pin code. This will be updated in our records.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'verification',
        suggestions: ['I\'ll type my address', 'Can I upload address proof?', 'Call me to update']
      };
    } else {
      // Treat as new address input
      if (message.length > 20) { // Assume it's an address if it's long enough
        session.context.addressVerified = true;
        session.context.updatedAddress = message;
        
        return {
          id: Date.now(),
          content: `Thank you for providing your updated address. I've noted it down for our records. Now, let's verify your income details to complete the application.`,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          agentType: 'verification',
          suggestions: ['Provide income details', 'Upload salary slip', 'I have questions']
        };
      } else {
        return {
          id: Date.now(),
          content: "Could you please provide your complete current address? I need the full address including area, city, and pin code for verification.",
          sender: 'bot',
          timestamp: new Date().toISOString(),
          agentType: 'verification'
        };
      }
    }
  }
  
  async handleIncomeVerification(session, message) {
    // Extract income amount from message
    const incomeMatch = message.match(/(\d+)[,\s]*(\d*)/);
    
    if (incomeMatch) {
      const income = parseInt(incomeMatch[1] + (incomeMatch[2] || ''));
      session.context.verifiedIncome = income;
      
      if (income >= 15000) {
        // Income meets minimum requirement
        session.context.incomeVerified = true;
        
        // Move to underwriting if all verifications are complete
        if (session.context.identityVerified && session.context.addressVerified) {
          session.state = 'UNDERWRITING';
          session.currentAgent = 'underwriting';
          
          return {
            id: Date.now(),
            content: `Perfect! Your monthly income of ₹${income.toLocaleString()} meets our requirements. All verifications are complete. I'm now processing your application for credit assessment. This will take just a moment...`,
            sender: 'bot',
            timestamp: new Date().toISOString(),
            agentType: 'verification',
            handover: true
          };
        } else {
          return {
            id: Date.now(),
            content: `Income verified: ₹${income.toLocaleString()} per month. To complete verification, please upload your latest salary slip or bank statement.`,
            sender: 'bot',
            timestamp: new Date().toISOString(),
            agentType: 'verification',
            actionRequired: 'DOCUMENT_UPLOAD',
            suggestions: ['Upload document', 'I don\'t have it now', 'Email me the requirements']
          };
        }
      } else {
        return {
          id: Date.now(),
          content: "I see your monthly income is ₹" + income.toLocaleString() + ". Our minimum income requirement is ₹15,000 per month. However, we might have other loan products that could work for you. Would you like me to check alternative options?",
          sender: 'bot',
          timestamp: new Date().toISOString(),
          agentType: 'verification',
          suggestions: ['Check other options', 'I have additional income', 'Speak to specialist']
        };
      }
    } else {
      return {
        id: Date.now(),
        content: "Could you please specify your monthly income in numbers? For example: ₹45,000 or ₹1,20,000 per month.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'verification',
        suggestions: ['₹25,000 - ₹50,000', '₹50,000 - ₹1,00,000', 'More than ₹1,00,000']
      };
    }
  }
  
  async handleDocumentUpload(session, message, context) {
    // This would be called when a document is uploaded
    if (context.uploadedFile) {
      session.context.documentsUploaded = session.context.documentsUploaded || [];
      session.context.documentsUploaded.push({
        fileName: context.uploadedFile.fileName,
        fileType: context.uploadedFile.fileType,
        uploadedAt: new Date().toISOString()
      });
      
      // Check if all required verifications are complete
      if (session.context.identityVerified && session.context.addressVerified && session.context.incomeVerified) {
        session.state = 'UNDERWRITING';
        session.currentAgent = 'underwriting';
        
        return {
          id: Date.now(),
          content: `Document uploaded successfully! I've received your ${context.uploadedFile.fileName}. All verification steps are now complete. Proceeding to credit assessment...`,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          agentType: 'verification',
          handover: true
        };
      } else {
        return {
          id: Date.now(),
          content: `Document uploaded successfully! I've received your ${context.uploadedFile.fileName}. Let me complete the remaining verification steps.`,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          agentType: 'verification',
          suggestions: ['Continue verification', 'Upload another document', 'Check status']
        };
      }
    } else {
      return {
        id: Date.now(),
        content: "I'm ready to receive your document. Please upload your latest salary slip, bank statement, or income proof. Supported formats: PDF, JPG, PNG (max 5MB).",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'verification',
        actionRequired: 'DOCUMENT_UPLOAD',
        suggestions: ['Upload now', 'I don\'t have documents', 'What documents do you accept?']
      };
    }
  }
  
  async handleGeneralVerification(session, message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('why') || lowerMessage.includes('need') || lowerMessage.includes('purpose')) {
      return {
        id: Date.now(),
        content: "We verify your details for these important reasons:\n\n🔒 **Security**: Protect against fraud and identity theft\n📋 **Compliance**: Meet regulatory requirements (RBI guidelines)\n⚡ **Quick Processing**: Pre-verified customers get faster approvals\n💰 **Better Rates**: Verified profiles often qualify for better interest rates\n\nYour information is completely secure and encrypted. Shall we continue with verification?",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'verification',
        suggestions: ['Continue verification', 'How is my data protected?', 'I have more questions']
      };
    }
    
    if (lowerMessage.includes('safe') || lowerMessage.includes('secure') || lowerMessage.includes('privacy')) {
      return {
        id: Date.now(),
        content: "Your data security is our top priority:\n\n🔐 256-bit SSL encryption for all data transmission\n🛡️ SOC 2 Type II certified data centers\n📊 Data used only for loan processing, never shared\n🗑️ Automatic deletion of sensitive documents after processing\n⚖️ Full compliance with RBI and Data Protection regulations\n\nReady to proceed with the secure verification process?",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'verification',
        suggestions: ['Yes, proceed', 'Tell me more about security', 'I have concerns']
      };
    }
    
    // Default verification guidance
    return {
      id: Date.now(),
      content: "I'm here to help verify your details for the loan application. This process typically involves:\n\n✅ Identity confirmation\n✅ Address verification\n✅ Income verification\n✅ Document upload\n\nWhich step would you like to start with or do you have questions about the verification process?",
      sender: 'bot',
      timestamp: new Date().toISOString(),
      agentType: 'verification',
      suggestions: ['Start identity verification', 'Verify address', 'Upload documents', 'I have questions']
    };
  }
  
  async lookupCustomer(phoneNumber) {
    return await this.crmService.getCustomerByPhone(phoneNumber);
  }
  
  classifyMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('yes') || lowerMessage.includes('correct') || lowerMessage.includes('confirm') || 
        lowerMessage.includes('no') || lowerMessage.includes('wrong') || lowerMessage.includes('different')) {
      return 'IDENTITY_CONFIRMATION';
    }
    
    if (lowerMessage.includes('upload') || lowerMessage.includes('document') || lowerMessage.includes('file')) {
      return 'DOCUMENT_UPLOAD';
    }
    
    if (lowerMessage.includes('address') || lowerMessage.includes('moved') || lowerMessage.includes('new address')) {
      return 'ADDRESS_VERIFICATION';
    }
    
    if (lowerMessage.match(/₹?\d+[,\s]*\d*/) || lowerMessage.includes('income') || lowerMessage.includes('salary')) {
      return 'INCOME_VERIFICATION';
    }
    
    return 'GENERAL_VERIFICATION';
  }
}

module.exports = VerificationAgent;