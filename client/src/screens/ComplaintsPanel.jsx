import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const ComplaintsPanel = () => {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');

  const load = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/tickets`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load complaints');
      setTickets(data.tickets || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => { load(); }, []);

  const updateTicket = async (ticketId, payload) => {
    setSavingId(ticketId);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update complaint');
      await load();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setSavingId('');
    }
  };

  const visible = filter === 'all' ? tickets : tickets.filter((ticket) => ticket.status === filter);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Complaints</h1>
        <select className="auth-input" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      {error && <div className="error-message">{error}</div>}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] p-6 text-[#A1A1A1]">No complaints found.</div>
      ) : visible.map((ticket) => (
        <article key={ticket._id} className="rounded-2xl border border-[#1F1F1F] bg-[#111111] p-4 space-y-3">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <p className="text-xs text-[#FF6A00]">{ticket.ticketNumber || ticket._id}</p>
              <h2 className="text-lg font-semibold">{ticket.subject}</h2>
            </div>
            <span className="text-xs text-[#A1A1A1]">{ticket.status} · {ticket.category}</span>
          </div>
          <p className="text-sm text-[#D4D4D4] whitespace-pre-wrap">{ticket.message}</p>
          {ticket.referenceId && <p className="text-xs text-[#A1A1A1]">Reference: {ticket.referenceId}</p>}
          <div className="grid gap-3 lg:grid-cols-2">
            <label className="form-group">
              <span className="form-label">Internal note (private)</span>
              <input className="form-input" defaultValue={ticket.adminComment || ''} onBlur={(event) => updateTicket(ticket._id, { adminComment: event.target.value })} />
            </label>
            <label className="form-group">
              <span className="form-label">User-visible response</span>
              <input className="form-input" defaultValue={ticket.userResponse || ''} onBlur={(event) => updateTicket(ticket._id, { userResponse: event.target.value })} />
            </label>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <input className="form-input" defaultValue={ticket.resolution || ''} placeholder="Resolution summary" onBlur={(event) => updateTicket(ticket._id, { resolution: event.target.value })} />
            <button type="button" className="btn-primary" disabled={savingId === ticket._id} onClick={() => updateTicket(ticket._id, { status: 'resolved', resolution: ticket.resolution || '' })}>Resolve</button>
            <button type="button" className="btn-secondary" disabled={savingId === ticket._id} onClick={() => updateTicket(ticket._id, { status: ticket.status === 'closed' ? 'open' : 'closed' })}>{ticket.status === 'closed' ? 'Reopen' : 'Close'}</button>
          </div>
        </article>
      ))}
    </div>
  );
};
