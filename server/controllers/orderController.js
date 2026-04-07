import Order from '../models/order.js';
import Cart from '../models/cart.js';
import Product from '../models/product.js';
import Media from '../models/media.js';
import Payment from '../models/payment.js';
import Notification from '../models/notification.js';
import logger from '../utils/logger.js';
import { createOrder as createOrderValidation, updateStatus } from '../utils/orderValidation.js';
import { emitNotification } from '../socket/notificationHandler.js';
import { ordersTotal } from '../config/prometheus.js';

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
      let variantStock = product.stockQuantity;

      // Resolve image URL for snapshot (store URL, not ObjectId)
      let imageSnapshot = null;
      if (product.primaryImage) {
        const media = await Media.findById(product.primaryImage).select('secureUrl url').lean();
        imageSnapshot = media?.secureUrl || media?.url || null;
      }

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

    // Calculate shipping server-side — free above £500, £15 otherwise
    const FREE_SHIPPING_THRESHOLD = 500;
    const STANDARD_SHIPPING_COST = 15;
    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
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

    // Create notification for order placed
    try {
      const notification = await Notification.create({
        user: userId,
        type: 'order_placed',
        title: 'Order Placed',
        message: `Your order #${order.orderNumber} has been placed.`,
        metadata: { orderId: order._id, orderNumber: order.orderNumber },
      });
      emitNotification(userId, notification);
    } catch (notifError) {
      logger.error('Failed to create order notification', { error: notifError.message });
    }

    // Increment Prometheus counter
    ordersTotal.inc({ status: 'pending' });

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

    const pageNumber = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNumber = Math.min(100, parseInt(req.query.limit, 10) || 10);

    const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    const query = { user: userId };

    if (typeof req.query.status === 'string' && allowedStatuses.includes(req.query.status)) {
      query.orderStatus = req.query.status;
    }

    const skip = (pageNumber - 1) * limitNumber;

    const orders = await Order.find(query)
      .populate('items.product', 'name slug primaryImage')
      .populate('payment', 'status amount method')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / limitNumber),
        limit: limitNumber,
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
    const pageNumber = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNumber = Math.min(100, parseInt(req.query.limit, 10) || 20);

    const allowedOrderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    const allowedPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

    const query = {};

    if (typeof req.query.status === 'string' && allowedOrderStatuses.includes(req.query.status)) {
      query.orderStatus = req.query.status;
    }

    if (
      typeof req.query.paymentStatus === 'string' &&
      allowedPaymentStatuses.includes(req.query.paymentStatus)
    ) {
      query.paymentStatus = req.query.paymentStatus;
    }

    const skip = (pageNumber - 1) * limitNumber;

    const orders = await Order.find(query)
      .populate('user', 'fullName email phone')
      .populate('items.product', 'name slug')
      .populate('payment')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / limitNumber),
        limit: limitNumber,
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

    // Create notification for order status update
    try {
      const notification = await Notification.create({
        user: order.user,
        type: 'order_status_updated',
        title: 'Order Status Updated',
        message: `Your order #${order.orderNumber} status has been updated to ${orderStatus}.`,
        metadata: { orderId: order._id, orderNumber: order.orderNumber, orderStatus },
      });
      emitNotification(order.user.toString(), notification);
    } catch (notifError) {
      logger.error('Failed to create status update notification', { error: notifError.message });
    }

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
