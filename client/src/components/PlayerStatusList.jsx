const statusStyle = {
  Pending: 'text-[#A1A1A1] bg-[#1F1F1F]',
  Paid: 'text-[#FBBF24] bg-[#1F1F1F]',
  Verified: 'text-[#22C55E] bg-[#1F1F1F]',
};

export const PlayerStatusList = ({ players }) => {
  return (
    <section className="space-y-3 rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5 text-white">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Payment Status</h2>
        <span className="text-sm text-[#A1A1A1]">Controlled settlement</span>
      </div>
      <div className="space-y-3">
        {players.map((player) => (
          <div key={player.id} className="flex flex-col gap-3 rounded-3xl border border-[#2A2A2A] bg-[#0B0B0B] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.18em] text-[#A1A1A1]">{player.role || 'Player'}</div>
              <div className="mt-1 text-base font-semibold text-white">{player.username}</div>
            </div>
            <div className={`inline-flex rounded-full px-3 py-2 text-sm font-semibold ${statusStyle[player.status] || statusStyle.Pending}`}>
              {player.status}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
