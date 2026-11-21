import mongoose from 'mongoose';
import User from '../models/User.js';
import Tournament from '../models/Tournament.js';
import TournamentStageGroup from '../models/TournamentStageGroup.js';
import TournamentStageRegistration from '../models/TournamentStageRegistration.js';
import { rupeesToCz } from '../utils/currency.js';

export const calculateTournamentStageFeeShares = (entryFee) => {
  const feeCz = rupeesToCz(entryFee);
  const hostShareCz = Number((feeCz * 0.7).toFixed(2));
  return {
    feeCz,
    hostShareCz,
    adminShareCz: Number((feeCz - hostShareCz).toFixed(2)),
  };
};

const withTransaction = async (operation) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const buildTransactionReference = (registrationId, share) => `TSR-${registrationId}-${share}`;

export const registerForTournamentStageGroup = async ({ tournamentId, stageKey, groupKey, userId, displayName }) => {
  const registrationId = new mongoose.Types.ObjectId();

  return withTransaction(async (session) => {
    const tournament = await Tournament.findOne({
      _id: tournamentId,
      status: { $in: ['open', 'upcoming', 'active'] },
    }).session(session);
    if (!tournament) throw new Error('Tournament is not accepting stage registrations');

    const group = await TournamentStageGroup.findOneAndUpdate(
      {
        tournamentId,
        stageKey,
        groupKey,
        registrationOpen: true,
        $expr: { $lt: ['$registeredCount', '$capacity'] },
      },
      { $inc: { registeredCount: 1 } },
      { new: true, session },
    );
    if (!group) throw new Error('This group is full or no longer accepting entries');

    const stage = tournament.stages.find((item) => item.key === stageKey);
    if (!stage) throw new Error('Tournament stage was not found');
    const entryFee = Number(group.entryFee);
    if (!Number.isFinite(entryFee) || entryFee <= 0) throw new Error('This group does not have a valid entry fee');

    const admin = await User.findOne({ role: 'admin' }).select('_id').session(session);
    if (!admin) throw new Error('Admin wallet account not found');
    if (String(admin._id) === String(tournament.createdBy)) throw new Error('Host and admin wallets must be different');

    const { feeCz, hostShareCz, adminShareCz } = calculateTournamentStageFeeShares(entryFee);
    const registration = new TournamentStageRegistration({
      _id: registrationId,
      tournamentId,
      stageKey,
      groupKey,
      userId,
      displayName,
      entryFee,
      feeCz,
      hostUserId: tournament.createdBy,
      hostShareCz,
      adminUserId: admin._id,
      adminShareCz,
    });
    await registration.save({ session });

    const userUpdate = await User.findOneAndUpdate(
      { _id: userId, 'wallet.balance': { $gte: feeCz } },
      {
        $inc: { 'wallet.balance': -feeCz },
        $push: {
          'wallet.transactions': {
            type: 'fee',
            amount: -feeCz,
            currency: 'CZ',
            status: 'completed',
            referenceId: buildTransactionReference(registrationId, 'ENTRY'),
            description: `Stage entry fee: ${tournament.name} - ${stage.name} / ${group.name}`,
            tournamentId,
            timestamp: new Date(),
          },
        },
      },
      { new: true, session },
    );
    if (!userUpdate) throw new Error('Insufficient wallet balance');

    const hostUpdate = await User.findByIdAndUpdate(
      tournament.createdBy,
      {
        $inc: { 'wallet.reservedBalance': hostShareCz },
        $push: {
          'wallet.transactions': {
            type: 'admin_adjustment',
            amount: hostShareCz,
            currency: 'CZ',
            status: 'pending',
            referenceId: buildTransactionReference(registrationId, 'HOST'),
            description: `Reserved host share: ${tournament.name} - ${stage.name} / ${group.name}`,
            tournamentId,
            timestamp: new Date(),
          },
        },
      },
      { new: true, session },
    );
    if (!hostUpdate) throw new Error('Tournament host wallet was not found');

    const adminUpdate = await User.findByIdAndUpdate(
      admin._id,
      {
        $inc: { 'wallet.reservedBalance': adminShareCz },
        $push: {
          'wallet.transactions': {
            type: 'admin_adjustment',
            amount: adminShareCz,
            currency: 'CZ',
            status: 'pending',
            referenceId: buildTransactionReference(registrationId, 'ADMIN'),
            description: `Reserved admin share: ${tournament.name} - ${stage.name} / ${group.name}`,
            tournamentId,
            timestamp: new Date(),
          },
        },
      },
      { new: true, session },
    );
    if (!adminUpdate) throw new Error('Admin wallet account not found');

    const updatedWallet = String(userId) === String(tournament.createdBy)
      ? hostUpdate.wallet
      : String(userId) === String(admin._id)
        ? adminUpdate.wallet
        : userUpdate.wallet;
    return {
      registration,
      walletBalance: Number(updatedWallet.balance || 0),
      reservedBalance: Number(updatedWallet.reservedBalance || 0),
    };
  });
};

