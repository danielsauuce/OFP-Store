import User from '../models/user.js';
import Media from '../models/media.js';
import { deleteMediaFromCloudinary, uploadMediaToCloudinary } from '../config/cloudinary.js';
import logger from '../utils/logger.js';
import { updateProfileValidation } from '../utils/userValidation.js';
import {
  addAddress as addAddressValidation,
  updateAddress as updateAddressValidation,
} from '../utils/addressValidation.js';


// Get current user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .populate('profilePicture', 'secureUrl publicId url')
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    logger.error('Get user profile error', { error: error.message, userId: req.user?.id });
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// Update basic profile fields (fullName, phone, preferences)
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = updateProfileValidation.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const allowedFields = ['fullName', 'phone', 'preferences'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update',
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    )
      .populate('profilePicture', 'secureUrl publicId')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Update profile error', { error: error.message, userId: req.user?.id });
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// Upload / Update profile picture
export const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const cloudinaryResult = await uploadMediaToCloudinary(req.file, 'profile-pictures');

    const media = new Media({
      publicId: cloudinaryResult.public_id,
      url: cloudinaryResult.secure_url,
      secureUrl: cloudinaryResult.secure_url,
      mimeType: req.file.mimetype,
      resourceType: cloudinaryResult.resource_type,
      uploadedBy: userId,
      folder: 'profile-pictures',
    });

    await media.save();

    const user = await User.findById(userId).populate('profilePicture');

    // Delete old picture if exists
    if (user.profilePicture) {
      try {
        await deleteMediaFromCloudinary(user.profilePicture.publicId);
        await Media.findByIdAndDelete(user.profilePicture._id);
      } catch (deleteErr) {
        logger.warn('Failed to delete old profile picture', { error: deleteErr.message });
      }
    }

    user.profilePicture = media._id;
    await user.save();

    const updatedUser = await User.findById(userId)
      .populate('profilePicture', 'secureUrl publicId url')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Upload profile picture error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to upload profile picture' });
  }
};

// Delete profile picture
export const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('profilePicture');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.profilePicture) {
      return res.status(400).json({ success: false, message: 'No profile picture to delete' });
    }

    await deleteMediaFromCloudinary(user.profilePicture.publicId);
    await Media.findByIdAndDelete(user.profilePicture._id);

    user.profilePicture = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture deleted successfully',
    });
  } catch (error) {
    logger.error('Delete profile picture error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to delete profile picture' });
  }
};

// Get all addresses
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      addresses: user.addresses || [],
    });
  } catch (error) {
    logger.error('Get addresses error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch addresses' });
  }
};

// Add new address
export const addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressData = req.body;

    const { error } = addAddressValidation.validate(addressData);

    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If this is the first address or marked as default, set others to false
    if (addressData.isDefault || user.addresses.length === 0) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
      addressData.isDefault = true;
    }

    user.addresses.push(addressData);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      addresses: user.addresses,
    });
  } catch (error) {
    logger.error('Add address error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to add address' });
  }
};

// Update existing address
export const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const updateData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // If setting as default, unset others
    if (updateData.isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = addr._id.toString() === addressId;
      });
    }

    Object.assign(address, updateData);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      addresses: user.addresses,
    });
  } catch (error) {
    logger.error('Update address error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to update address' });
  }
};

// Delete address
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // If deleting default address, set first remaining as default
    const wasDefault = address.isDefault;
    user.addresses.pull(addressId);

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      addresses: user.addresses,
    });
  } catch (error) {
    logger.error('Delete address error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to delete address' });
  }
};

// Set address as default
export const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const addressExists = user.addresses.id(addressId);
    if (!addressExists) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === addressId;
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Default address updated successfully',
      addresses: user.addresses,
    });
  } catch (error) {
    logger.error('Set default address error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to set default address' });
  }
};

// Deactivate own account
export const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully. You can reactivate by contacting support.',
    });
  } catch (error) {
    logger.error('Deactivate account error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to deactivate account' });
  }
};
