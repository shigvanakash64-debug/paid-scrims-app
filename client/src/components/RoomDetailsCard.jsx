export const RoomDetailsCard = ({ roomId, password }) => {
  return (
    <section className="space-y-4 rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5 text-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[#A1A1A1]">Match Started</p>
          <h2 className="text-xl font-semibold">Room access</h2>
        </div>
        <span className="rounded-full border border-[#2A2A2A] bg-[#0B0B0B] px-3 py-2 text-sm text-[#A1A1A1]">Secure</span>
      </div>
      <div className="space-y-3 rounded-3xl border border-[#2A2A2A] bg-[#0B0B0B] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">ROOM ID</p>
            <p className="mt-2 text-2xl font-semibold text-white">{roomId}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">PASSWORD</p>
            <p className="mt-2 text-2xl font-semibold text-white">{password}</p>
          </div>
        </div>
      </div>
      <p className="text-sm text-[#A1A1A1]">Copy the room credentials and share them carefully with both players once admin verification completes.</p>
    </section>
  );
};
