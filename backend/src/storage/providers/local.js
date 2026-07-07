const fs = require('fs/promises');
const path = require('path');
const env = require('../../config/env');

function sanitizeFileName(fileName) {
  return String(fileName || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function uploadFile(file, options = {}) {
  const userId = options.userId || 'anonymous';
  const safeName = sanitizeFileName(file.originalname);
  const fileName = `${Date.now()}-${safeName}`;
  const destination = path.join(env.uploadPath, userId);
  const absolutePath = path.join(destination, fileName);

  await fs.mkdir(destination, { recursive: true });
  await fs.writeFile(absolutePath, file.buffer);

  const filePath = path.relative(process.cwd(), absolutePath);
  const fileUrl = `/${filePath.replace(/\\/g, '/')}`;

  return {
    provider: 'local',
    key: filePath,
    filePath,
    fileUrl,
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };
}

async function deleteFile(file) {
  const key = file.key || file.filePath;
  if (!key) return;

  const absolutePath = path.resolve(process.cwd(), key);
  await fs.rm(absolutePath, { force: true });
}

function getFileUrl(file) {
  return file.fileUrl || `/${String(file.filePath || '').replace(/\\/g, '/')}`;
}

module.exports = {
  uploadFile,
  deleteFile,
  getFileUrl,
};
