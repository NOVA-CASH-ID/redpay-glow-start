import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Upload,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/rpc-notice")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Important Payment Notice — REDPAY" },
      {
        name: "description",
        content: "Read the REDPAY payment guidelines before making a transfer.",
      },
      { property: "og:title", content: "Important Payment Notice — REDPAY" },
      { property: "og:description", content: "REDPAY payment guidelines before transfer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RpcNotice,
});

const CARDS = [
  {
    icon: Wallet,
    tone: "text-sky-400",
    ring: "bg-sky-400/12 border-sky-400/25",
    title: "Transfer Amount",
    body: (
      <>
        Transfer the <span className="font-semibold text-sky-400">exact amount</span> shown on
        this page. Sending a different amount delays your order.
      </>
    ),
  },
  {
    icon: Upload,
    tone: "text-violet-400",
    ring: "bg-violet-400/12 border-violet-400/25",
    title: "Payment Screenshot",
    body: (
      <>
        Upload a clear <span className="font-semibold text-violet-400">payment screenshot</span>{" "}
        immediately after the transfer is completed.
      </>
    ),
  },
  {
    icon: AlertTriangle,
    tone: "text-orange-400",
    ring: "bg-orange-400/12 border-orange-400/30",
    title: "Payment Warning",
    body: (
      <>
        <span className="font-semibold text-orange-400">
          Avoid using unsupported payment methods.
        </span>{" "}
        Always follow the payment method displayed by the application.
      </>
    ),
  },
  {
    icon: CheckCircle2,
    tone: "text-emerald-400",
    ring: "bg-emerald-400/12 border-emerald-400/25",
    title: "Confirmation",
    body: (
      <>
        Payments are{" "}
        <span className="font-semibold text-emerald-400">
          reviewed after the required information is submitted
        </span>
        .
      </>
    ),
  },
  {
    icon: XCircle,
    tone: "text-primary",
    ring: "bg-primary/12 border-primary/35",
    title: "Dispute Notice",
    body: (
      <>
        If there is a problem with a payment, contact support through the application&apos;s{" "}
        <span className="font-semibold text-primary">official support channel</span>.
      </>
    ),
  },
] as const;

function RpcNotice() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-10 size-64 rounded-full bg-sky-500/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-40 size-64 rounded-full bg-primary/15 blur-3xl"
      />

      <main
        className="relative mx-auto w-full max-w-md px-4 pb-10 pt-6"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.25rem)" }}
      >
        <section className="glass-card rise-in rounded-3xl p-5">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full border border-orange-400/30 bg-orange-500/15 text-orange-400 shadow-[0_0_28px_-6px_rgb(251_146_60/0.7)]">
              <AlertTriangle className="size-6" strokeWidth={2} />
            </span>
            <h1 className="min-w-0 self-center text-xl font-black leading-tight tracking-tight">
              Important Payment Notice
            </h1>
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              aria-label="Close notice"
              className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-secondary/60 transition-transform active:scale-90"
            >
              <X className="size-4" />
            </button>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Please read these five points carefully before you continue to the payment page.
          </p>

          <div className="mt-4 space-y-3">
            {CARDS.map(({ icon: Icon, tone, ring, title, body }) => (
              <article
                key={title}
                className={`rounded-2xl border bg-background/40 p-3.5 ${ring}`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-xl border border-border/60 bg-background/60 ${tone}`}
                  >
                    <Icon className="size-[18px]" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <button
            onClick={() => navigate({ to: "/rpc-payment" })}
            className="gradient-red glow-red mt-5 h-14 w-full rounded-2xl text-base font-bold text-primary-foreground transition-transform active:scale-95"
          >
            I Understand
          </button>
        </section>
      </main>
    </div>
  );
}
