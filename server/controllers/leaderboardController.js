import User from '../models/User.js';

export const buildHostLeaderboardPipeline = () => [
  { $match: { role: 'host', isBanned: { $ne: true } } },
  { $project: {
    username: 1,
    title: 1,
    totalEarned: { $sum: {
      $map: {
        input: { $filter: {
          input: '$wallet.transactions',
          as: 'transaction',
          cond: {
            $and: [
              { $eq: ['$$transaction.type', 'admin_adjustment'] },
              { $regexMatch: { input: { $ifNull: ['$$transaction.description', ''] }, regex: '^Host share:' } },
            ],
          },
        } },
        as: 'share',
        in: { $max: ['$$share.amount', 0] },
      },
    } },
  } },
  { $sort: { totalEarned: -1, username: 1 } },
  { $limit: 100 },
  { $project: { _id: 1, username: 1, title: 1, totalEarned: 1 } },
];

export const getLeaderboard = async (req, res) => {
  try {
    if (req.query.type === 'hosts') {
      const hosts = await User.aggregate(buildHostLeaderboardPipeline());
      return res.json({ success: true, hosts: hosts.map((host, index) => ({
        ...host,
        rank: index + 1,
        id: host._id,
      })) });
    }

    const players = await User.aggregate([
      { $match: { role: 'user', isBanned: { $ne: true } } },
      { $project: {
        username: 1,
        title: 1,
        totalWon: { $sum: {
          $map: {
            input: { $filter: { input: '$wallet.transactions', as: 'transaction', cond: { $eq: ['$$transaction.type', 'match_win'] } } },
            as: 'win',
            in: { $max: ['$$win.amount', 0] },
          },
        } },
      } },
      { $sort: { totalWon: -1, username: 1 } },
      { $limit: 100 },
      { $project: { _id: 1, username: 1, title: 1, totalWon: 1 } },
    ]);

    return res.json({ success: true, players: players.map((player, index) => ({
      ...player,
      rank: index + 1,
      id: player._id,
    })) });
  } catch (error) {
    console.error('getLeaderboard error:', error);
    return res.status(500).json({ error: 'Failed to load leaderboard' });
  }
};
