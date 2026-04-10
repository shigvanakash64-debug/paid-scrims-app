import { useState } from 'react';
import axios from 'axios';
import { PaymentStatusCard } from '../components/admin/AdminComponents';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';

const getPlayerName = (player) => {
  if (!player) return 'Unknown';
  if (typeof player === 'string') return player;
  return player.username || player;
};

export const MatchRoomDetail = ({ match, onBack, onUpdate }) => {
  const [roomData, setRoomData] = useState({
    roomId: match.roomDetails?.roomId || '',
    password: match.roomDetails?.password || '',
  });

  const [paymentStatus, setPaymentStatus] = useState({
    playerA: !!match.paymentA,
    playerB: !!match.paymentB,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const matchId = match._id || match.id;
  const headers = {
    Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}`,
  };

  const playerAName = getPlayerName(match.playerA || match.players?.[0]);
  const playerBName = getPlayerName(match.playerB || match.players?.[1]);
  const allVerified = paymentStatus.playerA && paymentStatus.playerB;
  const hasRoomData = roomData.roomId && roomData.password;
  const canStartMatch = allVerified && hasRoomData && match.status !== 'cancelled';

  const handleApprovePayment = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      await axios.post(`${API_BASE}/admin/matches/${matchId}/verify-payment`, {}, { headers });
      setPaymentStatus({ playerA: true, playerB: true });
      onUpdate({ ...match, status: 'verified', paymentA: true, paymentB: true });
      setActionMessage('✓ Payment verified for this match');
      setTimeout(() => setActionMessage(''), 2500);
    } catch (error) {
      console.error('verify-payment error', error);
      setErrorMessage(error.response?.data?.error || 'Failed to verify payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!window.confirm('Reject the payment proof and require a new upload?')) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      await axios.post(`${API_BASE}/admin/matches/${matchId}/reject-payment`, {}, { headers });
      onUpdate({ ...match, status: 'payment_failed', paymentA: false, paymentB: false });
      setActionMessage('✓ Payment rejected and match sent back to payment review');
      setTimeout(() => setActionMessage(''), 2500);
    } catch (error) {
      console.error('reject-payment error', error);
      setErrorMessage(error.response?.data?.error || 'Failed to reject payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMatch = async () => {
    if (!canStartMatch) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post(
        `${API_BASE}/admin/matches/${matchId}/start`,
        {
          roomId: roomData.roomId,
          password: roomData.password,
        },
        { headers }
      );
      onUpdate({ ...match, ...response.data.match });
      setActionMessage('✓ Match started successfully');
      setTimeout(() => setActionMessage(''), 2500);
    } catch (error) {
      console.error('start-match error', error);
      setErrorMessage(error.response?.data?.error || 'Failed to start match');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelMatch = async () => {
    if (!window.confirm('Are you sure you want to cancel this match? Users will be refunded.')) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post(
        `${API_BASE}/admin/matches/${matchId}/cancel`,
        { reason: 'Admin cancelled' },
        { headers }
      );
      onUpdate({ ...match, ...response.data.match });
      setActionMessage('✓ Match cancelled, refunds processed');
      setTimeout(() => setActionMessage(''), 2500);
    } catch (error) {
      console.error('cancel-match error', error);
      setErrorMessage(error.response?.data?.error || 'Failed to cancel match');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefundBoth = async () => {
    if (!window.confirm('Refund both players? This will cancel the match and return all funds.')) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post(
        `${API_BASE}/admin/matches/${matchId}/cancel`,
        { reason: 'Admin refund both players' },
        { headers }
      );
      onUpdate({ ...match, ...response.data.match });
      setActionMessage('✓ Both players refunded');
      setTimeout(() => setActionMessage(''), 2500);
    } catch (error) {
      console.error('refund-both error', error);
      setErrorMessage(error.response?.data?.error || 'Failed to refund both players');
    } finally {
      setIsLoading(false);
    }
  };

  const MOCK_SCREENSHOT_A = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23111111%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2220%22 fill=%22%23A1A1A1%22%3EPayment Screenshot%3C/text%3E%3Ctext x=%2250%25%22 y=%2260%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2214%22 fill=%22%2366A1A1A1%22%3EPlayer A%3C/text%3E%3C/svg%3E';
  const MOCK_SCREENSHOT_B = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23111111%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2220%22 fill=%22%23A1A1A1%22%3EPayment Screenshot%3C/text%3E%3Ctext x=%2250%25%22 y=%2260%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2214%22 fill=%2266A1A1A1%22%3EPlayer B%3C/text%3E%3C/svg%3E';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-[#A1A1A1] hover:text-white text-2xl"
        >
          ←
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Match #{match.id}</h1>
          <p className="text-sm text-[#A1A1A1] mt-1">{match.mode} • {match.entry}</p>
        </div>
        <div className="ml-auto">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            match.status === 'ongoing'
              ? 'bg-[#022c0b] text-[#22C55E]'
              : 'bg-[#1F1F1F] text-[#A1A1A1]'
          }`}>
            {match.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Action Message */}
      {errorMessage && (
        <div className="rounded-lg border border-[#EF4444] bg-[#2B121A] px-4 py-3 text-sm text-[#FECACA]">
          {errorMessage}
        </div>
      )}

      {actionMessage && (
        <div className="bg-[#022c0b] border border-[#22C55E] text-[#22C55E] px-4 py-3 rounded-lg text-sm font-medium">
          {actionMessage}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Match Info & Payments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Match Info */}
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">MATCH INFO</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#A1A1A1]">HOST</p>
                <p className="text-lg font-semibold text-white mt-1">{match.playerA}</p>
              </div>
              <div>
                <p className="text-xs text-[#A1A1A1]">OPPONENT</p>
                <p className="text-lg font-semibold text-white mt-1">{match.playerB}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1F1F1F]">
              <div>
                <p className="text-xs text-[#A1A1A1]">MODE</p>
                <p className="text-sm font-medium text-white mt-1">{match.mode}</p>
              </div>
              <div>
                <p className="text-xs text-[#A1A1A1]">ENTRY</p>
                <p className="text-sm font-medium text-white mt-1">{match.entry}</p>
              </div>
            </div>
          </div>

          {/* Payments Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">PAYMENT VERIFICATION</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PaymentStatusCard
                player={playerAName}
                isPaid={paymentStatus.playerA}
                screenshotUrl={MOCK_SCREENSHOT_A}
                onApprove={handleApprovePayment}
                onReject={handleRejectPayment}
                isLoading={isLoading}
              />
              <PaymentStatusCard
                player={playerBName}
                isPaid={paymentStatus.playerB}
                screenshotUrl={MOCK_SCREENSHOT_B}
                onApprove={handleApprovePayment}
                onReject={handleRejectPayment}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Start Match Section */}
          {allVerified && (
            <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">START MATCH</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#A1A1A1] block mb-2">ROOM ID</label>
                  <input
                    type="text"
                    value={roomData.roomId}
                    onChange={(e) => setRoomData({ ...roomData, roomId: e.target.value })}
                    placeholder="Enter room ID"
                    disabled={isLoading || match.status === 'cancelled'}
                    className="w-full bg-[#0B0B0B] border border-[#1F1F1F] rounded px-3 py-3 text-white placeholder-[#666666] focus:border-[#FF6A00] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#A1A1A1] block mb-2">PASSWORD</label>
                  <input
                    type="text"
                    value={roomData.password}
                    onChange={(e) => setRoomData({ ...roomData, password: e.target.value })}
                    placeholder="Enter password"
                    disabled={isLoading || match.status === 'cancelled'}
                    className="w-full bg-[#0B0B0B] border border-[#1F1F1F] rounded px-3 py-3 text-white placeholder-[#666666] focus:border-[#FF6A00] outline-none text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleStartMatch}
                disabled={!canStartMatch || isLoading}
                className="w-full bg-[#FF6A00] text-black px-6 py-4 rounded-lg font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              >
                {isLoading ? '⏳ Starting...' : '🎮 START MATCH'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Actions Sidebar */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">ACTIONS</h2>
          
          {/* Control Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleCancelMatch}
              disabled={isLoading || match.status === 'cancelled'}
              className="w-full border border-[#EF4444] text-[#EF4444] px-4 py-3 rounded-lg font-semibold text-sm hover:bg-[#3d1c1c] transition disabled:opacity-50"
            >
              ✕ Cancel Match
            </button>

            <button
              onClick={handleRefundBoth}
              disabled={isLoading || match.status === 'cancelled'}
              className="w-full border border-[#EF4444] text-[#EF4444] px-4 py-3 rounded-lg font-semibold text-sm hover:bg-[#3d1c1c] transition disabled:opacity-50"
            >
              💸 Refund Both
            </button>

            <div className="pt-4 border-t border-[#1F1F1F]">
              <p className="text-xs text-[#A1A1A1] font-semibold mb-2">QUICK STATS</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[#A1A1A1]">
                  <span>Created:</span>
                  <span>2 hrs ago</span>
                </div>
                <div className="flex justify-between text-[#A1A1A1]">
                  <span>Status:</span>
                  <span className="text-[#FF6A00]">{match.status}</span>
                </div>
                <div className="flex justify-between text-[#A1A1A1]">
                  <span>Payments:</span>
                  <span className={paymentStatus.playerA && paymentStatus.playerB ? 'text-[#22C55E]' : 'text-[#F59E0B]'}>
                    {paymentStatus.playerA && paymentStatus.playerB ? '✓ Ready' : '⏳ Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
