const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, JPG, PNG) and documents (PDF, DOC, DOCX) are allowed'));
    }
  }
});

// Upload document endpoint
router.post('/upload', upload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Download generated document endpoint
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads/generated', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Download failed' });
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Get document info endpoint
router.get('/info/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const uploadPath = path.join(__dirname, '../../uploads', filename);
    const generatedPath = path.join(__dirname, '../../uploads/generated', filename);
    
    let filePath = null;
    if (fs.existsSync(uploadPath)) {
      filePath = uploadPath;
    } else if (fs.existsSync(generatedPath)) {
      filePath = generatedPath;
    }
    
    if (!filePath) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stats = fs.statSync(filePath);
    const fileInfo = {
      filename: filename,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isGenerated: filePath.includes('generated')
    };
    
    res.json({
      success: true,
      file: fileInfo
    });
  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({ error: 'Failed to get file information' });
  }
});

// List uploaded documents endpoint
router.get('/list', (req, res) => {
  try {
    const uploadPath = path.join(__dirname, '../../uploads');
    const generatedPath = path.join(__dirname, '../../uploads/generated');
    
    const files = [];
    
    // List uploaded files
    if (fs.existsSync(uploadPath)) {
      const uploadedFiles = fs.readdirSync(uploadPath)
        .filter(file => fs.statSync(path.join(uploadPath, file)).isFile())
        .map(file => ({
          filename: file,
          type: 'uploaded',
          path: `/api/documents/${file}`
        }));
      files.push(...uploadedFiles);
    }
    
    // List generated files
    if (fs.existsSync(generatedPath)) {
      const generatedFiles = fs.readdirSync(generatedPath)
        .filter(file => fs.statSync(path.join(generatedPath, file)).isFile())
        .map(file => ({
          filename: file,
          type: 'generated',
          path: `/api/documents/download/${file}`
        }));
      files.push(...generatedFiles);
    }
    
    res.json({
      success: true,
      files: files
    });
  } catch (error) {
    console.error('File list error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Delete document endpoint
router.delete('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const uploadPath = path.join(__dirname, '../../uploads', filename);
    const generatedPath = path.join(__dirname, '../../uploads/generated', filename);
    
    let filePath = null;
    if (fs.existsSync(uploadPath)) {
      filePath = uploadPath;
    } else if (fs.existsSync(generatedPath)) {
      filePath = generatedPath;
    }
    
    if (!filePath) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  
  if (error.message.includes('Only images')) {
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ error: 'File processing error' });
});

module.exports = router;