import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const AdminHostsPanel = () => {
  const [hosts, setHosts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHosts = async () => {
      try {
        const response = await fetch(`${API_BASE}/admin/hosts`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load hosts');
        setHosts(data.hosts || []);
      } catch (loadError) {
        setError(loadError.message);
      }
    };
    loadHosts();
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Hosts</h1>
        <p className="mt-2 text-sm text-[#A1A1A1]">Monitor host accounts and their tournament activity.</p>
      </div>
      {error && <p className="text-[#FCA5A5]">{error}</p>}
      {hosts.length === 0 && !error && <p className="text-[#A1A1A1]">No host accounts found.</p>}
      <div className="space-y-4">
        {hosts.map((host) => (
          <div key={host._id} className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="font-semibold text-white">{host.username}</h2><p className="text-sm text-[#A1A1A1]">{host.title || 'Host account'}</p></div>
              <span className="text-sm text-[#FFB066]">{host.tournaments.length} tournaments</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[#A1A1A1]"><tr><th className="py-2">Tournament</th><th>Status</th><th>Players</th><th>Scheduled</th></tr></thead>
                <tbody>{host.tournaments.map((tournament) => <tr key={tournament._id} className="border-t border-[#1F1F1F] text-white"><td className="py-2">{tournament.matchName}</td><td>{tournament.status}</td><td>{tournament.currentPlayers}/{tournament.maxPlayers}</td><td>{tournament.scheduledDateTime ? new Date(tournament.scheduledDateTime).toLocaleString() : 'Unscheduled'}</td></tr>)}</tbody>
              </table>
            </div>
            {host.parentTournaments?.length > 0 && <div className="mt-5 border-t border-[#1F1F1F] pt-4"><h3 className="text-sm font-semibold text-white">Parent Tournaments</h3><div className="mt-2 space-y-2">{host.parentTournaments.map((tournament) => <div key={tournament._id} className="flex flex-wrap justify-between gap-2 text-sm"><span className="text-white">{tournament.name}</span><span className="text-[#A1A1A1]">{tournament.format === 'single-match' ? 'Per Kill Tournament' : tournament.format} · {tournament.status} · ₹{tournament.prizePool || 0}</span></div>)}</div></div>}
          </div>
        ))}
      </div>
    </section>
  );
};