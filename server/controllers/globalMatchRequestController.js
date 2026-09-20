import GlobalMatchRequest from '../models/GlobalMatchRequest.js';

const isHostOrAdmin = (user) => ['host', 'admin'].includes(user?.role);

const serializeRequest = (request) => ({
  id: request._id,
  userId: request.userId?._id || request.userId,
  username: request.userId?.username || 'Player',
  game: request.game,
  mode: request.mode,
  type: request.type,
  skillSetting: request.skillSetting,
  entryFee: request.entryFee,
  status: request.status,
  respondedBy: request.respondedBy,
  respondedAt: request.respondedAt,
  createdAt: request.createdAt,
});

export const listGlobalMatchRequests = async (req, res) => {
  try {
    const query = isHostOrAdmin(req.user) ? {} : { userId: req.userId };
    const requests = await GlobalMatchRequest.find(query)
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return res.json({ success: true, requests: requests.map(serializeRequest) });
  } catch (error) {
    console.error('listGlobalMatchRequests error:', error);
    return res.status(500).json({ error: 'Failed to load global match requests' });
  }
};

export const createGlobalMatchRequest = async (req, res) => {
  try {
    const { game, mode, type, skillSetting, entryFee } = req.body || {};
    if (!game || !mode || !type || !skillSetting || entryFee === undefined) {
      return res.status(400).json({ error: 'Game, mode, kill type, skill setting and entry fee are required' });
    }

    const request = await GlobalMatchRequest.create({
      userId: req.userId,
      game,
      mode,
      type,
      skillSetting,
      entryFee: Number(entryFee),
    });
    await request.populate('userId', 'username');
    return res.status(201).json({ success: true, request: serializeRequest(request) });
  } catch (error) {
    console.error('createGlobalMatchRequest error:', error);
    return res.status(500).json({ error: 'Failed to send match request' });
  }
};

export const respondToGlobalMatchRequest = async (req, res) => {
  try {
    if (!isHostOrAdmin(req.user)) return res.status(403).json({ error: 'Host access required' });
    const { status } = req.body || {};
    if (!['accepted', 'declined'].includes(status)) return res.status(400).json({ error: 'Response must be accepted or declined' });

    const request = await GlobalMatchRequest.findByIdAndUpdate(
      req.params.requestId,
      { $set: { status, respondedBy: req.userId, respondedAt: new Date() } },
      { new: true },
    ).populate('userId', 'username');
    if (!request) return res.status(404).json({ error: 'Match request not found' });
    return res.json({ success: true, request: serializeRequest(request) });
  } catch (error) {
    console.error('respondToGlobalMatchRequest error:', error);
    return res.status(500).json({ error: 'Failed to respond to match request' });
  }
};
