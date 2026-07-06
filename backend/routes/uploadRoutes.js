const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// 1. Ensure target directory exists on server startup
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 2. Configure multer storage destination & file naming
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Upload destination folder
  },
  filename(req, file, cb) {
    // Generate unique file names to avoid overwriting existing files
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// 3. File type validation helper
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/;
  // Validate extension name
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Validate mime type
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPG, JPEG, and PNG images are allowed!'));
  }
}

// 4. Instantiate Multer Upload Object
const upload = multer({
  storage,
  limits: { fileSize: 2000000 }, // Max 2MB size limit
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  }
});

// 5. Expose POST /api/upload
// Access: Private (All authenticated roles)
router.post('/', protect, (req, res) => {
  // Wrap single file handler in custom middleware to intercept Multer errors cleanly
  const uploadSingle = upload.single('image');

  uploadSingle(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Handles Multer-specific errors (e.g., LIMIT_FILE_SIZE)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Upload failed. File size cannot exceed the 2MB limit!'
        });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      // Handles our custom file type filter errors
      return res.status(400).json({ success: false, message: err.message });
    }

    // Ensure a file was actually provided
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload' });
    }

    // Return the relative public path of the uploaded file
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      filePath: `/uploads/${req.file.filename}`
    });
  });
});

module.exports = router;
