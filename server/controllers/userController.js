import User from '../models/user.js';
import Media from '../models/media.js';
import logger from '../utils/logger.js';
import { updateProfileValidation } from '../utils/userValidation';
import { deleteMediaFromCloudinary, uploadMediaToCloudinary } from '../config/cloudinary.js';

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate('profilePicture', 'secureUrl publicId')
      .select('-password');

    if (!user) {
      logger.warn('User not found', { userId });
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    logger.info('User profile fetched successfully', { userId });

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    logger.error('Get user profile error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
    });
  }
};

export const updateUserProfile = async (req, res) => {
  logger.info('Update profile endpoint hit');

  try {
    const userId = req.user.id;

    const { error } = updateProfileValidation.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      logger.warn('Validation error', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    const user = await User.findByIdAndUpdate(userId, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('profilePicture', 'secureUrl publicId')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    logger.info('User profile updated successfully', { userId });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    logger.error('Update user profile error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};

export const uploadProfilePicture = async (req, res) => {
  logger.info('Upload profile picture endpoint hit');

  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    //upload to cloudinary
    const cloudinaryResult = await uploadMediaToCloudinary(req.file, 'profile-pictures');

    // save new media record
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
      folder: 'profile-pictures',
      resourceType: cloudinaryResult.resource_type,
      uploadedBy: userId,
    });

    await media.save();

    // fetch old profile pictures from user that upload a picture without deleting previous one
    const user = await User.findById(userId).populate('profilePicture');

    if (user.profilePicture) {
      try {
        await deleteMediaFromCloudinary(user.profilePicture.publicId);
        await Media.findByIdAndDelete(user.profilePicture._id);
      } catch (deleteError) {
        logger.warn('Failed to delete old profile picture:', deleteError);
      }
    }

    // Update user with new profile picture
    user.profilePicture = media._id;
    await user.save();

    await Media.findByIdAndUpdate(media._id, {
      $push: {
        usedBy: {
          modelType: 'User',
          modelId: userId,
        },
      },
    });

    const updatedUser = await User.findById(userId)
      .populate('profilePicture', 'secureUrl publicId')
      .select('-password');

    console.log(updatedUser, 'Profile pix updated user');

    logger.info('Profile picture uploaded successfully', { userId });

    return res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Upload profile picture error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture',
    });
  }
};

export const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate('profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture to delete',
      });
    }

    // Delete from Cloudinary
    await deleteMediaFromCloudinary(user.profilePicture.publicId);

    // Delete Media record
    await Media.findByIdAndDelete(user.profilePicture._id);

    // Remove reference from user
    user.profilePicture = null;
    await user.save();

    logger.info('Profile picture deleted successfully', { userId });

    return res.status(200).json({
      success: true,
      message: 'Profile picture deleted successfully',
    });
  } catch (error) {
    logger.error('Delete profile picture error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile picture',
    });
  }
};
