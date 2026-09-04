import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Clock, Headphones, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { RedpayLogo } from "@/components/redpay/Logo";
import { formatNaira, useLatestPayment, useSession } from "@/hooks/useRedpay";

export const Route = createFileRoute("/rpc-pending")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Payment Submitted — REDPAY" },
      {
        name: "description",
        content: "Track the review status of your REDPAY payment proof in real time.",
      },
      { property: "og:title", content: "Payment Submitted — REDPAY" },
      { property: "og:description", content: "Your payment status updates automatically." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RpcPending,
});

function RpcPending() {
  const { session } = useSession();
  const payment = useLatestPayment(session?.user.id);
  const status = (payment.data?.status ?? "pending") as string;
  const navigate = useNavigate();

  useEffect(() => {
    if (status !== "approved") return;
    const t = setTimeout(() => navigate({ to: "/rpc-code" }), 2500);
    return () => clearTimeout(t);
  }, [status, navigate]);

  const view =
    status === "approved"
      ? {
          icon: CheckCircle2,
          tone: "text-emerald-400 border-emerald-400/30 bg-emerald-400/12",
          title: "Payment Approved",
          body: "Your payment has been approved. Taking you to your RPC code…",
          heading: "Approved",
        }
      : status === "rejected"
        ? {
            icon: XCircle,
            tone: "text-destructive border-destructive/30 bg-destructive/12",
            title: "Payment Rejected",
            body: "Payment rejected. Please contact support for assistance.",
            heading: "Rejected",
          }
        : {
            icon: Clock,
            tone: "text-amber-400 border-amber-400/30 bg-amber-400/12",
            title: "Pending Review",
            body: "Reviews are completed after your details are checked. This page updates automatically.",
            heading: "Submitted",
          };
  const Icon = view.icon;

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
          Payment <span className="text-primary">{view.heading}</span>
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {payment.isLoading ? "Loading your latest payment…" : view.body}
        </p>

        <section className="glass-card rise-in mt-6 w-full rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <span className={`grid size-11 shrink-0 place-items-center rounded-2xl border ${view.tone}`}>
              {payment.isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Icon className="size-5" strokeWidth={1.75} />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{view.title}</p>
              <p className="text-xs text-muted-foreground">
                {payment.data
                  ? `${formatNaira(payment.data.amount)} · ${new Date(payment.data.created_at).toLocaleString()}`
                  : "No payment submitted yet."}
              </p>
            </div>
          </div>

          {payment.data?.admin_note ? (
            <div className="mt-4 rounded-2xl border border-border bg-background/40 p-3.5">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Admin note: {payment.data.admin_note}
              </p>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-border bg-background/40 p-3.5">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              Only the REDPAY review team can change this status.
            </p>
          </div>
        </section>

        <Link
          to="/dashboard"
          className="gradient-red glow-red mt-6 grid h-14 w-full place-items-center rounded-2xl text-base font-bold text-primary-foreground transition-transform active:scale-95"
        >
          Back to Dashboard
        </Link>

        <Link
          to="/support"
          className="glass-card mt-4 flex w-full items-center gap-3 rounded-2xl p-4"
        >
          <Headphones className="size-4 shrink-0 text-primary" />
          <p className="min-w-0 text-xs text-muted-foreground">
            Need help? Reach us through the official in-app support channel.
          </p>
        </Link>
      </main>
    </div>
  );
}
