import test from 'node:test';
import assert from 'node:assert/strict';

import { validateTournamentInput } from './controllers/tournamentController.js';

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
