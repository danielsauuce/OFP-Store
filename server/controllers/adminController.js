import logger from '../utils/logger';
import User from '../models/user';
import {
  userIdValidation,
  updateUserRoleValidation,
  updateUserStatusValidation,
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
  } catch (error) {}
};
