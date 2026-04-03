import User from '../models/user.js';
import Order from '../models/order.js';
import Product from '../models/product.js';
import Media from '../models/media.js';
import logger from '../utils/logger.js';
import { deleteMediaFromCloudinary } from '../config/cloudinary.js';
import {
  userIdValidation,
  updateUserRoleValidation,
  updateUserStatusValidation,
} from '../utils/userValidation.js';

// Escape user input for safe RegExp usage
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// User Management

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;

    const query = {};
    if (search) {
      const escapedSearch = escapeRegex(search.trim());
      const regex = new RegExp(escapedSearch, 'i');
      query.$or = [{ fullName: regex }, { email: regex }];
    }
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('profilePicture', 'secureUrl publicId url')
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    logger.error('Admin get all users error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { error } = userIdValidation.validate({ id: req.params.id });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const user = await User.findById(req.params.id)
      .populate('profilePicture', 'secureUrl publicId url')
      .select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    logger.error('Admin get user by ID error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { error: idError } = userIdValidation.validate({ id: req.params.id });
    if (idError)
      return res.status(400).json({ success: false, message: idError.details[0].message });

    const { error } = updateUserStatusValidation.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    if (req.params.id === req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot change your own status' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true, runValidators: true },
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: `User ${req.body.isActive ? 'activated' : 'deactivated'} successfully`,
      user,
    });
  } catch (error) {
    logger.error('Admin update user status error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { error: idError } = userIdValidation.validate({ id: req.params.id });
    if (idError)
      return res.status(400).json({ success: false, message: idError.details[0].message });

    const { error } = updateUserRoleValidation.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    if (req.params.id === req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true, runValidators: true },
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user,
    });
  } catch (error) {
    logger.error('Admin update user role error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to update user role' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { error } = userIdValidation.validate({ id: req.params.id });
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    if (req.params.id === req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: 'You cannot delete your own account' });
    }

    const user = await User.findById(req.params.id).populate('profilePicture');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.profilePicture) {
      try {
        await deleteMediaFromCloudinary(user.profilePicture.publicId);
        await Media.findByIdAndDelete(user.profilePicture._id);
      } catch (mediaError) {
        logger.warn('Failed to delete user profile picture', {
          error: mediaError.message,
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Admin delete user error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

// Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalOrders,
      totalProducts,
      recentOrders,
      revenueAgg,
      ordersByStatus,
      ordersLast30Days,
      newUsersLast7Days,
    ] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('user', 'fullName email')
        .select('orderNumber total orderStatus paymentStatus createdAt user')
        .lean(),
      // Total revenue from paid orders
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // Orders grouped by status
      Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
      // Daily orders + revenue for last 30 days
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // New users last 7 days
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const statusMap = {};
    ordersByStatus.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        totalProducts,
        totalRevenue,
        newUsersLast7Days,
        recentOrders,
        ordersByStatus: statusMap,
        ordersLast30Days,
      },
    });
  } catch (error) {
    logger.error('Admin dashboard stats error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};
