import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Check, Copy, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLatestPayment, useSession } from "@/hooks/useRedpay";

export const Route = createFileRoute("/rpc-code")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "RPC Code — REDPAY" },
      {
        name: "description",
        content: "View the one-time RPC code issued for your approved REDPAY transaction.",
      },
      { property: "og:title", content: "RPC Code — REDPAY" },
      { property: "og:description", content: "Your approved transaction code is ready." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RpcCodePage,
});

function RpcCodePage() {
  const { session } = useSession();
  const payment = useLatestPayment(session?.user.id);
  const paymentId = payment.data?.status === "approved" ? payment.data.id : undefined;
  const [copied, setCopied] = useState(false);

  const code = useQuery({
    queryKey: ["payment-rpc-code", paymentId],
    enabled: !!paymentId,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_payment_rpc_code", {
        _payment_id: paymentId!,
      });
      if (error) throw error;
      const res = data as { ok: boolean; code?: string; error?: string };
      if (!res.ok) throw new Error(res.error ?? "Unable to load code");
      return res.code!;
    },
  });

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const loading = payment.isLoading || code.isLoading;

  async function copyCode() {
    if (!code.data) return;
    try {
      await navigator.clipboard.writeText(code.data);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-primary/25 blur-[90px]"
      />
      <main
        className="relative mx-auto flex w-full max-w-md flex-col items-center px-4 pb-12"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 2.5rem)" }}
      >
        <div className="relative grid place-items-center">
          <span aria-hidden className="absolute size-24 rounded-full bg-primary/30 blur-2xl" />
          <span className="glow-red grid size-16 place-items-center rounded-3xl border border-primary/40 bg-primary/12">
            <KeyRound className="size-7 text-primary" strokeWidth={1.75} />
          </span>
        </div>

        <h1 className="rise-in mt-6 text-center text-2xl font-black tracking-tight">
          RPC <span className="text-primary">Code</span>
        </h1>
        <p className="mt-1.5 text-center text-sm text-muted-foreground">Your code is ready</p>

        <section className="glass-card rise-in mt-7 w-full rounded-3xl border-primary/25 p-6">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Your RPC Code
          </p>

          <div className="mt-4 grid place-items-center rounded-2xl border border-primary/30 bg-background/50 px-4 py-6">
            {loading ? (
              <Loader2 className="size-6 animate-spin text-primary" />
            ) : code.data ? (
              <p
                className="select-all text-center text-[26px] font-black tracking-[0.12em] text-foreground"
                style={{ textShadow: "0 0 18px hsl(var(--primary) / 0.85)" }}
              >
                {code.data}
              </p>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                {payment.data?.status === "approved"
                  ? "Code unavailable right now."
                  : "No approved payment yet."}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={copyCode}
            disabled={!code.data}
            className="gradient-red glow-red mt-5 grid h-13 w-full place-items-center rounded-2xl py-4 text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy Code"}
            </span>
          </button>

          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
            🔐 This is your one-time RPC code for the withdrawal activation.
          </p>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground/80">
            Keep this code secure. It is associated with this transaction.
          </p>

          <div className="mt-5 flex justify-center">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/12 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
              <BadgeCheck className="size-3.5" /> Payment Approved
            </span>
          </div>
        </section>

        <div className="glass-card mt-5 flex w-full items-start gap-3 rounded-2xl p-4">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            This is a demo application credential issued for your record. It does not by itself
            activate or complete a real financial withdrawal.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="glass-card mt-5 grid h-14 w-full place-items-center rounded-2xl text-base font-bold transition-transform active:scale-95"
        >
          Back to Dashboard
        </Link>
      </main>
    </div>
  );
}
