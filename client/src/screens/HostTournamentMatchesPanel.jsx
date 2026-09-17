import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Save, Trophy } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

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

export const HostTournamentMatchesPanel = ({ tournamentId, onBack }) => {
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedStageKey, setSelectedStageKey] = useState('');
  const [activeResult, setActiveResult] = useState(null);
  const [draftStageKey, setDraftStageKey] = useState(null);
  const [form, setForm] = useState({ matchTitle: '', resultType: 'normal', winnerParticipantId: '', entries: [] });
  const isPerKillTournament = tournament?.format === 'single-match' || tournament?.format === 'br-per-kill';
  const isEveryWinTournament = tournament?.format === 'cs-every-win';
  const isSingleStageTournament = isPerKillTournament || isEveryWinTournament;
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadTournament = async () => {
    try {
      const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/manage`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load tournament');
      setTournament(data.tournament);
      setParticipants(data.participants || []);
      setResults(data.results || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    if (tournamentId) {
      loadTournament();
    }
  }, [tournamentId]);

  const selectedStage = useMemo(
    () => tournament?.stages?.find((stage) => stage.key === selectedStageKey) || null,
    [tournament, selectedStageKey],
  );

  const stageParticipants = useMemo(() => {
    const optionMap = new Map();

    if (participants.length) {
      participants.forEach((participant) => {
        if (!participant?._id) return;
        optionMap.set(String(participant._id), {
          _id: participant._id,
          displayName: participant.displayName || participant.userName || participant.username || 'Participant',
        });
      });
    }

    if (selectedStage) {
      const stageMatchesParticipants = (selectedStage.matches || []).flatMap((match) => match.participants || []);
      stageMatchesParticipants.forEach((participant) => {
        if (!participant?._id) return;
        if (!optionMap.has(String(participant._id))) {
          optionMap.set(String(participant._id), participant);
        }
      });
    }

    return [...optionMap.values()];
  }, [participants, selectedStage]);

  const buildDefaultMatchTitle = (stage) => `${stage.name} - Match ${Math.max(1, (stage.matches?.length || 0) + 1)}`;

  const openCreateResult = async (stage) => {
    try {
      const publishedStageResult = results.filter((result) => result.stageKey === stage.key && result.status === 'published');
      if (publishedStageResult.length > 0 && !isEveryWinTournament) {
        openExistingResult(stage, publishedStageResult[0]);
        return;
      }

      const draftStageResult = results.filter((result) => result.stageKey === stage.key && result.status === 'draft');
      if (draftStageResult.length > 0) {
        openExistingResult(stage, draftStageResult[0]);
        return;
      }

      if (draftStageKey === stage.key) {
        return;
      }
      if (isEveryWinTournament) {
        const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}`,
          },
          body: JSON.stringify({
            stageKey: stage.key,
            matchTitle: buildDefaultMatchTitle(stage),
            resultType: 'grand-finale',
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to create CS knockout match');
        const participantMap = new Map(stageParticipants.map((participant) => [String(participant._id), participant]));
        const matchParticipants = (data.match?.participants || []).map((participantId) => {
          const participant = participantMap.get(String(participantId));
          return {
            participantId,
            participantName: participant?.displayName || participant?.username || 'Participant',
            kills: '',
            money: '',
            points: '',
          };
        });
        setError('');
        setNotice('CS knockout match ready. Select the winner after the match.');
        setSelectedStageKey(stage.key);
        setDraftStageKey(stage.key);
        setActiveResult(data.result);
        setForm({ matchTitle: data.result.matchTitle, resultType: 'grand-finale', winnerParticipantId: '', entries: matchParticipants });
        return;
      }
      if (isPerKillTournament && results.some((result) => result.status === 'published')) {
        setError('This per-kill tournament already has one published result.');
        return;
      }
      setError('');
      setNotice('');
      setSelectedStageKey(stage.key);
      setDraftStageKey(stage.key);
      setActiveResult({
        stageKey: stage.key,
        matchId: null,
        status: 'draft',
        matchTitle: stage.name || buildDefaultMatchTitle(stage),
        resultType: isSingleStageTournament ? 'grand-finale' : (stage.key === 'grand-final' ? 'grand-finale' : 'normal'),
      });
      setForm({
        matchTitle: stage.name || buildDefaultMatchTitle(stage),
        resultType: isSingleStageTournament ? 'grand-finale' : (stage.key === 'grand-final' ? 'grand-finale' : 'normal'),
        winnerParticipantId: '',
        entries: tournament?.format === 'cs-every-win' ? stageParticipants.slice(0, 2).map((participant) => ({ participantId: participant._id, participantName: participant.displayName, kills: '', money: '', points: '' })) : [],
      });
      setNotice('Result ready. Add the participant scores and publish it.');
    } catch (createError) {
      setError(createError.message);
    }
  };

  const openExistingResult = (stage, result) => {
    setSelectedStageKey(stage.key);
    setActiveResult(result);
    setForm({
      matchTitle: stage.name || result.matchTitle || buildDefaultMatchTitle(stage),
      resultType: result.resultType || (isSingleStageTournament ? 'grand-finale' : (stage.key === 'grand-final' ? 'grand-finale' : 'normal')),
      winnerParticipantId: result.winnerParticipantId || '',
      entries: (result.entries || []).map((entry) => ({
        participantId: entry.participantId,
        participantName: entry.participantName,
        kills: String(entry.kills ?? ''),
        money: String(entry.money ?? ''),
        points: String(entry.points ?? ''),
      })),
    });
    setError('');
    setNotice('');
  };

  const closeResultEditor = () => {
    setSelectedStageKey('');
    setActiveResult(null);
    setDraftStageKey(null);
    setError('');
    setNotice('');
  };

  const updateEntry = (index, field, value) => {
    setForm((current) => {
      const nextEntries = current.entries.map((entry, entryIndex) => {
        if (entryIndex !== index) return entry;
        const nextEntry = { ...entry, [field]: value };
        if (isPerKillTournament && field === 'kills') {
          const kills = Number(value || 0);
          const reward = Number(tournament?.perKillReward || 0);
          nextEntry.money = String(kills * reward);
        }
        return nextEntry;
      });
      return { ...current, entries: nextEntries };
    });
  };

  const addEntry = () => {
    if (isEveryWinTournament && form.entries.length >= 2) {
      setError('CS Every Single Win matches can contain only two participants.');
      return;
    }
    setForm((current) => ({
      ...current,
      entries: [...current.entries, {
        participantId: '',
        participantName: '',
        kills: isPerKillTournament ? '' : '',
        money: isPerKillTournament ? '' : '',
        points: isPerKillTournament ? '' : '',
      }],
    }));
  };

  const handleParticipantSelect = (index, participantId) => {
    const selectedIds = new Set(
      form.entries
        .filter((_, entryIndex) => entryIndex !== index && entryIndex !== undefined && entryIndex !== null)
        .map((entry) => String(entry.participantId || ''))
        .filter(Boolean),
    );

    if (participantId && selectedIds.has(String(participantId))) {
      setError('This participant is already selected in this result. Pick a different participant.');
      return;
    }

    setError('');
    const participant = stageParticipants.find((item) => String(item._id) === String(participantId));
    setForm((current) => ({
      ...current,
      entries: current.entries.map((entry, entryIndex) => {
        if (entryIndex !== index) return entry;
        return {
          ...entry,
          participantId: participantId || '',
          participantName: participant?.displayName || participant?.userId || participant?.username || 'Participant',
        };
      }),
    }));
  };

  const removeEntry = (index) => {
    setForm((current) => ({
      ...current,
      entries: current.entries.filter((_, entryIndex) => entryIndex !== index),
    }));
  };

  const saveDraft = async () => {
    if (!activeResult) return;

    try {
      const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/matches/${activeResult.matchId}/result`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
        body: JSON.stringify({
          matchTitle: form.matchTitle,
          resultType: form.resultType,
          entries: form.entries.map((entry) => ({
            participantId: entry.participantId,
            points: Number(entry.points || 0),
            kills: Number(entry.kills || 0),
            money: Number(entry.money || 0),
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save draft');
      setActiveResult(data.result);
      setNotice('Draft saved successfully.');
      await loadTournament();
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const addStage = async () => {
    if (!['custom', 'br-custom', 'cs-custom'].includes(tournament?.format)) return;
    const stageName = window.prompt('Enter new stage name');
    if (!stageName || !stageName.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/stages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
        body: JSON.stringify({ name: stageName.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add stage');
      setNotice('Stage added successfully.');
      setError('');
      await loadTournament();
    } catch (addError) {
      setError(addError.message);
    }
  };

  const publishResult = async () => {
    if (!activeResult) return;
    if (form.entries.length === 0) {
      setError('Add at least one result before publishing.');
      return;
    }

    const confirmed = window.confirm(isPerKillTournament
      ? 'Publish this per-kill result? This will lock the result and pay winners.'
      : isEveryWinTournament
        ? 'Publish this CS every-win result? This will lock the result.'
      : 'Publish this custom tournament result? This will lock the result.');
    if (!confirmed) return;

    try {
      const payload = {
        matchTitle: form.matchTitle,
        resultType: form.resultType,
        winnerParticipantId: form.winnerParticipantId,
        entries: form.entries.map((entry) => ({
          participantId: entry.participantId,
          points: Number(entry.points || 0),
          kills: Number(entry.kills || 0),
          money: Number(entry.money || 0),
        })),
      };

      let publishMatchId = activeResult?.matchId;
      if (!publishMatchId) {
        const createResponse = await fetch(`${API_BASE}/tournaments/${tournamentId}/results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}`,
          },
          body: JSON.stringify({
            stageKey: selectedStageKey,
            matchTitle: form.matchTitle,
            resultType: form.resultType,
            participantIds: form.entries.map((entry) => entry.participantId).filter(Boolean),
          }),
        });
        const createData = await createResponse.json().catch(() => ({}));
        if (!createResponse.ok) throw new Error(createData.error || 'Failed to create result');
        publishMatchId = createData.result?.matchId || createData.match?._id;
        setActiveResult(createData.result);
        if (isEveryWinTournament) {
          const createdParticipants = createData.match?.participants || [];
          const participantMap = new Map(stageParticipants.map((participant) => [String(participant._id), participant]));
          setForm((current) => ({
            ...current,
            winnerParticipantId: '',
            entries: createdParticipants.map((participant) => {
              const details = participantMap.get(String(participant._id || participant));
              return {
                participantId: participant._id || participant,
                participantName: details?.displayName || details?.username || 'Participant',
                kills: '',
                money: '',
                points: '',
              };
            }),
          }));
        }
      }

      const saveResponse = await fetch(`${API_BASE}/tournaments/${tournamentId}/matches/${publishMatchId}/result`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
        body: JSON.stringify(payload),
      });

      const saveData = await saveResponse.json().catch(() => ({}));
      if (!saveResponse.ok) throw new Error(saveData.error || 'Failed to save result');

      const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/matches/${publishMatchId}/result/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to publish result');
      setActiveResult(data.result);
      setDraftStageKey(null);
      setNotice('Result published successfully.');
      setError('');
      await loadTournament();
    } catch (publishError) {
      setError(publishError.message);
    }
  };

  if (!tournament) {
    return <div className="text-[#A1A1A1]">{error || 'Loading tournament...'}</div>;
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-[#A1A1A1] hover:text-white">
        <ArrowLeft size={16} /> Host Dashboard
      </button>

      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
            <p className="mt-2 text-sm text-[#A1A1A1]">Create and publish one match result at a time.</p>
          </div>
          {['custom', 'br-custom', 'cs-custom'].includes(tournament.format) && (
            <Button variant="secondary" size="sm" onClick={addStage}>
              <Plus size={16} /> Create Stage
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-[#FCA5A5]">{error}</p>}
      {notice && <p className="text-sm text-[#22C55E]">{notice}</p>}

      <div className="space-y-3">
        {tournament.stages.map((stage) => {
          const publishedStageResults = results.filter((result) => result.stageKey === stage.key && result.status === 'published');
          const hasPublishedResult = publishedStageResults.length > 0;
          const isStageOpen = selectedStageKey === stage.key && activeResult;

          return (
            <div key={stage.key} className="space-y-3">
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-white">{stage.name}</h2>
                    <p className="text-sm text-[#A1A1A1]">
                      {publishedStageResults.length} published result{publishedStageResults.length === 1 ? '' : 's'} · {stage.matchCount} planned
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {['custom', 'br-custom', 'cs-custom'].includes(tournament?.format) && (
                      <Button variant="secondary" size="sm" onClick={addStage}>
                        <Plus size={16} /> Create Stage
                      </Button>
                    )}
                    {isStageOpen && (
                      <Button variant="secondary" size="sm" onClick={closeResultEditor}>
                        Close
                      </Button>
                    )}
                    <Button variant="primary" size="sm" onClick={() => openCreateResult(stage)} disabled={(!isEveryWinTournament && hasPublishedResult) || (draftStageKey === stage.key) || (isPerKillTournament && results.some((result) => result.status === 'published'))}>
                      <Plus size={16} /> {isStageOpen ? 'Reopen Result' : 'Create Result'}
                    </Button>
                  </div>
                </div>
              </Card>

              {isStageOpen && activeResult && selectedStage && (
                <Card>
                  {!isPerKillTournament && (
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold text-white">{activeResult.status === 'published' ? 'Published Result' : 'Create Result'}</h2>
                      <p className="text-sm text-[#A1A1A1]">
                        {activeResult.status === 'published'
                          ? 'This result is locked.'
                          : 'Add participant scores and publish the final result.'}
                      </p>
                    </div>
                  )}
                  {isPerKillTournament && (
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold text-white">{activeResult.status === 'published' ? 'Published Result' : 'Create Result'}</h2>
                      <p className="text-sm text-[#A1A1A1]">
                        {activeResult.status === 'published'
                          ? 'This result is locked.'
                          : 'Add participant kills and publish the final result.'}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 space-y-4">
                    <label className="block text-sm text-[#A1A1A1]">
                      Match Title
                      <input
                        className="auth-input mt-2 w-full"
                        value={form.matchTitle}
                        readOnly
                      />
                    </label>

                    {isEveryWinTournament && (
                      <label className="block text-sm text-[#A1A1A1]">
                        Match Winner
                        <select
                          className="auth-input mt-2 w-full"
                          value={form.winnerParticipantId}
                          onChange={(event) => setForm((current) => ({ ...current, winnerParticipantId: event.target.value }))}
                        >
                          <option value="">Select winner</option>
                          {form.entries.filter((entry) => entry.participantId).map((entry) => (
                            <option key={entry.participantId} value={entry.participantId}>{entry.participantName}</option>
                          ))}
                        </select>
                      </label>
                    )}

                    {!isPerKillTournament && <label className="block text-sm text-[#A1A1A1]">
                      Result Type
                      <select
                        className="auth-input mt-2 w-full"
                        value={form.resultType}
                        onChange={(event) => setForm((current) => ({ ...current, resultType: event.target.value }))}
                      >
                        <option value="normal">Normal Stage Result</option>
                        <option value="grand-finale">Grand Finale Result</option>
                      </select>
                    </label>}

                    <div className="space-y-3">
                      {form.entries.length === 0 && (
                        <p className="text-sm text-[#A1A1A1]">No entries added yet.</p>
                      )}

                      {form.entries.map((entry, index) => (
                        <div key={`${entry.participantId || 'new'}-${index}`} className="rounded-lg border border-[#2B2B2B] p-3">
                          <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#A1A1A1]">
                            <span className="w-10">Top</span>
                            <span className="flex-1">Participant</span>
                            {!isPerKillTournament && <span className="w-20 text-right">Kill</span>}
                            <span className="w-20 text-right">{isPerKillTournament ? 'Kill' : 'Points'}</span>
                            {isPerKillTournament && <span className="w-28 text-right">Money</span>}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex w-10 items-center justify-center text-sm font-semibold text-[#FFB066]">#{index + 1}</span>
                            <select
                              className="auth-input min-w-[220px] flex-1"
                              value={entry.participantId}
                              onChange={(event) => handleParticipantSelect(index, event.target.value)}
                            >
                              <option value="">Select participant</option>
                              {stageParticipants
                                .filter((participant) => {
                                  const participantId = String(participant._id);
                                  const isCurrentSelection = String(entry.participantId || '') === participantId;
                                  const takenByAnotherEntry = form.entries.some((entryItem, entryIndex) => entryIndex !== index && String(entryItem.participantId || '') === participantId);
                                  return isCurrentSelection || !takenByAnotherEntry;
                                })
                                .map((participant) => (
                                  <option key={participant._id} value={participant._id}>
                                    {participant.displayName || participant.userId || 'Participant'}
                                  </option>
                                ))}
                            </select>

                            {isPerKillTournament ? <>
                              <input
                                className="auth-input w-20"
                                type="number"
                                min="0"
                                value={entry.kills ?? ''}
                                onChange={(event) => updateEntry(index, 'kills', event.target.value)}
                                placeholder="Kill"
                              />
                              <input
                                className="auth-input w-28"
                                type="number"
                                min="0"
                                value={entry.money ?? ''}
                                readOnly
                                placeholder="Money"
                              />
                            </> : <>
                              <input
                                className="auth-input w-20"
                                type="number"
                                min="0"
                                value={entry.kills ?? ''}
                                onChange={(event) => updateEntry(index, 'kills', event.target.value)}
                                placeholder="Kill"
                              />
                              <input
                                className="auth-input w-20"
                                type="number"
                                min="0"
                                value={entry.points ?? ''}
                                onChange={(event) => updateEntry(index, 'points', event.target.value)}
                                placeholder="Points"
                              />
                            </>}

                            <button type="button" onClick={() => removeEntry(index)} className="text-sm text-[#FCA5A5]">
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button variant="secondary" size="sm" onClick={addEntry}>
                        <Plus size={16} /> Add Entry
                      </Button>
                      {!isPerKillTournament && (
                        <Button variant="secondary" size="sm" onClick={saveDraft}>
                          <Save size={16} /> Save Draft
                        </Button>
                      )}
                      <Button variant="primary" size="sm" onClick={publishResult} disabled={activeResult?.status === 'published'}>
                        <Trophy size={16} /> Publish Result
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HostTournamentMatchesPanel;
