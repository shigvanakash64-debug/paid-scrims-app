import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMyMatchesQuery } from './controllers/matchController.js';

test('buildMyMatchesQuery includes active statuses and excludes completed/cancelled/disputed matches', () => {
  const userId = '64f1a2b3c4d5e6f7a8b9c0d1';
  const query = buildMyMatchesQuery(userId);

  assert.deepEqual(query.players, userId);
  assert.deepEqual(query.status, {
    $nin: ['completed', 'cancelled', 'disputed'],
  });
});
