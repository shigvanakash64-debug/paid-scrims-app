import { useState } from 'react';
import { DisputeCard } from '../admin/AdminComponents';

export const DisputesPanel = () => {
  const [disputes, setDisputes] = useState([
    {
      id: 1,
      matchId: 1022,
      playerA: 'lucky_strike',
      playerB: 'king_of_games',
      screenshotA: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23111111%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2216%22 fill=%22%23A1A1A1%22%3EPlayer A Win%3C/text%3E%3C/svg%3E',
      screenshotB: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23111111%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2216%22 fill=%22%23A1A1A1%22%3EPlayer B Win%3C/text%3E%3C/svg%3E',
      openedAt: '1:58 PM',
    },
    {
      id: 2,
      matchId: 1018,
      playerA: 'shadow_gamer',
      playerB: 'frost_bite',
      screenshotA: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23111111%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2216%22 fill=%22%23A1A1A1%22%3EDraw/Tie%3C/text%3E%3C/svg%3E',
      screenshotB: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23111111%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2216%22 fill=%22%23A1A1A1%22%3EDraw/Tie%3C/text%3E%3C/svg%3E',
      openedAt: '12:20 PM',
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const handleResolve = async (disputeId, winner) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setDisputes((prev) => prev.filter((d) => d.id !== disputeId));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Disputes</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">
          {disputes.length} active dispute{disputes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Open Disputes */}
      {disputes.length > 0 ? (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <DisputeCard
              key={dispute.id}
              matchId={dispute.matchId}
              playerA={dispute.playerA}
              playerB={dispute.playerB}
              screenshotA={dispute.screenshotA}
              screenshotB={dispute.screenshotB}
              onResolve={(winner) => handleResolve(dispute.id, winner)}
              isLoading={isLoading}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-12 text-center space-y-3">
          <p className="text-2xl">✓</p>
          <p className="text-lg font-semibold text-white">No active disputes</p>
          <p className="text-sm text-[#A1A1A1]">All matches resolved fairly</p>
        </div>
      )}

      {/* Resolved Disputes History */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white">Resolved</h2>
        <div className="space-y-2">
          {[
            { match: 1017, playerA: 'swift_ninja', playerB: 'dark_knight', winner: 'swift_ninja', time: '2:00 PM' },
            { match: 1016, playerA: 'myth_breaker', playerB: 'thunder_strike', winner: 'myth_breaker', time: '1:30 PM' },
            { match: 1015, playerA: 'cosmic_force', playerB: 'void_walker', winner: 'cosmic_force', time: '12:45 PM' },
          ].map((item, idx) => (
            <div key={idx} className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Match #{item.match}</p>
                <p className="text-xs text-[#A1A1A1]">{item.playerA} vs {item.playerB}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-[#22C55E]">🏆 {item.winner}</p>
                <p className="text-xs text-[#A1A1A1]">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
