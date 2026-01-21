import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  {
    _id: false,
  },
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index
cartSchema.index({ user: 1 });

// Virtuals
cartSchema.virtual('total').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((count, item) => count + item.quantity, 0);
});

// Pre-save hook to update lastModified and merge duplicate products
cartSchema.pre('save', function (next) {
  this.lastModified = new Date();

  // Merge duplicate products by productId
  const mergedItems = {};
  this.items.forEach((item) => {
    const key = item.productId.toString();
    if (mergedItems[key]) {
      mergedItems[key].quantity += item.quantity;
    } else {
      mergedItems[key] = { ...item._doc }; // copy fields
    }
  });

  this.items = Object.values(mergedItems);

  next();
});

// Pre 'findOneAndUpdate' hook to update lastModified automatically
cartSchema.pre('findOneAndUpdate', function (next) {
  this.set({ lastModified: new Date() });
  next();
});

// Include virtuals in JSON and Object
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

// Method to add a product to the cart
cartSchema.methods.addItem = async function (product, quantity = 1) {
  const existingIndex = this.items.findIndex(
    (item) => item.productId.toString() === product._id.toString(),
  );

  if (existingIndex > -1) {
    // Product already exists, increment quantity
    this.items[existingIndex].quantity += quantity;
  } else {
    // Add new product
    this.items.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      quantity,
    });
  }

  this.lastModified = new Date();
  return this.save();
};

export default mongoose.model('Cart', cartSchema);
