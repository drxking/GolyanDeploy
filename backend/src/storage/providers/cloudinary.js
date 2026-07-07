const env = require('../../config/env');

function getCloudinary() {
  try {
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: env.cloudinaryCloudName,
      api_key: env.cloudinaryApiKey,
      api_secret: env.cloudinaryApiSecret,
      secure: true,
    });
    return cloudinary;
  } catch (error) {
    throw new Error('Cloudinary storage selected, but the cloudinary package is not installed');
  }
}

function uploadStream(cloudinary, file, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || env.storageFolder,
        resource_type: 'auto',
        public_id: options.publicId,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
}

async function uploadFile(file, options = {}) {
  const cloudinary = getCloudinary();
  const result = await uploadStream(cloudinary, file, options);

  return {
    provider: 'cloudinary',
    key: result.public_id,
    resourceType: result.resource_type,
    filePath: result.public_id,
    fileUrl: result.secure_url,
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };
}

async function deleteFile(file) {
  const key = file.key || file.filePath;
  if (!key) return;

  const preferredType = file.resourceType || (file.mimeType === 'application/pdf' ? 'raw' : 'image');
  const resourceTypes = [preferredType, 'image', 'raw', 'video'].filter((type, index, list) => type && list.indexOf(type) === index);
  const cloudinary = getCloudinary();

  let lastResult;
  for (const resourceType of resourceTypes) {
    lastResult = await cloudinary.uploader.destroy(key, {
      resource_type: resourceType,
      invalidate: true,
    });

    if (lastResult?.result === 'ok') return lastResult;
  }

  return lastResult;
}

function getFileUrl(file) {
  return file.fileUrl || '';
}

module.exports = {
  uploadFile,
  deleteFile,
  getFileUrl,
};
