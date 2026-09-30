import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMatchListQuery, buildMyMatchesQuery } from './controllers/matchController.js';

test('buildMatchListQuery includes entries within both range boundaries', () => {
  const now = Date.UTC(2026, 8, 30);
  const query = buildMatchListQuery({ game: 'Fortnite', entryMin: '11', entryMax: '20', now });

  assert.equal(query.game, 'Fortnite');
  assert.deepEqual(query.entry, { $gte: 11, $lte: 20 });
  assert.equal(query.status, 'waiting');
});

test('buildMyMatchesQuery includes active statuses and excludes completed/cancelled/disputed matches', () => {
  const userId = '64f1a2b3c4d5e6f7a8b9c0d1';
  const query = buildMyMatchesQuery(userId);

  assert.deepEqual(query.players, userId);
  assert.deepEqual(query.status, {
    $nin: ['completed', 'cancelled', 'disputed'],
  });
});
