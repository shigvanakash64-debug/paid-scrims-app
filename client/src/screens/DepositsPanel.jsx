import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const DepositsPanel = () => {
  const [deposits, setDeposits] = useState([]);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('clutchzone_token');
      const response = await axios.get(`${API_BASE}/admin/deposits?status=${filterStatus}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeposits(response.data.deposits || []);
    } catch (err) {
      console.error('Failed to fetch deposits', err);
      setError('Failed to fetch deposit requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [filterStatus]);

  const handleApprove = async (depositId) => {
    if (!window.confirm('Approve this deposit and credit the wallet?')) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.post(`${API_BASE}/admin/deposits/${depositId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchDeposits();
    } catch (err) {
      alert('Failed to approve deposit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (depositId) => {
    if (!window.confirm('Reject this deposit request?')) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.post(`${API_BASE}/admin/deposits/${depositId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchDeposits();
    } catch (err) {
      alert('Failed to reject deposit');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-[#A1A1A1]">Loading deposits...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Deposit Requests</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">Approve manual wallet deposits using UTR + last 4 digits.</p>
      </div>
      {error && <div className="text-red-400">{error}</div>}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
          <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-2 rounded-lg font-semibold text-sm ${filterStatus === status ? 'bg-[#FF6A00] text-black' : 'border border-[#1F1F1F] text-[#A1A1A1]'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {deposits.filter((item) => filterStatus === 'all' || item.status === filterStatus).length === 0 ? (
          <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-10 text-center text-[#A1A1A1]">No deposit requests</div>
        ) : deposits.filter((item) => filterStatus === 'all' || item.status === filterStatus).map((item) => (
          <div key={item.depositId} className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white font-semibold">{item.username}</p>
                <p className="text-xs text-[#A1A1A1]">User ID: {item.userId}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'approved' ? 'bg-[#022c0b] text-[#22C55E]' : item.status === 'rejected' ? 'bg-[#3d1c1c] text-[#EF4444]' : 'bg-[#2A2A2A] text-[#F59E0B]'}`}>{item.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-[#E5E7EB]">
              <div><span className="text-[#A1A1A1]">Amount:</span> ₹{Number(item.amount).toLocaleString()}</div>
              <div><span className="text-[#A1A1A1]">UTR:</span> {item.utr}</div>
              <div><span className="text-[#A1A1A1]">Last 4:</span> ****{item.mobileLast4}</div>
              <div><span className="text-[#A1A1A1]">Submitted:</span> {new Date(item.requestedAt).toLocaleString()}</div>
            </div>
            {item.status === 'pending' && (
              <div className="flex gap-3">
                <button onClick={() => handleApprove(item.depositId)} disabled={actionLoading} className="rounded-2xl bg-[#22C55E] px-4 py-2 text-sm font-semibold text-black">Approve</button>
                <button onClick={() => handleReject(item.depositId)} disabled={actionLoading} className="rounded-2xl border border-[#EF4444] px-4 py-2 text-sm font-semibold text-[#EF4444]">Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
