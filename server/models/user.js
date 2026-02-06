import mongoose from 'mongoose';
import argon2 from 'argon2';

const addressSchema = new mongoose.Schema(
  {
    isDefault: { type: Boolean, default: false },
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'Nigeria' },
    type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
  },
  { _id: true },
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    profilePicture: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    addresses: [addressSchema],
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    lastLogin: Date,
    preferences: { type: Map, of: String },
  },
  { timestamps: true },
);

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) this.password = await argon2.hash(this.password);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return argon2.verify(this.password, candidate);
};

export default mongoose.model('User', userSchema);
