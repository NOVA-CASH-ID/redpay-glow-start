import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Activity as ActivityIcon, ArrowDownLeft, ArrowUpRight, AlertCircle } from "lucide-react";
import { BottomNav, type NavKey } from "@/components/redpay/BottomNav";
import { useSession, useTransactions, formatNaira } from "@/hooks/useRedpay";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/activity")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Activity — REDPAY" },
      {
        name: "description",
        content: "A live feed of your REDPAY account activity: money in, money out and pending items.",
      },
      { property: "og:title", content: "Activity — REDPAY" },
      { property: "og:description", content: "Track everything happening on your REDPAY wallet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const userId = session?.user.id;
  const tx = useTransactions(userId);
  const [tab, setTab] = useState<NavKey>("activity");

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login", replace: true });
  }, [loading, session, navigate]);

  const rows = tx.data ?? [];
  const { inflow, outflow, pending } = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    let pending = 0;
    for (const r of rows) {
      const a = Number(r.amount);
      if (a >= 0) inflow += a;
      else outflow += Math.abs(a);
      if (/pend|process/i.test(r.status)) pending += 1;
    }
    return { inflow, outflow, pending };
  }, [rows]);

  function onNav(k: NavKey) {
    setTab(k);
    if (k === "home" || k === "wallet") navigate({ to: "/dashboard" });
    if (k === "support") navigate({ to: "/support" });
    if (k === "profile") navigate({ to: "/profile" });
  }

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden">
      <header
        className="glass-card sticky top-0 z-30 rounded-none border-x-0 border-t-0"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto grid w-full max-w-md grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            aria-label="Back to dashboard"
            className="grid size-10 place-items-center rounded-2xl border border-primary/40 bg-secondary/60 transition-transform active:scale-90"
          >
            <ArrowLeft className="size-[18px]" strokeWidth={1.75} />
          </button>
          <h1 className="truncate text-center text-lg font-black tracking-tight text-glow">
            Activity
          </h1>
          <span className="grid size-10 place-items-center rounded-2xl border border-primary/40 bg-secondary/60 text-primary">
            <ActivityIcon className="size-[18px]" strokeWidth={1.75} />
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-4">
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: "Money In", value: formatNaira(inflow), tone: "text-emerald-400" },
            { label: "Money Out", value: formatNaira(outflow), tone: "text-primary" },
            { label: "Pending", value: String(pending), tone: "text-orange-400" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-3">
              <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
              <p className={cn("mt-1 truncate text-sm font-black", s.tone)}>{s.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
            <Link to="/history" className="text-xs font-semibold text-primary">
              Full history →
            </Link>
          </div>

          <div className="glass-card mt-3 rounded-3xl p-4">
            {tx.isLoading ? (
              <div className="space-y-3">
                <div className="h-10 animate-pulse rounded-xl bg-secondary/70" />
                <div className="h-10 animate-pulse rounded-xl bg-secondary/70" />
              </div>
            ) : tx.isError ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="size-4 text-destructive" /> Couldn't load activity.
              </p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet — your transactions will show up here.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((t) => {
                  const positive = Number(t.amount) >= 0;
                  return (
                    <li key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-xl",
                          positive
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-primary/15 text-primary",
                        )}
                      >
                        {positive ? (
                          <ArrowDownLeft className="size-4" strokeWidth={1.75} />
                        ) : (
                          <ArrowUpRight className="size-4" strokeWidth={1.75} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.description || t.type}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(t.created_at).toLocaleString()} · {t.status}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-sm font-semibold",
                          positive ? "text-emerald-400" : "text-foreground",
                        )}
                      >
                        {positive ? "+ " : "- "}
                        {formatNaira(Math.abs(Number(t.amount)))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>

      <BottomNav active={tab} onChange={onNav} />
    </div>
  );
}
