import { useState } from 'react';
import { Card } from './Card';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const TournamentCard = ({ tournament, user, onJoined }) => {
  const [showResults, setShowResults] = useState(false);
  const [showStructure, setShowStructure] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedStageKey, setSelectedStageKey] = useState(null);
  const handleJoin = async () => {
    if (!user) {
      window.alert('Please login to join this tournament');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/tournaments/${tournament._id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to join tournament');
      window.alert('Tournament joined successfully');
      onJoined?.();
    } catch (error) {
      window.alert(error.message);
    }
  };

  const handleViewResults = async () => {
    setShowResults(true);
    const response = await fetch(`${API_BASE}/tournaments/${tournament._id}/public-matches`);
    const data = await response.json();
    if (response.ok) setResults(data.results || []);
  };
  const hostUsername = tournament?.createdBy?.username || tournament?.hostUsername || 'Host';
  const isPerKillTournament = tournament?.format === 'single-match';
  const isJoined = Boolean(tournament?.isRegistered || tournament?.registered || tournament?.joined);
  const stages = Array.isArray(tournament?.stages) ? [...tournament.stages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : [];

  const customStageResults = useMemo(() => {
    if (isPerKillTournament) return [];
    return stages.map((stage) => ({
      stage,
      result: (results || []).find((item) => item.stageKey === stage.key && item.status === 'published') || null,
    }));
  }, [isPerKillTournament, stages, results]);

  const selectedStageResult = useMemo(() => {
    if (isPerKillTournament || !selectedStageKey) return null;
    return (results || []).find((item) => item.stageKey === selectedStageKey && item.status === 'published') || null;
  }, [isPerKillTournament, results, selectedStageKey]);

  return (
    <Card className="br-match-card">
      <div className="br-match-header">
        <div className="br-match-title">
          <div className="mb-1 text-xs text-[#A1A1A1]">Host: {hostUsername}</div>
          <h3>{tournament.name}</h3>
          <span className="br-status-badge text-green-400">OPEN FOR REGISTRATION</span>
        </div>
      </div>
      <div className="br-match-grid">
        <div className="br-match-left">
          <div className="br-match-stat"><span className="label">Game</span><span className="value">{tournament.game}</span></div>
          <div className="br-match-stat"><span className="label">Entry Fee</span><span className="value">₹{tournament.entryFee}</span></div>
        </div>
        <div className="br-match-middle">
          <div className="br-match-stat"><span className="label">Paid Entries</span><span className="value">{tournament.successfulEntries}/{tournament.maxTeams}</span></div>
          {tournament.format === 'single-match' ? <div className="br-match-stat"><span className="label">Per Kill</span><span className="value">₹{Number(tournament.perKillReward || 0).toLocaleString()}</span></div> : <div className="br-match-stat"><span className="label">Prize Pool</span><span className="value">₹{Number(tournament.prizePool || 0).toLocaleString()}</span></div>}
        </div>
      </div>
      <div className="br-match-actions">
        <span className="registered-badge">{tournament.format === 'single-match' ? 'Per Kill Tournament' : tournament.format} · OPEN</span>
        <button type="button" className="btn btn-sm btn-primary" onClick={handleJoin} disabled={isJoined || tournament.successfulEntries >= tournament.maxTeams}>
          {isJoined ? 'Joined' : tournament.successfulEntries >= tournament.maxTeams ? 'Full' : 'Join'}
        </button>
        {!isPerKillTournament && (
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowStructure((current) => !current)}>
            Match Structure
          </button>
        )}
        {isJoined && <button type="button" className="btn btn-sm btn-secondary" onClick={handleViewResults}>View Results</button>}
      </div>

      {!isPerKillTournament && showStructure && (
        <div className="mt-4 border-t border-[#1F1F1F] pt-3">
          <div className="mb-2 text-xs uppercase tracking-wide text-[#A1A1A1]">Match Structure</div>
          <div className="space-y-2">
            {stages.length === 0 ? (
              <p className="text-sm text-[#A1A1A1]">No stage structure configured yet.</p>
            ) : (
              stages.map((stage) => (
                <div key={stage.key || stage.name} className="flex items-center justify-between gap-3 rounded-lg border border-[#1F1F1F] bg-[#0B0B0B] px-3 py-2">
                  <span className="text-sm font-medium text-white">{stage.name}</span>
                  <span className="text-xs text-[#A1A1A1]">{Number(stage.matchCount || stage.matches?.length || 0)} match{Number(stage.matchCount || stage.matches?.length || 0) === 1 ? '' : 'es'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showResults && <div className="mt-4 border-t border-[#1F1F1F] pt-3"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-white">Published Results</span><button type="button" className="text-sm text-[#A1A1A1]" onClick={() => { setShowResults(false); setSelectedStageKey(null); }}>Close</button></div>
        {isPerKillTournament ? (
          results.length === 0 ? <p className="mt-3 text-sm text-[#A1A1A1]">Result not published yet.</p> : <div className="mt-3 space-y-2">{results.map((result) => <div key={`${result.matchId}-${result._id}`} className="border-t border-[#1F1F1F] pt-2"><p className="text-xs text-[#FFB066]">{result.stageKey} · Match</p><div className="mt-2 grid grid-cols-4 text-xs uppercase tracking-wide text-[#A1A1A1]"><span>Top</span><span>Name</span><span>Kill</span><span>Money</span></div>{[...result.entries].sort((a, b) => Number(b.kills ?? 0) - Number(a.kills ?? 0) || Number(b.money ?? 0) - Number(a.money ?? 0)).map((entry, index) => <div key={entry.participantId} className="mt-2 grid grid-cols-4 text-sm text-white"><span>{index + 1}</span><span>{entry.participantName}</span><span>{Number(entry.kills ?? 0)}</span><span>₹{Number(entry.money ?? 0)}</span></div>)}</div>)}</div>
        ) : (
          <div className="mt-3 space-y-3">
            {customStageResults.length === 0 ? (
              <p className="mt-3 text-sm text-[#A1A1A1]">No stages available yet.</p>
            ) : (
              customStageResults.map(({ stage, result }) => {
                const stageHasResult = Boolean(result);
                const isSelected = selectedStageKey === stage.key;
                return (
                  <div key={stage.key || stage.name} className="rounded-lg border border-[#1F1F1F] bg-[#0D0D0D] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-white">{stage.name}</span>
                      <button
                        type="button"
                        disabled={!stageHasResult}
                        onClick={() => setSelectedStageKey(stageHasResult ? stage.key : null)}
                        className={`btn btn-sm ${stageHasResult ? 'btn-secondary' : 'btn-disabled'}`} 
                        style={{ opacity: stageHasResult ? 1 : 0.5, cursor: stageHasResult ? 'pointer' : 'not-allowed' }}
                      >
                        {stageHasResult ? (isSelected ? 'Viewing' : 'View') : 'Not Uploaded'}
                      </button>
                    </div>

                    {stageHasResult && isSelected && selectedStageResult && (
                      <div className="mt-3 border-t border-[#1F1F1F] pt-3">
                        <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#FFB066]">{stage.name} result</p>
                        <div className="grid grid-cols-4 text-[10px] uppercase tracking-wide text-[#A1A1A1]">
                          <span>Top</span>
                          <span>Name</span>
                          <span>Score</span>
                          <span>Points</span>
                        </div>
                        {[...(selectedStageResult.entries || [])].sort((a, b) => Number(b.points ?? 0) - Number(a.points ?? 0)).map((entry, index) => (
                          <div key={`${selectedStageResult.matchId}-${entry.participantId || index}`} className="mt-2 grid grid-cols-4 text-sm text-white">
                            <span>{index + 1}</span>
                            <span>{entry.participantName}</span>
                            <span>{Number(entry.points ?? 0)}</span>
                            <span>{Number(entry.points ?? 0)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>}
    </Card>
  );
};

export default TournamentCard;