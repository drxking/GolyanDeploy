const env = require('../../config/env');

function getS3Client() {
  try {
    const { S3Client } = require('@aws-sdk/client-s3');
    return new S3Client({
      region: env.awsRegion,
      credentials: env.awsAccessKeyId && env.awsSecretAccessKey ? {
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey,
      } : undefined,
    });
  } catch (error) {
    throw new Error('S3 storage selected, but @aws-sdk/client-s3 is not installed');
  }
}

function sanitizeFileName(fileName) {
  return String(fileName || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function buildKey(file, options = {}) {
  const folder = options.folder || env.storageFolder || 'uploads';
  const userId = options.userId || 'anonymous';
  return `${folder}/${userId}/${Date.now()}-${sanitizeFileName(file.originalname)}`;
}

function buildUrl(key) {
  if (env.awsCloudFrontUrl) {
    return `${env.awsCloudFrontUrl.replace(/\/$/, '')}/${key}`;
  }
  return `https://${env.awsS3Bucket}.s3.${env.awsRegion}.amazonaws.com/${key}`;
}

async function uploadFile(file, options = {}) {
  let PutObjectCommand;
  try {
    ({ PutObjectCommand } = require('@aws-sdk/client-s3'));
  } catch (error) {
    throw new Error('S3 storage selected, but @aws-sdk/client-s3 is not installed');
  }

  const client = getS3Client();
  const key = buildKey(file, options);

  await client.send(new PutObjectCommand({
    Bucket: env.awsS3Bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  return {
    provider: 's3',
    key,
    filePath: key,
    fileUrl: buildUrl(key),
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };
}

async function deleteFile(file) {
  const key = file.key || file.filePath;
  if (!key) return;

  let DeleteObjectCommand;
  try {
    ({ DeleteObjectCommand } = require('@aws-sdk/client-s3'));
  } catch (error) {
    throw new Error('S3 storage selected, but @aws-sdk/client-s3 is not installed');
  }

  const client = getS3Client();
  await client.send(new DeleteObjectCommand({
    Bucket: env.awsS3Bucket,
    Key: key,
  }));
}

function getFileUrl(file) {
  return file.fileUrl || (file.filePath ? buildUrl(file.filePath) : '');
}

module.exports = {
  uploadFile,
  deleteFile,
  getFileUrl,
};
