export const MatchHeader = ({ match, statusLabel }) => {
  return (
    <section className="space-y-3 rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5 text-white">
      <div className="flex items-center justify-between gap-3 text-sm text-[#A1A1A1]">
        <span>Match ID: <strong className="text-white">#{match.id}</strong></span>
        <span className="rounded-full border border-[#2A2A2A] bg-[#151515] px-3 py-1 text-xs uppercase tracking-[0.12em] text-[#A1A1A1]">{statusLabel}</span>
      </div>
      <div className="space-y-2">
        <div className="text-sm uppercase text-[#A1A1A1]">Match details</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">{match.mode} · {match.type}</h1>
            <p className="text-sm text-[#A1A1A1]">Entry fee • ₹{match.entry}</p>
          </div>
          <div className="rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-3 text-right">
            <div className="text-xs uppercase text-[#A1A1A1]">Players</div>
            <div className="text-lg font-semibold text-white">{match.players[0]?.username} vs {match.players[1]?.username}</div>
          </div>
        </div>
      </div>
    </section>
  );
};
