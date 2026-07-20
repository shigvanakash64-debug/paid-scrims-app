import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNotificationPayload, getNewNotifications } from './notificationUtils.js';

test('normalizes incoming payloads into a consistent notification shape', () => {
  const payload = {
    type: 'match',
    title: 'Opponent Joined',
    message: 'A new player joined your room.',
    duration: 7000,
  };

  const normalized = normalizeNotificationPayload(payload);

  assert.equal(normalized.type, 'match');
  assert.equal(normalized.title, 'Opponent Joined');
  assert.equal(normalized.message, 'A new player joined your room.');
  assert.equal(normalized.duration, 7000);
  assert.ok(normalized.id);
});

test('detects new unread notifications even when previous state is empty', () => {
  const existing = [
    { id: 'a1', read: false, createdAt: '2024-01-01T00:00:00.000Z', type: 'wallet', message: 'Deposit confirmed' },
  ];

  const incoming = [
    { id: 'a1', read: false, createdAt: '2024-01-01T00:00:00.000Z', type: 'wallet', message: 'Deposit confirmed' },
    { _id: 'b2', read: false, createdAt: '2024-01-01T00:10:00.000Z', type: 'match', message: 'Payment proof needed' },
  ];

  const next = getNewNotifications(existing, incoming);

  assert.equal(next.length, 1);
  assert.equal(next[0].message, 'Payment proof needed');
});
