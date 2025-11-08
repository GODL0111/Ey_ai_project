import React from 'react';

const ChatHeader = ({ title, subtitle }) => {
  return (
    <div className="bg-blue-700 text-white p-4 flex items-center">
      <div className="bg-white p-2 rounded-full mr-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-700">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <div>
        <h2 className="font-bold text-lg">{title}</h2>
        <p className="text-xs text-blue-100">{subtitle}</p>
      </div>
    </div>
  );
};

export default ChatHeader;