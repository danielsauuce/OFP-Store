import Category from '../models/category.js';
import Media from '../models/media.js';
import logger from '../utils/logger.js';
import { invalidateCache } from '../middleware/cacheMiddleware.js';
import {
  createCategory as createCategoryValidation,
  updateCategory as updateCategoryValidation,
  reorder as reorderValidation,
} from '../utils/categoryValidation.js';

// Get all categories (public - active only)
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('image', 'secureUrl publicId url')
      .populate('parent', 'name slug')
      .sort({ order: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    logger.error('Get all categories error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

// Get single category by slug (public)
export const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true })
      .populate('image', 'secureUrl publicId url')
      .populate('parent', 'name slug')
      .lean();

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    logger.error('Get category by slug error', { slug: req.params.slug, error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch category' });
  }
};


// Admin endpoints
export const createCategory = async (req, res) => {
  try {
    const { error } = createCategoryValidation.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    // Auto-generate slug if not provided
    if (!req.body.slug) {
      req.body.slug = req.body.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const category = await Category.create(req.body);

    // Track image usage if provided
    if (category.image) {
      await Media.findByIdAndUpdate(category.image, {
        $addToSet: { usedBy: { modelType: 'Category', modelId: category._id } },
      });
    }

    await invalidateCache('cache:/api/categories*');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    logger.error('Create category error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { error } = updateCategoryValidation.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const oldImageId = category.image?.toString();

    // Update fields
    Object.assign(category, req.body);
    await category.save();

    // Handle image change
    if (req.body.image && req.body.image.toString() !== oldImageId) {
      // Add new image reference
      await Media.findByIdAndUpdate(req.body.image, {
        $addToSet: { usedBy: { modelType: 'Category', modelId: category._id } },
      });

      // Remove old image reference if exists
      if (oldImageId) {
        await Media.findByIdAndUpdate(oldImageId, {
          $pull: { usedBy: { modelId: category._id } },
        });
      }
    }

    await invalidateCache('cache:/api/categories*');
    await invalidateCache(`cache:/api/category/${req.params.id}`);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    logger.error('Update category error', { id: req.params.id, error: error.message });
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Optional: prevent deletion if it has children
    const hasChildren = await Category.exists({ parent: category._id });
    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Delete or reassign children first.',
      });
    }

    // Clean up image reference
    if (category.image) {
      await Media.findByIdAndUpdate(category.image, {
        $pull: { usedBy: { modelId: category._id } },
      });
    }

    await category.deleteOne();

    await invalidateCache('cache:/api/categories*');

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    logger.error('Delete category error', { id: req.params.id, error: error.message });
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};

export const reorderCategories = async (req, res) => {
  try {
    const { error } = reorderValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { id } = req.params;
    const { order } = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      { order },
      { new: true, runValidators: true },
    );

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await invalidateCache('cache:/api/categories*');

    res.status(200).json({
      success: true,
      message: 'Category order updated',
      category,
    });
  } catch (error) {
    logger.error('Reorder category error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to reorder category' });
  }
};

export const getAllCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('image', 'secureUrl publicId url')
      .populate('parent', 'name slug')
      .sort({ order: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    logger.error('Admin get all categories error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};
