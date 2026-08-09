import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGO_URI);
const Wallpaper = (await import('./models/Wallpaper.js')).default;
const User = (await import('./models/User.js')).default;
const wallpaper = await Wallpaper.findOne({ isActive: true });
const user = await User.findOne({});
if (!wallpaper || !user) {
  console.log('missing docs');
  process.exit(1);
}
const { createWallpaperCashfreeOrder } = await import('./services/wallpaperCashfreeService.js');
try {
  const result = await createWallpaperCashfreeOrder({
    wallpaperId: String(wallpaper._id),
    userId: String(user._id),
    userName: user.username || 'test',
    userEmail: 'wallpaper@clutchzone.in',
    userPhone: '9999999999',
    amount: wallpaper.price,
    returnBaseUrl: 'https://www.clutchzone.in/api/wallpaper/payment/return'
  });
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  console.error('CREATE ORDER FAIL', e.message || e, JSON.stringify(e?.response?.data || e?.body || e));
  console.error(e?.stack || e);
}
await mongoose.disconnect();
