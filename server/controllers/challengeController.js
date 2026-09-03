import Challenge from '../models/Challenge.js';
import Match from '../models/Match.js';
import User from '../models/User.js';
import { getNextPaymentUpi } from './matchController.js';

const entryFees = [5, 10, 20, 30, 50, 100, 200, 500, 1000];
const modes = ['1v1', '2v2', '3v3', '4v4'];
const types = ['Headshot', 'Normal Headshot', 'Bodyshot', 'Only One Tap', 'Only Punch', 'Only Desert', 'Only Melee Weapon', 'Only Knife Throw', 'Only SMG Headshot', 'Only AR Headshot', 'Only AWM Bodyshot', 'Only Grenade', 'Rank Clash Squad'];
const prizePools = { 5: 7, 10: 15, 20: 35, 30: 50, 50: 80, 100: 170, 200: 360, 500: 900, 1000: 1800 };
const activeMatchStatuses = ['waiting', 'payment_pending', 'verified', 'ongoing', 'result_pending', 'in-progress'];
const activeMatchCutoff = () => new Date(Date.now() - 2 * 60 * 60 * 1000);

const expireChallenges = async () => {
  await Challenge.updateMany({ status: 'pending', expiresAt: { $lte: new Date() } }, { $set: { status: 'expired' } });
};

const populateChallenge = (query) => query.populate('challenger', 'username title').populate('challengedPlayer', 'username title');

export const createChallenge = async (req, res) => {
  try {
    await expireChallenges();
    const { targetUserId, game = 'Free Fire', mode, type, entry, skillSetting = 'Skill On' } = req.body;
    const challengerId = req.userId;
    const parsedEntry = Number(entry);

    if (!targetUserId || targetUserId.toString() === challengerId.toString()) return res.status(400).json({ error: 'You cannot challenge yourself' });
    if (!modes.includes(mode) || !types.includes(type) || !entryFees.includes(parsedEntry)) return res.status(400).json({ error: 'Invalid challenge settings' });

    const [challenger, target] = await Promise.all([User.findById(challengerId), User.findById(targetUserId)]);
    if (!challenger || !target) return res.status(404).json({ error: 'Player not found' });
    if (target.isBanned || challenger.isBanned) return res.status(403).json({ error: 'This player is not eligible for challenges' });
    if (Number(challenger.wallet?.balance || 0) < parsedEntry) return res.status(400).json({ error: 'Insufficient wallet balance' });

    const activeMatch = await Match.findOne({
      players: { $in: [challengerId, targetUserId] },
      status: { $in: activeMatchStatuses },
      createdAt: { $gte: activeMatchCutoff() },
    });
    if (activeMatch) {
      const challengerHasMatch = activeMatch.players.some((player) => player.toString() === challengerId.toString());
      return res.status(400).json({ error: challengerHasMatch ? 'You already have an active match' : 'This player already has an active match' });
    }
    const recentCount = await Challenge.countDocuments({ challenger: challengerId, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
    if (recentCount >= 20) return res.status(429).json({ error: 'Challenge limit reached. Try again later.' });
    const duplicate = await Challenge.findOne({ challenger: challengerId, challengedPlayer: targetUserId, status: 'pending', expiresAt: { $gt: new Date() } });
    const reverseDuplicate = await Challenge.findOne({ challenger: targetUserId, challengedPlayer: challengerId, status: 'pending', expiresAt: { $gt: new Date() } });
    if (duplicate || reverseDuplicate) return res.status(409).json({ error: 'An active challenge already exists between these players' });

    const challenge = await Challenge.create({ challenger: challengerId, challengedPlayer: targetUserId, game, mode, type, entry: parsedEntry, skillSetting, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    target.notifications.push({ type: 'info', message: `⚔️ ${challenger.username} challenged you`, read: false, createdAt: new Date() });
    await target.save();
    return res.status(201).json({ success: true, challenge: await populateChallenge(Challenge.findById(challenge._id)) });
  } catch (error) {
    console.error('createChallenge error:', error);
    return res.status(500).json({ error: 'Failed to send challenge' });
  }
};

export const getMyChallenges = async (req, res) => {
  try {
    await expireChallenges();
    const challenges = await populateChallenge(Challenge.find({ $or: [{ challenger: req.userId }, { challengedPlayer: req.userId }] }).sort({ createdAt: -1 }).limit(50));
    return res.json({ success: true, challenges });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load challenges' });
  }
};

export const acceptChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOneAndUpdate({ _id: req.params.challengeId, challengedPlayer: req.userId, status: 'pending', expiresAt: { $gt: new Date() } }, { $set: { status: 'accepted', acceptedAt: new Date() } }, { new: true });
    if (!challenge) return res.status(400).json({ error: 'Challenge is no longer available' });
    const [challenger, target] = await Promise.all([User.findById(challenge.challenger), User.findById(challenge.challengedPlayer)]);
    if (!challenger || !target || challenger.isBanned || target.isBanned) return res.status(403).json({ error: 'Both players must be eligible' });
    const activeMatch = await Match.findOne({ players: { $in: [challenger._id, target._id] }, status: { $in: activeMatchStatuses }, createdAt: { $gte: activeMatchCutoff() } });
    if (activeMatch) return res.status(400).json({ error: 'One of these players already has an active match' });
    if (Number(challenger.wallet?.balance || 0) < challenge.entry || Number(target.wallet?.balance || 0) < challenge.entry) return res.status(400).json({ error: 'Both players need sufficient wallet balance' });

    const match = await Match.create({ creator: challenger._id, players: [challenger._id, target._id], game: challenge.game, mode: challenge.mode, type: challenge.type, skillSetting: challenge.skillSetting, entry: challenge.entry, prizePool: prizePools[challenge.entry] || challenge.entry * 2, status: 'payment_pending', paymentUpi: await getNextPaymentUpi(), paymentDueAt: null, adminMessages: [{ sender: 'system', text: 'Challenge accepted. Both players must pay before the match can start.' }] });
    challenge.match = match._id;
    await challenge.save();
    return res.json({ success: true, match });
  } catch (error) {
    console.error('acceptChallenge error:', error);
    return res.status(500).json({ error: 'Failed to accept challenge' });
  }
};

export const declineChallenge = async (req, res) => {
  const challenge = await Challenge.findOneAndUpdate({ _id: req.params.challengeId, challengedPlayer: req.userId, status: 'pending' }, { $set: { status: 'declined', declinedAt: new Date() } }, { new: true });
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
  return res.json({ success: true, challenge });
};
