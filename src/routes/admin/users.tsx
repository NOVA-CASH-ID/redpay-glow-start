import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Ban, ShieldCheck, X } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminUsers, type AdminUser } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/users")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Users — REDPAY" },
      { name: "description", content: "Search, review and moderate REDPAY registered users." },
      { property: "og:title", content: "Admin Users — REDPAY" },
      { property: "og:description", content: "Manage REDPAY user accounts and ban status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminUsersPage,
});

const NGN = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const FILTERS = ["all", "active", "banned"] as const;

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(0);
  const users = useAdminUsers(search, status, page);
  const [detail, setDetail] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function setBan(u: AdminUser, banned: boolean) {
    const reason = banned ? (window.prompt("Reason (optional)") ?? "") : "";
    if (!window.confirm(`${banned ? "Ban" : "Unban"} ${u.email ?? u.account_id}?`)) return;
    setBusy(true);
    setError("");
    const { data, error: err } = await supabase.rpc("admin_set_ban", {
      _user_id: u.id,
      _banned: banned,
      _reason: reason || "",
    });
    const res = (data ?? {}) as { ok?: boolean; error?: string };
    setBusy(false);
    if (err || !res.ok) {
      setError(err?.message ?? res.error ?? "Could not update user");
      return;
    }
    setDetail(null);
    await queryClient.invalidateQueries();
  }

  const rows = users.data?.rows ?? [];
  const total = users.data?.total ?? 0;

  return (
    <AdminShell>
      <div className="glass-card rounded-3xl p-4">
        <p className="text-[11px] text-muted-foreground">Registered users</p>
        <p className="text-2xl font-black">{users.isLoading ? "…" : total}</p>
      </div>

      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        placeholder="Search name, email, phone or user ID"
        className="mt-4 h-12 w-full rounded-2xl border border-border bg-secondary/50 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/70"
      />

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => {
              setStatus(f);
              setPage(0);
            }}
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

      {users.isLoading ? (
        <div className="mt-6 grid place-items-center">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card mt-4 grid h-32 place-items-center rounded-3xl text-sm text-muted-foreground">
          No users match your filters
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((u) => (
            <li key={u.id} className="glass-card rounded-3xl p-4">
              <button onClick={() => setDetail(u)} className="w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {[u.first_name, u.last_name].filter(Boolean).join(" ") || "Unnamed user"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{u.email ?? "—"}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {u.account_id} · {u.phone ?? "no phone"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                      u.status === "banned" ? "bg-destructive/15 text-destructive" : "bg-primary/12 text-primary",
                    )}
                  >
                    {u.status === "banned" ? "Banned" : "Active"}
                  </span>
                </div>
              </button>
              <div className="mt-3 flex gap-2">
                <button
                  disabled={busy}
                  onClick={() => setBan(u, u.status !== "banned")}
                  className={cn(
                    "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-xs font-bold disabled:opacity-45",
                    u.status === "banned"
                      ? "border border-border bg-secondary/60"
                      : "gradient-red text-primary-foreground",
                  )}
                >
                  {u.status === "banned" ? <ShieldCheck className="size-4" /> : <Ban className="size-4" />}
                  {u.status === "banned" ? "Unban" : "Ban"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="h-10 rounded-full border border-border bg-secondary/60 px-4 text-xs font-semibold disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-[11px] text-muted-foreground">Page {page + 1}</span>
        <button
          disabled={(page + 1) * 20 >= total}
          onClick={() => setPage((p) => p + 1)}
          className="h-10 rounded-full border border-border bg-secondary/60 px-4 text-xs font-semibold disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {detail ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-background/80 sm:place-items-center">
          <div className="glass-card w-full max-w-md rounded-t-3xl p-5 sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-black">
                {[detail.first_name, detail.last_name].filter(Boolean).join(" ") || "User"}
              </h3>
              <button onClick={() => setDetail(null)} aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <dl className="mt-3 space-y-2 text-xs">
              {[
                ["User ID", detail.id],
                ["Account ID", detail.account_id ?? "—"],
                ["Email", detail.email ?? "—"],
                ["Phone", detail.phone ?? "—"],
                ["Country", detail.country ?? "—"],
                ["Balance", NGN.format(Number(detail.balance ?? 0))],
                ["Status", detail.status],
                ["Ban reason", detail.ban_reason ?? "—"],
                ["Registered", new Date(detail.created_at).toLocaleString()],
                ["Last seen", detail.last_seen_at ? new Date(detail.last_seen_at).toLocaleString() : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="max-w-[60%] truncate text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
