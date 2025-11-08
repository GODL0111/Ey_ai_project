import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ChatHeader from './components/ChatHeader';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import FileUpload from './components/FileUpload';
import SanctionLetterViewer from './components/SanctionLetterViewer';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ChatbotContainer = () => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      content: "Welcome to Tata Capital! I'm Maya, your personal financial assistant. How can I help you today?", 
      sender: 'bot', 
      timestamp: new Date().toISOString(),
      agentType: 'master'
    }
  ]);
  
  const [isTyping, setIsTyping] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [sanctionLetter, setSanctionLetter] = useState(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [conversationContext, setConversationContext] = useState({});
  
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (text) => {
    // Add user message to chat
    const userMessage = { 
      id: Date.now(), 
      content: text, 
      sender: 'user', 
      timestamp: new Date().toISOString() 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    try {
      // Send message to the Master Agent API
      const response = await axios.post(`${API_BASE_URL}/chat/message`, {
        message: text,
        sessionId: sessionId,
        context: conversationContext
      });

      const botResponse = {
        id: Date.now() + 1,
        content: response.data.content,
        sender: 'bot',
        timestamp: response.data.timestamp,
        agentType: response.data.agentType,
        suggestions: response.data.suggestions,
        actionRequired: response.data.actionRequired,
        documents: response.data.documents,
        downloadLinks: response.data.downloadLinks
      };

      // Handle special actions based on the response
      if (response.data.actionRequired === 'DOCUMENT_UPLOAD') {
        setShowFileUpload(true);
      }

      // Handle sanction letter display
      if (response.data.documents && response.data.documents.sanctionLetter) {
        // Extract sanction letter data from the response
        setSanctionLetter({
          customerName: conversationContext.customerName || "Valued Customer",
          loanAmount: conversationContext.approvedAmount || "₹500,000",
          interestRate: conversationContext.interestRate || "10.5%",
          tenure: conversationContext.tenure || "36 months",
          emi: conversationContext.monthlyEmi || "₹16,330",
          processingFee: conversationContext.processingFee || "₹5,000",
          disbursalDate: new Date(Date.now() + 2*24*60*60*1000).toLocaleDateString(),
          loanId: conversationContext.loanId || "PL" + Math.floor(Math.random() * 1000000)
        });
      }

      // Update conversation context if provided
      if (response.data.conversationState) {
        setConversationContext(prev => ({
          ...prev,
          state: response.data.conversationState,
          ...response.data.context
        }));
      }

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback error message
      const errorMessage = {
        id: Date.now() + 1,
        content: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'master',
        error: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleFileUpload = async (file) => {
    try {
      // Add a message showing the file was uploaded
      const fileMessage = {
        id: Date.now(),
        content: `File uploaded: ${file.name}`,
        sender: 'user',
        timestamp: new Date().toISOString(),
        isFile: true,
        fileName: file.name
      };
      
      setMessages(prev => [...prev, fileMessage]);
      setShowFileUpload(false);
      setIsTyping(true);

      // Upload file to backend
      const formData = new FormData();
      formData.append('document', file);

      const uploadResponse = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (uploadResponse.data.success) {
        // Send notification to chat that file was processed
        const processResponse = await axios.post(`${API_BASE_URL}/chat/message`, {
          message: `Document uploaded: ${file.name}`,
          sessionId: sessionId,
          context: {
            ...conversationContext,
            uploadedFile: {
              fileName: file.name,
              fileType: uploadResponse.data.file.mimetype,
              filePath: uploadResponse.data.file.path
            }
          }
        });

        const botResponse = {
          id: Date.now() + 1,
          content: processResponse.data.content,
          sender: 'bot',
          timestamp: processResponse.data.timestamp,
          agentType: processResponse.data.agentType,
          suggestions: processResponse.data.suggestions
        };

        setMessages(prev => [...prev, botResponse]);

        // Update conversation context
        if (processResponse.data.conversationState) {
          setConversationContext(prev => ({
            ...prev,
            state: processResponse.data.conversationState,
            ...processResponse.data.context
          }));
        }
      }
    } catch (error) {
      console.error('File upload error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        content: "I apologize, but there was an issue uploading your file. Please try again or contact our support team.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        agentType: 'verification',
        error: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  return (
    <div className="flex flex-col h-[600px] w-full max-w-md mx-auto rounded-lg shadow-lg overflow-hidden bg-white">
      <ChatHeader 
        title="Tata Capital Personal Loan Assistant" 
        subtitle="We're here to help you 24/7"
      />
      
      <ChatMessages 
        messages={messages} 
        isTyping={isTyping} 
        ref={messagesEndRef} 
      />
      
      {showFileUpload && (
        <FileUpload onFileUpload={handleFileUpload} onCancel={() => setShowFileUpload(false)} />
      )}
      
      {sanctionLetter && (
        <SanctionLetterViewer 
          sanctionData={sanctionLetter} 
          onClose={() => setSanctionLetter(null)} 
        />
      )}
      
      <ChatInput 
        onSendMessage={handleSendMessage} 
        disabled={isTyping || showFileUpload} 
      />
    </div>
  );
};

export default ChatbotContainer;