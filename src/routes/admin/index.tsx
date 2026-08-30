import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Activity,
  Clock,
  Wallet,
  CheckCircle2,
  XCircle,
  Ban,
  Crown,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminStats, useAdminPayments, type AdminPayment } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Dashboard — REDPAY" },
      { name: "description", content: "REDPAY control panel: users, payments and platform stats." },
      { property: "og:title", content: "Admin Dashboard — REDPAY" },
      { property: "og:description", content: "Review payments and monitor REDPAY activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDashboard,
});

const NGN = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const STATUSES = ["all", "pending", "approved", "rejected"] as const;

function AdminDashboard() {
  const queryClient = useQueryClient();
  const stats = useAdminStats();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const payments = useAdminPayments(search, status);
  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState("");
  const [proof, setProof] = useState<string | null>(null);

  const s = stats.data ?? {};
  const cards = [
    { icon: Users, label: "Total Users", value: s['total_users'] ?? 0 },
    { icon: Activity, label: "Active (7d)", value: s['active_7d'] ?? 0 },
    { icon: Clock, label: "Pending", value: s['pending'] ?? 0 },
    { icon: Wallet, label: "Paid", value: NGN.format(Number(s['paid_naira'] ?? 0)) },
    { icon: CheckCircle2, label: "Approved", value: s['approved'] ?? 0 },
    { icon: XCircle, label: "Rejected", value: s['rejected'] ?? 0 },
    { icon: Ban, label: "Banned", value: s['banned'] ?? 0 },
    { icon: Crown, label: "Upgrades", value: s['upgrades'] ?? 0 },
  ];

  async function review(p: AdminPayment, next: "approved" | "rejected") {
    setBusy(p.id + next);
    setError("");
    const { data, error: err } = await supabase.rpc("admin_review_payment", {
      _payment_id: p.id,
      _status: next,
      _note: "",
    });
    const res = (data ?? {}) as { ok?: boolean; error?: string };
    setBusy("");
    if (err || !res.ok) {
      setError(err?.message ?? res.error ?? "Could not update payment");
      return;
    }
    await queryClient.invalidateQueries();
  }

  async function viewProof(path: string | null) {
    if (!path) return;
    const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 300);
    if (data?.signedUrl) setProof(data.signedUrl);
  }

  return (
    <AdminShell>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="glass-card rounded-3xl p-4">
            <span className="grid size-11 place-items-center rounded-full bg-primary/12 text-primary">
              <c.icon className="size-5" strokeWidth={1.9} />
            </span>
            <p className="mt-3 text-[11px] font-medium text-muted-foreground">{c.label}</p>
            <p className="truncate text-xl font-black tracking-tight">
              {stats.isLoading ? "…" : String(c.value)}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-6">
        <h2 className="px-1 text-sm font-bold">Payments</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user, email"
          className="mt-3 h-12 w-full rounded-2xl border border-border bg-secondary/50 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/70"
        />
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs font-semibold capitalize",
                status === st
                  ? "gradient-red text-primary-foreground"
                  : "border border-border bg-secondary/60",
              )}
            >
              {st}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-3 rounded-2xl bg-destructive/10 px-3 py-2.5 text-xs text-destructive">{error}</p>
        ) : null}

        {payments.isLoading ? (
          <div className="mt-6 grid place-items-center">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : (payments.data ?? []).length === 0 ? (
          <div className="glass-card mt-4 grid h-32 place-items-center rounded-3xl text-sm text-muted-foreground">
            No payments match your filters
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {(payments.data ?? []).map((p) => (
              <li key={p.id} className="glass-card rounded-3xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{p.full_name || "Unnamed user"}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.email ?? "—"}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      ID {p.account_id ?? p.user_id ?? "—"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black">{NGN.format(Number(p.amount))}</p>
                    <p className="text-[11px] capitalize text-muted-foreground">{p.status}</p>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {new Date(p.created_at).toLocaleString()}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.screenshot_path ? (
                    <button
                      onClick={() => viewProof(p.screenshot_path)}
                      className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-4 text-xs font-semibold"
                    >
                      <ImageIcon className="size-4" /> Receipt
                    </button>
                  ) : null}
                  <button
                    disabled={busy !== "" || p.status === "approved"}
                    onClick={() => review(p, "approved")}
                    className="gradient-red flex h-10 items-center gap-1.5 rounded-full px-4 text-xs font-bold text-primary-foreground disabled:opacity-45"
                  >
                    {busy === p.id + "approved" ? <Loader2 className="size-4 animate-spin" /> : null}
                    Approve
                  </button>
                  <button
                    disabled={busy !== "" || p.status === "rejected"}
                    onClick={() => review(p, "rejected")}
                    className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-4 text-xs font-semibold disabled:opacity-45"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {proof ? (
        <button
          onClick={() => setProof(null)}
          className="fixed inset-0 z-50 grid place-items-center bg-background/90 p-6"
        >
          <img src={proof} alt="Payment receipt" className="max-h-[80dvh] w-auto rounded-2xl" />
        </button>
      ) : null}
    </AdminShell>
  );
}
