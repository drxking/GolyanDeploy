const multer = require('multer');
const ApiError = require('../utils/apiError');
const env = require('../config/env');

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const providers = {
  local: () => require('./providers/local'),
  cloudinary: () => require('./providers/cloudinary'),
  s3: () => require('./providers/s3'),
};

function getProvider() {
  const providerName = env.storageProvider || 'local';
  const loadProvider = providers[providerName];

  if (!loadProvider) {
    throw new Error(`Unsupported storage provider: ${providerName}`);
  }

  return loadProvider();
}

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new ApiError(400, 'Only PDF, JPG, JPEG, and PNG files are allowed'));
    }
    cb(null, true);
  },
});

async function uploadFile(file, options = {}) {
  if (!file) {
    throw new ApiError(400, 'A PDF, JPG, JPEG, or PNG file is required');
  }

  return getProvider().uploadFile(file, options);
}

async function deleteFile(file) {
  if (!file) return;
  return getProvider().deleteFile(file);
}

function getFileUrl(file) {
  if (!file) return '';
  if (typeof getProvider().getFileUrl === 'function') {
    return getProvider().getFileUrl(file);
  }
  return file.fileUrl || '';
}

module.exports = {
  uploadMiddleware,
  uploadFile,
  uploadfile: uploadFile,
  deleteFile,
  getFileUrl,
};
