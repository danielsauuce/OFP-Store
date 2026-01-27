import multer from 'multer';
import upload from '../config/multer.js';
import logger from '../utils/logger.js';

const handleMulterError = (err, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Upload Error: ${err.message}`,
    });
  } else if (err) {
    logger.error('Unexpected Upload Error:', err);
    return res.status(500).json({
      success: false,
      message: 'File upload failed',
    });
  }
  next();
};

export const uploadSingle = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => handleMulterError(err, res, next));
};

export const uploadMultiple =
  (fieldName, maxCount = 5) =>
  (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => handleMulterError(err, res, next));
  };

export const uploadFields = (fields) => (req, res, next) => {
  upload.fields(fields)(req, res, (err) => handleMulterError(err, res, next));
};
