import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


export const uploadMediaToCloudinary = (file, folder = 'products') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: folder,
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          logger.error('Error while uploading media to Cloudinary:', error);
          reject(error);
        } else {
          logger.info('Media uploaded successfully to Cloudinary', {
            publicId: result.public_id,
          });
          resolve(result);
        }
      },
    );
    uploadStream.end(file.buffer);
  });
};

export const deleteMediaFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info('Media deleted successfully from Cloudinary', { publicId });
    return result;
  } catch (error) {
    logger.error('Error deleting media from Cloudinary:', error);
    throw error;
  }
};

export const deleteMultipleMediaFromCloudinary = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    logger.info('Multiple media deleted successfully from Cloudinary', {
      count: publicIds.length,
    });
    return result;
  } catch (error) {
    logger.error('Error deleting multiple media from Cloudinary:', error);
    throw error;
  }
};

export default cloudinary;
