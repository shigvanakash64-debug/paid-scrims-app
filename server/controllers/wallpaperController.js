import Wallpaper from '../models/Wallpaper.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';

const sendError = (res, status, message, error) => {
  console.error(`[WALLPAPER ERROR] ${message}:`, error);
  return res.status(status).json({ error: message, details: error.message });
};

export const listWallpapers = async (req, res) => {
  try {
    const { category = '', search = '' } = req.query;
    const query = { isActive: true };

    if (category) {
      query.category = new RegExp(category, 'i');
    }

    if (search) {
      query.title = new RegExp(search, 'i');
    }

    const wallpapers = await Wallpaper.find(query).sort({ createdAt: -1 });
    return res.json({ wallpapers });
  } catch (error) {
    return sendError(res, 500, 'Could not load wallpapers', error);
  }
};

export const getWallpaperById = async (req, res) => {
  try {
    const wallpaper = await Wallpaper.findById(req.params.id);
    if (!wallpaper || !wallpaper.isActive) {
      return res.status(404).json({ error: 'Wallpaper not found' });
    }
    return res.json({ wallpaper });
  } catch (error) {
    return sendError(res, 500, 'Could not load wallpaper', error);
  }
};

export const createWallpaper = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, description, category, price, resolution } = req.body;

    if (!title || !category || !price) {
      return res.status(400).json({ error: 'Title, category and price are required' });
    }

    // If a file was uploaded, send it to Cloudinary and use the returned URL(s)
    let previewImage = req.body.previewImage || '';
    let originalFile = req.body.originalFile || '';

    if (req.file && req.file.buffer) {
      // Upload using base64 data URI to avoid stream/worker issues
      const mime = req.file.mimetype || 'image/jpeg';
      const base64 = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
      const result = await cloudinary.uploader.upload(base64, { folder: 'wallpapers' });
      previewImage = result.secure_url;
      originalFile = result.secure_url;
    }

    if (!previewImage || !originalFile) {
      return res.status(400).json({ error: 'Preview image and original file are required (upload a file or provide URLs)' });
    }

    const wallpaper = await Wallpaper.create({
      title,
      description: description || '',
      category,
      price: Number(price),
      resolution: resolution || '',
      previewImage,
      originalFile,
      createdBy: user._id,
    });

    return res.status(201).json({ wallpaper });
  } catch (error) {
    return sendError(res, 500, 'Could not create wallpaper', error);
  }
};

export const updateWallpaper = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const wallpaper = await Wallpaper.findById(req.params.id);
    if (!wallpaper) {
      return res.status(404).json({ error: 'Wallpaper not found' });
    }

    const allowedFields = ['title', 'description', 'category', 'price', 'resolution', 'previewImage', 'originalFile', 'isActive'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        wallpaper[field] = req.body[field];
      }
    });

    await wallpaper.save();
    return res.json({ wallpaper });
  } catch (error) {
    return sendError(res, 500, 'Could not update wallpaper', error);
  }
};

export const deleteWallpaper = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const wallpaper = await Wallpaper.findById(req.params.id);
    if (!wallpaper) {
      return res.status(404).json({ error: 'Wallpaper not found' });
    }

    await wallpaper.deleteOne();
    return res.json({ success: true, message: 'Wallpaper deleted' });
  } catch (error) {
    return sendError(res, 500, 'Could not delete wallpaper', error);
  }
};

export const purchaseWallpaper = async (req, res) => {
  try {
    const wallpaper = await Wallpaper.findById(req.params.id);
    if (!wallpaper || !wallpaper.isActive) {
      return res.status(404).json({ error: 'Wallpaper not found' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const alreadyPurchased = (user.wallpaperLibrary || []).some((entry) => entry.wallpaperId?.toString() === wallpaper._id.toString());
    if (alreadyPurchased) {
      return res.json({ success: true, message: 'Wallpaper already in your library', wallpaper });
    }

    user.wallpaperLibrary = user.wallpaperLibrary || [];
    user.wallpaperLibrary.push({
      wallpaperId: wallpaper._id,
      title: wallpaper.title,
      category: wallpaper.category,
      price: wallpaper.price,
      previewImage: wallpaper.previewImage,
      purchasedAt: new Date(),
    });

    await user.save();
    return res.json({ success: true, message: 'Wallpaper added to your library', wallpaper });
  } catch (error) {
    return sendError(res, 500, 'Could not purchase wallpaper', error);
  }
};

export const getMyLibrary = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('wallpaperLibrary.wallpaperId');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const wallpapers = (user.wallpaperLibrary || []).map((entry) => ({
      ...entry.toObject?.(),
      wallpaperId: entry.wallpaperId
        ? {
            _id: entry.wallpaperId._id,
            title: entry.wallpaperId.title,
            description: entry.wallpaperId.description,
            category: entry.wallpaperId.category,
            price: entry.wallpaperId.price,
            resolution: entry.wallpaperId.resolution,
            previewImage: entry.wallpaperId.previewImage,
            originalFile: entry.wallpaperId.originalFile,
          }
        : null,
    }));

    return res.json({ wallpapers });
  } catch (error) {
    return sendError(res, 500, 'Could not load library', error);
  }
};
