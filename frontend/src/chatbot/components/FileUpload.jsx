import React, { useState } from 'react';

const FileUpload = ({ onFileUpload, onCancel }) => {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  
  const handleDragLeave = () => {
    setDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length) {
      handleFile(files[0]);
    }
  };
  
  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files.length) {
      handleFile(files[0]);
    }
  };
  
  const handleFile = (selectedFile) => {
    // Check file type and size
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please upload a PDF, JPEG or PNG file');
      return;
    }
    
    if (selectedFile.size > maxSize) {
      alert('File size should be less than 5MB');
      return;
    }
    
    setFile(selectedFile);
  };
  
  const handleUpload = () => {
    if (file) {
      onFileUpload(file);
    }
  };
  
  return (
    <div className="p-4 bg-gray-100 border-t border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-700">Upload Document</h3>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center ${
            dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop your file here, or
          </p>
          <label className="inline-block bg-blue-600 text-white rounded-lg px-4 py-2 cursor-pointer text-sm font-medium">
            Browse Files
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInput}
            />
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Supported formats: PDF, JPEG, PNG (Max: 5MB)
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <div className="bg-blue-100 p-2 rounded mr-3">
              {file.type === 'application/pdf' ? '📄' : '🖼️'}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button 
              onClick={() => setFile(null)} 
              className="text-gray-500 hover:text-red-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={onCancel}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpload}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;