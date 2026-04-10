import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  MatchCard,
} from '../components/admin/AdminComponents';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';
const STATUS_FILTERS = [
  'all',
  'waiting',
  'matched',
  'payment_pending',
  'verified',
  'result_pending',
  'disputed',
  'ongoing',
];
const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'payments', label: 'Payments' },
  { id: 'result', label: 'Result Review' },
  { id: 'disputes', label: 'Disputes' },
];

const getPlayerName = (player) => {
  if (!player) return 'Unknown';
  if (typeof player === 'string') return player;
  return player.username || player;
};

export const AdminRequests = () => {
  const [matches, setMatches] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  const token = localStorage.getItem('clutchzone_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (selectedMatchId) {
      fetchMatchDetails(selectedMatchId);
    }
  }, [selectedMatchId]);

  const fetchMatches = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE}/admin/matches?limit=100`, {
        headers,
      });
      const list = response.data.matches || [];
      setMatches(list);
      if (!selectedMatchId && list.length > 0) {
        setSelectedMatchId(list[0]._id || list[0].id);
      }
    } catch (err) {
      console.error('fetchMatches error', err);
      setError('Unable to load request list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchDetails = async (matchId) => {
    setDetailLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE}/match/${matchId}`, {
        headers,
      });
      setSelectedMatch(response.data.match);
    } catch (err) {
      console.error('fetchMatchDetails error', err);
      setError('Unable to load match details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const refresh = async () => {
    await fetchMatches();
    if (selectedMatchId) {
      await fetchMatchDetails(selectedMatchId);
    }
  };

  const handleCancel = async (matchId) => {
    if (!window.confirm('Cancel this match request and refund players?')) return;

    setActionLoading(true);
    try {
      await axios.post(
        `${API_BASE}/admin/matches/${matchId}/cancel`,
        { reason: 'Cancelled by admin' },
        { headers }
      );
      await refresh();
    } catch (err) {
      console.error('handleCancel error', err);
      alert(err.response?.data?.error || 'Failed to cancel match');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedMatchId) return;
    setActionLoading(true);

    try {
      await axios.post(`${API_BASE}/admin/matches/${selectedMatchId}/verify-payment`, {}, { headers });
      await refresh();
      setSelectedTab('overview');
    } catch (err) {
      console.error('handleVerifyPayment error', err);
      alert(err.response?.data?.error || 'Failed to verify payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedMatchId || !window.confirm('Reject payment for this match? Players will need to re-upload proof.')) return;

    setActionLoading(true);
    try {
      await axios.post(`${API_BASE}/admin/matches/${selectedMatchId}/reject-payment`, {}, { headers });
      await refresh();
      setSelectedTab('overview');
    } catch (err) {
      console.error('handleRejectPayment error', err);
      alert(err.response?.data?.error || 'Failed to reject payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveResult = async (winnerId) => {
    if (!selectedMatchId) return;
    setActionLoading(true);

    try {
      await axios.post(
        `${API_BASE}/match/approve-result`,
        { matchId: selectedMatchId, winnerId },
        { headers }
      );
      await refresh();
      setSelectedTab('overview');
    } catch (err) {
      console.error('handleApproveResult error', err);
      alert(err.response?.data?.error || 'Failed to approve result');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectResult = async () => {
    if (!selectedMatchId || !window.confirm('Move this match to dispute?')) return;
    setActionLoading(true);

    try {
      await axios.post(
        `${API_BASE}/match/reject-result`,
        { matchId: selectedMatchId },
        { headers }
      );
      await refresh();
      setSelectedTab('disputes');
    } catch (err) {
      console.error('handleRejectResult error', err);
      alert(err.response?.data?.error || 'Failed to reject result');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveDispute = async (winner) => {
    if (!selectedMatchId || !window.confirm(`Resolve dispute in favor of ${winner === 'A' ? 'Player A' : 'Player B'}?`)) return;
    setActionLoading(true);

    try {
      await axios.post(
        `${API_BASE}/admin/matches/${selectedMatchId}/resolve-dispute`,
        { winner },
        { headers }
      );
      await refresh();
      setSelectedTab('overview');
    } catch (err) {
      console.error('handleResolveDispute error', err);
      alert(err.response?.data?.error || 'Failed to resolve dispute');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMatches = useMemo(() => {
    if (selectedStatus === 'all') return matches;
    return matches.filter((match) => match.status === selectedStatus);
  }, [matches, selectedStatus]);

  const playerNames = useMemo(() => {
    const players = selectedMatch?.players || [];
    if (players.length) {
      return players.map((player) => getPlayerName(player));
    }
    const fallback = [];
    if (selectedMatch?.playerA) fallback.push(getPlayerName(selectedMatch.playerA));
    if (selectedMatch?.playerB) fallback.push(getPlayerName(selectedMatch.playerB));
    return fallback;
  }, [selectedMatch]);

  const playerA = playerNames[0] || 'Player A';
  const playerB = playerNames[1] || 'Player B';
  const paymentScreenshots = selectedMatch?.paymentScreenshots || [];
  const resultScreenshots = selectedMatch?.result?.screenshots || [];
  const disputes = selectedMatch?.disputes || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Requests</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">
          See matched requests, manage payment proof, review result submissions, and resolve disputes per match.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-3 py-2 rounded-full text-xs font-semibold transition ${
              selectedStatus === status
                ? 'bg-[#FF6A00] text-black'
                : 'bg-[#1F1F1F] text-[#A1A1A1] hover:bg-[#2A2A2A]'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-[#EF4444] bg-[#2B121A] px-4 py-3 text-sm text-[#FECACA]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="space-y-4">
          <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Match Requests</p>
                <p className="text-xs text-[#A1A1A1] mt-1">
                  {loading ? 'Loading requests…' : `${filteredMatches.length} matching items`}
                </p>
              </div>
              <button
                onClick={refresh}
                className="text-xs text-[#A1A1A1] border border-[#1F1F1F] rounded-full px-3 py-1 hover:border-[#FF6A00]"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-8 text-center text-[#A1A1A1]">
                Loading matches...
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-8 text-center text-[#A1A1A1]">
                No requests found for this filter.
              </div>
            ) : (
              filteredMatches.map((match) => (
                <div
                  key={match._id || match.id}
                  className={`${
                    selectedMatchId === (match._id || match.id)
                      ? 'border-[#FF6A00] bg-[#161313]'
                      : 'border-[#1F1F1F]'
                  } rounded-xl border bg-[#0B0B0B] shadow-sm`}
                >
                  <MatchCard
                    matchId={match._id || match.id}
                    playerA={getPlayerName(match.players?.[0] || match.playerA)}
                    playerB={getPlayerName(match.players?.[1] || match.playerB)}
                    mode={match.mode || 'Unknown'}
                    entry={`₹${match.entry || '0'}`}
                    status={match.status || 'waiting'}
                    paymentA={match.paymentA}
                    paymentB={match.paymentB}
                    onOpen={() => setSelectedMatchId(match._id || match.id)}
                    onCancel={() => handleCancel(match._id || match.id)}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-4">
            {detailLoading ? (
              <div className="py-12 text-center text-[#A1A1A1]">Loading match details…</div>
            ) : !selectedMatch ? (
              <div className="py-12 text-center text-[#A1A1A1]">Select a request to review its proof and actions.</div>
            ) : (
              <>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#A1A1A1]">Request</p>
                    <h2 className="text-2xl font-bold text-white">{playerA} vs {playerB}</h2>
                    <p className="text-sm text-[#A1A1A1] mt-1">Match #{selectedMatch._id || selectedMatch.id} • {selectedMatch.mode} • ₹{selectedMatch.entry}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    selectedMatch.status === 'completed'
                      ? 'bg-[#022c0b] text-[#22C55E]'
                      : selectedMatch.status === 'disputed'
                        ? 'bg-[#3D1F0F] text-[#F59E0B]'
                        : selectedMatch.status === 'ongoing'
                          ? 'bg-[#2A2A2A] text-[#FF6A00]'
                          : 'bg-[#1F1F1F] text-[#A1A1A1]'
                  }`}
                  >
                    {selectedMatch.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-4">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        selectedTab === tab.id
                          ? 'bg-[#FF6A00] text-black'
                          : 'bg-[#1F1F1F] text-[#A1A1A1] hover:bg-[#2A2A2A]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="pt-6">
                  {selectedTab === 'overview' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-[#1F1F1F] bg-[#0B0B0B] p-4">
                          <p className="text-xs text-[#A1A1A1]">Players</p>
                          <p className="text-lg font-semibold text-white mt-2">{playerA}</p>
                          <p className="text-lg font-semibold text-white mt-1">{playerB}</p>
                        </div>
                        <div className="rounded-2xl border border-[#1F1F1F] bg-[#0B0B0B] p-4">
                          <p className="text-xs text-[#A1A1A1]">Proof Summary</p>
                          <p className="mt-2 text-sm text-white">Payments: {paymentScreenshots.length > 0 ? `${paymentScreenshots.length} proof(s)` : 'No screenshots yet'}</p>
                          <p className="mt-1 text-sm text-white">Result proofs: {resultScreenshots.length > 0 ? `${resultScreenshots.length} screenshot(s)` : 'No submissions yet'}</p>
                          <p className="mt-1 text-sm text-white">Disputes: {disputes.length}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#1F1F1F] bg-[#0B0B0B] p-4">
                        <p className="text-xs text-[#A1A1A1]">Admin Notes</p>
                        {selectedMatch.adminMessages?.length ? (
                          <div className="mt-3 space-y-3">
                            {selectedMatch.adminMessages.slice(-3).map((message) => (
                              <div key={message.id || message.createdAt} className="rounded-xl bg-[#111111] p-3">
                                <p className="text-sm text-white">{message.text}</p>
                                <p className="text-xs text-[#666666] mt-1">{new Date(message.createdAt).toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-[#A1A1A1]">No admin notes available.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedTab === 'payments' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-[#1F1F1F] bg-[#0B0B0B] p-4">
                        <p className="text-xs text-[#A1A1A1]">Payment Proof</p>
                        {paymentScreenshots.length === 0 ? (
                          <p className="mt-3 text-sm text-[#A1A1A1]">Waiting for payment screenshots from both players.</p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2 mt-4">
                            {paymentScreenshots.map((proof, index) => (
                              <div key={index} className="rounded-2xl border border-[#1F1F1F] bg-[#111111] p-3">
                                <p className="text-xs text-[#A1A1A1]">{getPlayerName(proof.user) || `Proof ${index + 1}`}</p>
                                <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#0B0B0B]">
                                  <img
                                    src={proof.image}
                                    alt={`Payment proof ${index + 1}`}
                                    className="h-full w-full object-cover cursor-pointer"
                                    onClick={() => setLightboxImage(proof.image)}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          onClick={handleVerifyPayment}
                          disabled={actionLoading || selectedMatch.status === 'verified'}
                          className="flex-1 rounded-full bg-[#22C55E] px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
                        >
                          {selectedMatch.status === 'verified' ? 'Payment Verified' : actionLoading ? 'Working…' : 'Verify Payment'}
                        </button>
                        <button
                          onClick={handleRejectPayment}
                          disabled={actionLoading || selectedMatch.status === 'payment_failed'}
                          className="flex-1 rounded-full border border-[#EF4444] px-4 py-3 text-sm font-semibold text-[#EF4444] hover:bg-[#3d1c1c] transition disabled:opacity-50"
                        >
                          {actionLoading ? 'Working…' : 'Reject Payment'}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedTab === 'result' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-[#1F1F1F] bg-[#0B0B0B] p-4">
                        <p className="text-xs text-[#A1A1A1]">Result Proof</p>
                        {resultScreenshots.length === 0 ? (
                          <p className="mt-3 text-sm text-[#A1A1A1]">No result submission screenshots are available yet.</p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2 mt-4">
                            {resultScreenshots.map((proof, index) => (
                              <div key={index} className="rounded-2xl border border-[#1F1F1F] bg-[#111111] p-3">
                                <p className="text-xs text-[#A1A1A1]">{getPlayerName(proof.user) || `Submission ${index + 1}`}</p>
                                <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#0B0B0B]">
                                  <img
                                    src={proof.image}
                                    alt={`Result proof ${index + 1}`}
                                    className="h-full w-full object-cover cursor-pointer"
                                    onClick={() => setLightboxImage(proof.image)}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          onClick={() => handleApproveResult(selectedMatch.players?.[0]?._id || selectedMatch.players?.[0] || null)}
                          disabled={actionLoading || selectedMatch.status === 'completed'}
                          className="flex-1 rounded-full bg-[#22C55E] px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
                        >
                          {actionLoading ? 'Working…' : `Winner is ${playerA}`}
                        </button>
                        <button
                          onClick={() => handleApproveResult(selectedMatch.players?.[1]?._id || selectedMatch.players?.[1] || null)}
                          disabled={actionLoading || selectedMatch.status === 'completed'}
                          className="flex-1 rounded-full bg-[#FF6A00] px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
                        >
                          {actionLoading ? 'Working…' : `Winner is ${playerB}`}
                        </button>
                        <button
                          onClick={handleRejectResult}
                          disabled={actionLoading || selectedMatch.status === 'disputed'}
                          className="flex-1 rounded-full border border-[#EF4444] px-4 py-3 text-sm font-semibold text-[#EF4444] hover:bg-[#3d1c1c] transition disabled:opacity-50"
                        >
                          {actionLoading ? 'Working…' : 'Reject to dispute'}
                        </button>
                      </div>
                    </div>
                  )}

                  {lightboxImage && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                      onClick={() => setLightboxImage(null)}
                    >
                      <img
                        src={lightboxImage}
                        alt="Preview"
                        className="max-h-full max-w-full rounded-3xl shadow-2xl"
                      />
                    </div>
                  )}

                  {selectedTab === 'disputes' && (
                    <div className="space-y-4">
                      {disputes.length === 0 ? (
                        <div className="rounded-2xl border border-[#1F1F1F] bg-[#0B0B0B] p-6 text-center text-[#A1A1A1]">
                          {selectedMatch.status === 'disputed'
                            ? 'This match is disputed but no dispute details are available.'
                            : 'No disputes have been raised for this match.'}
                        </div>
                      ) : (
                        disputes.map((dispute) => (
                          <div key={dispute._id || dispute.createdAt} className="rounded-2xl border border-[#1F1F1F] bg-[#111111] p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{getPlayerName(dispute.raisedBy)} raised a dispute</p>
                                <p className="text-xs text-[#A1A1A1] mt-1">{dispute.reason.replace('_', ' ')}</p>
                              </div>
                              <span className="rounded-full bg-[#1F1F1F] px-3 py-1 text-xs text-[#A1A1A1]">{dispute.status}</span>
                            </div>
                            <p className="mt-3 text-sm text-[#E5E7EB]">{dispute.description || 'No description provided.'}</p>
                            {dispute.evidence?.length > 0 && (
                              <div className="grid gap-3 sm:grid-cols-2 mt-4">
                                {dispute.evidence.map((image, index) => (
                                  <div key={index} className="aspect-video overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#0B0B0B]">
                                    <img src={image} alt={`Evidence ${index + 1}`} className="h-full w-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}

                      {selectedMatch.status === 'disputed' && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            onClick={() => handleResolveDispute('A')}
                            disabled={actionLoading}
                            className="rounded-full bg-[#22C55E] px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
                          >
                            {actionLoading ? 'Working…' : `Resolve for ${playerA}`}
                          </button>
                          <button
                            onClick={() => handleResolveDispute('B')}
                            disabled={actionLoading}
                            className="rounded-full bg-[#FF6A00] px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
                          >
                            {actionLoading ? 'Working…' : `Resolve for ${playerB}`}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
