import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const MIGRATION_ID = 'cz-wallet-ratio-10-v1';
const RATE = 10;

const multiplyIfPresent = (field) => ({
  $cond: [
    { $eq: [{ $type: `$${field}` }, 'missing'] },
    '$$REMOVE',
    { $multiply: [`$${field}`, RATE] },
  ],
});

const scaleUserWallet = [
  {
    $set: {
      wallet: {
        $mergeObjects: [
          '$wallet',
          {
            balance: { $multiply: [{ $ifNull: ['$wallet.balance', 0] }, RATE] },
            bonusBalance: { $multiply: [{ $ifNull: ['$wallet.bonusBalance', 0] }, RATE] },
            referralEarningsBalance: { $multiply: [{ $ifNull: ['$wallet.referralEarningsBalance', 0] }, RATE] },
            totalBonusEarned: { $multiply: [{ $ifNull: ['$wallet.totalBonusEarned', 0] }, RATE] },
            totalWelcomeBonusEarned: { $multiply: [{ $ifNull: ['$wallet.totalWelcomeBonusEarned', 0] }, RATE] },
            totalPlatformFeesCollected: { $multiply: [{ $ifNull: ['$wallet.totalPlatformFeesCollected', 0] }, RATE] },
            transactions: {
              $map: {
                input: { $ifNull: ['$wallet.transactions', []] },
                as: 'transaction',
                in: {
                  $cond: [
                    { $eq: [{ $type: '$$transaction.amount' }, 'missing'] },
                    '$$transaction',
                    {
                      $mergeObjects: [
                        '$$transaction',
                        { amount: { $multiply: ['$$transaction.amount', RATE] } },
                      ],
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    },
  },
];

const scaleMatchAmounts = [
  {
    $set: {
      entry: { $multiply: ['$entry', RATE] },
      prizePool: { $multiply: ['$prizePool', RATE] },
      platformFee: multiplyIfPresent('platformFee'),
    },
  },
];

const scaleReferralAmounts = [
  {
    $set: {
      lifetimePlatformFeesGenerated: multiplyIfPresent('lifetimePlatformFeesGenerated'),
      totalReferralCommissionEarned: multiplyIfPresent('totalReferralCommissionEarned'),
      qualifyingMatchSpend: multiplyIfPresent('qualifyingMatchSpend'),
      rewardAmount: multiplyIfPresent('rewardAmount'),
      rewardThreshold: multiplyIfPresent('rewardThreshold'),
    },
  },
];

const scaleRewardSettings = [
  {
    $set: {
      welcomeBonusAmount: multiplyIfPresent('welcomeBonusAmount'),
      signupBonusAmount: multiplyIfPresent('signupBonusAmount'),
      minimumMatchEntryForWithdrawal: multiplyIfPresent('minimumMatchEntryForWithdrawal'),
    },
  },
];

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required to run the CZ currency migration.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const migrations = db.collection('schema_migrations');
  const existing = await migrations.findOne({ _id: MIGRATION_ID });

  if (existing) {
    console.log(`Migration ${MIGRATION_ID} is already recorded; no changes made.`);
    return;
  }

  const session = await mongoose.startSession();
  const results = {};
  try {
    await session.withTransaction(async () => {
      const marker = await migrations.findOne({ _id: MIGRATION_ID }, { session });
      if (marker) {
        throw new Error(`Migration ${MIGRATION_ID} was applied concurrently; no changes made by this run.`);
      }

      results.users = await db.collection('users').updateMany({}, scaleUserWallet, { session });
      results.matches = await db.collection('matches').updateMany({}, scaleMatchAmounts, { session });
      results.challenges = await db.collection('challenges').updateMany(
        {},
        [{ $set: { entry: { $multiply: ['$entry', RATE] } } }],
        { session },
      );
      results.globalMatchRequests = await db.collection('globalmatchrequests').updateMany(
        {},
        [{ $set: { entryFee: { $multiply: ['$entryFee', RATE] } } }],
        { session },
      );
      results.referrals = await db.collection('referrals').updateMany({}, scaleReferralAmounts, { session });
      results.rewardSettings = await db.collection('rewardsettings').updateMany({}, scaleRewardSettings, { session });

      await migrations.insertOne({
        _id: MIGRATION_ID,
        appliedAt: new Date(),
        rate: RATE,
        walletFields: 'CZ values multiplied by 10; INR fields left unchanged',
      }, { session });
    });
  } finally {
    await session.endSession();
  }

  for (const [collection, result] of Object.entries(results)) {
    console.log(`${collection}: ${result.modifiedCount} document(s) updated`);
  }
  console.log(`Migration ${MIGRATION_ID} completed.`);
};

run()
  .catch((error) => {
    console.error('CZ currency migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
