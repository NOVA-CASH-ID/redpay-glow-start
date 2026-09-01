import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, Headphones, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { RedpayLogo } from "@/components/redpay/Logo";
import { formatNaira, useLatestWithdrawal, useSession } from "@/hooks/useRedpay";
import { maskAccount } from "@/hooks/useAdmin";

export const Route = createFileRoute("/withdraw-status")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Withdrawal Status — REDPAY" },
      {
        name: "description",
        content: "Follow your REDPAY withdrawal from processing through to payout.",
      },
      { property: "og:title", content: "Withdrawal Status — REDPAY" },
      { property: "og:description", content: "Live status of your REDPAY withdrawal request." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WithdrawStatus,
});

function WithdrawStatus() {
  const { session } = useSession();
  const w = useLatestWithdrawal(session?.user.id);
  const status = (w.data?.status ?? "pending") as string;

  const view =
    status === "completed"
      ? {
          icon: CheckCircle2,
          tone: "text-emerald-400 border-emerald-400/30 bg-emerald-400/12",
          heading: "Successful",
          title: "Withdrawal Successful",
          body: "Your payout has been completed and sent to your bank account.",
        }
      : status === "rejected" || status === "failed"
        ? {
            icon: XCircle,
            tone: "text-destructive border-destructive/30 bg-destructive/12",
            heading: "Failed",
            title: "Withdrawal Failed",
            body: "This withdrawal was not completed and the amount has been returned to your wallet.",
          }
        : {
            icon: Clock,
            tone: "text-amber-400 border-amber-400/30 bg-amber-400/12",
            heading: "Processing",
            title: "Withdrawal Processing",
            body: "Your request is being reviewed. This page updates automatically.",
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
          Withdrawal <span className="text-primary">{view.heading}</span>
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {w.isLoading ? "Loading your latest withdrawal…" : view.body}
        </p>

        <section className="glass-card rise-in mt-6 w-full rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <span className={`grid size-11 shrink-0 place-items-center rounded-2xl border ${view.tone}`}>
              {w.isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Icon className="size-5" strokeWidth={1.75} />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{view.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {w.data
                  ? `${formatNaira(w.data.amount)} · ${w.data.bank_name} · ${maskAccount(w.data.account_number)}`
                  : "No withdrawal request yet."}
              </p>
            </div>
          </div>

          {w.data?.admin_note ? (
            <div className="mt-4 rounded-2xl border border-border bg-background/40 p-3.5">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Admin note: {w.data.admin_note}
              </p>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-border bg-background/40 p-3.5">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              Payouts are marked successful only after the REDPAY team completes the transfer.
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
            Questions about your payout? Contact REDPAY support.
          </p>
        </Link>
      </main>
    </div>
  );
}
