import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { AdminShell, SettingsCard, Field, SaveButton } from "@/components/admin/AdminShell";
import {
  useAdminWithdrawals,
  useAdminSettings,
  saveSetting,
  maskAccount,
  type AdminWithdrawal,
} from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/withdrawals")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Withdrawals — REDPAY" },
      { name: "description", content: "Review and approve REDPAY withdrawal requests." },
      { property: "og:title", content: "Admin Withdrawals — REDPAY" },
      { property: "og:description", content: "Manage REDPAY payout requests and the withdrawal amount." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminWithdrawalsPage,
});

const NGN = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const FILTERS = ["all", "pending", "processing", "approved", "rejected", "completed"] as const;

function AdminWithdrawalsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const list = useAdminWithdrawals(status);
  const settings = useAdminSettings();
  const withdrawal = (settings.data?.['withdrawal'] ?? {}) as Record<string, string | number>;

  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!settings.data) return;
    setAmount(String(withdrawal['amount'] ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.data]);

  async function saveAmount() {
    setSaving(true);
    setMessage("");
    try {
      const n = Number(amount);
      if (!Number.isFinite(n) || n <= 0) throw new Error("Enter a valid amount");
      await saveSetting("withdrawal", { ...withdrawal, amount: n });
      await queryClient.invalidateQueries();
      setMessage("Withdrawal amount updated on the REDPAY website.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save");
    }
    setSaving(false);
  }

  async function review(w: AdminWithdrawal, next: string) {
    if (!window.confirm(`Mark this withdrawal as ${next}?`)) return;
    setBusy(w.id + next);
    setError("");
    const { data, error: err } = await supabase.rpc("admin_review_withdrawal", {
      _withdrawal_id: w.id,
      _status: next,
      _note: null,
    });
    const res = (data ?? {}) as { ok?: boolean; error?: string };
    setBusy("");
    if (err || !res.ok) {
      setError(err?.message ?? res.error ?? "Could not update withdrawal");
      return;
    }
    await queryClient.invalidateQueries();
  }

  const rows = list.data ?? [];

  return (
    <AdminShell>
      <SettingsCard title="Withdrawal amount">
        <Field label="Current withdrawal amount (NGN)" value={amount} onChange={setAmount} placeholder="50000" />
        <SaveButton onClick={saveAmount} saving={saving} message={message} />
      </SettingsCard>

      <section className="mt-6">
        <h2 className="px-1 text-sm font-bold">Withdrawal requests</h2>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs font-semibold capitalize",
                status === f ? "gradient-red text-primary-foreground" : "border border-border bg-secondary/60",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-3 rounded-2xl bg-destructive/10 px-3 py-2.5 text-xs text-destructive">{error}</p>
        ) : null}

        {list.isLoading ? (
          <div className="mt-6 grid place-items-center">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <div className="glass-card mt-4 grid h-32 place-items-center rounded-3xl text-sm text-muted-foreground">
            No withdrawals match your filters
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {rows.map((w) => (
              <li key={w.id} className="glass-card rounded-3xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{w.full_name || "Unnamed user"}</p>
                    <p className="truncate text-xs text-muted-foreground">{w.email ?? "—"}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{w.account_id ?? w.user_id}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black">{NGN.format(Number(w.amount))}</p>
                    <p className="text-[11px] capitalize text-muted-foreground">{w.status}</p>
                  </div>
                </div>
                <p className="mt-2 truncate text-[11px] text-muted-foreground">
                  {w.bank_name} · {maskAccount(w.account_number)} · {w.account_name}
                </p>
                <p className="text-[11px] text-muted-foreground">{new Date(w.created_at).toLocaleString()}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["approved", "completed", "rejected"] as const).map((next) => (
                    <button
                      key={next}
                      disabled={busy !== "" || w.status === next || w.status === "rejected" || w.status === "completed"}
                      onClick={() => review(w, next)}
                      className={cn(
                        "flex h-10 items-center gap-1.5 rounded-full px-4 text-xs font-bold capitalize disabled:opacity-45",
                        next === "rejected"
                          ? "border border-border bg-secondary/60"
                          : "gradient-red text-primary-foreground",
                      )}
                    >
                      {busy === w.id + next ? <Loader2 className="size-4 animate-spin" /> : null}
                      {next}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
