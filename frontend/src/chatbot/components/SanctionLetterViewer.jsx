import React from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SanctionLetterViewer = ({ sanctionData, onClose, downloadUrl }) => {
  const today = new Date().toLocaleDateString();
  
  const handleDownload = () => {
    if (downloadUrl) {
      // If we have a download URL from the backend, use it
      window.open(downloadUrl, '_blank');
    } else {
      // Fallback to generating a simple PDF download
      const printContent = document.getElementById('sanction-letter-content');
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head>
            <title>Loan Sanction Letter</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .content { margin: 20px 0; }
              .details { border: 1px solid #ccc; padding: 10px; margin: 20px 0; }
              .footer { margin-top: 30px; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      newWindow.document.close();
      newWindow.print();
    }
  };
  
  return (
    <div className="p-4 bg-gray-100 border-t border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mr-2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <h3 className="font-medium text-gray-700">Loan Sanction Letter</h3>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="bg-white rounded-lg p-4 border shadow-sm" id="sanction-letter-content">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-xl font-bold text-blue-700">TATA CAPITAL</div>
            <div className="text-xs text-gray-500">Financial Services Ltd.</div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Date: {today}</p>
            <p>Ref: {sanctionData.loanId}</p>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm mb-2">Dear {sanctionData.customerName},</p>
          <p className="text-sm mb-2">
            We are pleased to inform you that your Personal Loan application has been approved.
            The details of your loan are as follows:
          </p>
        </div>
        
        <div className="border-t border-b border-gray-200 py-2 mb-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-600">Loan Amount:</div>
            <div className="font-medium">{sanctionData.loanAmount}</div>
            
            <div className="text-gray-600">Interest Rate:</div>
            <div className="font-medium">{sanctionData.interestRate}</div>
            
            <div className="text-gray-600">Tenure:</div>
            <div className="font-medium">{sanctionData.tenure}</div>
            
            <div className="text-gray-600">Monthly EMI:</div>
            <div className="font-medium">{sanctionData.emi}</div>
            
            <div className="text-gray-600">Processing Fee:</div>
            <div className="font-medium">{sanctionData.processingFee}</div>
            
            <div className="text-gray-600">Disbursal Date:</div>
            <div className="font-medium">{sanctionData.disbursalDate}</div>
          </div>
        </div>
        
        <div className="text-sm mb-4">
          <p>
            The loan amount will be disbursed to your registered bank account within 48 hours.
            The first EMI will be due one month from the disbursal date.
          </p>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-gray-500">For Tata Capital Financial Services Ltd.</div>
            <div className="mt-2 border-b border-black w-24"></div>
            <div className="text-xs font-medium">Authorized Signatory</div>
          </div>
          
          <button 
            onClick={handleDownload}
            className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download PDF
          </button>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        This is a system-generated document and doesn't require physical signature.
      </p>
    </div>
  );
};

export default SanctionLetterViewer;