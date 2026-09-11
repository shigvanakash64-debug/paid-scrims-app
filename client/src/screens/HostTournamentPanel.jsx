import { useState } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const FORMAT_OPTIONS = [
  { value: 'single-match', title: 'Per Kill Tournament', description: 'One match', detail: 'Per-kill reward' },
  { value: 'custom', title: 'Custom Tournament', description: 'Host manually creates the stages', detail: 'Flexible stage structure' },
];

export const HostTournamentPanel = ({ onBack }) => {
  const [step, setStep] = useState('format');
  const [format, setFormat] = useState('');
  const [form, setForm] = useState({ name: '', game: 'Free Fire', entryFee: '', maxTeams: '', perKillReward: '' });
  const [customStages, setCustomStages] = useState([{ name: '' }]);
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

    if (format === 'single-match') {
      const entryFee = Number(form.entryFee);
      const perKillReward = Number(form.perKillReward);
      if (!Number.isFinite(entryFee) || !Number.isFinite(perKillReward) || entryFee <= perKillReward) {
        setError('For per-kill tournaments, entry fee must be greater than the per-kill reward. Example: entry fee 5 and per kill 3 is valid.');
        return;
      }
    }

    if (format === 'custom') {
      const validStages = customStages.filter((stage) => stage?.name?.trim());
      if (validStages.length === 0) {
        setError('Add at least one stage name before creating the custom tournament.');
        return;
      }
    }

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
    return (
      <div className="space-y-6">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-[#A1A1A1] hover:text-white">
          <ArrowLeft size={16} /> Host Dashboard
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Select Tournament Format</h1>
          <p className="mt-2 text-sm text-[#A1A1A1]">Choose how the parent tournament will organize its stages.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {FORMAT_OPTIONS.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setFormat(option.value);
                setStep('form');
              }}
              className="text-left"
            >
              <Card className="h-full transition hover:border-[#FF6A00]">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-2xl">{index + 1}️⃣</span>
                  <Plus size={18} className="text-[#FF6A00]" />
                </div>
                <h2 className="mt-5 text-lg font-semibold text-white">{option.title}</h2>
                <p className="mt-2 text-sm text-[#A1A1A1]">{option.description}</p>
                <p className="mt-3 text-sm text-[#FFB066]">{option.detail}</p>
              </Card>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'created') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Tournament Created</h1>
          <p className="mt-2 text-sm text-[#A1A1A1]">{created?.name} is ready for stage and match management.</p>
        </div>

        <Card>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <span className="text-xs text-[#A1A1A1]">Format</span>
              <p className="font-semibold text-white">{created?.format === 'single-match' ? 'Per Kill Tournament' : created?.format}</p>
            </div>
            {created?.format === 'single-match' ? (
              <div>
                <span className="text-xs text-[#A1A1A1]">Per Kill</span>
                <p className="font-semibold text-white">₹{created?.perKillReward || 0}</p>
              </div>
            ) : (
              <div>
                <span className="text-xs text-[#A1A1A1]">Prize Pool</span>
                <p className="font-semibold text-white">₹{created?.prizePool}</p>
              </div>
            )}
            <div>
              <span className="text-xs text-[#A1A1A1]">Stages</span>
              <p className="font-semibold text-white">{created?.stages?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Button variant="secondary" onClick={onBack}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => setStep('format')} className="flex items-center gap-2 text-sm text-[#A1A1A1] hover:text-white">
        <ArrowLeft size={16} /> Change Format
      </button>

      <div>
        <h1 className="text-3xl font-bold text-white">Create Tournament</h1>
        <p className="mt-2 text-sm text-[#A1A1A1]">{FORMAT_OPTIONS.find((option) => option.value === format)?.title}</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm text-[#A1A1A1]">
              Tournament Name
              <input className="auth-input" name="name" value={form.name} onChange={updateForm} required placeholder="Enter tournament name" />
            </label>

            <label className="space-y-2 text-sm text-[#A1A1A1]">
              Game
              <select className="auth-input" name="game" value={form.game} onChange={updateForm}
              >
                <option>Free Fire</option>
                <option>BGMI</option>
              </select>
            </label>

            <label className="space-y-2 text-sm text-[#A1A1A1]">
              Entry Fee
              <input className="auth-input" type="number" name="entryFee" value={form.entryFee} onChange={updateForm} min="0" required placeholder="₹ 0" />
            </label>

            <label className="space-y-2 text-sm text-[#A1A1A1]">
              Maximum Teams
              <input className="auth-input" type="number" name="maxTeams" value={form.maxTeams} onChange={updateForm} min="1" required placeholder="Enter maximum teams" />
            </label>

            {isSingleMatch ? (
              <label className="space-y-2 text-sm text-[#A1A1A1]">
                Per Kill Reward
                <input className="auth-input" type="number" name="perKillReward" value={form.perKillReward} onChange={updateForm} min="0" required placeholder="₹ per kill" />
              </label>
            ) : (
              <div className="space-y-2 text-sm text-[#A1A1A1]">
                Prize Pool
                <div className="rounded-lg border border-[#1F1F1F] bg-[#0B0B0B] px-3 py-3 font-semibold text-[#FFB066]">
                  ₹{prizePool.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white">Tournament Format</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {FORMAT_OPTIONS.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#1F1F1F] bg-[#0B0B0B] px-3 py-3 text-white">
                <input
                  type="radio"
                  checked={format === option.value}
                  onChange={() => setFormat(option.value)}
                  value={option.value}
                />
                <span>
                  <span className="block font-medium">{option.title}</span>
                  <span className="block text-sm text-[#A1A1A1]">{option.description}</span>
                </span>
              </label>
            ))}
          </div>

          {format === 'custom' && (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-white">Stage Names</h3>
                <button
                  type="button"
                  onClick={() => setCustomStages((current) => [...current, { name: '' }])}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#2B2B2B] bg-[#111111] px-3 py-2 text-sm text-[#FFB066] hover:border-[#FF6A00]"
                >
                  <Plus size={16} /> Add Stage
                </button>
              </div>

              <div className="space-y-3">
                {customStages.map((stage, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      className="auth-input flex-1"
                      value={stage.name}
                      onChange={(event) => {
                        const next = [...customStages];
                        next[index] = { ...next[index], name: event.target.value };
                        setCustomStages(next);
                      }}
                      placeholder="Stage name"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomStages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#2B2B2B] bg-[#111111] text-xl text-[#E5E7EB] hover:border-[#FF6A00] hover:text-[#FF6A00]"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {error && <p className="text-sm text-[#FCA5A5]">{error}</p>}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Tournament'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default HostTournamentPanel;
