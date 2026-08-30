import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Banknote, KeyRound, Landmark, Loader2, ShieldCheck, Wallet } from "lucide-react";
import { PageHeader } from "@/components/redpay/PageHeader";
import { BottomNav, type NavKey } from "@/components/redpay/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAppSetting } from "@/hooks/useAdmin";
import { useProfile, useSession } from "@/hooks/useRedpay";


export const Route = createFileRoute("/withdraw")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Withdraw Funds — REDPAY" },
      {
        name: "description",
        content:
          "Withdraw your REDPAY wallet balance to your bank account using a valid RPC code.",
      },
      { property: "og:title", content: "Withdraw Funds — REDPAY" },
      {
        property: "og:description",
        content: "Move money from your REDPAY wallet to your bank securely.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WithdrawPage,
});

const NGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 2,
});

function WithdrawPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<NavKey>("wallet");
  const { session } = useSession();
  const profile = useProfile(session?.user.id);
  const balance = Number(profile.data?.balance ?? 0);

  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [benefit, setBenefit] = useState<RpcBenefit | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const numericAmount = Number(amount || 0);
  const valid =
    numericAmount > 0 &&
    numericAmount <= balance &&
    bank.trim().length > 1 &&
    accountNumber.trim().length >= 10 &&
    accountName.trim().length > 2 &&
    !!benefit;

  function onNav(k: NavKey) {
    setTab(k);
    if (k === "home" || k === "wallet") navigate({ to: "/dashboard" });
    if (k === "activity") navigate({ to: "/activity" });
    if (k === "support") navigate({ to: "/support" });
    if (k === "profile") navigate({ to: "/profile" });
  }

  function submit() {
    if (!valid) return;
    setSubmitting(true);
    setMessage("");
    setTimeout(() => {
      setSubmitting(false);
      setMessage(
        `Withdrawal of ${NGN.format(numericAmount)} to ${bank} is being processed. You'll be notified shortly.`,
      );
    }, 1600);
  }

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden pb-28">
      <PageHeader title="Withdraw" subtitle="Cash out to your bank account" />

      <main className="mx-auto w-full max-w-md px-4">
        {/* Balance */}
        <section className="gradient-red rise-in mt-4 rounded-3xl p-5 text-primary-foreground">
          <p className="flex items-center gap-2 text-xs opacity-90">
            <Wallet className="size-4" /> Available balance
          </p>
          <p className="mt-1 text-3xl font-black tracking-tight">
            {profile.isLoading ? "…" : NGN.format(balance)}
          </p>
        </section>

        {/* Amount */}
        <section className="mt-6">
          <h2 className="px-1 text-sm font-semibold">Amount</h2>
          <div className="glass-card mt-3 rounded-3xl p-4">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-3 focus-within:border-primary/70">
              <Banknote className="size-[18px] shrink-0 text-primary" strokeWidth={1.75} />
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                inputMode="decimal"
                placeholder="0.00"
                aria-label="Withdrawal amount"
                className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[5000, 10000, 25000, 50000].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-transform active:scale-95"
                >
                  {NGN.format(v)}
                </button>
              ))}
            </div>
            {numericAmount > balance ? (
              <p className="mt-2 text-xs text-destructive">Amount exceeds your balance.</p>
            ) : null}
          </div>
        </section>

        {/* Bank details */}
        <section className="mt-6">
          <h2 className="px-1 text-sm font-semibold">Bank Details</h2>
          <div className="glass-card mt-3 space-y-3 rounded-3xl p-4">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-3 focus-within:border-primary/70">
              <Landmark className="size-[18px] shrink-0 text-primary" strokeWidth={1.75} />
              <input
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="Bank name"
                aria-label="Bank name"
                className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric"
              placeholder="Account number"
              aria-label="Account number"
              className="h-12 w-full rounded-2xl border border-border bg-secondary/50 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/70"
            />
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Account name"
              aria-label="Account name"
              className="h-12 w-full rounded-2xl border border-border bg-secondary/50 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/70"
            />
          </div>
        </section>

        {/* RPC code */}
        <RpcCodeInput benefit={benefit} onChange={setBenefit} />

        <p className="mt-4 flex items-start gap-2 px-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-primary" />
          A valid RPC code is required to authorise every withdrawal.
        </p>

        <button
          onClick={submit}
          disabled={!valid || submitting}
          className="gradient-red mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-45"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Confirm Withdrawal
        </button>

        {message ? (
          <p className="mt-3 rounded-2xl bg-primary/10 px-3 py-2.5 text-xs font-medium text-primary">
            {message}
          </p>
        ) : null}
      </main>

      <BottomNav active={tab} onChange={onNav} />
    </div>
  );
}
