import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeResultEntry, validateTournamentInput } from './controllers/tournamentController.js';

test('validateTournamentInput requires match schedule and room details', () => {
  assert.throws(() => validateTournamentInput({
    name: 'Test Cup',
    format: 'custom',
    game: 'Free Fire',
    entryFee: 20,
    maxTeams: 10,
    estimatedDate: '',
    estimatedTime: '',
    roomId: '',
    roomPassword: '',
  }), /estimatedDate/i);

  assert.doesNotThrow(() => validateTournamentInput({
    name: 'Test Cup',
    format: 'single-match',
    game: 'Free Fire',
    entryFee: 20,
    maxTeams: 10,
    perKillReward: 5,
    estimatedDate: '2026-09-15',
    estimatedTime: '19:30',
    roomId: 'ABCD12',
    roomPassword: '123456',
  }));
});

test('normalizeResultEntry keeps both kills and points for custom tournament results', () => {
  const result = normalizeResultEntry({
    entry: { participantId: 'participant-1', kills: 12, points: 180 },
    participantMap: new Map([['participant-1', { displayName: 'Alpha' }]]),
    isPerKill: false,
    perKillReward: 15,
  });

  assert.deepEqual(result, {
    participantId: 'participant-1',
    participantName: 'Alpha',
    kills: 12,
    points: 180,
    money: 0,
  });
});
