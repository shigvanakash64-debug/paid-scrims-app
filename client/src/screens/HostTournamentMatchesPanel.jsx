import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Save, Trophy } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const HostTournamentMatchesPanel = ({ tournamentId, onBack }) => {
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedStageKey, setSelectedStageKey] = useState('');
  const [activeResult, setActiveResult] = useState(null);
  const [draftStageKey, setDraftStageKey] = useState(null);
  const [form, setForm] = useState({ matchTitle: '', resultType: 'normal', entries: [] });
  const isPerKillTournament = tournament?.format === 'single-match';
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
      if (publishedStageResult.length > 0) {
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
      if (tournament?.format === 'single-match' && results.some((result) => result.status === 'published')) {
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
        resultType: tournament?.format === 'single-match' ? 'grand-finale' : (stage.key === 'grand-final' ? 'grand-finale' : 'normal'),
      });
      setForm({
        matchTitle: stage.name || buildDefaultMatchTitle(stage),
        resultType: tournament?.format === 'single-match' ? 'grand-finale' : (stage.key === 'grand-final' ? 'grand-finale' : 'normal'),
        entries: [],
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
      resultType: result.resultType || (tournament?.format === 'single-match' ? 'grand-finale' : (stage.key === 'grand-final' ? 'grand-finale' : 'normal')),
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

  const publishResult = async () => {
    if (!activeResult) return;
    if (form.entries.length === 0) {
      setError('Add at least one result before publishing.');
      return;
    }

    const confirmed = window.confirm('Publish this per-kill result? This will lock the result and pay winners.');
    if (!confirmed) return;

    try {
      const payload = {
        matchTitle: form.matchTitle,
        resultType: form.resultType,
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
          }),
        });
        const createData = await createResponse.json().catch(() => ({}));
        if (!createResponse.ok) throw new Error(createData.error || 'Failed to create result');
        publishMatchId = createData.result?.matchId || createData.match?._id;
        setActiveResult(createData.result);
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
        <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
        <p className="mt-2 text-sm text-[#A1A1A1]">Create and publish one match result at a time.</p>
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
                    {isStageOpen && (
                      <Button variant="secondary" size="sm" onClick={closeResultEditor}>
                        Close
                      </Button>
                    )}
                    <Button variant="primary" size="sm" onClick={() => openCreateResult(stage)} disabled={hasPublishedResult || (draftStageKey === stage.key) || (tournament?.format === 'single-match' && results.some((result) => result.status === 'published'))}>
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
                            <span className="w-24 text-right">{isPerKillTournament ? 'Kill' : 'Points'}</span>
                            {isPerKillTournament && <span className="w-28 text-right">Money</span>}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex w-10 items-center justify-center text-sm font-semibold text-[#FFB066]">#{index + 1}</span>
                            <select
                              className="auth-input min-w-[220px] flex-1"
                              value={entry.participantId}
                              onChange={(event) => {
                                const participant = stageParticipants.find((item) => String(item._id) === String(event.target.value));
                                updateEntry(index, 'participantId', event.target.value);
                                updateEntry(index, 'participantName', participant?.displayName || 'Participant');
                              }}
                            >
                              <option value="">Select participant</option>
                              {stageParticipants.map((participant) => (
                                <option key={participant._id} value={participant._id}>
                                  {participant.displayName || participant.userId || 'Participant'}
                                </option>
                              ))}
                            </select>

                            {isPerKillTournament ? <>
                              <input
                                className="auth-input w-24"
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
                            </> : <input
                              className="auth-input w-24"
                              type="number"
                              min="0"
                              value={entry.points}
                              onChange={(event) => updateEntry(index, 'points', event.target.value)}
                              placeholder="Points"
                            />}

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
