import { useMemo } from 'react';

export const PaymentCard = ({ amount, upiId, deadline, onCopy, onPaid, showUpload, onUpload, uploadedFileName, isPaid, paymentStatus, screenshotError }) => {
  const buttonLabel = isPaid ? 'Payment proof uploaded' : 'I HAVE PAID';

  const qrPlaceholder = useMemo(() => {
    return (
      <div className="flex h-40 w-full items-center justify-center rounded-3xl border border-dashed border-[#2A2A2A] bg-[#0B0B0B] text-center text-sm text-[#A1A1A1]">
        QR Code
        <br />
        Placeholder
      </div>
    );
  }, []);

  return (
    <section className="space-y-4 rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5 text-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[#A1A1A1]">Complete Payment to Join Match</p>
          <p className="mt-2 text-4xl font-semibold text-white">₹{amount}</p>
        </div>
        <div className="rounded-3xl bg-[#0B0B0B] px-4 py-3 text-right text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">
          {paymentStatus}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="rounded-3xl border border-[#1F1F1F] bg-[#0B0B0B] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">UPI ID</div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="break-all text-base font-medium text-white">{upiId}</span>
            <button type="button" onClick={onCopy} className="rounded-xl border border-[#2A2A2A] bg-[#151515] px-3 py-2 text-sm text-[#FF6A00] transition hover:bg-[#1f1f1f]">
              Copy
            </button>
          </div>
        </div>
        <div className="hidden min-h-[160px] w-full sm:block">{qrPlaceholder}</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-[#1F1F1F] bg-[#0B0B0B] p-4 text-sm text-[#A1A1A1]">
          <div className="uppercase tracking-[0.18em]">Timer</div>
          <div className="mt-3 text-3xl font-semibold text-white">{deadline}</div>
        </div>
        <div className="rounded-3xl border border-[#1F1F1F] bg-[#0B0B0B] p-4 text-sm text-[#A1A1A1]">
          <div className="uppercase tracking-[0.18em]">Payment flow</div>
          <p className="mt-3 text-sm text-[#E5E7EB]">Upload payment screenshot after transferring UPI amount. Admin must verify both players before match begins.</p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onPaid}
          disabled={isPaid}
          className="w-full rounded-3xl bg-[#FF6A00] px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#e65b00] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {buttonLabel}
        </button>

        {showUpload && (
          <div className="rounded-3xl border border-[#2A2A2A] bg-[#0B0B0B] p-4">
            <label className="block text-sm font-medium text-[#A1A1A1]">Upload Payment Screenshot</label>
            <input
              type="file"
              accept="image/*"
              onChange={onUpload}
              className="mt-3 w-full rounded-2xl border border-[#2A2A2A] bg-[#111111] px-4 py-3 text-sm text-white file:cursor-pointer file:rounded-xl file:border-0 file:bg-[#FF6A00] file:px-4 file:py-2 file:text-black"
            />
            {uploadedFileName && <p className="mt-3 text-sm text-[#A1A1A1]">Uploaded: {uploadedFileName}</p>}
            {screenshotError && <p className="mt-2 text-sm text-[#EF4444]">{screenshotError}</p>}
          </div>
        )}
      </div>
    </section>
  );
};
