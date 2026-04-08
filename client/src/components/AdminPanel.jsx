import { lazy, Suspense } from 'react';

// Lazy load the admin dashboard to reduce bundle size
const AdminLayout = lazy(() => import('./admin/AdminLayout').then(m => ({ default: m.AdminLayout })));

// Basic match control component (for use within a match)
const MatchAdminControls = ({
  players = [],
  verifiedUsers = [],
  onVerify,
  roomData = {},
  onRoomChange,
  onStartMatch,
  canStart,
  status,
  onAdminAction,
  onCancel,
  isMatchActive
}) => {
  const readyToStart = canStart && status !== 'ongoing' && status !== 'cancelled';
  const allVerified = verifiedUsers.length === players.length;

  return (
    <section className="space-y-5 rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5 text-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[#A1A1A1]">Admin Controls</p>
          <h2 className="text-xl font-semibold">Verification & match planning</h2>
        </div>
        <span className="rounded-full border border-[#2A2A2A] bg-[#0B0B0B] px-3 py-2 text-sm text-[#A1A1A1]">Admin Only</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {players.map((player) => {
          const verified = verifiedUsers.includes(player.id);
          return (
            <div key={player.id} className="rounded-3xl border border-[#2A2A2A] bg-[#0B0B0B] p-4">
              <div className="text-sm text-[#A1A1A1]">{player.username}</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className={`rounded-full px-3 py-2 text-sm font-semibold ${verified ? 'bg-[#022c0b] text-[#22C55E]' : 'bg-[#1F1F1F] text-[#A1A1A1]'}`}>
                  {verified ? 'Verified' : 'Pending'}
                </span>
                <button
                  type="button"
                  onClick={() => onVerify?.(player.id)}
                  disabled={verified || status === 'cancelled' || isMatchActive}
                  className="rounded-2xl border border-[#2A2A2A] px-3 py-2 text-sm font-semibold text-[#FF6A00] transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Verify
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3 rounded-3xl border border-[#2A2A2A] bg-[#0B0B0B] p-4">
        <div className="text-sm uppercase tracking-[0.18em] text-[#A1A1A1]">Room credentials</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={roomData.roomId || ''}
            placeholder="Room ID"
            onChange={(e) => onRoomChange?.('roomId', e.target.value)}
            disabled={!allVerified || status === 'cancelled' || isMatchActive}
            className="w-full rounded-2xl border border-[#2A2A2A] bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6A00]"
          />
          <input
            type="text"
            value={roomData.password || ''}
            placeholder="Password"
            onChange={(e) => onRoomChange?.('password', e.target.value)}
            disabled={!allVerified || status === 'cancelled' || isMatchActive}
            className="w-full rounded-2xl border border-[#2A2A2A] bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6A00]"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onStartMatch}
            disabled={!readyToStart}
            className="w-full rounded-3xl bg-[#FF6A00] px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black transition disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            START MATCH
          </button>
          <button
            type="button"
            onClick={() => onCancel?.('admin')}
            className="w-full rounded-3xl border border-[#EF4444] bg-[#0B0B0B] px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#EF4444] transition sm:w-auto"
          >
            Cancel Match
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onAdminAction?.('Payment received')}
          className="rounded-3xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-4 text-sm font-semibold text-[#FF6A00]"
        >
          Payment received
        </button>
        <button
          type="button"
          onClick={() => onAdminAction?.('Room created')}
          className="rounded-3xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-4 text-sm font-semibold text-[#FF6A00]"
        >
          Room created
        </button>
        <button
          type="button"
          onClick={() => onAdminAction?.('Match cancelled')}
          className="rounded-3xl border border-[#EF4444] bg-[#0B0B0B] px-4 py-4 text-sm font-semibold text-[#EF4444]"
        >
          Match cancelled
        </button>
      </div>
    </section>
  );
};

// Main AdminPanel - handles both match control and admin dashboard
export const AdminPanel = (props) => {
  // If no props passed or empty object, render full admin dashboard
  if (!props || Object.keys(props).length === 0) {
    return (
      <Suspense fallback={<div className="text-white p-8">Loading...</div>}>
        <AdminLayout />
      </Suspense>
    );
  }

  // Otherwise render match-specific admin controls
  return <MatchAdminControls {...props} />;
};
