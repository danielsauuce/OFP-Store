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

const updateUserProfile = async (req, res) => {
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
