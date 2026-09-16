import { useMemo, useState } from 'react';
import { Card } from './Card';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const formatTime12Hour = (value) => {
  if (!value || value === 'undefined' || value === 'null') return '';
  const [hours = '0', minutes = '00'] = String(value).split(':');
  const hour = Number(hours);
  if (!Number.isFinite(hour)) return '';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${formattedHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

export const TournamentCard = ({ tournament, user, onJoined }) => {
  const [activePanel, setActivePanel] = useState(null);
  const [results, setResults] = useState([]);
  const [selectedStageKey, setSelectedStageKey] = useState(null);
  const [groupData, setGroupData] = useState({ groups: [], userGroup: tournament?.userGroup || null });
  const [expandedGroup, setExpandedGroup] = useState(null);
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
    const response = await fetch(`${API_BASE}/tournaments/${tournament._id}/public-matches`);
    const data = await response.json();
    if (response.ok) setResults(data.results || []);
    setActivePanel((current) => (current === 'results' ? null : 'results'));
  };

  const handleLoadGroups = async () => {
    if (!isJoined) return;
    const response = await fetch(`${API_BASE}/tournaments/${tournament._id}/groups`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` },
    });
    const data = await response.json();
    if (!response.ok) {
      window.alert(data.error || 'Unable to load your group');
      return;
    }
    setGroupData({ groups: data.groups || [], userGroup: data.userGroup ?? tournament?.userGroup ?? null });
    setActivePanel((current) => (current === 'groups' ? null : 'groups'));
  };
  const hostUsername = tournament?.createdBy?.username || tournament?.hostUsername || 'Host';
  const isPerKillTournament = tournament?.format === 'single-match' || tournament?.format === 'br-per-kill';
  const formatTitle = tournament?.format === 'single-match' || tournament?.format === 'br-per-kill'
    ? 'BR Per Kill Tournament'
    : tournament?.format === 'custom' || tournament?.format === 'br-custom'
      ? 'BR Custom Tournament'
      : tournament?.format === 'cs-every-win'
        ? 'CS Every Single Win'
        : tournament?.format === 'cs-custom' ? 'CS Custom Tournament' : tournament?.format;
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
      {(tournament.estimatedDate || tournament.hostMessage) && (
        <div className="mt-4 rounded-lg border border-[#1F1F1F] bg-[#0B0B0B] p-3 text-xs text-[#A1A1A1]">
          {tournament.estimatedDate && (
            <div className="mb-2">
              <span className="text-[#A1A1A1]">Estimated Match:</span>
              <b className="text-white"> {new Date(tournament.estimatedDate).toLocaleDateString()}</b>
              {tournament.estimatedTime && (
                <span className="ml-2 text-[#FFB066]">{formatTime12Hour(tournament.estimatedTime)}</span>
              )}
            </div>
          )}
          {tournament.hostMessage && <div><span className="text-[#A1A1A1]">Host Message:</span> <b className="text-white">{tournament.hostMessage}</b></div>}
        </div>
      )}
      <div className="br-match-actions">
        <span className="registered-badge">{formatTitle} · OPEN</span>
        <button type="button" className="btn btn-sm btn-primary" onClick={handleJoin} disabled={isJoined || tournament.successfulEntries >= tournament.maxTeams}>
          {isJoined ? 'Joined' : tournament.successfulEntries >= tournament.maxTeams ? 'Full' : 'Join'}
        </button>
        {!isPerKillTournament && (
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => setActivePanel((current) => (current === 'structure' ? null : 'structure'))}>
            Match Structure
          </button>
        )}
        {isJoined && <button type="button" className="btn btn-sm btn-secondary" onClick={handleViewResults}>View Results</button>}
        {isJoined && <button type="button" className="btn btn-sm btn-secondary" onClick={handleLoadGroups}>Your Group</button>}
      </div>

      {!isPerKillTournament && activePanel === 'structure' && (
        <div className="mt-4 border-t border-[#1F1F1F] pt-3">
          <div className="mb-2 text-xs uppercase tracking-wide text-[#A1A1A1]">Match Structure</div>
          <div className="space-y-2">
            {stages.length === 0 ? (
              <p className="text-sm text-[#A1A1A1]">No stage structure configured yet.</p>
            ) : (
              stages.map((stage) => (
                <div key={stage.key || stage.name} className="flex items-center justify-between gap-3 rounded-lg border border-[#1F1F1F] bg-[#0B0B0B] px-3 py-2">
                  <span className="text-sm font-medium text-white">{tournament.format === 'cs-every-win' && stage.key === 'cs-every-win' ? 'Round 1' : stage.name}</span>
                  {stage.time && <span className="text-xs text-[#FFB066]">{formatTime12Hour(stage.time)}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activePanel === 'groups' && (
        <div className="mt-3 border-t border-[#1F1F1F] pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Your Group</span>
            <span className="text-xs text-[#FFB066]">{groupData.userGroup ? `Group ${groupData.userGroup}` : 'Not assigned'}</span>
          </div>
          <div className="space-y-2">
            {groupData.groups.length === 0 ? (
              <p className="text-sm text-[#A1A1A1]">No groups are available yet.</p>
            ) : (
              groupData.groups.map((group) => (
                <div key={`group-${group.groupNumber}`} className="rounded-lg border border-[#1F1F1F] bg-[#0D0D0D] p-3">
                  <button type="button" className="flex w-full items-center justify-between text-left text-sm font-medium text-white" onClick={() => setExpandedGroup((current) => current === group.groupNumber ? null : group.groupNumber)}>
                    <span>Group {group.groupNumber}</span>
                    <span className="text-xs text-[#A1A1A1]">{group.participants.length} players</span>
                  </button>
                  {expandedGroup === group.groupNumber && (
                    <div className="mt-2 space-y-1 border-t border-[#1F1F1F] pt-2 text-sm text-[#E5E5E5]">
                      {group.participants.map((participant) => (
                        <div key={participant._id || participant.participantId} className="flex items-center justify-between gap-2 rounded-md bg-[#111111] px-2 py-1">
                          <span>{participant.displayName || participant.username || 'Participant'}</span>
                          {group.groupNumber === Number(groupData.userGroup) && <span className="text-[10px] uppercase tracking-wide text-[#FFB066]" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activePanel === 'results' && <div className="mt-3 border-t border-[#1F1F1F] pt-2"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-white">Published Results</span><button type="button" className="text-sm text-[#A1A1A1]" onClick={() => { setActivePanel(null); setSelectedStageKey(null); }}>Close</button></div>
        {isPerKillTournament ? (
          results.length === 0 ? <p className="mt-2 text-sm text-[#A1A1A1]">Result not published yet.</p> : <div className="mt-2 space-y-2">{results.map((result) => <div key={`${result.matchId}-${result._id}`} className="border-t border-[#1F1F1F] pt-2"><p className="text-xs text-[#FFB066]">{result.stageKey} · Match</p><div className="mt-1 grid grid-cols-4 text-xs uppercase tracking-wide text-[#A1A1A1]"><span>Top</span><span>Name</span><span>Kill</span><span>Money</span></div>{[...result.entries].sort((a, b) => Number(b.kills ?? 0) - Number(a.kills ?? 0) || Number(b.money ?? 0) - Number(a.money ?? 0)).map((entry, index) => <div key={entry.participantId} className="mt-1 grid grid-cols-4 text-sm text-white"><span>{index + 1}</span><span>{entry.participantName}</span><span>{Number(entry.kills ?? 0)}</span><span>₹{Number(entry.money ?? 0)}</span></div>)}</div>)}</div>
        ) : (
          <div className="mt-2 space-y-2">
            {customStageResults.length === 0 ? (
              <p className="mt-2 text-sm text-[#A1A1A1]">No stages available yet.</p>
            ) : (
              customStageResults.map(({ stage, result }) => {
                const stageHasResult = Boolean(result);
                const isSelected = selectedStageKey === stage.key;
                return (
                  <div key={stage.key || stage.name} className="rounded-lg border border-[#1F1F1F] bg-[#0D0D0D] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-white">{tournament.format === 'cs-every-win' && stage.key === 'cs-every-win' ? 'Round 1' : stage.name}</span>
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
                      <div className="mt-2 border-t border-[#1F1F1F] pt-2">
                        <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#FFB066]">{stage.name} result</p>
                        <div className="grid grid-cols-4 gap-x-2 text-[10px] uppercase tracking-wide text-[#A1A1A1]">
                          <span>Top</span>
                          <span>Name</span>
                          <span>Kill</span>
                          <span>Points</span>
                        </div>
                        {[...(selectedStageResult.entries || [])].sort((a, b) => Number(b.kills ?? 0) - Number(a.kills ?? 0) || Number(b.points ?? 0) - Number(a.points ?? 0)).map((entry, index) => (
                          <div key={`${selectedStageResult.matchId}-${entry.participantId || index}`} className="mt-1 grid grid-cols-4 gap-x-2 text-sm text-white">
                            <span>{index + 1}</span>
                            <span className="break-words leading-tight">{entry.participantName}</span>
                            <span>{Number(entry.kills ?? 0)}</span>
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