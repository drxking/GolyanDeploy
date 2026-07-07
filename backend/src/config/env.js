const path = require('path');
require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 8000),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/scholarship_db',
  jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
  storageFolder: process.env.STORAGE_FOLDER || 'scholarship-documents',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  awsS3Bucket: process.env.AWS_S3_BUCKET,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsCloudFrontUrl: process.env.AWS_CLOUDFRONT_URL,
};

env.uploadPath = path.resolve(process.cwd(), env.uploadDir);

module.exports = env;
