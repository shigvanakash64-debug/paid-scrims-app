export const InstructionsScreen = () => {
  return (
    <div className="min-h-screen bg-[#0B0B0B] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-[#1F1F1F] bg-[#111111] p-8">
        <h1 className="text-3xl font-bold">How to use Clutch Zone</h1>
        <div className="space-y-4 text-sm text-[#D3D3D3]">
          <p>1. Create or join a match by selecting kill type, choosing an entry fee, and clicking FIND MATCH.</p>
          <p>2. Complete payment in the match lobby by uploading proof, then wait for verification so the match can start.</p>
          <p>3. After the match, submit result proof and the system/admin will approve the winner and process payout automatically.</p>
        </div>
      </div>
    </div>
  );
};
