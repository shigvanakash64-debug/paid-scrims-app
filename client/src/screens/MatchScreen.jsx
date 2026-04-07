import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { AdminPanel } from '../components/AdminPanel';
import { ChatBox } from '../components/ChatBox';
import { MatchHeader } from '../components/MatchHeader';
import { PaymentCard } from '../components/PaymentCard';
import { PlayerStatusList } from '../components/PlayerStatusList';
import { RoomDetailsCard } from '../components/RoomDetailsCard';
import { Timer } from '../components/Timer';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';
const TOKEN_KEY = 'clutchzone_token';

const statusLabels = {
  waiting: 'Waiting',
  matched: 'Matched',
  payment_pending: 'Payment Pending',
  verified: 'Verified',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
  pending: 'Pending',
  'in-progress': 'In Progress',
  disputed: 'Disputed',
};

const formatTime = (seconds) => {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${secs}`;
};

export const MatchScreen = ({ match, user, onScreenChange }) => {
  const matchId = match?.id || match?._id;
  const [currentMatch, setCurrentMatch] = useState(match || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [screenshotError, setScreenshotError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isMatchActive = currentMatch?.status === 'ongoing' || currentMatch?.status === 'completed';
  const isCancelled = currentMatch?.status === 'cancelled';

  const players = useMemo(() => {
    return (currentMatch?.players || []).map((player, index) => {
      const id = player?.id || player?._id || player;
      const name = player?.username || `Player ${index + 1}`;
      return {
        id,
        username: name,
        role: index === 0 ? 'Player A' : 'Player B',
      };
    });
  }, [currentMatch]);

  const playerStatuses = players.map((player) => {
    const paid = currentMatch?.paidUsers?.includes(player.id);
    const verified = currentMatch?.verifiedUsers?.includes(player.id);
    return {
      ...player,
      status: verified ? 'Verified' : paid ? 'Paid' : 'Pending',
    };
  });

  const deadlineLabel = isCancelled ? '00:00' : formatTime(timeLeft);
  const currentStatusLabel = statusLabels[currentMatch?.status] || 'Unknown';
  const roomDetails = currentMatch?.roomDetails || { roomId: '', password: '' };
  const showRoomDetails = currentMatch?.status === 'ongoing' || currentMatch?.status === 'completed';

  useEffect(() => {
    const fetchMatch = async () => {
      if (!matchId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await axios.get(`${API_BASE}/match/${matchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentMatch(response.data.match);
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load match details');
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId]);

  useEffect(() => {
    if (!currentMatch?.paymentDueAt || isMatchActive || isCancelled) {
      setTimeLeft(0);
      return undefined;
    }

    const updateTimer = () => {
      const diff = Math.max(new Date(currentMatch.paymentDueAt).getTime() - Date.now(), 0);
      setTimeLeft(Math.floor(diff / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentMatch, isMatchActive, isCancelled]);

  const refreshMatch = async () => {
    if (!matchId) return;
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.get(`${API_BASE}/match/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentMatch(response.data.match);
    } catch (err) {
      console.error('Refresh failed', err);
    }
  };

  useEffect(() => {
    if (!matchId || !currentMatch) return undefined;
    const active = !['ongoing', 'completed', 'cancelled'].includes(currentMatch.status);
    if (!active) return undefined;

    const interval = setInterval(() => {
      refreshMatch();
    }, 5000);

    return () => clearInterval(interval);
  }, [matchId, currentMatch?.status]);

  const addLocalMessage = (sender, text) => {
    setCurrentMatch((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      const nextMessages = [
        ...(next.adminMessages || []),
        {
          id: `local-${sender}-${Date.now()}`,
          sender,
          text,
          createdAt: new Date().toISOString(),
        },
      ];
      next.adminMessages = nextMessages;
      return next;
    });
  };

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText('yourupi@okaxis');
      addLocalMessage('system', 'UPI ID copied to clipboard.');
    } catch (error) {
      addLocalMessage('system', 'Copy failed. Please copy manually.');
    }
  };

  const handlePaidClick = () => {
    if (isCancelled || isMatchActive) return;
    setShowUpload(true);
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setScreenshotError('Please upload a valid image file.');
      return;
    }

    setIsSubmitting(true);
    setScreenshotError('');
    setUploadedFileName(file.name);

    const formData = new FormData();
    formData.append('matchId', matchId);
    formData.append('screenshot', file);

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.post(`${API_BASE}/match/upload-payment`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setCurrentMatch(response.data.match);
      setShowUpload(false);
    } catch (err) {
      setScreenshotError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPlayer = async (playerId) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.post(
        `${API_BASE}/match/verify-player`,
        { matchId, playerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentMatch(response.data.match);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not verify player');
    }
  };

  const handleStartMatch = async () => {
    if (!roomDetails.roomId?.trim() || !roomDetails.password?.trim()) {
      alert('Room ID and password are required');
      return;
    }

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.post(
        `${API_BASE}/match/start`,
        { matchId, roomId: roomDetails.roomId, password: roomDetails.password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentMatch(response.data.match);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not start match');
    }
  };

  const handleCancelMatch = async (byAdmin = false) => {
    if (isMatchActive || isCancelled) return;
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.post(
        `${API_BASE}/match/cancel`,
        { matchId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentMatch(response.data.match);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not cancel match');
    }
  };

  const addChatMessage = async (sender, text) => {
    if (!matchId) return;
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.post(
        `${API_BASE}/match/chat`,
        { matchId, sender, text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentMatch(response.data.match);
    } catch (err) {
      console.error('Chat send failed', err);
    }
  };

  const handleUserAction = async (action) => {
    if (action === 'Paid') {
      handlePaidClick();
      return;
    }
    await addChatMessage('user', action === 'Not received room' ? 'Not received room' : 'Issue');
  };

  const handleAdminAction = async (action) => {
    if (action === 'Match cancelled') {
      await handleCancelMatch(true);
      return;
    }
    await addChatMessage('admin', action);
  };

  const handleRoomChange = (key, value) => {
    setCurrentMatch((prev) => ({
      ...prev,
      roomDetails: {
        ...prev.roomDetails,
        [key]: value,
      },
    }));
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] px-4 py-6 text-white sm:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-[#1F1F1F] bg-[#111111] p-8 text-center">
          <h1 className="text-2xl font-semibold">Match room not available</h1>
          <p className="mt-3 text-sm text-[#A1A1A1]">Create or join a match first to access the live payment room.</p>
          <button
            type="button"
            className="mt-6 inline-flex rounded-3xl bg-[#FF6A00] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black"
            onClick={() => onScreenChange('pairing')}
          >
            Back to lobby
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] px-4 py-6 text-white sm:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-[#1F1F1F] bg-[#111111] p-8 text-center">
          <div className="text-lg font-semibold">Loading match details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] px-4 py-6 text-white sm:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-[#1F1F1F] bg-[#111111] p-8 text-center">
          <h1 className="text-2xl font-semibold">Unable to load match</h1>
          <p className="mt-3 text-sm text-[#A1A1A1]">{error}</p>
          <button
            type="button"
            className="mt-6 inline-flex rounded-3xl bg-[#FF6A00] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black"
            onClick={() => onScreenChange('pairing')}
          >
            Back to lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] px-4 pb-40 pt-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <MatchHeader match={currentMatch} statusLabel={currentStatusLabel} />

          <PaymentCard
            amount={currentMatch.entry}
            upiId="yourupi@okaxis"
            deadline={deadlineLabel}
            onCopy={handleCopyUpi}
            onPaid={handlePaidClick}
            showUpload={showUpload}
            onUpload={handleUpload}
            uploadedFileName={uploadedFileName}
            isPaid={currentMatch?.paidUsers?.includes(user?.id)}
            paymentStatus={currentStatusLabel}
            screenshotError={screenshotError}
          />

          <PlayerStatusList players={playerStatuses} />

          {isAdmin && (
            <AdminPanel
              players={players}
              verifiedUsers={currentMatch?.verifiedUsers || []}
              onVerify={handleVerifyPlayer}
              roomData={currentMatch?.roomDetails || { roomId: '', password: '' }}
              onRoomChange={handleRoomChange}
              onStartMatch={handleStartMatch}
              canStart={currentMatch?.verifiedUsers?.length === players.length && currentMatch?.roomDetails?.roomId?.trim() && currentMatch?.roomDetails?.password?.trim()}
              status={currentMatch?.status}
              onAdminAction={handleAdminAction}
              onCancel={handleCancelMatch}
              isMatchActive={isMatchActive}
            />
          )}

          {showRoomDetails && (
            <RoomDetailsCard roomId={roomDetails.roomId} password={roomDetails.password} />
          )}

          <ChatBox
            messages={currentMatch?.adminMessages || []}
            isAdmin={isAdmin}
            onUserAction={handleUserAction}
            onAdminAction={handleAdminAction}
            status={currentMatch?.status}
          />
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[#A1A1A1]">Match progress</p>
                <p className="mt-2 text-2xl font-semibold text-white">{currentStatusLabel}</p>
              </div>
              <span className="rounded-3xl border border-[#2A2A2A] bg-[#0B0B0B] px-3 py-2 text-sm text-[#A1A1A1]">{currentMatch?.mode}</span>
            </div>
            <div className="mt-5">
              <Timer deadline={currentMatch?.paymentDueAt} onExpire={() => {}} />
            </div>
          </div>

          <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
            <h3 className="text-lg font-semibold">Quick actions</h3>
            <div className="mt-4 space-y-3">
              {!isMatchActive && !isCancelled && (
                <button
                  type="button"
                  onClick={handlePaidClick}
                  className="w-full rounded-3xl bg-[#FF6A00] px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black"
                >
                  I HAVE PAID
                </button>
              )}
              {!isMatchActive && !isCancelled && (
                <button
                  type="button"
                  onClick={() => handleCancelMatch()}
                  className="w-full rounded-3xl border border-[#EF4444] bg-[#0B0B0B] px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#EF4444]"
                >
                  Cancel Match
                </button>
              )}
              {showRoomDetails && (
                <div className="rounded-3xl border border-[#2A2A2A] bg-[#0B0B0B] p-4 text-sm text-[#A1A1A1]">
                  <div className="text-white">Room is ready when admin marks it live.</div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed bottom-20 left-0 right-0 z-30 border-t border-[#1F1F1F] bg-[#0B0B0B]/95 p-4 backdrop-blur-sm sm:hidden">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePaidClick}
            className="flex-1 rounded-3xl bg-[#FF6A00] px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black"
            disabled={isMatchActive || isCancelled}
          >
            I HAVE PAID
          </button>
          <button
            type="button"
            onClick={() => handleCancelMatch()}
            className="flex-1 rounded-3xl border border-[#EF4444] bg-[#0B0B0B] px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#EF4444]"
            disabled={isMatchActive || isCancelled}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
