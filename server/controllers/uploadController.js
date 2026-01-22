import { uploadMediaToCloudinary, deleteMediaFromCloudinary } from '../config/cloudinary.js';
import Media from '../models/media.js';
import logger from '../utils/logger.js';

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const folder = req.body.folder || 'products';
    const cloudinaryResult = await uploadMediaToCloudinary(req.file, folder);

    const media = new Media({
      publicId: cloudinaryResult.public_id,
      url: cloudinaryResult.url,
      secureUrl: cloudinaryResult.secure_url,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      format: cloudinaryResult.format,
      size: cloudinaryResult.bytes,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
      folder: folder,
      resourceType: cloudinaryResult.resource_type,
      uploadedBy: req.user.id,
    });

    await media.save();

    logger.info('Image uploaded and tracked successfully', {
      mediaId: media._id,
      publicId: cloudinaryResult.public_id,
      uploadedBy: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      media: {
        id: media._id,
        url: media.secureUrl,
        publicId: media.publicId,
      },
    });
  } catch (error) {
    logger.error('Upload image error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
    });
  }
};

export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const folder = req.body.folder || 'products';
    const uploadPromises = req.files.map((file) => uploadMediaToCloudinary(file, folder));

    const cloudinaryResults = await Promise.all(uploadPromises);

    // Create Media records for all uploads
    const mediaDocuments = cloudinaryResults.map((result, index) => ({
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      originalName: req.files[index].originalname,
      mimeType: req.files[index].mimetype,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height,
      folder: folder,
      resourceType: result.resource_type,
      uploadedBy: req.user.id,
    }));

    const savedMedia = await Media.insertMany(mediaDocuments);

    const mediaData = savedMedia.map((media) => ({
      id: media._id,
      url: media.secureUrl,
      publicId: media.publicId,
    }));

    logger.info('Multiple images uploaded and tracked successfully', {
      count: mediaData.length,
      uploadedBy: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      media: mediaData,
    });
  } catch (error) {
    logger.error('Upload multiple images error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
    });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required',
      });
    }

    const media = await Media.findOne({ publicId });

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found',
      });
    }

    if (media.usedBy && media.usedBy.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete media that is currently in use',
        usedBy: media.usedBy,
      });
    }

    // Delete from Cloudinary
    await deleteMediaFromCloudinary(publicId);

    // Delete from database
    await Media.findByIdAndDelete(media._id);

    logger.info('Image deleted successfully', {
      mediaId: media._id,
      publicId,
    });

    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    logger.error('Delete image error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
    });
  }
};
