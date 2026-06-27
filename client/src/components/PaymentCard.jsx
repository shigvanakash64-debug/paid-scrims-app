export const PaymentCard = ({ amount, walletBalance, deadline, onPayWithWallet, isPaid, paymentStatus }) => {
  const buttonLabel = isPaid ? 'Wallet payment completed' : 'Pay from wallet';

  return (
    <section className="space-y-4 rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5 text-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[#A1A1A1]">Wallet-first match entry</p>
          <p className="mt-2 text-4xl font-semibold text-white">CZ{amount}</p>
        </div>
        <div className="rounded-3xl bg-[#0B0B0B] px-4 py-3 text-right text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">
          {paymentStatus}
        </div>
      </div>

      <div className="rounded-3xl border border-[#1F1F1F] bg-[#0B0B0B] p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">Wallet status</div>
        <div className="mt-2 text-base font-medium text-white">Available balance: CZ{Number(walletBalance || 0).toLocaleString()}</div>
        <p className="mt-1 text-sm text-[#A1A1A1]">Entry fee will be deducted from your wallet as soon as you confirm payment.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-[#1F1F1F] bg-[#0B0B0B] p-4 text-sm text-[#A1A1A1]">
          <div className="uppercase tracking-[0.18em]">Timer</div>
          <div className="mt-3 text-3xl font-semibold text-white">{deadline}</div>
        </div>
        <div className="rounded-3xl border border-[#1F1F1F] bg-[#0B0B0B] p-4 text-sm text-[#A1A1A1]">
          <div className="uppercase tracking-[0.18em]">Payment flow</div>
          <p className="mt-3 text-sm text-[#E5E7EB]">Deposit money into your wallet first, then pay the entry fee directly from wallet when you join a match.</p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onPayWithWallet}
          disabled={isPaid}
          className="w-full rounded-3xl bg-[#FF6A00] px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#e65b00] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {buttonLabel}
        </button>
      </div>
    </section>
  );
};
