import React, { forwardRef } from 'react';

const ChatMessages = forwardRef(({ messages, isTyping }, ref) => {
  // Helper function to get avatar based on agent type
  const getAgentAvatar = (agentType) => {
    switch (agentType) {
      case 'sales':
        return '👨‍💼'; // Sales agent avatar
      case 'verification':
        return '🔍'; // Verification agent avatar
      case 'underwriting':
        return '📊'; // Underwriting agent avatar
      default:
        return '🤖'; // Default master agent avatar
    }
  };
  
  // Helper to format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 chatbot-messages">
      {messages.map((message) => (
        <div 
          key={message.id} 
          className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} message-bubble`}
        >
          {message.sender === 'bot' && (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
              {getAgentAvatar(message.agentType)}
            </div>
          )}
          
          <div 
            className={`px-4 py-2 rounded-lg max-w-[80%] ${
              message.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 shadow-sm rounded-bl-none'
            }`}
          >
            {message.isFile ? (
              <div className="flex items-center">
                <div className="bg-blue-100 p-1 rounded mr-2">
                  📎
                </div>
                <span>{message.fileName}</span>
              </div>
            ) : (
              <p>{message.content}</p>
            )}
            <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
              {formatTime(message.timestamp)}
              {message.sender === 'bot' && message.agentType !== 'master' && (
                <span className="ml-2 bg-blue-100 text-blue-800 px-1 rounded text-[10px]">
                  {message.agentType === 'sales' && 'Sales Agent'}
                  {message.agentType === 'verification' && 'Verification Agent'}
                  {message.agentType === 'underwriting' && 'Underwriting Agent'}
                </span>
              )}
            </p>
          </div>
          
          {message.sender === 'user' && (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center ml-2 flex-shrink-0">
              👤
            </div>
          )}
        </div>
      ))}
      
      {isTyping && (
        <div className="flex justify-start mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
            🤖
          </div>
          <div className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-sm rounded-bl-none">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
      
      {/* Empty div for scrolling to bottom */}
      <div ref={ref} />
    </div>
  );
});

export default ChatMessages;