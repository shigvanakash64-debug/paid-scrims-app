import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const HostTournamentMatchesPanel = ({ tournamentId, onBack }) => {
  const [tournament, setTournament] = useState(null);
  const [results, setResults] = useState([]);
  const [stageKey, setStageKey] = useState('');
  const [activeResult, setActiveResult] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [form, setForm] = useState({ matchTitle: '', resultType: 'normal', entries: [] });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadTournament = async () => {
    try {
      const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/manage`, { headers: { Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load tournament');
      setTournament(data.tournament);
      setResults(data.results || []);
    } catch (loadError) { setError(loadError.message); }
  };

  useEffect(() => { loadTournament(); }, [tournamentId]);

  const openCreate = (stage) => {
    setStageKey(stage.key);
    setActiveResult(null);
    setActiveTab('upload');
    setForm({ matchTitle: `${stage.name} - Match ${stage.matches.length + 1}`, resultType: stage.key === 'grand-final' ? 'grand-finale' : 'normal', entries: [] });
    setError('');
  };

  const openExisting = (stage, result) => {
    setStageKey(stage.key);
    setActiveResult(result);
    setActiveTab('upload');
    setForm({ matchTitle: result.matchTitle, resultType: result.resultType, entries: result.entries || [] });
    setError('');
  };

  const selectedStage = tournament?.stages.find((stage) => stage.key === stageKey);
  const selectedMatch = selectedStage?.matches.find((match) => String(match._id) === String(activeResult?.matchId));
  const participants = selectedMatch?.participants || selectedStage?.matches?.flatMap((match) => match.participants || []) || [];
  const resultForMatch = (match) => results.find((result) => String(result.matchId) === String(match._id));

  const updateEntry = (index, field, value) => setForm((current) => ({ ...current, entries: current.entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry) }));
  const addEntry = () => setForm((current) => ({ ...current, entries: [...current.entries, { participantId: '', points: '' }] }));
  const removeEntry = (index) => setForm((current) => ({ ...current, entries: current.entries.filter((_, entryIndex) => entryIndex !== index) }));

  const saveDraft = async () => {
    if (!activeResult) {
      const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/results`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` }, body: JSON.stringify({ stageKey, matchTitle: form.matchTitle, resultType: form.resultType }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create result');
      setActiveResult(data.result);
      await loadTournament();
      return data.result;
    }
    const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/matches/${activeResult.matchId}/result`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` }, body: JSON.stringify({ matchTitle: form.matchTitle, resultType: form.resultType, entries: form.entries }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save draft');
    setResults((current) => [...current.filter((result) => result.matchId !== data.result.matchId), data.result]);
    setActiveResult(data.result);
    return data.result;
  };

  const saveAndPublish = async () => {
    const draft = await saveDraft();
    const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/matches/${draft.matchId}/result/publish`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to publish result');
    setResults((current) => [...current.filter((result) => result.matchId !== data.result.matchId), data.result]);
    setActiveResult(data.result);
    setNotice(data.result.resultType === 'grand-finale' ? 'Grand Finale published and payouts distributed.' : 'Normal stage result published. No payout was distributed.');
  };

  const run = (action) => { setError(''); setNotice(''); action().catch((actionError) => setError(actionError.message)); };

  if (!tournament) return <div className="text-[#A1A1A1]">{error || 'Loading tournament...'}</div>;

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-[#A1A1A1] hover:text-white"><ArrowLeft size={16} /> Host Dashboard</button>
      <div><h1 className="text-3xl font-bold text-white">{tournament.name}</h1><p className="mt-2 text-sm text-[#A1A1A1]">Create and publish one match result at a time.</p></div>
      {error && <p className="text-sm text-[#FCA5A5]">{error}</p>}{notice && <p className="text-sm text-[#22C55E]">{notice}</p>}
      {!activeResult && <div className="space-y-3">{tournament.stages.map((stage) => <Card key={stage.key}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-white">{stage.name}</h2><p className="text-sm text-[#A1A1A1]">{stage.matches.length} results created · {stage.matchCount} planned</p></div><Button variant="primary" size="sm" onClick={() => openCreate(stage)}><Plus size={16} /> Create Result</Button></div>{stage.matches.length > 0 && <div className="mt-4 space-y-2">{stage.matches.map((match) => { const result = resultForMatch(match); return <div key={match._id} className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1F1F1F] pt-2"><span className="text-sm text-white">{match.name}</span><div className="flex items-center gap-3"><span className="text-xs text-[#A1A1A1]">{result?.status === 'published' ? 'PUBLISHED' : result ? 'DRAFT' : 'NO RESULT'}</span><Button variant="secondary" size="sm" onClick={() => openExisting(stage, result)} disabled={!result}>Manage Result</Button></div></div>; })}</div>}</Card>)}</div>}
      {activeResult && <Card><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-white">{activeResult.status === 'published' ? 'Published Result' : 'Create Result'}</h2><p className="text-sm text-[#A1A1A1]">{activeResult.status === 'published' ? 'This result is locked.' : 'Edit the title, participants, and points before publishing.'}</p></div><Button variant="secondary" size="sm" onClick={() => setActiveResult(null)}>Back to Matches</Button></div><div className="mt-4 flex gap-4 border-b border-[#1F1F1F] pb-2"><button type="button" className={activeTab === 'upload' ? 'text-[#FF6A00]' : 'text-[#A1A1A1]'} onClick={() => setActiveTab('upload')}>UPLOAD RESULT</button><button type="button" className={activeTab === 'view' ? 'text-[#FF6A00]' : 'text-[#A1A1A1]'} onClick={() => setActiveTab('view')}>VIEW RESULT</button></div>{activeTab === 'view' ? <PublishedRows result={activeResult} /> : activeResult.status === 'published' ? <p className="mt-4 text-[#22C55E]">RESULT PUBLISHED ✓ This result is locked.</p> : <div className="mt-4 space-y-4"><label className="block text-sm text-[#A1A1A1]">Match Title<input className="auth-input mt-2 w-full" value={form.matchTitle} onChange={(event) => setForm((current) => ({ ...current, matchTitle: event.target.value }))} /></label><label className="block text-sm text-[#A1A1A1]">Result Type<select className="auth-input mt-2 w-full" value={form.resultType} onChange={(event) => setForm((current) => ({ ...current, resultType: event.target.value }))}><option value="normal">Normal Stage Result (no payout)</option><option value="grand-finale">Grand Finale Result (distribute payouts)</option></select></label><div className="space-y-3">{form.entries.map((entry, index) => <div key={index} className="flex flex-wrap gap-2"><select className="auth-input min-w-0 flex-1" value={entry.participantId} onChange={(event) => updateEntry(index, 'participantId', event.target.value)}><option value="">Select participant</option>{participants.map((participant) => <option key={participant._id} value={participant._id}>{participant.displayName || participant.userId?.username || 'Participant'}</option>)}</select><input className="auth-input w-28" type="number" min="0" value={entry.points} placeholder="Points" onChange={(event) => updateEntry(index, 'points', event.target.value)} /><button type="button" className="text-[#A1A1A1]" onClick={() => removeEntry(index)}><X size={18} /></button></div>)}<div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={addEntry}><Plus size={16} /> Add Result</Button><Button type="button" variant="secondary" onClick={() => run(saveDraft)}>Save Draft</Button><Button type="button" variant="primary" onClick={() => run(saveAndPublish)}>Publish Result</Button></div></div></div>}</Card>}
    </div>
  );
};

const PublishedRows = ({ result }) => {
  if (!result || result.status !== 'published') return <p className="mt-4 text-sm text-[#A1A1A1]">Result not published yet.</p>;
  return <div className="mt-4 space-y-2">{[...result.entries].sort((left, right) => right.points - left.points).map((entry, index) => <div key={entry.participantId} className="grid grid-cols-3 border-t border-[#1F1F1F] py-2 text-sm text-white"><span>{index + 1}</span><span>{entry.participantName}</span><span>{entry.points}</span></div>)}</div>;
};

export default HostTournamentMatchesPanel;