const updateReservedShare = async ({ session, userId, registrationId, referenceShare, action, amount, description }) => {
  if (amount <= 0) return;
  const update = await User.findOneAndUpdate(
    { _id: userId, 'wallet.reservedBalance': { $gte: amount } },
    {
      $inc: { 'wallet.reservedBalance': -amount, ...(action === 'release' ? { 'wallet.balance': amount } : {}) },
      $set: {
        'wallet.transactions.$[transaction].status': action === 'release' ? 'completed' : 'reversed',
        ...(action === 'release' && description ? { 'wallet.transactions.$[transaction].description': description } : {}),
      },
    },
    {
      new: true,
      session,
      arrayFilters: [{ 'transaction.referenceId': buildTransactionReference(registrationId, referenceShare.toUpperCase()) }],
    },
  );
  if (!update) throw new Error(`Could not ${action} reserved tournament share`);
};

export const releaseTournamentStageGroupShares = async (tournamentId) => {
  const registrations = await TournamentStageRegistration.find({
    tournamentId,
    status: 'registered',
    sharesReleasedAt: null,
  }).select('_id hostUserId hostShareCz adminUserId adminShareCz').lean();

  for (const registration of registrations) {
    await withTransaction(async (session) => {
      const claimed = await TournamentStageRegistration.findOneAndUpdate(
        { _id: registration._id, status: 'registered', sharesReleasedAt: null },
        { $set: { sharesReleasedAt: new Date() } },
        { new: true, session },
      );
      if (!claimed) return;

      await updateReservedShare({
        session,
        userId: registration.hostUserId,
        registrationId: registration._id,
        referenceShare: 'host',
        action: 'release',
        amount: registration.hostShareCz,
        description: 'Host share: paid stage group registration',
      });
      await updateReservedShare({
        session,
        userId: registration.adminUserId,
        registrationId: registration._id,
        referenceShare: 'admin',
        action: 'release',
        amount: registration.adminShareCz,
        description: 'Platform share: paid stage group registration',
      });
    });
  }
};

export const refundTournamentStageGroupRegistrations = async ({ tournamentId, reason, actorId }) => {
  const registrations = await TournamentStageRegistration.find({
    tournamentId,
    status: 'registered',
    sharesReleasedAt: null,
  }).select('_id userId hostUserId hostShareCz adminUserId adminShareCz feeCz groupKey').lean();
  const refundResults = [];

  for (const registration of registrations) {
    await withTransaction(async (session) => {
      const claimed = await TournamentStageRegistration.findOneAndUpdate(
        { _id: registration._id, status: 'registered', sharesReleasedAt: null },
        { $set: { status: 'refunded', refundedAt: new Date() } },
        { new: true, session },
      );
      if (!claimed) return;

      const refundReference = `TSR-${registration._id}-REFUND`;
      const reversedEntry = await User.updateOne(
        { _id: registration.userId },
        { $set: { 'wallet.transactions.$[transaction].status': 'reversed' } },
        {
          session,
          arrayFilters: [{ 'transaction.referenceId': buildTransactionReference(registration._id, 'ENTRY') }],
        },
      );
      if (reversedEntry.matchedCount !== 1) throw new Error('Could not reverse the stage-entry wallet transaction');

      const refund = await User.findOneAndUpdate(
        { _id: registration.userId, 'wallet.transactions.referenceId': { $ne: refundReference } },
        {
          $inc: { 'wallet.balance': registration.feeCz },
          $push: {
            'wallet.transactions': {
              type: 'refund',
              amount: registration.feeCz,
              currency: 'CZ',
              status: 'completed',
              referenceId: refundReference,
              reason,
              description: 'Tournament stage-entry refund',
              tournamentId,
              timestamp: new Date(),
              actorId,
            },
          },
        },
        { new: true, session },
      );
      if (!refund) throw new Error('Could not refund a tournament stage registration');

      await updateReservedShare({
        session,
        userId: registration.hostUserId,
        registrationId: registration._id,
        referenceShare: 'host',
        action: 'reverse',
        amount: registration.hostShareCz,
      });
      await updateReservedShare({
        session,
        userId: registration.adminUserId,
        registrationId: registration._id,
        referenceShare: 'admin',
        action: 'reverse',
        amount: registration.adminShareCz,
      });

      await TournamentStageGroup.updateOne(
        { tournamentId, groupKey: registration.groupKey, registeredCount: { $gt: 0 } },
        { $inc: { registeredCount: -1 } },
        { session },
      );
      refundResults.push({ registrationId: registration._id, refunded: true, amount: registration.feeCz });
    });
  }
  return refundResults;
};
