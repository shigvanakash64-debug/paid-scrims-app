import { useState } from 'react';
import { MatchCard } from '../admin/AdminComponents';
import { MatchRoomDetail } from './MatchRoomDetail';

export const LiveMatches = () => {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [matches, setMatches] = useState([
    {
      id: 1025,
      playerA: 'john_doe',
      playerB: 'alpha_pro',
      mode: 'Valorant',
      entry: '5v5 Tournament',
      status: 'ongoing',
      paymentA: true,
      paymentB: true,
    },
    {
      id: 1024,
      playerA: 'gamer_x',
      playerB: 'pro_player',
      mode: 'CSGO',
      entry: '1v1 Entry',
      status: 'payment_pending',
      paymentA: true,
      paymentB: false,
    },
    {
      id: 1023,
      playerA: 'ninja_gamer',
      playerB: 'beast_mode',
      mode: 'Valorant',
      entry: '5v5 Tournament',
      status: 'verified',
      paymentA: true,
      paymentB: true,
    },
    {
      id: 1022,
      playerA: 'lucky_strike',
      playerB: 'king_of_games',
      mode: 'Apex',
      entry: '2v2 Entry',
      status: 'payment_pending',
      paymentA: false,
      paymentB: false,
    },
    {
      id: 1021,
      playerA: 'phoenix_rise',
      playerB: 'shadow_legend',
      mode: 'Valorant',
      entry: '1v1 Challenge',
      status: 'waiting',
      paymentA: false,
      paymentB: false,
    },
    {
      id: 1020,
      playerA: 'storm_breaker',
      playerB: 'ice_cold',
      mode: 'CSGO',
      entry: '5v5 Tournament',
      status: 'completed',
      paymentA: true,
      paymentB: true,
    },
    {
      id: 1019,
      playerA: 'error_404',
      playerB: 'code_master',
      mode: 'Valorant',
      entry: '1v1 Entry',
      status: 'cancelled',
      paymentA: true,
      paymentB: false,
    },
  ]);

  const filteredMatches =
    filterStatus === 'all'
      ? matches
      : matches.filter((m) => m.status === filterStatus);

  const handleCancel = (matchId) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId ? { ...m, status: 'cancelled' } : m
      )
    );
  };

  if (selectedMatch) {
    return (
      <MatchRoomDetail
        match={selectedMatch}
        onBack={() => setSelectedMatch(null)}
        onUpdate={(updated) => {
          setMatches((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
          setSelectedMatch(updated);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Live Matches</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">
          {matches.length} total • {matches.filter((m) => m.status === 'ongoing').length} active
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'waiting', 'payment_pending', 'verified', 'ongoing', 'completed', 'cancelled'].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
                filterStatus === status
                  ? 'bg-[#FF6A00] text-black'
                  : 'border border-[#1F1F1F] text-[#A1A1A1] hover:border-[#FF6A00]'
              }`}
            >
              {status === 'all'
                ? 'All'
                : status
                    .split('_')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
            </button>
          )
        )}
      </div>

      {/* Matches Grid */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              matchId={match.id}
              playerA={match.playerA}
              playerB={match.playerB}
              mode={match.mode}
              entry={match.entry}
              status={match.status}
              paymentA={match.paymentA}
              paymentB={match.paymentB}
              onOpen={() => setSelectedMatch(match)}
              onCancel={() => handleCancel(match.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-8 text-center">
          <p className="text-[#A1A1A1]">No matches found</p>
        </div>
      )}
    </div>
  );
};
