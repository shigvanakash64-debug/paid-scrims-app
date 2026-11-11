const AD_REWARD_CZ = 1;

export const AdsScreen = () => (
  <div className="screen-ads px-4 py-6">
    <div className="mb-6">
      <div className="text-xs uppercase tracking-[0.2em] text-[#FF6A00]">Watch &amp; earn</div>
      <h1 className="mt-2 text-3xl font-bold text-white">Ad Rewards</h1>
      <p className="mt-2 text-sm leading-6 text-[#A1A1A1]">
        Earn {AD_REWARD_CZ} CZ in tournament-only credits for each completed ad. 1 CZ = ₹0.10 (10 CZ = ₹1.00).
      </p>
    </div>

    <section className="rounded-2xl border border-[#2A2A2A] bg-[#111111] p-5" aria-labelledby="ad-rewards-status">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="ad-rewards-status" className="text-lg font-semibold text-white">Rewarded ads</h2>
        <span className="rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-3 py-1 text-xs font-semibold text-[#FCD34D]">
          Not available yet
        </span>
      </div>
      <p className="text-sm leading-6 text-[#A1A1A1]">
        Rewarded ads are not configured yet, so ads cannot be watched and no rewards can be claimed right now. This website needs a web ad provider; Unity Ads would require a native mobile app or wrapper.
      </p>
      <button
        className="mt-5 w-full cursor-not-allowed rounded-xl bg-[#333333] px-4 py-3 font-semibold text-[#999999]"
        type="button"
        disabled
      >
        Web ad provider setup required
      </button>
    </section>

    <section className="mt-5 rounded-2xl border border-[#2A2A2A] bg-[#111111] p-5">
      <h2 className="text-lg font-semibold text-white">How rewards will work</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#A1A1A1]">
        <li>Receive {AD_REWARD_CZ} CZ after a rewarded ad is verified as completed.</li>
        <li>Conversion rate: 1 CZ = ₹0.10, so 10 CZ = ₹1.00.</li>
        <li>Ad credits can be used toward tournament entry fees only.</li>
        <li>Ad credits cannot be withdrawn or transferred to your cash wallet.</li>
      </ul>
    </section>
  </div>
);

export default AdsScreen;
