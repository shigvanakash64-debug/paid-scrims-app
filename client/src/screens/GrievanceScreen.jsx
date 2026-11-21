import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const categories = [
  ['payment_deposit', 'Payment / deposit'],
  ['wallet_balance', 'Wallet balance'],
  ['withdrawal', 'Withdrawal'],
  ['tournament', 'Tournament'],
  ['direct_match', 'Direct match'],
  ['result_dispute', 'Result / dispute'],
  ['account_restriction', 'Account restriction'],
  ['privacy', 'Privacy / data request'],
  ['host_complaint', 'Host complaint'],
  ['other', 'Other'],
];

export const GrievanceScreen = () => {
  const [category, setCategory] = useState('other');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}`,
  });

  const loadTickets = async () => {
    try {
      const response = await fetch(`${API_BASE}/tickets`, { headers: headers() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load complaints');
      setTickets(data.tickets || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!subject.trim() || !message.trim()) {
      setError('Subject and complaint details are required.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ category, subject: subject.trim(), message: message.trim(), referenceId: referenceId.trim(), evidenceUrls: [] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to submit complaint');
      setSuccess(`Complaint submitted. Ticket ID: ${data.ticket.ticketNumber}`);
      setSubject('');
      setMessage('');
      setReferenceId('');
      await loadTickets();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-home info-page" style={{ paddingBottom: 20 }}>
      <div className="hero">
        <div className="hero-top">
          <div>
            <div className="game-pill"><div className="game-dot"></div><span>Grievance</span></div>
            <div className="screen-title">Submit a complaint</div>
          </div>
        </div>
      </div>
      <div className="section">
        <form className="info-ticket-form" onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input className="form-input" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={120} required />
          </div>
          <div className="form-group">
            <label className="form-label">Reference ID (optional)</label>
            <input className="form-input" value={referenceId} onChange={(event) => setReferenceId(event.target.value)} maxLength={100} placeholder="Match, tournament, transaction or withdrawal ID" />
          </div>
          <div className="form-group">
            <label className="form-label">Complaint details</label>
            <textarea className="form-input" value={message} onChange={(event) => setMessage(event.target.value)} rows={6} maxLength={3000} required />
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit complaint'}</button>
        </form>

        <div style={{ marginTop: 24 }}>
          <h2 className="info-heading">My complaints</h2>
          {tickets.length === 0 ? (
            <p className="info-text">No complaints submitted yet.</p>
          ) : tickets.map((ticket) => (
            <div className="info-section" key={ticket._id} style={{ borderTop: '1px solid #1F1F1F', paddingTop: 12 }}>
              <strong>{ticket.ticketNumber || ticket._id}</strong>
              <p className="info-text" style={{ marginBottom: 4 }}>{ticket.subject}</p>
              <p className="info-text" style={{ marginBottom: 4 }}>Status: {ticket.status}</p>
              {ticket.userResponse && <p className="info-text">Response: {ticket.userResponse}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
