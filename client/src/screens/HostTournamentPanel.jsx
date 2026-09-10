import { useState } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const FORMAT_OPTIONS = [
  { value: 'single-match', title: 'Single Match Tournament', description: 'One match', detail: 'Per-kill reward' },
  { value: 'custom', title: 'Custom Tournament', description: 'Host manually creates the stages', detail: 'Flexible stage structure' },
];

const generatedStages = [
  ['Group Stage', '5 Groups · 3 Matches per Group'],
  ['Quarter Final', 'Automatically generated'],
  ['Semi Final', 'Automatically generated'],
  ['Grand Final', 'Automatically generated'],
];

export const HostTournamentPanel = ({ onBack }) => {
  const [step, setStep] = useState('format');
  const [format, setFormat] = useState('');
  const [form, setForm] = useState({ name: '', game: 'Free Fire', entryFee: '', maxTeams: '', perKillReward: '' });
  const [customStages, setCustomStages] = useState([{ name: '', matches: 1 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const isSingleMatch = format === 'single-match';
  const successfulEntries = 0;
  const prizePool = isSingleMatch ? 0 : (Number(form.entryFee) || 0) * successfulEntries * 0.7;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` },
        body: JSON.stringify({ ...form, format, customStages: format === 'custom' ? customStages : [] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create tournament');
      setCreated(data.tournament);
      setStep('created');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'format') {
    return <div className="space-y-6"><button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-[#A1A1A1] hover:text-white"><ArrowLeft size={16} /> Host Dashboard</button><div><h1 className="text-3xl font-bold text-white">Select Tournament Format</h1><p className="mt-2 text-sm text-[#A1A1A1]">Choose how the parent tournament will organize its stages.</p></div><div className="grid gap-4 lg:grid-cols-2">{FORMAT_OPTIONS.map((option, index) => <button key={option.value} type="button" onClick={() => { setFormat(option.value); setStep('form'); }} className="text-left"><Card className="h-full transition hover:border-[#FF6A00]"><div className="flex items-start justify-between gap-3"><span className="text-2xl">{index + 1}️⃣</span><Plus size={18} className="text-[#FF6A00]" /></div><h2 className="mt-5 text-lg font-semibold text-white">{option.title}</h2><p className="mt-2 text-sm text-[#A1A1A1]">{option.description}</p><p className="mt-3 text-sm text-[#FFB066]">{option.detail}</p></Card></button>)}</div></div>;
  }

  if (step === 'created') {
    return <div className="space-y-6"><div><h1 className="text-3xl font-bold text-white">Tournament Created</h1><p className="mt-2 text-sm text-[#A1A1A1]">{created?.name} is ready for stage and match management.</p></div><Card><div className="grid gap-4 sm:grid-cols-3"><div><span className="text-xs text-[#A1A1A1]">Format</span><p className="font-semibold text-white">{created?.format}</p></div>{created?.format === 'single-match' ? <div><span className="text-xs text-[#A1A1A1]">Per Kill</span><p className="font-semibold text-white">₹{created?.perKillReward || 0}</p></div> : <div><span className="text-xs text-[#A1A1A1]">Prize Pool</span><p className="font-semibold text-white">₹{created?.prizePool}</p></div>}<div><span className="text-xs text-[#A1A1A1]">Stages</span><p className="font-semibold text-white">{created?.stages?.length || 0}</p></div></div></Card><Button variant="secondary" onClick={onBack}>Back to Dashboard</Button></div>;
  }

  return <div className="space-y-6"><button type="button" onClick={() => setStep('format')} className="flex items-center gap-2 text-sm text-[#A1A1A1] hover:text-white"><ArrowLeft size={16} /> Change Format</button><div><h1 className="text-3xl font-bold text-white">Create Tournament</h1><p className="mt-2 text-sm text-[#A1A1A1]">{FORMAT_OPTIONS.find((option) => option.value === format)?.title}</p></div><form onSubmit={submit} className="space-y-6"><Card><div className="grid gap-5 md:grid-cols-2"><label className="space-y-2 text-sm text-[#A1A1A1]">Tournament Name<input className="auth-input" name="name" value={form.name} onChange={updateForm} required placeholder="Enter tournament name" /></label><label className="space-y-2 text-sm text-[#A1A1A1]">Game<select className="auth-input" name="game" value={form.game} onChange={updateForm}><option>Free Fire</option><option>BGMI</option></select></label><label className="space-y-2 text-sm text-[#A1A1A1]">Entry Fee<input className="auth-input" type="number" name="entryFee" value={form.entryFee} onChange={updateForm} min="0" required placeholder="₹ 0" /></label><label className="space-y-2 text-sm text-[#A1A1A1]">Maximum Teams<input className="auth-input" type="number" name="maxTeams" value={form.maxTeams} onChange={updateForm} min="1" required placeholder="Enter maximum teams" /></label>{isSingleMatch ? <label className="space-y-2 text-sm text-[#A1A1A1]">Per Kill Reward<input className="auth-input" type="number" name="perKillReward" value={form.perKillReward} onChange={updateForm} min="0" required placeholder="₹ per kill" /></label> : <div className="space-y-2 text-sm text-[#A1A1A1]">Prize Pool<div className="rounded-lg border border-[#1F1F1F] bg-[#0B0B0B] px-3 py-3 font-semibold text-[#FFB066]">₹{prizePool.toLocaleString()}</div></div>}</div></Card><Card><h2 className="text-lg font-semibold text-white">Tournament Format</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{FORMAT_OPTIONS.map((option) => <label key={option.value} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${format === option.value ? 'border-[#FF6A00] text-white' : 'border-[#1F1F1F] text-[#A1A1A1]'}`}><input type="radio" name="format" checked={format === option.value} onChange={() => setFormat(option.value)} value={option.value} />{option.title}</label>)}</div></Card>{format === 'multi-stage' && <Card><h2 className="text-lg font-semibold text-white">Stage Structure</h2><div className="mt-4 space-y-3">{generatedStages.map(([name, detail], index) => <div key={name} className="flex items-center gap-3"><span className="text-[#FF6A00]">{index + 1}</span><div><p className="font-semibold text-white">{name}</p><p className="text-sm text-[#A1A1A1]">{detail}</p></div></div>)}</div></Card>}{format === 'single-match' && <Card><h2 className="text-lg font-semibold text-white">Stage Structure</h2><p className="mt-3 text-sm text-[#A1A1A1]">One match with a per-kill reward. Match details can be managed after creation.</p></Card>}{format === 'custom' && <Card><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-white">Stage Structure</h2><p className="mt-1 text-sm text-[#A1A1A1]">Add the stages you want to manage.</p></div><Button type="button" variant="secondary" onClick={() => setCustomStages([...customStages, { name: '', matches: 1 }])}><Plus size={16} /></Button></div><div className="mt-4 space-y-3">{customStages.map((stage, index) => <div key={index} className="flex gap-3"><input className="auth-input flex-1" value={stage.name} placeholder={`Stage ${index + 1} name`} onChange={(event) => setCustomStages(customStages.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} /><input className="auth-input w-32" type="number" min="1" value={stage.matches} onChange={(event) => setCustomStages(customStages.map((item, itemIndex) => itemIndex === index ? { ...item, matches: event.target.value } : item))} /><button type="button" className="text-[#A1A1A1] hover:text-white" onClick={() => setCustomStages(customStages.filter((_, itemIndex) => itemIndex !== index))} disabled={customStages.length === 1}><X size={18} /></button></div>)}</div></Card>}{error && <p className="text-sm text-[#FCA5A5]">{error}</p>}<Button type="submit" variant="primary" disabled={loading}>{loading ? 'Creating...' : 'Create Tournament'}</Button></form></div>;
};