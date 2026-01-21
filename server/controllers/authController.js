import User from '../models/user.js';
import generateTokens from '../utils/generateToken.js';
import logger from '../utils/logger.js';
import {
  registerValidation,
  loginValidation,
  changePasswordValidation,
} from '../utils/userValidation.js';
import { arcjetRules, handleArcjetDecision } from '../config/arject.js';

export const registerUser = async (req, res) => {
  logger.info('Registration endpoint hit');

  try {
    // Arcjet protection
    const decision = await arcjetRules.registration.protect(req);
    const blocked = handleArcjetDecision(decision, logger, 'registration');
    if (blocked) {
      return res.status(blocked.status).json(blocked.response);
    }

    const { error } = registerValidation.validate(req.body);

    if (error) {
      logger.warn('Validation error', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { fullName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn('User already exists');
      return res.status(400).json({
        success: false,
        message: 'User already exists. Please use a different email.',
      });
    }

    const user = new User({
      fullName,
      email,
      password,
    });
    await user.save();
    logger.info('User saved successfully', { userId: user._id });

    const { accessToken, refreshToken } = await generateTokens(user);

    return res.status(200).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('Registration error occurred:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

export const loginUser = async (req, res) => {
  logger.info('Login endpoint hit');

  try {
    // Arcjet protection
    const decision = await arcjetRules.login.protect(req);
    const blocked = handleArcjetDecision(decision, logger, 'login');
    if (blocked) {
      return res.status(blocked.status).json(blocked.response);
    }

    const { error } = loginValidation.validate(req.body);

    if (error) {
      logger.warn('Validation error', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logger.warn('User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn('Invalid password attempt');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // last login updated
    user.lastLogin = new Date();
    await user.save();

    logger.info('User logged in successfully', { userId: user._id });

    const { accessToken, refreshToken } = await generateTokens(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Login error occurred:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    // Arcjet protection
    const decision = await arcjetRules.passwordChange.protect(req);
    const blocked = handleArcjetDecision(decision, logger, 'password change');
    if (blocked) {
      return res.status(blocked.status).json(blocked.response);
    }

    // req.body validation
    const { error } = changePasswordValidation.validate(req.body);
    if (error) {
      logger.warn('Validation error', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    logger.info('Password changed successfully', { userId: user._id });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Change password error occurred:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};

export const checkAuth = async (req, res) => {
  try {
    // Arcjet protection
    const decision = await arcjetRules.authCheck.protect(req);
    const blocked = handleArcjetDecision(decision, logger, 'auth check');
    if (blocked) {
      return res.status(blocked.status).json(blocked.response);
    }

    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      logger.warn('User not found in database', { userId });
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePicture: user.profilePicture,
        address: user.address,
      },
    });
  } catch (error) {
    logger.error('Check auth error occurred:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};

// implemented just for logging purpose, logout would be handled from the client side
export const logoutUser = async (req, res) => {
  try {
    logger.info('User logged out successfully');
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error occurred:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};
