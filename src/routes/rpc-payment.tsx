import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Building2,
  Check,
  Copy,
  Hash,
  Landmark,
  Send,
  Upload,
  UserRound,
} from "lucide-react";

export const Route = createFileRoute("/rpc-payment")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Payment Instructions — REDPAY" },
      {
        name: "description",
        content: "Transfer to the account shown and upload your payment proof.",
      },
      { property: "og:title", content: "Payment Instructions — REDPAY" },
      { property: "og:description", content: "Transfer to the account below and upload proof." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RpcPayment,
});

// Placeholder prototype data — edit these values freely.
const PAYMENT_FIELDS = [
  { icon: Banknote, label: "Amount to Pay", value: "₦X,XXX" },
  { icon: Building2, label: "Bank Name", value: "BANK NAME" },
  { icon: Hash, label: "Account Number", value: "XXXXXXXXXX" },
  { icon: UserRound, label: "Account Name", value: "ACCOUNT HOLDER" },
] as const;

function RpcPayment() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(label);
    setTimeout(() => setCopied((c) => (c === label ? null : c)), 1600);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    setFileName(f.name);
  }

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-0 size-72 rounded-full bg-primary/18 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-56 size-72 rounded-full bg-pink-500/12 blur-3xl"
      />

      <main
        className="relative mx-auto w-full max-w-md px-4 pb-12"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.75rem)" }}
      >
        <header className="flex flex-col items-center text-center">
          <span className="glow-red grid size-14 place-items-center rounded-2xl border border-primary/40 bg-primary/15 text-primary">
            <Landmark className="size-7" strokeWidth={1.75} />
          </span>
          <h1 className="mt-4 text-2xl font-black tracking-tight">
            Payment <span className="text-primary text-glow">Instructions</span>
          </h1>
          <div className="mt-2 grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
            <span aria-hidden className="h-px bg-gradient-to-r from-transparent to-primary/70" />
            <p className="text-xs text-muted-foreground">Transfer to the account below</p>
            <span aria-hidden className="h-px bg-gradient-to-l from-transparent to-primary/70" />
          </div>
        </header>

        <section className="mt-6 space-y-3">
          {PAYMENT_FIELDS.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="glass-card grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border-primary/25 p-4"
            >
              <span className="glow-red grid size-10 shrink-0 place-items-center rounded-xl border border-primary/35 bg-primary/12 text-primary">
                <Icon className="size-[18px]" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="truncate text-lg font-bold tracking-tight">{value}</p>
              </div>
              <button
                onClick={() => copy(label, value)}
                aria-label={`Copy ${label}`}
                className="gradient-red flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-primary-foreground transition-transform active:scale-90"
              >
                {copied === label ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied === label ? "Copied" : "Copy"}
              </button>
            </div>
          ))}
        </section>

        <section className="mt-5">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={onPick}
            className="sr-only"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-primary/45 bg-background/40 px-4 py-7 text-center backdrop-blur-md transition-transform active:scale-[0.98]"
          >
            {preview ? (
              <>
                <img
                  src={preview}
                  alt="Payment proof preview"
                  className="max-h-52 w-full rounded-2xl object-contain"
                />
                <p className="mt-1 max-w-full truncate text-xs text-muted-foreground">
                  {fileName} · tap to change
                </p>
              </>
            ) : (
              <>
                <span className="glow-red grid size-12 place-items-center rounded-full border border-primary/35 bg-primary/12 text-primary">
                  <Upload className="size-5" strokeWidth={1.75} />
                </span>
                <p className="text-sm font-semibold">Click to upload payment proof</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
              </>
            )}
          </button>
        </section>

        <button
          onClick={() => navigate({ to: "/rpc-pending" })}
          className="gradient-red glow-red mt-6 grid h-14 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl px-5 text-base font-bold text-primary-foreground transition-transform active:scale-95"
        >
          <Send className="size-5" strokeWidth={2} />
          <span className="truncate">I Have Made Payment</span>
          <ArrowRight className="size-5" strokeWidth={2} />
        </button>

        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Prototype screen — placeholder details, no real transaction is processed.
        </p>
      </main>
    </div>
  );
}
