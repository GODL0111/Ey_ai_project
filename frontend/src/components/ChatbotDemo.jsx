import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Bot, User, Zap, Shield, Clock } from 'lucide-react';
import ChatbotContainer from '../chatbot/ChatbotContainer';
import FloatingChatbot from '../chatbot/FloatingChatbot';

const ChatbotDemo = () => {
  const [viewMode, setViewMode] = useState('container'); // 'container' or 'floating'
  const [isDemoActive, setIsDemoActive] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center text-gray-600 hover:text-gray-900 mr-6"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
              <div className="flex items-center">
                <Bot className="h-8 w-8 text-blue-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">Maya AI Demo</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('container')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'container' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Container View
                </button>
                <button
                  onClick={() => setViewMode('floating')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'floating' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Floating View
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Demo Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Experience Maya AI
              </h2>
              <p className="text-gray-600 mb-6">
                Maya is our intelligent loan assistant that guides you through the entire personal loan process. 
                Try the demo to see how conversational AI makes getting a loan simple and fast.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Natural Conversation</h3>
                    <p className="text-sm text-gray-500">Talk to Maya like you would to a human advisor</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <Zap className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Instant Processing</h3>
                    <p className="text-sm text-gray-500">Get real-time loan calculations and approvals</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                      <Shield className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Secure & Private</h3>
                    <p className="text-sm text-gray-500">Your data is protected with bank-grade security</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">24/7 Available</h3>
                    <p className="text-sm text-gray-500">Get help anytime, anywhere</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Conversation */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Try These Sample Queries</h3>
              <div className="space-y-3">
                {[
                  "I need a personal loan for ₹5 lakhs",
                  "What are your interest rates?",
                  "Check if I'm pre-approved",
                  "How much EMI for ₹3 lakhs?",
                  "What documents do I need?"
                ].map((query, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors text-sm text-gray-700"
                  >
                    <User className="h-4 w-4 inline mr-2 text-gray-400" />
                    "{query}"
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Chat Demo */}
          <div className="lg:col-span-2">
            {viewMode === 'container' ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Container Chat View
                  </h3>
                  <p className="text-sm text-gray-600">
                    This is how Maya would appear embedded in your banking app or website
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <ChatbotContainer />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 relative" style={{ minHeight: '600px' }}>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Floating Chat View
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    This is how Maya appears as a floating chatbot on any webpage. 
                    Click the chat icon in the bottom right to start.
                  </p>
                  
                  {!isDemoActive && (
                    <button
                      onClick={() => setIsDemoActive(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Activate Floating Demo
                    </button>
                  )}
                </div>
                
                {/* Demo webpage content */}
                <div className="bg-gray-50 rounded-lg p-6 h-96 overflow-hidden">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                    <div className="h-20 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-300 rounded w-4/5"></div>
                  </div>
                </div>
                
                {isDemoActive && <FloatingChatbot />}
              </div>
            )}
          </div>
        </div>
        
        {/* Features Demo */}
        <div className="mt-12 bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            AI Agent Capabilities
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Sales Agent</h3>
              <p className="text-sm text-gray-600">
                Provides loan information, calculates EMI, and creates personalized offers
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Verification Agent</h3>
              <p className="text-sm text-gray-600">
                Handles KYC verification, document collection, and identity confirmation
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Underwriting Agent</h3>
              <p className="text-sm text-gray-600">
                Performs credit assessment, risk analysis, and loan approval decisions
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Document Generator</h3>
              <p className="text-sm text-gray-600">
                Creates loan sanction letters, repayment schedules, and legal documents
              </p>
            </div>
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Experience Maya AI?
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join thousands of customers who have simplified their loan journey with our AI assistant. 
            Get started with a real application today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Start Real Application
            </button>
            <Link 
              to="/" 
              className="bg-blue-800 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-900 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotDemo;