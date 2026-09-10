import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Save, Trophy } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const HostTournamentMatchesPanel = ({ tournamentId, onBack }) => {
  const [tournament, setTournament] = useState(null);
  const [results, setResults] = useState([]);
  const [selectedStageKey, setSelectedStageKey] = useState('');
  const [activeResult, setActiveResult] = useState(null);
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
    if (!selectedStage) return [];
    const allParticipants = (selectedStage.matches || []).flatMap((match) => match.participants || []);
    const deduped = new Map();
    allParticipants.forEach((participant) => {
      if (!participant?._id) return;
      deduped.set(String(participant._id), participant);
    });
    return [...deduped.values()];
  }, [selectedStage]);

  const buildDefaultMatchTitle = (stage) => `${stage.name} - Match ${Math.max(1, (stage.matches?.length || 0) + 1)}`;

  const openCreateResult = async (stage) => {
    try {
      if (tournament?.format === 'single-match' && results.length > 0) {
        setError('This per-kill tournament already has one published result.');
        return;
      }
      setError('');
      setNotice('');
      const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
        body: JSON.stringify({
          stageKey: stage.key,
          matchTitle: buildDefaultMatchTitle(stage),
          resultType: tournament?.format === 'single-match' ? 'grand-finale' : (stage.key === 'grand-final' ? 'grand-finale' : 'normal'),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create result');

      setSelectedStageKey(stage.key);
      setActiveResult(data.result);
      setForm({
        matchTitle: data.result?.matchTitle || buildDefaultMatchTitle(stage),
        resultType: data.result?.resultType || (tournament?.format === 'single-match' ? 'grand-finale' : (stage.key === 'grand-final' ? 'grand-finale' : 'normal')),
        entries: [],
      });
      setNotice('Result created. Add the participant scores and publish it.');
      await loadTournament();
    } catch (createError) {
      setError(createError.message);
    }
  };

  const openExistingResult = (stage, result) => {
    setSelectedStageKey(stage.key);
    setActiveResult(result);
    setForm({
      matchTitle: result.matchTitle || buildDefaultMatchTitle(stage),
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

    try {
      const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/matches/${activeResult.matchId}/result/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to publish result');
      setActiveResult(data.result);
      setNotice('Result published successfully.');
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
          const stageResult = results.filter((result) => result.stageKey === stage.key);

          return (
            <Card key={stage.key}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-white">{stage.name}</h2>
                  <p className="text-sm text-[#A1A1A1]">
                    {stageResult.length} results created · {stage.matchCount} planned
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={() => openCreateResult(stage)} disabled={tournament?.format === 'single-match' && results.length > 0}>
                  <Plus size={16} /> Create Result
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {activeResult && selectedStage && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">{activeResult.status === 'published' ? 'Published Result' : 'Create Result'}</h2>
              <p className="text-sm text-[#A1A1A1]">
                {activeResult.status === 'published'
                  ? 'This result is locked.'
                  : 'Add participant scores and publish the final result.'}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setActiveResult(null)}>
              Close
            </Button>
          </div>

          <div className="mt-4 space-y-4">
            <label className="block text-sm text-[#A1A1A1]">
              Match Title
              <input
                className="auth-input mt-2 w-full"
                value={form.matchTitle}
                onChange={(event) => setForm((current) => ({ ...current, matchTitle: event.target.value }))}
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
                <div key={`${entry.participantId || 'new'}-${index}`} className="flex flex-wrap items-center gap-2 rounded-lg border border-[#2B2B2B] p-3">
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
                      placeholder="Kills"
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
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" size="sm" onClick={addEntry}>
                <Plus size={16} /> Add Entry
              </Button>
              <Button variant="secondary" size="sm" onClick={saveDraft}>
                <Save size={16} /> Save Draft
              </Button>
              <Button variant="primary" size="sm" onClick={publishResult} disabled={activeResult?.status === 'published'}>
                <Trophy size={16} /> Publish Result
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default HostTournamentMatchesPanel;
