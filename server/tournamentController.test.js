import test from 'node:test';
import assert from 'node:assert/strict';

import { assignTournamentGroups, buildTournamentBracket, calculateFinancials, isCompletedTournamentExpired, normalizeResultEntry, normalizeTournamentRegistration, resolveTeamMatchClaims, validateTournamentInput } from './controllers/tournamentController.js';

test('buildTournamentBracket creates the expected knockout rounds and automatic byes', () => {
  const bracket = buildTournamentBracket(Array.from({ length: 16 }, (_, index) => `team-${index + 1}`));
  assert.deepEqual(bracket.map((round) => [round.name, round.matches.length]), [
    ['Round 1', 8],
    ['Quarterfinal', 4],
    ['Semifinal', 2],
    ['Final', 1],
  ]);

  const fiveTeamBracket = buildTournamentBracket(['one', 'two', 'three', 'four', 'five']);
  assert.equal(fiveTeamBracket[0].matches.length, 4);
  assert.equal(fiveTeamBracket[0].matches.filter((match) => match.status === 'completed').length, 3);
});

test('resolveTeamMatchClaims accepts agreement and flags conflicting winner claims', () => {
  assert.deepEqual(resolveTeamMatchClaims([
    { claimedWinnerId: 'team-b' },
    { claimedWinnerId: 'team-b' },
  ]), { status: 'completed', winnerParticipantId: 'team-b' });

  assert.deepEqual(resolveTeamMatchClaims([
    { claimedWinnerId: 'team-a' },
    { claimedWinnerId: 'team-b' },
  ]), { status: 'disputed', winnerParticipantId: null });
});

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
    estimatedTime: '19:30',
    roomId: 'ABCD12',
    roomPassword: '123456',
  }));

  assert.doesNotThrow(() => validateTournamentInput({
    name: 'BR Per Kill Cup',
    format: 'br-per-kill',
    game: 'Free Fire',
    entryFee: 20,
    maxTeams: 10,
    perKillReward: 5,
    estimatedDate: '2026-09-15',
    estimatedTime: '19:30',
  }));

  assert.doesNotThrow(() => validateTournamentInput({
    name: 'CS Custom Cup',
    format: 'cs-custom',
    game: 'Free Fire',
    entryFee: 20,
    maxTeams: 10,
    estimatedDate: '2026-09-15',
  }));

  assert.doesNotThrow(() => validateTournamentInput({
    name: 'No Host View Cup',
    format: 'team-vs-team',
    game: 'COD Mobile',
    entryFee: 20,
    maxTeams: 10,
    teamTournamentMode: 'bo3',
    estimatedDate: '2026-09-15',
  }));

  assert.doesNotThrow(() => validateTournamentInput({
    name: 'Message Limit Cup',
    format: 'custom',
    game: 'Free Fire',
    entryFee: 20,
    maxTeams: 10,
    estimatedDate: '2026-09-15',
    hostMessage: `${'a'.repeat(297)} !?`,
  }));
  assert.throws(() => validateTournamentInput({
    name: 'Long Message Cup',
    format: 'custom',
    game: 'Free Fire',
    entryFee: 20,
    maxTeams: 10,
    estimatedDate: '2026-09-15',
    hostMessage: 'a'.repeat(301),
  }), /cannot exceed 300/i);

  assert.throws(() => validateTournamentInput({
    name: 'Invalid Custom Cup',
    format: 'custom',
    game: 'COD Mobile',
    entryFee: 20,
    maxTeams: 10,
    estimatedDate: '2026-09-15',
  }), /supports Team vs Team tournaments/i);

  assert.throws(() => validateTournamentInput({
    name: 'Invalid TVT Cup',
    format: 'team-vs-team',
    game: 'Free Fire',
    entryFee: 20,
    maxTeams: 10,
    estimatedDate: '2026-09-15',
  }), /supports Custom tournaments/i);

  for (const format of ['br-custom', 'cs-custom', 'team-vs-team']) {
    const validated = validateTournamentInput({
      name: 'Team Cup',
      format,
      game: format === 'team-vs-team' ? 'Valorant' : 'Free Fire',
      entryFee: 20,
      maxTeams: 10,
      teamSize: 4,
      estimatedDate: '2026-09-15',
    });
    assert.equal(validated.numericTeamSize, 4);
  }

  assert.throws(() => validateTournamentInput({
    name: 'Team Cup',
    format: 'team-vs-team',
    game: 'Valorant',
    entryFee: 20,
    maxTeams: 10,
    teamSize: 7,
    estimatedDate: '2026-09-15',
  }), /Team size must be/i);

  assert.throws(() => validateTournamentInput({
    name: 'Old Format Cup',
    format: 'cs-every-win',
    game: 'Free Fire',
    entryFee: 20,
    maxTeams: 10,
    estimatedDate: '2026-09-15',
  }), /Invalid tournament format/i);
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

test('normalizeTournamentRegistration validates and trims the full team roster', () => {
  assert.deepEqual(normalizeTournamentRegistration({ format: 'custom', inGameName: ' Solo Player ' }), {
    displayName: 'Solo Player',
    teamName: '',
    teamMembers: [],
  });

  assert.deepEqual(normalizeTournamentRegistration({
    format: 'team-vs-team',
    teamSize: 3,
    teamName: '  Team Alpha  ',
    teamMembers: [' Player One ', 'Player Two', 'Player Three '],
  }), {
    displayName: 'Player One',
    teamName: 'Team Alpha',
    teamMembers: ['Player One', 'Player Two', 'Player Three'],
  });

  assert.throws(() => normalizeTournamentRegistration({
    format: 'br-custom',
    teamSize: 2,
    teamName: 'Team Alpha',
    teamMembers: ['Player One'],
  }), /exactly 2 team member names/i);

  assert.throws(() => normalizeTournamentRegistration({
    format: 'cs-custom',
    teamSize: 2,
    teamName: 'Team Alpha',
    teamMembers: ['Player One', '  '],
  }), /Each team member name/i);
});

test('calculateFinancials keeps 70% prize pool and splits the 30% profit as 20% host and 10% platform', () => {
  const result = calculateFinancials(100, 10);

  assert.equal(result.totalCollection, 1000);
  assert.equal(result.prizePool, 700);
  assert.equal(result.retainedAmount, 300);
  assert.equal(result.hostShare, 60);
  assert.equal(result.clutchZoneFee, 30);
});

test('completed tournaments expire after 2 days', () => {
  const now = Date.now();
  const oldTournament = {
    status: 'completed',
    updatedAt: new Date(now - (2 * 24 * 60 * 60 * 1000) - 1000),
  };

  const freshTournament = {
    status: 'completed',
    updatedAt: new Date(now - (24 * 60 * 60 * 1000)),
  };

  assert.equal(isCompletedTournamentExpired(oldTournament), true);
  assert.equal(isCompletedTournamentExpired(freshTournament), false);
  assert.equal(isCompletedTournamentExpired({ status: 'open', updatedAt: new Date(now - 1000000) }), false);
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
