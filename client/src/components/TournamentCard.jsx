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
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [inGameName, setInGameName] = useState(user?.username || '');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [results, setResults] = useState([]);
  const [selectedStageKey, setSelectedStageKey] = useState(null);
  const [groupData, setGroupData] = useState({ groups: [], userGroup: tournament?.userGroup || null });
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState(() => Array.from({ length: 6 }, (_, index) => index === 0 ? user?.username || '' : ''));
  const usesTeamRoster = ['br-custom', 'cs-custom', 'team-vs-team'].includes(tournament?.format);
  const teamSize = Math.min(6, Math.max(1, Number(tournament?.teamSize) || 1));

  const handleJoin = async () => {
    if (!user) {
      window.alert('Please login to join this tournament');
      return;
    }

    let registration;
    if (usesTeamRoster) {
      const normalizedMembers = teamMembers.slice(0, teamSize).map((member) => member.trim());
      if (!teamName.trim()) {
        setJoinError('Enter a team name to continue.');
        return;
      }
      if (normalizedMembers.some((member) => !member)) {
        setJoinError('Enter a name for every team member.');
        return;
      }
      registration = { teamName: teamName.trim(), teamMembers: normalizedMembers };
    } else {
      if (!inGameName.trim()) {
        setJoinError('Enter your in-game name to continue.');
        return;
      }
      registration = { inGameName: inGameName.trim() };
    }

    setJoining(true);
    setJoinError('');
    try {
      const response = await fetch(`${API_BASE}/tournaments/${tournament._id}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registration),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to join tournament');
      setShowJoinForm(false);
      onJoined?.();
    } catch (error) {
      setJoinError(error.message);
    } finally {
      setJoining(false);
    }
  };

  const handleViewResults = async () => {
    const response = await fetch(`${API_BASE}/tournaments/${tournament._id}/public-matches`);
    const data = await response.json();
    if (response.ok) setResults(data.results || []);
    setActivePanel((current) => (current === 'results' ? null : 'results'));
  };

  const handleLoadGroups = async (groupNumber = null) => {
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
    if (groupNumber !== null) setExpandedGroup(Number(groupNumber));
    setActivePanel((current) => (current === 'groups' ? null : 'groups'));
  };
  const hostUsername = tournament?.createdBy?.username || tournament?.hostUsername || 'Host';
  const isPerKillTournament = tournament?.format === 'single-match' || tournament?.format === 'br-per-kill';
  const formatTitle = tournament?.format === 'single-match' || tournament?.format === 'br-per-kill'
    ? 'Per Kill Tournament'
    : tournament?.format === 'custom' || tournament?.format === 'br-custom' || tournament?.format === 'cs-custom'
      ? 'Custom Tournament'
      : tournament?.format === 'team-vs-team'
        ? 'Team vs Team Tournament'
        : tournament?.format;
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

  const isJoinReady = usesTeamRoster
    ? Boolean(teamName.trim()) && teamMembers.slice(0, teamSize).every((member) => member.trim())
    : Boolean(inGameName.trim());

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
        <div className="br-match-stat"><span className="label">Game</span><span className="value">{tournament.game}</span></div>
        {usesTeamRoster && <div className="br-match-stat"><span className="label">Team Size</span><span className="value">{teamSize}</span></div>}
        <div className="br-match-stat"><span className="label">Entry Fee</span><span className="value">₹{tournament.entryFee}</span></div>
        <div className="br-match-stat"><span className="label">Paid Entries</span><span className="value">{tournament.successfulEntries}/{tournament.maxTeams}</span></div>
        <div className="br-match-stat"><span className="label">{tournament.format === 'single-match' ? 'Per Kill' : 'Prize Pool'}</span><span className="value">₹{Number(tournament.format === 'single-match' ? tournament.perKillReward || 0 : tournament.prizePool || 0).toLocaleString()}</span></div>
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
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowJoinForm(true)} disabled={isJoined || tournament.successfulEntries >= tournament.maxTeams}>
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

      {activePanel && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#0B0B0B] p-4" role="dialog" aria-modal="true">
          <div className="relative mx-auto min-h-full max-w-xl pt-12">
            <button
              type="button"
              aria-label="Close panel"
              className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg border border-[#2A2A2A] bg-[#111111] text-2xl text-white hover:bg-[#1A1A1A]"
              onClick={() => { setActivePanel(null); setSelectedStageKey(null); }}
            >
              ×
            </button>
      {!isPerKillTournament && activePanel === 'structure' && (
        <div className="border-t border-[#1F1F1F] pt-3">
          <div className="mb-2 text-xs uppercase tracking-wide text-[#A1A1A1]">Match Structure</div>
          <div className="space-y-2">
            {stages.length === 0 ? (
              <p className="text-sm text-[#A1A1A1]">No stage structure configured yet.</p>
            ) : (
              stages.map((stage) => (
                <div key={stage.key || stage.name} className="flex items-center justify-between gap-3 rounded-lg border border-[#1F1F1F] bg-[#0B0B0B] px-3 py-2">
                  <span className="text-sm font-medium text-white">{stage.name}</span>
                  {stage.time && <span className="text-xs text-[#FFB066]">{formatTime12Hour(stage.time)}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activePanel === 'groups' && (
        <div className="border-t border-[#1F1F1F] pt-3">
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
                    <span className="text-xs text-[#A1A1A1]">{group.participants.length} {usesTeamRoster ? 'teams' : 'players'}</span>
                  </button>
                  {expandedGroup === group.groupNumber && (
                    <div className="mt-2 space-y-1 border-t border-[#1F1F1F] pt-2 text-sm text-[#E5E5E5]">
                      {group.participants.map((participant) => (
                        <div key={participant._id || participant.participantId} className="flex items-center justify-between gap-2 rounded-md bg-[#111111] px-2 py-1">
                          <div className="min-w-0">
                            <span className="block break-words">{participant.teamName || participant.displayName || participant.username || 'Participant'}</span>
                            {participant.teamMembers?.length > 0 && <span className="block break-words text-xs text-[#A1A1A1]">{participant.teamMembers.join(' · ')}</span>}
                          </div>
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

      {activePanel === 'results' && <div className="border-t border-[#1F1F1F] pt-2"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-white">Published Results</span></div>
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
          </div>
        </div>
      )}
      {showJoinForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation">
          <form
            className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-xl border border-[#2A2A2A] bg-[#111111] p-5 text-white"
            onSubmit={(event) => {
              event.preventDefault();
              handleJoin();
            }}
          >
            <div>
              <h2 className="text-lg font-semibold">Join tournament</h2>
              <p className="mt-1 text-sm text-[#A1A1A1]">
                {usesTeamRoster ? `Enter your team name and ${teamSize} member names for ${tournament.name}.` : `Enter the in-game name to use for ${tournament.name}.`}
              </p>
            </div>
            {usesTeamRoster ? (
              <div className="space-y-3">
                <label className="block text-sm text-[#D4D4D4]" htmlFor={`tournament-team-name-${tournament._id}`}>
                  Team name
                  <input
                    id={`tournament-team-name-${tournament._id}`}
                    className="mt-2 w-full rounded-lg border border-[#333333] bg-[#0B0B0B] px-3 py-2 text-white"
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value.slice(0, 50))}
                    maxLength={50}
                    autoFocus
                    required
                  />
                </label>
                {Array.from({ length: teamSize }, (_, index) => (
                  <label key={index} className="block text-sm text-[#D4D4D4]" htmlFor={`tournament-team-member-${tournament._id}-${index}`}>
                    Team member {index + 1}
                    <input
                      id={`tournament-team-member-${tournament._id}-${index}`}
                      className="mt-2 w-full rounded-lg border border-[#333333] bg-[#0B0B0B] px-3 py-2 text-white"
                      value={teamMembers[index]}
                      onChange={(event) => setTeamMembers((current) => current.map((member, memberIndex) => memberIndex === index ? event.target.value.slice(0, 50) : member))}
                      maxLength={50}
                      required
                    />
                  </label>
                ))}
              </div>
            ) : (
              <label className="block text-sm text-[#D4D4D4]" htmlFor={`tournament-ign-${tournament._id}`}>
                In-game name
                <input
                  id={`tournament-ign-${tournament._id}`}
                  className="mt-2 w-full rounded-lg border border-[#333333] bg-[#0B0B0B] px-3 py-2 text-white"
                  value={inGameName}
                  onChange={(event) => setInGameName(event.target.value.slice(0, 50))}
                  maxLength={50}
                  autoFocus
                  required
                />
              </label>
            )}
            {joinError && <p className="text-sm text-red-400" role="alert">{joinError}</p>}
            <div className="flex justify-end gap-2">
              <button className="btn btn-sm btn-secondary" type="button" onClick={() => { setShowJoinForm(false); setJoinError(''); }} disabled={joining}>Cancel</button>
              <button className="btn btn-sm btn-primary" type="submit" disabled={joining || !isJoinReady}>{joining ? 'Joining...' : 'Join tournament'}</button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
};

export default TournamentCard;