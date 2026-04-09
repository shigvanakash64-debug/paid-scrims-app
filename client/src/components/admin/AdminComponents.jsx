// StatCard - Dashboard stats display
export const StatCard = ({ label, value, icon, trend, color = '#FF6A00' }) => (
  <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wider text-[#A1A1A1]">{label}</p>
        <p className="text-2xl font-bold text-white mt-2">{value}</p>
        {trend && (
          <p className={`text-xs mt-2 ${trend > 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </p>
        )}
      </div>
      <div
        className="text-2xl"
        style={icon ? undefined : { color }}
      >
        {icon}
      </div>
    </div>
  </div>
);

// MatchCard - Single match in list view
export const MatchCard = ({
  matchId,
  playerA,
  playerB,
  mode,
  entry,
  status,
  paymentA,
  paymentB,
  onOpen,
  onVerifyA,
  onVerifyB,
  onCancel,
}) => {
  const STATUS_COLORS = {
    waiting: 'text-[#A1A1A1]',
    matched: 'text-[#F59E0B]',
    payment_pending: 'text-[#F59E0B]',
    verified: 'text-[#F59E0B]',
    ongoing: 'text-[#FF6A00]',
    completed: 'text-[#22C55E]',
    cancelled: 'text-[#EF4444]',
  };

  const STATUS_BG = {
    waiting: 'bg-[#1F1F1F]',
    matched: 'bg-[#2A2A2A]',
    payment_pending: 'bg-[#2A2A2A]',
    verified: 'bg-[#2A2A2A]',
    ongoing: 'bg-[#2A3318]',
    completed: 'bg-[#022c0b]',
    cancelled: 'bg-[#3d1c1c]',
  };

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-[#A1A1A1]">MATCH #{matchId}</p>
          <p className="text-sm text-white font-medium mt-1">{mode} • {entry}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[status]} ${STATUS_BG[status]}`}>
          {status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Players */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0B0B0B] border border-[#1F1F1F] rounded p-3">
          <div className="text-xs text-[#A1A1A1]">PLAYER A</div>
          <div className="text-sm font-medium text-white mt-1">{playerA}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-1 rounded ${paymentA ? 'bg-[#022c0b] text-[#22C55E]' : 'bg-[#1F1F1F] text-[#A1A1A1]'}`}>
              {paymentA ? '✓ Paid' : '○ Pending'}
            </span>
          </div>
        </div>

        <div className="bg-[#0B0B0B] border border-[#1F1F1F] rounded p-3">
          <div className="text-xs text-[#A1A1A1]">PLAYER B</div>
          <div className="text-sm font-medium text-white mt-1">{playerB}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-1 rounded ${paymentB ? 'bg-[#022c0b] text-[#22C55E]' : 'bg-[#1F1F1F] text-[#A1A1A1]'}`}>
              {paymentB ? '✓ Paid' : '○ Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          onClick={onOpen}
          className="bg-[#FF6A00] text-black px-3 py-2 rounded text-xs font-semibold hover:opacity-90 transition"
        >
          Open
        </button>
        <button
          onClick={onCancel}
          className="border border-[#EF4444] text-[#EF4444] px-3 py-2 rounded text-xs font-semibold hover:bg-[#3d1c1c] transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// PaymentStatusCard - Payment verification display
export const PaymentStatusCard = ({ player, isPaid, paymentScreenshots, onApprove, onReject, isLoading }) => (
  <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 space-y-3">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-[#A1A1A1]">PAYMENT STATUS</p>
        <p className="text-lg font-semibold text-white mt-1">{player}</p>
      </div>
      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
        isPaid ? 'bg-[#022c0b] text-[#22C55E]' : 'bg-[#1F1F1F] text-[#A1A1A1]'
      }`}>
        {isPaid ? 'VERIFIED' : 'PENDING'}
      </span>
    </div>

    {paymentScreenshots && paymentScreenshots.length > 0 && (
      <div className={`grid gap-3 ${
        paymentScreenshots.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
      }`}>
        {paymentScreenshots.map((screenshot, idx) => (
          <div key={idx} className="relative overflow-hidden rounded-lg bg-[#0B0B0B] border border-[#1F1F1F] aspect-video">
            <img src={screenshot.image} alt={`Payment proof ${idx + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    )}

    {!isPaid && (
      <div className="flex gap-2">
        <button
          onClick={onApprove}
          disabled={isLoading}
          className="flex-1 bg-[#22C55E] text-black px-3 py-2 rounded font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
        >
          {isLoading ? '...' : 'Approve'}
        </button>
        <button
          onClick={onReject}
          disabled={isLoading}
          className="flex-1 border border-[#EF4444] text-[#EF4444] px-3 py-2 rounded font-semibold text-sm hover:bg-[#3d1c1c] transition disabled:opacity-50"
        >
          {isLoading ? '...' : 'Reject'}
        </button>
      </div>
    )}
  </div>
);

export const ResultSubmissionCard = ({ matchId, players, mode, type, entry, status, resultDeadline, resultScreenshots }) => (
  <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs text-[#A1A1A1]">RESULT SUBMISSION</p>
        <p className="text-lg font-semibold text-white mt-1">Match #{matchId}</p>
      </div>
      <span className="text-xs font-semibold rounded-full bg-[#1F1F1F] px-3 py-1 text-[#A1A1A1]">
        {status.replace('_', ' ').toUpperCase()}
      </span>
    </div>

    <div className="space-y-2 text-sm text-[#E5E7EB]">
      <div><span className="font-semibold text-white">Match:</span> {mode} • {type}</div>
      <div><span className="font-semibold text-white">Entry fee:</span> ₹{entry}</div>
      <div><span className="font-semibold text-white">Players:</span> {players.join(' vs ')}</div>
      {resultDeadline && (
        <div><span className="font-semibold text-white">Deadline:</span> {new Date(resultDeadline).toLocaleString()}</div>
      )}
    </div>

    {resultScreenshots && resultScreenshots.length > 0 && (
      <div className="grid gap-3 sm:grid-cols-2">
        {resultScreenshots.map((screenshot, idx) => (
          <div key={idx} className="space-y-2">
            <div className="text-xs text-[#A1A1A1]">{screenshot.user?.username || `Player ${idx + 1}`}</div>
            <div className="relative overflow-hidden rounded-lg bg-[#0B0B0B] border border-[#1F1F1F] aspect-video">
              <img src={screenshot.image} alt={`Result proof ${idx + 1}`} className="w-full h-full object-cover" />
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// DisputeCard - Dispute display
export const DisputeCard = ({
  matchId,
  playerA,
  playerB,
  screenshotA,
  screenshotB,
  onResolve,
  isLoading,
}) => (
  <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 space-y-4">
    <div>
      <p className="text-xs text-[#A1A1A1]">DISPUTED MATCH #{matchId}</p>
      <p className="text-sm text-white font-medium mt-1">{playerA} vs {playerB}</p>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <p className="text-xs text-[#A1A1A1] mb-2">{playerA} PROOF</p>
        <div className="relative overflow-hidden rounded-lg bg-[#0B0B0B] border border-[#1F1F1F] aspect-video">
          <img src={screenshotA} alt={playerA} className="w-full h-full object-cover" />
        </div>
      </div>
      <div>
        <p className="text-xs text-[#A1A1A1] mb-2">{playerB} PROOF</p>
        <div className="relative overflow-hidden rounded-lg bg-[#0B0B0B] border border-[#1F1F1F] aspect-video">
          <img src={screenshotB} alt={playerB} className="w-full h-full object-cover" />
        </div>
      </div>
    </div>

    <div className="flex gap-2">
      <button
        onClick={() => onResolve('A')}
        disabled={isLoading}
        className="flex-1 bg-[#FF6A00] text-black px-3 py-2 rounded font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
      >
        {isLoading ? '...' : `Winner: ${playerA}`}
      </button>
      <button
        onClick={() => onResolve('B')}
        disabled={isLoading}
        className="flex-1 border border-[#FF6A00] text-[#FF6A00] px-3 py-2 rounded font-semibold text-sm hover:bg-[#2A2A2A] transition disabled:opacity-50"
      >
        {isLoading ? '...' : `Winner: ${playerB}`}
      </button>
    </div>
  </div>
);

// UserCard - User in list
export const UserCard = ({
  username,
  walletBalance,
  trustScore,
  status,
  matchCount,
  onBan,
  onAdjustBalance,
  onViewHistory,
}) => (
  <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 space-y-3">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold text-white">{username}</p>
        <div className="flex gap-2 mt-2 text-xs">
          <span className="px-2 py-1 bg-[#1F1F1F] text-[#A1A1A1] rounded">
            {trustScore}⭐ Trust
          </span>
          <span className={`px-2 py-1 rounded ${
            status === 'Active'
              ? 'bg-[#022c0b] text-[#22C55E]'
              : 'bg-[#3d1c1c] text-[#EF4444]'
          }`}>
            {status}
          </span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-[#A1A1A1]">WALLET</p>
        <p className="text-lg font-bold text-white">₹{walletBalance}</p>
      </div>
    </div>

    <div className="text-xs text-[#A1A1A1] pt-2 border-t border-[#1F1F1F]">
      Matches: {matchCount}
    </div>

    <div className="flex gap-2">
      <button
        onClick={onViewHistory}
        className="flex-1 border border-[#1F1F1F] text-[#A1A1A1] px-3 py-2 rounded text-xs font-semibold hover:border-[#FF6A00] hover:text-[#FF6A00] transition"
      >
        History
      </button>
      <button
        onClick={onAdjustBalance}
        className="flex-1 border border-[#1F1F1F] text-[#A1A1A1] px-3 py-2 rounded text-xs font-semibold hover:bg-[#1F1F1F] transition"
      >
        Adjust
      </button>
      <button
        onClick={onBan}
        className="flex-1 border border-[#EF4444] text-[#EF4444] px-3 py-2 rounded text-xs font-semibold hover:bg-[#3d1c1c] transition"
      >
        {status === 'Active' ? 'Ban' : 'Unban'}
      </button>
    </div>
  </div>
);

// WithdrawalCard - Withdrawal request
export const WithdrawalCard = ({
  id,
  username,
  amount,
  method,
  details,
  requestedAt,
  onApprove,
  onReject,
  isLoading,
}) => (
  <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 space-y-3">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold text-white">{username}</p>
        <p className="text-xs text-[#A1A1A1] mt-1">{requestedAt}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-[#A1A1A1]">AMOUNT</p>
        <p className="text-2xl font-bold text-[#FF6A00]">₹{amount}</p>
      </div>
    </div>

    <div className="bg-[#0B0B0B] border border-[#1F1F1F] rounded p-3">
      <p className="text-xs text-[#A1A1A1] mb-2">METHOD: {method}</p>
      <p className="text-sm text-white font-mono">{details}</p>
    </div>

    <div className="flex gap-2">
      <button
        onClick={onApprove}
        disabled={isLoading}
        className="flex-1 bg-[#22C55E] text-black px-3 py-2 rounded font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
      >
        {isLoading ? '...' : 'Approve'}
      </button>
      <button
        onClick={onReject}
        disabled={isLoading}
        className="flex-1 border border-[#EF4444] text-[#EF4444] px-3 py-2 rounded font-semibold text-sm hover:bg-[#3d1c1c] transition disabled:opacity-50"
      >
        {isLoading ? '...' : 'Reject'}
      </button>
    </div>
  </div>
);

// LogCard - System log entry
export const LogCard = ({ timestamp, level, action, details, user }) => {
  const LEVEL_COLORS = {
    info: 'text-[#A1A1A1] bg-[#1F1F1F]',
    success: 'text-[#22C55E] bg-[#022c0b]',
    warning: 'text-[#F59E0B] bg-[#2A2A1F]',
    error: 'text-[#EF4444] bg-[#3d1c1c]',
  };

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded ${LEVEL_COLORS[level]}`}>
              {level.toUpperCase()}
            </span>
            <p className="text-sm font-medium text-white">{action}</p>
          </div>
          <p className="text-xs text-[#A1A1A1] mt-2">{details}</p>
          {user && <p className="text-xs text-[#666666] mt-1">by {user}</p>}
        </div>
        <p className="text-xs text-[#666666] text-right whitespace-nowrap">{timestamp}</p>
      </div>
    </div>
  );
};
