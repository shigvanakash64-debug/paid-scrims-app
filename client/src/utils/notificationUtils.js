export const normalizeNotificationPayload = (payload = {}) => {
  const id = payload.id || payload._id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const type = payload.type || 'info';
  const title = payload.title || payload.type?.toUpperCase?.() || 'Clutch Zone';
  const message = payload.message || 'You have a new update.';
  const duration = Number.isFinite(payload.duration) ? payload.duration : 5000;

  return {
    id,
    type,
    title,
    message,
    duration,
  };
};

export const getFloatingNotificationPayload = (payload = {}) => {
  const message = `${payload.message || ''}`.trim();
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('has joined your match')) {
    return normalizeNotificationPayload({
      ...payload,
      type: 'match',
      title: '🎮 Match Joined',
      message: message || 'A player has joined your match. Complete your payment to continue.',
      duration: 5000,
    });
  }

  if (normalizedMessage.includes('the match creator has completed payment')) {
    return normalizeNotificationPayload({
      ...payload,
      type: 'info',
      title: '💳 Creator Completed Payment',
      message: message || 'The match creator has completed payment. You can now complete your payment.',
      duration: 5000,
    });
  }

  if (normalizedMessage.includes('your opponent has completed payment')) {
    return normalizeNotificationPayload({
      ...payload,
      type: 'success',
      title: '✅ Opponent Completed Payment',
      message: message || 'Your opponent has completed payment. Proceed to the next stage.',
      duration: 5000,
    });
  }

  return null;
};

export const getNewNotifications = (previousItems = [], incomingItems = []) => {
  const previousKeys = new Set(
    previousItems
      .filter((item) => !item.read)
      .map((item) => `${item.id || item._id || ''}-${item.createdAt || ''}`)
  );

  return incomingItems
    .filter((item) => !item.read)
    .filter((item) => {
      const key = `${item.id || item._id || ''}-${item.createdAt || ''}`;
      return !previousKeys.has(key);
    })
    .map((item) => normalizeNotificationPayload({
      id: item.id || item._id,
      type: item.type,
      title: item.title || item.type?.toUpperCase?.() || 'Clutch Zone',
      message: item.message || 'You have a new update.',
      duration: 5500,
    }));
};
