import test from 'node:test';
import assert from 'node:assert/strict';

import { assignTournamentGroups, normalizeResultEntry, validateTournamentInput } from './controllers/tournamentController.js';

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
  }), /Estimated match date/i);

  assert.doesNotThrow(() => validateTournamentInput({
    name: 'Test Cup',
    format: 'custom',
    game: 'Free Fire',
    entryFee: 20,
    maxTeams: 10,
    estimatedDate: '2026-09-15',
    estimatedTime: '',
    roomId: 'ABCD12',
    roomPassword: '123456',
  }));

  assert.doesNotThrow(() => validateTournamentInput({
    name: 'Test Cup',
    format: 'single-match',
    game: 'Free Fire',
    entryFee: 20,
    maxTeams: 10,
    perKillReward: 5,
    estimatedDate: '2026-09-15',
    estimatedTime: '',
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

test('assignTournamentGroups split entrants into max-12 groups with final remainder bucket', () => {
  const assignments = assignTournamentGroups([
    { _id: 'p1' },
    { _id: 'p2' },
    { _id: 'p3' },
    { _id: 'p4' },
    { _id: 'p5' },
    { _id: 'p6' },
    { _id: 'p7' },
    { _id: 'p8' },
    { _id: 'p9' },
    { _id: 'p10' },
    { _id: 'p11' },
    { _id: 'p12' },
    { _id: 'p13' },
    { _id: 'p14' },
    { _id: 'p15' },
    { _id: 'p16' },
    { _id: 'p17' },
    { _id: 'p18' },
    { _id: 'p19' },
    { _id: 'p20' },
    { _id: 'p21' },
    { _id: 'p22' },
    { _id: 'p23' },
    { _id: 'p24' },
    { _id: 'p25' },
    { _id: 'p26' },
    { _id: 'p27' },
    { _id: 'p28' },
    { _id: 'p29' },
    { _id: 'p30' },
    { _id: 'p31' },
    { _id: 'p32' },
    { _id: 'p33' },
    { _id: 'p34' },
    { _id: 'p35' },
    { _id: 'p36' },
    { _id: 'p37' },
    { _id: 'p38' },
    { _id: 'p39' },
    { _id: 'p40' },
  ], () => 0.5);

  assert.equal(assignments.get('p1'), 1);
  assert.equal(assignments.get('p12'), 1);
  assert.equal(assignments.get('p13'), 2);
  assert.equal(assignments.get('p25'), 3);
  assert.equal(assignments.get('p40'), 4);
  assert.equal(new Set(assignments.values()).size, 4);
});
