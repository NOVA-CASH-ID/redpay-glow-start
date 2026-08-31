import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPurchases } from "@/hooks/useAdmin";

export const Route = createFileRoute("/admin/purchases")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Purchases — REDPAY" },
      { name: "description", content: "Review every RPC, airtime and data purchase made on REDPAY." },
      { property: "og:title", content: "Admin Purchases — REDPAY" },
      { property: "og:description", content: "All REDPAY code and airtime purchases in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPurchasesPage,
});

const NGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function AdminPurchasesPage() {
  const [search, setSearch] = useState("");
  const purchases = useAdminPurchases(search);
  const rows = purchases.data ?? [];

  return (
    <AdminShell>
      <section>
        <h2 className="px-1 text-sm font-bold">Purchases ({rows.length})</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user, email, network, phone"
          className="mt-3 h-12 w-full rounded-2xl border border-border bg-secondary/50 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/70"
        />

        {purchases.isLoading ? (
          <div className="mt-6 grid place-items-center">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <div className="glass-card mt-4 grid h-32 place-items-center rounded-3xl text-sm text-muted-foreground">
            No purchases match your search
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {rows.map((p) => (
              <li key={p.id} className="glass-card rounded-3xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold">
                      <ShoppingBag className="size-4 shrink-0 text-primary" />
                      {p.network} · {p.card_type}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.full_name || "Unnamed user"} · {p.email ?? "—"}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      ID {p.account_id ?? p.user_id ?? "—"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black">{NGN.format(Number(p.total))}</p>
                    <p className="text-[11px] capitalize text-muted-foreground">{p.status}</p>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <dt className="text-muted-foreground">Plan</dt>
                    <dd className="truncate font-medium">{p.plan_label || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="truncate font-medium">{p.phone || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Unit × Qty</dt>
                    <dd className="font-medium">
                      {NGN.format(Number(p.denomination))} × {p.quantity}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">RPC code</dt>
                    <dd className="truncate font-medium">{p.rpc_code || "—"}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {new Date(p.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
