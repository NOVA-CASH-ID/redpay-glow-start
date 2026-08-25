import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Headphones, ShieldCheck } from "lucide-react";
import { RedpayLogo } from "@/components/redpay/Logo";

export const Route = createFileRoute("/rpc-pending")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Payment Submitted — REDPAY" },
      {
        name: "description",
        content: "Your REDPAY payment proof was submitted and is pending review.",
      },
      { property: "og:title", content: "Payment Submitted — REDPAY" },
      { property: "og:description", content: "Your payment is pending review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RpcPending,
});

function RpcPending() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden">
      <main
        className="mx-auto flex w-full max-w-md flex-col items-center px-4 pb-10"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 2.5rem)" }}
      >
        <div className="relative grid place-items-center">
          <span aria-hidden className="absolute size-28 rounded-full bg-primary/25 blur-2xl" />
          <RedpayLogo size={64} />
        </div>

        <h1 className="rise-in mt-6 text-center text-2xl font-black tracking-tight">
          Payment <span className="text-primary">Submitted</span>
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Your payment proof is pending review.
        </p>

        <section className="glass-card rise-in mt-6 w-full rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-amber-400/30 bg-amber-400/12 text-amber-400">
              <Clock className="size-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Pending Review</p>
              <p className="text-xs text-muted-foreground">
                Reviews are completed after your details are checked.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-background/40 p-3.5">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              This is a prototype screen. No real financial transaction was processed.
            </p>
          </div>
        </section>

        <Link
          to="/dashboard"
          className="gradient-red glow-red mt-6 grid h-14 w-full place-items-center rounded-2xl text-base font-bold text-primary-foreground transition-transform active:scale-95"
        >
          Back to Dashboard
        </Link>

        <div className="glass-card mt-4 flex w-full items-center gap-3 rounded-2xl p-4">
          <Headphones className="size-4 shrink-0 text-primary" />
          <p className="min-w-0 text-xs text-muted-foreground">
            Need help? Reach us through the official in-app support channel.
          </p>
        </div>
      </main>
    </div>
  );
}
