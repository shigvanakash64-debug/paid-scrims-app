import mongoose from 'mongoose';

const wallpaperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  resolution: {
    type: String,
    default: '',
  },
  previewImage: {
    type: String,
    required: true,
  },
  originalFile: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

wallpaperSchema.pre('save', function handleSlug(next) {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Wallpaper', wallpaperSchema);
