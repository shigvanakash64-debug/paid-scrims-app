import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'clutchzone_token';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` });

const statusLabel = {
  pending: 'Waiting for host',
  accepted: 'Host is making this match',
  declined: 'Host declined',
};

export const GlobalChatScreen = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isHostOrAdmin = ['host', 'admin'].includes(user?.role) || user?.isAdmin === true;

  const loadRequests = async () => {
    try {
      const response = await fetch(`${API_BASE}/global-match-requests`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load global chat');
      setRequests(data.requests || []);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const timer = setInterval(loadRequests, 8000);
    return () => clearInterval(timer);
  }, []);

  const respond = async (requestId, status) => {
    try {
      const response = await fetch(`${API_BASE}/global-match-requests/${requestId}/respond`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to respond to request');
      setRequests((current) => current.map((request) => request.id === requestId ? data.request : request));
    } catch (responseError) {
      setError(responseError.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Global Chat</h1>
        <p className="mt-2 text-sm text-[#A1A1A1]">{isHostOrAdmin ? 'See what players want to play and respond to their requests.' : 'Hosts can see your request and let you know when they are making the match.'}</p>
      </div>

      {error && <div className="rounded-xl border border-[#EF4444] bg-[#1A0B0B] p-4 text-sm text-[#FCA5A5]">{error}</div>}
      {loading ? (
        <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-6 text-center text-[#A1A1A1]">Loading global chat...</div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-8 text-center text-[#A1A1A1]">No match requests yet.</div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <article key={request.id} className="rounded-2xl border border-[#2A2A2A] bg-[#111111] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#FF6A00]">{request.username} wants to play</p>
                  <h2 className="mt-2 text-lg font-semibold text-white">{request.game} · {request.mode}</h2>
                  <p className="mt-1 text-sm text-[#D4D4D4]">{request.type} · {request.skillSetting} · CZ- {request.entryFee}</p>
                  <p className="mt-2 text-xs text-[#737373]">{new Date(request.createdAt).toLocaleString()}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${request.status === 'accepted' ? 'border-[#22C55E] text-[#22C55E]' : request.status === 'declined' ? 'border-[#EF4444] text-[#EF4444]' : 'border-[#FFB066] text-[#FFB066]'}`}>
                  {statusLabel[request.status] || request.status}
                </span>
              </div>
              {isHostOrAdmin && request.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => respond(request.id, 'accepted')} className="rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-black">YES</button>
                  <button type="button" onClick={() => respond(request.id, 'declined')} className="rounded-lg border border-[#EF4444] px-4 py-2 text-sm font-semibold text-[#EF4444]">NO</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
