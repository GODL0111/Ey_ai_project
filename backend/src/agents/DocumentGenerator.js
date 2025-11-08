const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class DocumentGenerator {
  constructor() {
    this.documentsPath = path.join(__dirname, '../../uploads/generated');
    this.ensureDirectoryExists();
  }
  
  ensureDirectoryExists() {
    if (!fs.existsSync(this.documentsPath)) {
      fs.mkdirSync(this.documentsPath, { recursive: true });
    }
  }
  
  async handleMessage(session, message, context) {
    // Auto-trigger document generation if just entering this state
    if (!session.context.documentsGenerated) {
      return await this.generateLoanDocuments(session);
    }
    
    const messageType = this.classifyMessage(message);
    
    switch (messageType) {
      case 'DOWNLOAD_REQUEST':
        return await this.handleDownloadRequest(session, message);
      
      case 'EMAIL_REQUEST':
        return await this.handleEmailRequest(session, message);
      
      case 'DOCUMENT_INQUIRY':
        return await this.handleDocumentInquiry(session, message);
      
      case 'DISBURSEMENT_INQUIRY':
        return await this.handleDisbursementInquiry(session, message);
      
      default:
        return await this.handleGeneralDocumentQueries(session, message);
    }
  }
  
  async generateLoanDocuments(session) {
    try {
      if (!session.context.finalOffer || !session.context.offerAccepted) {
        return {
          id: Date.now(),
          content: "I need a confirmed loan offer before I can generate documents. Let me check your application status.",
          sender: 'bot',
          timestamp: new Date().toISOString(),
          agentType: 'document_generator'
        };
      }
      
      session.context.documentsGenerated = true;
      
      // Generate loan documents
      const sanctionLetter = await this.generateSanctionLetter(session);
      const repaymentSchedule = await this.generateRepaymentSchedule(session);
      
      session.context.generatedDocuments = {
        sanctionLetter,
        repaymentSchedule,
        generatedAt: new Date().toISOString()
      };
      
      // Complete the loan process
      session.state = 'COMPLETED';
      session.context.loanProcessCompleted = true;
      
      return {
        id: Date.now(),
        content: `🎉 **Loan Documents Generated Successfully!**\n\n📄 **Generated Documents:**\n✅ Loan Sanction Letter\n✅ Repayment Schedule\n✅ Terms & Conditions\n\n💰 **Loan Details:**\n• Loan ID: ${sanctionLetter.loanId}\n• Amount: ₹${session.context.finalOffer.approvedAmount.toLocaleString()}\n• Disbursement: ${sanctionLetter.disbursementDate}\n\n🏦 **Next Steps:**\n• Documents are ready for download\n• Funds will be transferred to your account: ${session.customerData.accountNumber}\n• First EMI due: ${sanctionLetter.firstEmiDate}\n\nWould you like to download the documents or have them emailed to you?`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'document_generator',
        documents: {
          sanctionLetter: sanctionLetter.filePath,
          repaymentSchedule: repaymentSchedule.filePath
        },
        suggestions: ['Download documents', 'Email me documents', 'View sanction letter', 'When will I get money?']
      };
    } catch (error) {
      console.error('Document generation error:', error);
      return {
        id: Date.now(),
        content: "I encountered an issue while generating your loan documents. Our team will manually prepare them and email you within 2 hours. Your loan is still approved and the disbursement process will continue as planned.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'document_generator',
        suggestions: ['Check back later', 'Contact customer service', 'When will I get money?']
      };
    }
  }
  
  async generateSanctionLetter(session) {
    const offer = session.context.finalOffer;
    const customer = session.customerData;
    const loanId = `PL${Date.now()}`;
    
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `sanction_letter_${loanId}.pdf`;
    const filePath = path.join(this.documentsPath, fileName);
    
    doc.pipe(fs.createWriteStream(filePath));
    
    // Header
    doc.fontSize(20).text('TATA CAPITAL LIMITED', { align: 'center' });
    doc.fontSize(12).text('Personal Loan Sanction Letter', { align: 'center' });
    doc.moveDown(2);
    
    // Loan Details
    doc.fontSize(14).text('LOAN SANCTION LETTER', { underline: true });
    doc.moveDown();
    
    const today = new Date();
    const disbursementDate = new Date(today);
    disbursementDate.setDate(today.getDate() + 2);
    const firstEmiDate = new Date(disbursementDate);
    firstEmiDate.setMonth(firstEmiDate.getMonth() + 1);
    
    doc.fontSize(12)
       .text(`Date: ${today.toLocaleDateString()}`)
       .text(`Loan ID: ${loanId}`)
       .moveDown()
       .text(`Dear ${customer.name},`)
       .moveDown()
       .text('We are pleased to inform you that your Personal Loan application has been approved. The details are as follows:')
       .moveDown();
    
    // Loan terms table
    const leftColumn = 70;
    const rightColumn = 300;
    let currentY = doc.y;
    
    doc.text('LOAN DETAILS:', leftColumn, currentY, { underline: true });
    currentY += 30;
    
    doc.text('Loan Amount:', leftColumn, currentY);
    doc.text(`₹${offer.approvedAmount.toLocaleString()}`, rightColumn, currentY);
    currentY += 20;
    
    doc.text('Interest Rate:', leftColumn, currentY);
    doc.text(`${offer.interestRate}% per annum`, rightColumn, currentY);
    currentY += 20;
    
    doc.text('Loan Tenure:', leftColumn, currentY);
    doc.text(`${offer.tenure} months`, rightColumn, currentY);
    currentY += 20;
    
    doc.text('Monthly EMI:', leftColumn, currentY);
    doc.text(`₹${offer.monthlyEmi.toLocaleString()}`, rightColumn, currentY);
    currentY += 20;
    
    doc.text('Processing Fee:', leftColumn, currentY);
    doc.text(`₹${(offer.approvedAmount * offer.processingFee / 100).toLocaleString()}`, rightColumn, currentY);
    currentY += 20;
    
    doc.text('Disbursement Date:', leftColumn, currentY);
    doc.text(disbursementDate.toLocaleDateString(), rightColumn, currentY);
    currentY += 20;
    
    doc.text('First EMI Date:', leftColumn, currentY);
    doc.text(firstEmiDate.toLocaleDateString(), rightColumn, currentY);
    currentY += 40;
    
    // Terms and conditions
    doc.y = currentY;
    doc.text('TERMS AND CONDITIONS:', { underline: true });
    doc.moveDown();
    
    const terms = [
      '1. This sanction is valid for 7 days from the date of this letter.',
      '2. Funds will be disbursed to your registered bank account within 48 hours.',
      '3. EMI will be auto-debited from your account on the due date.',
      '4. Prepayment is allowed after 12 months without penalty.',
      '5. Late payment charges apply as per the loan agreement.',
      '6. This offer is subject to final documentation and verification.'
    ];
    
    terms.forEach(term => {
      doc.fontSize(10).text(term);
      doc.moveDown(0.5);
    });
    
    doc.moveDown(2);
    doc.fontSize(12).text('Thank you for choosing Tata Capital!');
    doc.moveDown();
    doc.text('Yours sincerely,');
    doc.moveDown();
    doc.text('Loan Officer');
    doc.text('Tata Capital Limited');
    
    doc.end();
    
    return {
      loanId,
      fileName,
      filePath,
      disbursementDate: disbursementDate.toLocaleDateString(),
      firstEmiDate: firstEmiDate.toLocaleDateString()
    };
  }
  
  async generateRepaymentSchedule(session) {
    const offer = session.context.finalOffer;
    const customer = session.customerData;
    
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `repayment_schedule_${Date.now()}.pdf`;
    const filePath = path.join(this.documentsPath, fileName);
    
    doc.pipe(fs.createWriteStream(filePath));
    
    // Header
    doc.fontSize(16).text('LOAN REPAYMENT SCHEDULE', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12)
       .text(`Customer: ${customer.name}`)
       .text(`Loan Amount: ₹${offer.approvedAmount.toLocaleString()}`)
       .text(`Interest Rate: ${offer.interestRate}% p.a.`)
       .text(`Tenure: ${offer.tenure} months`)
       .text(`Monthly EMI: ₹${offer.monthlyEmi.toLocaleString()}`)
       .moveDown(2);
    
    // Schedule table headers
    const tableTop = doc.y;
    doc.fontSize(10);
    
    doc.text('EMI No.', 50, tableTop);
    doc.text('Due Date', 100, tableTop);
    doc.text('Principal', 180, tableTop);
    doc.text('Interest', 250, tableTop);
    doc.text('EMI Amount', 320, tableTop);
    doc.text('Balance', 400, tableTop);
    
    doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();
    
    // Generate schedule data
    let balance = offer.approvedAmount;
    const monthlyRate = offer.interestRate / 12 / 100;
    let currentY = tableTop + 25;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() + 1);
    
    for (let i = 1; i <= offer.tenure; i++) {
      const interestAmount = balance * monthlyRate;
      const principalAmount = offer.monthlyEmi - interestAmount;
      balance -= principalAmount;
      
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + i - 1);
      
      if (currentY > 700) { // Start new page if needed
        doc.addPage();
        currentY = 50;
      }
      
      doc.text(i.toString(), 50, currentY);
      doc.text(dueDate.toLocaleDateString(), 100, currentY);
      doc.text(`₹${Math.round(principalAmount).toLocaleString()}`, 180, currentY);
      doc.text(`₹${Math.round(interestAmount).toLocaleString()}`, 250, currentY);
      doc.text(`₹${offer.monthlyEmi.toLocaleString()}`, 320, currentY);
      doc.text(`₹${Math.round(balance).toLocaleString()}`, 400, currentY);
      
      currentY += 15;
    }
    
    doc.end();
    
    return {
      fileName,
      filePath
    };
  }
  
  async handleDownloadRequest(session, message) {
    if (session.context.generatedDocuments) {
      const docs = session.context.generatedDocuments;
      
      return {
        id: Date.now(),
        content: `📥 **Download Links Ready!**\n\nYour loan documents are available for download:\n\n📄 [Loan Sanction Letter](${docs.sanctionLetter.filePath})\n📊 [Repayment Schedule](${docs.repaymentSchedule.filePath})\n\n💡 **Note:** Links are valid for 30 days. Please save these documents for your records.`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'document_generator',
        downloadLinks: {
          sanctionLetter: `/api/documents/download/${path.basename(docs.sanctionLetter.filePath)}`,
          repaymentSchedule: `/api/documents/download/${path.basename(docs.repaymentSchedule.filePath)}`
        },
        suggestions: ['Email me documents', 'I have questions', 'When will money arrive?']
      };
    } else {
      return {
        id: Date.now(),
        content: "Your documents are still being generated. Please wait a moment for the process to complete.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'document_generator'
      };
    }
  }
  
  async handleEmailRequest(session, message) {
    const email = session.customerData.email;
    
    // Simulate email sending
    setTimeout(() => {
      // In real implementation, this would actually send emails
      console.log(`Documents emailed to ${email}`);
    }, 1000);
    
    return {
      id: Date.now(),
      content: `📧 **Documents Emailed Successfully!**\n\nI've sent your loan documents to: ${email}\n\n📄 Email includes:\n• Loan Sanction Letter\n• Repayment Schedule\n• Terms & Conditions\n\nPlease check your inbox (and spam folder) within the next 5 minutes. If you don't receive it, I can resend or provide download links.`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      agentType: 'document_generator',
      suggestions: ['Resend email', 'Download instead', 'Change email address', 'I have questions']
    };
  }
  
  async handleDisbursementInquiry(session, message) {
    if (session.context.generatedDocuments) {
      const sanctionLetter = session.context.generatedDocuments.sanctionLetter;
      
      return {
        id: Date.now(),
        content: `💰 **Disbursement Information:**\n\n🏦 **Your funds will be transferred to:**\nAccount: ${session.customerData.accountNumber}\nIFSC: ${session.customerData.ifscCode}\n\n📅 **Timeline:**\n• Disbursement Date: ${sanctionLetter.disbursementDate}\n• Expected Time: Before 6 PM on disbursement date\n• First EMI Due: ${sanctionLetter.firstEmiDate}\n\n📱 **You'll receive:**\n• SMS confirmation when funds are transferred\n• Email with transaction details\n• EMI reminder before due date\n\nIs there anything else you'd like to know about the disbursement?`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'document_generator',
        suggestions: ['Change bank account', 'EMI auto-debit setup', 'Track transfer status', 'Contact if delayed']
      };
    } else {
      return {
        id: Date.now(),
        content: "I'm still preparing your disbursement details. Once your documents are ready, I'll provide complete information about when and how you'll receive the funds.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'document_generator'
      };
    }
  }
  
  async handleDocumentInquiry(session, message) {
    return {
      id: Date.now(),
      content: `📋 **About Your Loan Documents:**\n\n📄 **Sanction Letter includes:**\n• Official loan approval confirmation\n• All loan terms and conditions\n• Disbursement and EMI dates\n• Important terms & conditions\n\n📊 **Repayment Schedule shows:**\n• Monthly EMI breakdown\n• Principal vs Interest split\n• Outstanding balance after each payment\n• Complete payment timeline\n\n💡 **Important Notes:**\n• Keep these documents safe for your records\n• Required for tax benefits (under Section 80C & 24)\n• May be needed for future loan applications\n\nAny specific questions about the documents?`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      agentType: 'document_generator',
      suggestions: ['Download documents', 'Email documents', 'Tax benefits info', 'Future loan queries']
    };
  }
  
  async handleGeneralDocumentQueries(session, message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('congratulations') || lowerMessage.includes('thank')) {
      return {
        id: Date.now(),
        content: "🎉 You're very welcome! It's been a pleasure helping you with your personal loan. Your loan is now fully approved and set up for disbursement.\n\n✅ **What's Done:**\n• Loan approved and sanctioned\n• Documents generated\n• Disbursement scheduled\n• EMI auto-debit setup\n\nIs there anything else I can help you with today? I'm also here for any future banking needs!",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'document_generator',
        suggestions: ['Future loan needs', 'Other banking products', 'Customer service contact', 'Rate this experience']
      };
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return {
        id: Date.now(),
        content: "I'm here to help! You can:\n\n📞 **Contact Customer Service:**\n• Phone: 1800-209-8800 (Toll Free)\n• Email: customercare@tatacapital.com\n• Live Chat: Available 24/7 on our website\n\n🏪 **Visit Branch:**\n• Find nearest branch on tatacapital.com\n• Carry your loan documents and ID\n\n💬 **Future Questions:**\n• EMI payments and schedules\n• Loan closure procedures\n• Additional banking products\n\nWhat specific help do you need?",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'document_generator',
        suggestions: ['EMI payment help', 'Find nearest branch', 'Other loan products', 'End conversation']
      };
    }
    
    return {
      id: Date.now(),
      content: "Your loan process is now complete! All documents have been generated and your disbursement is scheduled. Is there anything specific you'd like to know about your loan or our services?",
      sender: 'bot',
      timestamp: new Date().toISOString(),
      agentType: 'document_generator',
      suggestions: ['Download documents', 'Disbursement details', 'EMI information', 'Contact customer service']
    };
  }
  
  classifyMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('download') || lowerMessage.includes('get documents') || lowerMessage.includes('pdf')) {
      return 'DOWNLOAD_REQUEST';
    }
    
    if (lowerMessage.includes('email') || lowerMessage.includes('send') || lowerMessage.includes('mail')) {
      return 'EMAIL_REQUEST';
    }
    
    if (lowerMessage.includes('money') || lowerMessage.includes('funds') || lowerMessage.includes('disburs') ||
        lowerMessage.includes('transfer') || lowerMessage.includes('when will i get')) {
      return 'DISBURSEMENT_INQUIRY';
    }
    
    if (lowerMessage.includes('document') || lowerMessage.includes('paper') || lowerMessage.includes('sanction') ||
        lowerMessage.includes('schedule') || lowerMessage.includes('what is')) {
      return 'DOCUMENT_INQUIRY';
    }
    
    return 'GENERAL_DOCUMENT_QUERY';
  }
}

module.exports = DocumentGenerator;