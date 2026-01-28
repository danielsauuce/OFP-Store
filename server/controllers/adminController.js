import User from '../models/user.js';
import logger from '../utils/logger.js';
import {
  updateUserRoleValidation,
  updateUserStatusValidation,
  userIdValidation,
} from '../utils/userValidation.js';

// Helper to prevent ReDoS
const regexEscape = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;
    const query = {};

    if (search) {
      const safeSearch = regexEscape(search.substring(0, 100));
      const searchRegex = new RegExp(safeSearch, 'i');
      query.$or = [{ fullName: searchRegex }, { email: searchRegex }];
    }

    const allowedRoles = ['user', 'admin'];
    if (role) {
      if (allowedRoles.includes(role)) {
        query.role = role;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid role filter' });
      }
    }

    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('profilePicture', 'secureUrl')
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    logger.error('Get all users error', { message: error.message });
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

export const getUsersById = async (req, res) => {
  logger.info('Admin getting user by Id endpoint hit');

  try {
    const { error } = userIdValidation.validate({ id: req.params.id });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const user = await User.findById(req.params.id)
      .populate('profilePicture', 'secureUrl publicId')
      .select('-password');

    if (!user) {
      logger.warn('User not found', { userId: req.params.id });
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    logger.info('User fetched successfully by admin', { adminId: req.user.id, userId: user._id });
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    logger.error('Get user by ID error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { error: idError } = userIdValidation.validate({ id: req.params.id });
    if (idError) {
      return res.status(400).json({
        success: false,
        message: idError.details[0].message,
      });
    }

    const { error } = updateUserStatusValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true },
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    logger.info('User status updated by admin', {
      adminId: req.user.id,
      userId: user._id,
      newStatus: req.body.isActive,
    });

    return res.status(200).json({
      success: true,
      message: `User ${req.body.isActive ? 'activated' : 'deactivated'} successfully`,
      user,
    });
  } catch (error) {
    logger.error('Update user status error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { error: idError } = userIdValidation.validate({ id: req.params.id });
    if (idError) {
      return res.status(400).json({
        success: false,
        message: idError.details[0].message,
      });
    }

    const { error } = updateUserRoleValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    } // Prevent admin from changing their own role
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true },
    ).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    logger.info('User role updated by admin', {
      adminId: req.user.id,
      userId: user._id,
      newRole: req.body.role,
    });

    return res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user,
    });
  } catch (error) {
    logger.error('Update user role error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { error } = userIdValidation.validate({ id: req.params.id });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    // Find user with profile picture
    const user = await User.findById(req.params.id).populate('profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    //Delete profile picture from Cloudinary + Media collection
    if (user.profilePicture) {
      try {
        await deleteMediaFromCloudinary(user.profilePicture.publicId);
        await Media.findByIdAndDelete(user.profilePicture._id);
      } catch (mediaError) {
        logger.warn('Failed to delete user profile media', mediaError);
      }
    }

    // Permanently delete user
    await User.findByIdAndDelete(user._id);

    logger.info('User permanently deleted by admin', {
      adminId: req.user.id,
      userId: user._id,
    });

    return res.status(200).json({
      success: true,
      message: 'User permanently deleted successfully',
    });
  } catch (error) {
    logger.error('Permanent delete user error:', {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
};
