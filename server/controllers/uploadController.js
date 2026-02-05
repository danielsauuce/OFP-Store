import { uploadMediaToCloudinary, deleteMediaFromCloudinary } from '../config/cloudinary.js';
import Media from '../models/media.js';
import logger from '../utils/logger.js';

// Upload single image
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const folder = req.body.folder || 'general';

    const cloudinaryResult = await uploadMediaToCloudinary(req.file, folder);

    const media = new Media({
      url: cloudinaryResult.secure_url,
      secureUrl: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      mimeType: req.file.mimetype,
      resourceType: cloudinaryResult.resource_type,
      uploadedBy: req.user?.id || null,
      folder,
    });

    await media.save();

    logger.info('Single image uploaded successfully', {
      mediaId: media._id,
      publicId: media.publicId,
      uploadedBy: req.user?.id,
    });

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      media: {
        id: media._id,
        url: media.secureUrl,
        publicId: media.publicId,
        mimeType: media.mimeType,
        folder: media.folder,
      },
    });
  } catch (error) {
    logger.error('Upload single image error', { error: error.message });

    // Attempt cleanup if upload to Cloudinary succeeded but DB failed
    if (error.cloudinaryResult?.public_id) {
      await deleteMediaFromCloudinary(error.cloudinaryResult.public_id).catch(() => {});
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
    });
  }
};

// Upload multiple images
export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const folder = req.body.folder || 'general';

    const uploadPromises = req.files.map((file) => uploadMediaToCloudinary(file, folder));

    const results = await Promise.allSettled(uploadPromises);

    const successful = [];
    const failed = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push({ file: req.files[index], result: result.value });
      } else {
        failed.push({ file: req.files[index], error: result.reason });
      }
    });

    // If any failed → rollback successful uploads
    if (failed.length > 0 && successful.length > 0) {
      await Promise.all(
        successful.map((item) => deleteMediaFromCloudinary(item.result.public_id)),
      ).catch(() => {});
      return res.status(500).json({
        success: false,
        message: 'Some uploads failed - all rolled back',
        failedCount: failed.length,
      });
    }

    // Save successful uploads to database
    const mediaDocs = successful.map(({ result }) => ({
      url: result.secure_url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      mimeType: result.mimetype || result.format,
      resourceType: result.resource_type,
      uploadedBy: req.user?.id || null,
      folder,
    }));

    const savedMedia = await Media.insertMany(mediaDocs);

    const responseMedia = savedMedia.map((m) => ({
      id: m._id,
      url: m.secureUrl,
      publicId: m.publicId,
      mimeType: m.mimeType,
      folder: m.folder,
    }));

    logger.info('Multiple images uploaded successfully', {
      count: savedMedia.length,
      uploadedBy: req.user?.id,
    });

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      media: responseMedia,
    });
  } catch (error) {
    logger.error('Upload multiple images error', { error: error.message });

    // Attempt cleanup on error
    if (error.results) {
      const successfulIds = error.results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value.public_id);
      await Promise.all(successfulIds.map((id) => deleteMediaFromCloudinary(id))).catch(() => {});
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
    });
  }
};

// Get all media (admin only)
export const getAllMedia = async (req, res) => {
  try {
    const { page = 1, limit = 20, folder, uploadedBy } = req.query;

    const query = {};
    if (folder) query.folder = folder;
    if (uploadedBy) query.uploadedBy = uploadedBy;

    const skip = (Number(page) - 1) * Number(limit);

    const [media, total] = await Promise.all([
      Media.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Media.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      media,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    logger.error('Get all media error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch media' });
  }
};
