import User from '../models/user';
import logger from '../utils/logger';
import {
  updateUserRoleValidation,
  updateUserStatusValidation,
  userIdValidation,
} from '../utils/userValidation';

export const getAllUsers = async (req, res) => {
  logger.info('Admin get all user endpoint hit');

  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = Number(page) - 1 * Number(limit);

    const [users, total] = await Promise.all([
      (await User.find(query).populate('profilePicture', 'secureUrl'))
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    logger.info('Users fetched successfully by admin', {
      adminId: req.user.id,
      count: users.length,
    });

    return res.status(200).json({
      success: 'false',
      message: 'Users fetched successfully',
      users,
      pagination: total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    });
  } catch (error) {
    logger.error('Get all users error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
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
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    logger.info('User deleted by admin', {
      adminId: req.user.id,
      userId: user._id,
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    logger.error('Delete user error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
};
