import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatNaira } from "@/hooks/useRedpay";

export type PurchaseStatus = "idle" | "confirm" | "loading" | "successful" | "pending" | "failed";

export function ConfirmSheet({
  status,
  rows,
  total,
  message,
  onConfirm,
  onCancel,
  onDone,
}: {
  status: PurchaseStatus;
  rows: { label: string; value: string }[];
  total: number;
  message?: string | undefined;
  onConfirm: () => void;
  onCancel: () => void;
  onDone: () => void;
}) {
  if (status === "idle") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Confirm purchase"
        className="glass-card rise-in w-full max-w-md rounded-t-3xl border-x-0 border-b-0 p-5"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />

        {status === "confirm" ? (
          <>
            <h2 className="text-center text-lg font-black">Confirm Purchase</h2>
            <dl className="mt-4 divide-y divide-border rounded-2xl border border-border bg-secondary/40 px-4">
              {rows.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-3 py-3">
                  <dt className="text-xs text-muted-foreground">{r.label}</dt>
                  <dd className="truncate text-sm font-semibold">{r.value}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 py-3">
                <dt className="text-sm font-semibold">Total</dt>
                <dd className="text-lg font-black text-primary">{formatNaira(total)}</dd>
              </div>
            </dl>
            <button
              onClick={onConfirm}
              className="gradient-red glow-red mt-4 h-13 w-full rounded-2xl py-3.5 text-sm font-bold text-primary-foreground transition-transform active:scale-95"
            >
              Confirm &amp; Buy
            </button>
            <button
              onClick={onCancel}
              className="mt-2 h-12 w-full rounded-2xl border border-border text-sm font-medium text-muted-foreground transition-transform active:scale-95"
            >
              Cancel
            </button>
          </>
        ) : status === "loading" ? (
          <div className="grid place-items-center gap-3 py-10 text-center">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing your purchase…</p>
          </div>
        ) : (
          <div className="grid place-items-center gap-3 py-8 text-center">
            {status === "successful" ? (
              <CheckCircle2 className="size-12 text-primary" />
            ) : status === "pending" ? (
              <Clock className="size-12 text-primary" />
            ) : (
              <XCircle className="size-12 text-destructive" />
            )}
            <p className="text-lg font-black capitalize">{status}</p>
            <p className="px-4 text-sm text-muted-foreground">
              {message ??
                (status === "successful"
                  ? "Your card has been delivered and your wallet debited."
                  : "Something went wrong with this transaction.")}
            </p>
            <button
              onClick={onDone}
              className="gradient-red mt-2 h-12 w-full rounded-2xl text-sm font-bold text-primary-foreground transition-transform active:scale-95"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
