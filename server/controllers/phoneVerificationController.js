import bcrypt from 'bcrypt';
import PhoneVerification from '../models/PhoneVerification.js';
import User from '../models/User.js';
import { sendOtp } from '../services/smsService.js';

const OTP_LENGTH = 6;
const OTP_EXPIRE_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60; // 30-60 seconds per requirement
const MAX_ATTEMPTS = 5;

function normalizeIndianPhone(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  // remove spaces, dashes
  const digits = s.replace(/[^0-9+]/g, '');
  if (digits.startsWith('+91') && digits.length === 13) return digits;
  if (digits.startsWith('91') && digits.length === 12) return '+' + digits;
  if (digits.startsWith('0') && digits.length === 11) return '+91' + digits.slice(1);
  if (/^[6-9][0-9]{9}$/.test(digits)) return '+91' + digits;
  return null;
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const sendPhoneOtp = async (req, res) => {
  try {
    const { phone: rawPhone } = req.body;
    const phone = normalizeIndianPhone(rawPhone);
    if (!phone) return res.status(400).json({ success: false, message: 'Invalid mobile number' });

    // Check if phone already registered and verified
    const existingUser = await User.findOne({ phone, phoneVerified: true });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Mobile number already registered' });
    }

    let pv = await PhoneVerification.findOne({ phone });
    const now = new Date();
    if (pv && pv.lastSentAt) {
      const secondsSince = (now - pv.lastSentAt) / 1000;
      if (secondsSince < RESEND_COOLDOWN_SECONDS) {
        return res.status(429).json({ success: false, code: 'TOO_SOON', message: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSince)} seconds before requesting another OTP` });
      }
    }

    const otp = generateOtp();
    const hash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

    if (!pv) {
      pv = await PhoneVerification.create({ phone, otpHash: hash, expiresAt, attempts: 0, lastSentAt: now, verified: false });
    } else {
      pv.otpHash = hash;
      pv.expiresAt = expiresAt;
      pv.attempts = 0;
      pv.lastSentAt = now;
      pv.verified = false;
      pv.verifiedAt = null;
      await pv.save();
    }

    // Send SMS through abstraction. Don't log OTP in production
    await sendOtp(phone, otp);

    return res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('sendPhoneOtp error', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

export const verifyPhoneOtp = async (req, res) => {
  try {
    const { phone: rawPhone, otp } = req.body;
    const phone = normalizeIndianPhone(rawPhone);
    if (!phone) return res.status(400).json({ success: false, message: 'Invalid mobile number' });
    if (!otp || String(otp).length !== OTP_LENGTH) return res.status(400).json({ success: false, message: 'Invalid OTP' });

    const pv = await PhoneVerification.findOne({ phone });
    if (!pv || !pv.otpHash) return res.status(400).json({ success: false, message: 'No OTP requested for this number' });
    if (pv.verified) return res.json({ success: true, message: 'Mobile number already verified' });
    if (pv.expiresAt && pv.expiresAt < new Date()) return res.status(410).json({ success: false, code: 'OTP_EXPIRED', message: 'OTP expired' });
    if (pv.attempts >= MAX_ATTEMPTS) return res.status(429).json({ success: false, code: 'TOO_MANY_ATTEMPTS', message: 'Too many attempts' });

    const match = await bcrypt.compare(String(otp), pv.otpHash);
    if (!match) {
      pv.attempts = (pv.attempts || 0) + 1;
      await pv.save();
      if (pv.attempts >= MAX_ATTEMPTS) {
        return res.status(429).json({ success: false, code: 'TOO_MANY_ATTEMPTS', message: 'Too many attempts' });
      }
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    pv.verified = true;
    pv.verifiedAt = new Date();
    pv.otpHash = null;
    pv.expiresAt = null;
    pv.attempts = 0;
    await pv.save();

    // If a user already exists with this phone, mark phoneVerified true
    const user = await User.findOne({ phone });
    if (user) {
      user.phone = phone;
      user.phoneVerified = true;
      user.phoneOtpHash = null;
      user.phoneOtpExpiresAt = null;
      user.phoneOtpAttempts = 0;
      user.phoneOtpLastSentAt = null;
      await user.save();
    }

    return res.json({ success: true, message: 'Mobile number verified' });
  } catch (error) {
    console.error('verifyPhoneOtp error', error);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};
