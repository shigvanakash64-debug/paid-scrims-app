import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const HostTournamentMatchesPanel = ({ tournamentId, onBack }) => {
  const [tournament, setTournament] = useState(null);
  const [results, setResults] = useState({});
  const [activeTab, setActiveTab] = useState({});
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/manage`, { headers: { Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load tournament matches');
        setTournament(data.tournament);
        setResults(Object.fromEntries((data.results || []).map((result) => [String(result.matchId), result])));
      } catch (loadError) { setError(loadError.message); }
    };
    load();
  }, [tournamentId]);

  const getDraft = (match) => drafts[match._id] || results[match._id]?.entries || [];
  const setDraft = (matchId, entries) => setDrafts((current) => ({ ...current, [matchId]: entries }));
  const saveDraft = async (match) => {
    const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/matches/${match._id}/result`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` }, body: JSON.stringify({ entries: getDraft(match) }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save draft');
    setResults((current) => ({ ...current, [match._id]: data.result }));
    setDrafts((current) => ({ ...current, [match._id]: data.result.entries }));
  };
  const publish = async (match) => {
    await saveDraft(match);
    const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/matches/${match._id}/result/publish`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to publish result');
    setResults((current) => ({ ...current, [match._id]: data.result }));
  };
  const run = (action) => action().catch((actionError) => setError(actionError.message));
  const addRow = (match) => setDraft(match._id, [...getDraft(match), { participantId: '', points: '' }]);
  const updateRow = (match, index, field, value) => setDraft(match._id, getDraft(match).map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry));
  const removeRow = (match, index) => setDraft(match._id, getDraft(match).filter((_, entryIndex) => entryIndex !== index));

  if (!tournament) return <div className="text-[#A1A1A1]">{error || 'Loading tournament matches...'}</div>;

  return <div className="space-y-6"><button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-[#A1A1A1] hover:text-white"><ArrowLeft size={16} /> Host Dashboard</button><div><h1 className="text-3xl font-bold text-white">{tournament.name}</h1><p className="mt-2 text-sm text-[#A1A1A1]">Open a match to upload or view its official result.</p></div>{error && <p className="text-sm text-[#FCA5A5]">{error}</p>}{tournament.stages.map((stage) => <section key={stage.key} className="space-y-3"><h2 className="text-xl font-semibold text-white">{stage.name}</h2>{stage.matches.map((match) => { const result = results[match._id]; const isPublished = result?.status === 'published'; const tab = activeTab[match._id] || 'upload'; const entries = getDraft(match); return <Card key={match._id}><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold text-white">{match.name}</h3>{isPublished && <span className="text-sm text-[#22C55E]">RESULT PUBLISHED ✓</span>}</div><div className="mt-4 flex gap-4 border-b border-[#1F1F1F] pb-2"><button type="button" className={`text-sm ${tab === 'upload' ? 'text-[#FF6A00]' : 'text-[#A1A1A1]'}`} onClick={() => setActiveTab((current) => ({ ...current, [match._id]: 'upload' }))}>UPLOAD RESULT</button><button type="button" className={`text-sm ${tab === 'view' ? 'text-[#FF6A00]' : 'text-[#A1A1A1]'}`} onClick={() => setActiveTab((current) => ({ ...current, [match._id]: 'view' }))}>VIEW RESULT</button></div>{tab === 'view' ? <PublishedRows result={result} /> : isPublished ? <p className="mt-4 text-sm text-[#22C55E]">This result is locked.</p> : <div className="mt-4 space-y-3"><p className="text-xs text-[#A1A1A1]">Only participants assigned to this match can be selected.</p>{entries.map((entry, index) => <div key={`${match._id}-${index}`} className="flex flex-wrap items-center gap-2"><select className="auth-input min-w-0 flex-1" value={entry.participantId} onChange={(event) => updateRow(match, index, 'participantId', event.target.value)}><option value="">Select participant</option>{match.participants.map((participant) => <option key={participant._id} value={participant._id}>{participant.displayName || participant.userId?.username || 'Participant'}</option>)}</select><input className="auth-input w-28" type="number" min="0" value={entry.points} placeholder="Points" onChange={(event) => updateRow(match, index, 'points', event.target.value)} /><button type="button" className="text-[#A1A1A1]" onClick={() => removeRow(match, index)}><X size={18} /></button></div>)}<div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={() => addRow(match)}><Plus size={16} /> Add Result</Button><Button type="button" variant="secondary" onClick={() => run(() => saveDraft(match))}>Save Draft</Button><Button type="button" variant="primary" onClick={() => run(() => publish(match))}>Publish Result</Button></div></div>}</Card>; })}</section>)}</div>;
};

const PublishedRows = ({ result }) => {
  if (!result || result.status !== 'published') return <p className="mt-4 text-sm text-[#A1A1A1]">Result not published yet.</p>;
  return <div className="mt-4 space-y-2"><div className="grid grid-cols-3 text-xs uppercase text-[#A1A1A1]"><span>Rank</span><span>Participant</span><span>Points</span></div>{[...result.entries].sort((a, b) => b.points - a.points).map((entry, index) => <div key={entry.participantId} className="grid grid-cols-3 border-t border-[#1F1F1F] py-2 text-sm text-white"><span>{index + 1}</span><span>{entry.participantName}</span><span>{entry.points}</span></div>)}</div>;
};

export default HostTournamentMatchesPanel;