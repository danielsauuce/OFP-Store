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
      folder,
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
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded',
    });
  }

  const folder = req.body.folder || 'products';

  // Upload all to Cloudinary using allSettled
  const uploadPromises = req.files.map((file) => uploadMediaToCloudinary(file, folder));
  const results = await Promise.allSettled(uploadPromises);

  const successfulUploads = [];
  const failedUploads = [];

  results.forEach((r, index) => {
    if (r.status === 'fulfilled') {
      successfulUploads.push({ file: req.files[index], result: r.value });
    } else {
      failedUploads.push({ file: req.files[index], error: r.reason });
    }
  });

  // If any failed, rollback successful uploads
  if (failedUploads.length > 0) {
    try {
      await Promise.all(
        successfulUploads.map((u) => deleteMediaFromCloudinary(u.result.public_id)),
      );
      logger.warn('Rolled back successful Cloudinary uploads due to failures', {
        failedCount: failedUploads.length,
      });
    } catch (err) {
      logger.error('Failed to rollback Cloudinary uploads', {
        message: err.message,
        stack: err.stack,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Some uploads failed, all uploads rolled back',
      failedUploads: failedUploads.map((f) => f.file.originalname),
    });
  }

  // Prepare Media documents
  const mediaDocuments = successfulUploads.map(({ file, result }) => ({
    publicId: result.public_id,
    url: result.url,
    secureUrl: result.secure_url,
    originalName: file.originalname,
    mimeType: file.mimetype,
    format: result.format,
    size: result.bytes,
    width: result.width,
    height: result.height,
    folder,
    resourceType: result.resource_type,
    uploadedBy: req.user.id,
  }));

  // Insert into DB with rollback if insertMany fails
  let savedMedia;
  try {
    savedMedia = await Media.insertMany(mediaDocuments);
  } catch (dbError) {
    // Rollback Cloudinary if DB insert fails
    await Promise.all(mediaDocuments.map((m) => deleteMediaFromCloudinary(m.publicId)));
    logger.error('DB insert failed, rolled back Cloudinary uploads', { message: dbError.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to save media in database, uploads rolled back',
    });
  }

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
};
