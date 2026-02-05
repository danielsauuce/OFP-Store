import Order from '../models/order.js';
import Cart from '../models/cart.js';
import Product from '../models/product.js';
import Payment from '../models/payment.js';
import logger from '../utils/logger.js';
import { createOrder as createOrderValidation, updateStatus } from '../utils/orderValidation.js';

export const createOrder = async (req, res) => {
  try {
    const { error } = createOrderValidation.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const userId = req.user.id;
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    // Fetch full product data to create snapshots and check stock
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of items) {
      const product = await Product.findById(cartItem.product);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${cartItem.product} not found or inactive`,
        });
      }

      let itemPrice = product.price;
      let nameSnapshot = product.name;
      let imageSnapshot = product.primaryImage?.toString() || null;
      let variantStock = product.stockQuantity;

      // Handle variants
      if (product.variants?.length > 0) {
        if (!cartItem.variantSku) {
          return res.status(400).json({
            success: false,
            message: `Variant SKU required for product ${product.name}`,
          });
        }

        const variant = product.variants.find((v) => v.sku === cartItem.variantSku);
        if (!variant) {
          return res.status(400).json({
            success: false,
            message: `Variant ${cartItem.variantSku} not found for ${product.name}`,
          });
        }

        if (variant.stockQuantity < cartItem.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name} (${cartItem.variantSku})`,
          });
        }

        itemPrice = variant.price || product.price;
        variantStock = variant.stockQuantity;
      } else {
        if (product.stockQuantity < cartItem.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}`,
          });
        }
      }

      orderItems.push({
        product: cartItem.product,
        variantSku: cartItem.variantSku,
        nameSnapshot,
        priceSnapshot: itemPrice,
        imageSnapshot,
        quantity: cartItem.quantity,
      });

      subtotal += itemPrice * cartItem.quantity;
    }

    // Calculate total (subtotal + shipping)
    const shippingCost = 0; // ← you can implement real shipping logic here later
    const total = subtotal + shippingCost;

    // Create the order
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;

    const order = new Order({
      orderNumber,
      user: userId,
      items: orderItems,
      shippingAddress,
      subtotal,
      shippingCost,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'pay_on_delivery' ? 'pending' : 'pending',
      orderStatus: 'pending',
      notes,
    });

    await order.save();

    // Reduce stock
    for (const item of orderItems) {
      await Product.findOneAndUpdate(
        {
          _id: item.product,
          ...(item.variantSku ? { 'variants.sku': item.variantSku } : {}),
        },
        {
          $inc: item.variantSku
            ? { 'variants.$.stockQuantity': -item.quantity }
            : { stockQuantity: -item.quantity },
        },
      );
    }

    // Clear user's cart after successful order
    await Cart.findOneAndUpdate({ user: userId }, { items: [] });

    // If payment method requires immediate payment, you can create Payment document here
    // Example:
    // if (paymentMethod === 'card') {
    //   const payment = await Payment.create({
    //     order: order._id,
    //     provider: 'paystack', // or stripe, etc.
    //     intentId: 'temp-intent-id', // replace with real gateway response
    //     amount: total,
    //     currency: 'NGN',
    //     method: 'card',
    //     status: 'pending'
    //   });
    //   order.payment = payment._id;
    //   await order.save();
    // }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    logger.error('Create order error', { error: error.message, userId: req.user?.id });
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: userId };
    if (status) query.orderStatus = status;

    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find(query)
      .populate('items.product', 'name slug primaryImage')
      .populate('payment', 'status amount method')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    logger.error('Get user orders error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    })
      .populate('items.product', 'name slug primaryImage')
      .populate('payment', 'status amount method provider intentId')
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or not authorized' });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    logger.error('Get order by ID error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!['pending', 'processing'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage',
      });
    }

    order.orderStatus = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: 'Cancelled by customer',
    });

    await order.save();

    // Optional restore stock here if needed

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    logger.error('Cancel order error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
};

// Admin endpoints

export const getAllOrdersAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus } = req.query;

    const query = {};
    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find(query)
      .populate('user', 'fullName email phone')
      .populate('items.product', 'name slug')
      .populate('payment')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    logger.error('Admin get all orders error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

export const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { error } = updateStatus.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { orderStatus, note } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.orderStatus = orderStatus;
    order.statusHistory.push({
      status: orderStatus,
      timestamp: new Date(),
      note: note || `Status updated to ${orderStatus} by admin`,
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      order,
    });
  } catch (error) {
    logger.error('Update order status error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};
