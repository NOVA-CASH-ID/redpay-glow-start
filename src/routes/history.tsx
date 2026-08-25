import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  SlidersHorizontal,
  ReceiptText,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Gift,
  ShoppingBag,
  X,
} from "lucide-react";
import { BottomNav, type NavKey } from "@/components/redpay/BottomNav";
import { useSession, useTransactions, formatNaira } from "@/hooks/useRedpay";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Transaction History — REDPAY" },
      {
        name: "description",
        content: "Review every REDPAY top up, purchase, transfer, withdrawal and referral reward.",
      },
      { property: "og:title", content: "Transaction History — REDPAY" },
      {
        property: "og:description",
        content: "All your REDPAY transactions in one premium, filterable timeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

type Cat = "all" | "topup" | "purchase" | "transfer" | "withdraw";

const CATS: { key: Cat; label: string }[] = [
  { key: "all", label: "All" },
  { key: "topup", label: "Top Up" },
  { key: "purchase", label: "Purchase" },
  { key: "transfer", label: "Transfer" },
  { key: "withdraw", label: "Withdraw" },
];

type Item = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  amount: number;
  status: string;
  cat: Cat;
};

const DEMO: Item[] = [
  {
    id: "d1",
    title: "RPC Code Purchase",
    description: "RPC-4821-9930",
    created_at: iso(0, 10, 30),
    amount: -3500,
    status: "completed",
    cat: "purchase",
  },
  {
    id: "d2",
    title: "Wallet Top Up",
    description: "Wallet funding",
    created_at: iso(0, 9, 15),
    amount: 25000,
    status: "completed",
    cat: "topup",
  },
  {
    id: "d3",
    title: "Airtime Purchase",
    description: "Airtime purchase",
    created_at: iso(1, 20, 45),
    amount: -2000,
    status: "completed",
    cat: "purchase",
  },
  {
    id: "d4",
    title: "Withdrawal",
    description: "Bank withdrawal",
    created_at: iso(1, 16, 20),
    amount: -15000,
    status: "processing",
    cat: "withdraw",
  },
  {
    id: "d5",
    title: "Referral Bonus",
    description: "Referral reward",
    created_at: iso(1, 11, 30),
    amount: 1500,
    status: "completed",
    cat: "transfer",
  },
];

function iso(daysAgo: number, h: number, m: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function classify(type: string, amount: number): Cat {
  const t = (type || "").toLowerCase();
  if (t.includes("withdraw")) return "withdraw";
  if (t.includes("transfer") || t.includes("referral") || t.includes("bonus")) return "transfer";
  if (t.includes("purchase") || t.includes("buy") || t.includes("rpc") || t.includes("data"))
    return "purchase";
  if (t.includes("top") || t.includes("fund") || t.includes("deposit") || t.includes("credit"))
    return "topup";
  return amount >= 0 ? "topup" : "purchase";
}

function iconFor(cat: Cat) {
  if (cat === "topup") return Wallet;
  if (cat === "withdraw") return ArrowUpRight;
  if (cat === "transfer") return Gift;
  return ShoppingBag;
}

function relativeDay(d: Date) {
  const now = new Date();
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (same(d, now)) return "Today";
  if (same(d, y)) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function stamp(iso: string) {
  const d = new Date(iso);
  return `${relativeDay(d)}, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("pend") || s.includes("process")) return "bg-orange-500/15 text-orange-400";
  if (s.includes("fail") || s.includes("declин") || s.includes("declin"))
    return "bg-destructive/15 text-destructive";
  return "bg-emerald-500/15 text-emerald-400";
}

function HistoryPage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const userId = session?.user.id;
  const tx = useTransactions(userId);

  const [tab, setTab] = useState<NavKey>("activity");
  const [cat, setCat] = useState<Cat>("all");
  const [seeAll, setSeeAll] = useState(false);
  const [range, setRange] = useState<"month" | "week" | "all">("month");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login", replace: true });
  }, [loading, session, navigate]);

  const items: Item[] = useMemo(() => {
    const rows = tx.data ?? [];
    if (rows.length === 0) return DEMO;
    return rows.map((t) => ({
      id: t.id,
      title: t.description || t.type,
      description: t.type,
      created_at: t.created_at,
      amount: Number(t.amount),
      status: t.status,
      cat: classify(t.type, Number(t.amount)),
    }));
  }, [tx.data]);

  const inRange = useMemo(() => {
    if (range === "all") return items;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (range === "week" ? 7 : 30));
    return items.filter((i) => new Date(i.created_at) >= cutoff);
  }, [items, range]);

  const filtered = useMemo(
    () => (cat === "all" ? inRange : inRange.filter((i) => i.cat === cat)),
    [inRange, cat],
  );
  const visible = seeAll ? filtered : filtered.slice(0, 5);

  function onNav(k: NavKey) {
    setTab(k);
    if (k === "home") navigate({ to: "/dashboard" });
    if (k === "support") navigate({ to: "/support" });
    if (k === "profile") navigate({ to: "/profile" });
    if (k === "wallet") navigate({ to: "/dashboard" });
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
            History
          </h1>
          <button
            onClick={() => setFilterOpen(true)}
            aria-label="Filter transactions"
            className="grid size-10 place-items-center rounded-2xl border border-primary/40 bg-secondary/60 transition-transform active:scale-90"
          >
            <SlidersHorizontal className="size-[18px]" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mx-auto w-full max-w-md overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2">
            {CATS.map((c) => {
              const on = c.key === cat;
              return (
                <button
                  key={c.key}
                  onClick={() => setCat(c.key)}
                  className={cn(
                    "relative rounded-full px-4 py-1.5 text-xs font-semibold transition-all active:scale-95",
                    on
                      ? "gradient-red glow-red text-primary-foreground"
                      : "border border-border bg-secondary/50 text-muted-foreground",
                  )}
                >
                  {c.label}
                  {on ? (
                    <span className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-primary-glow" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-4">
        <section className="glass-card relative overflow-hidden rounded-3xl p-5">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-primary/25 blur-3xl"
          />
          <div className="relative flex items-center gap-4">
            <span className="gradient-red glow-red grid size-12 shrink-0 place-items-center rounded-2xl text-primary-foreground">
              <ReceiptText className="size-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Total Transactions
              </p>
              <p className="text-3xl font-black tracking-tight">{filtered.length}</p>
            </div>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as typeof range)}
              aria-label="Date range"
              className="shrink-0 rounded-xl border border-border bg-secondary/60 px-2.5 py-2 text-xs font-medium outline-none"
            >
              <option value="month">This Month</option>
              <option value="week">This Week</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="text-sm font-semibold">Recent Transactions</h2>
            <button
              onClick={() => setSeeAll((v) => !v)}
              className="text-xs font-semibold text-primary transition-transform active:scale-95"
            >
              {seeAll ? "Show Less" : "See All →"}
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {visible.length === 0 ? (
              <div className="glass-card rounded-3xl p-8 text-center">
                <p className="text-sm font-semibold">Nothing here yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No {CATS.find((c) => c.key === cat)?.label.toLowerCase()} transactions for this
                  period.
                </p>
              </div>
            ) : (
              visible.map((t) => {
                const Icon = iconFor(t.cat);
                const positive = t.amount >= 0;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="glass-card flex w-full items-center gap-3 rounded-3xl p-4 text-left transition-all duration-300 active:scale-[0.98] active:border-primary/60"
                  >
                    <span
                      className={cn(
                        "grid size-11 shrink-0 place-items-center rounded-full",
                        positive
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-primary/15 text-primary",
                      )}
                    >
                      {positive ? (
                        <ArrowDownLeft className="size-5" strokeWidth={1.75} />
                      ) : (
                        <Icon className="size-5" strokeWidth={1.75} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{t.description}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {stamp(t.created_at)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          "text-sm font-bold",
                          positive ? "text-emerald-400" : "text-foreground",
                        )}
                      >
                        {positive ? "+ " : "- "}
                        {formatNaira(Math.abs(t.amount))}
                      </p>
                      <span
                        className={cn(
                          "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                          statusTone(t.status),
                        )}
                      >
                        {t.status}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </main>

      {filterOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm"
          onClick={() => setFilterOpen(false)}
        >
          <div
            className="glass-card mx-auto w-full max-w-md rounded-t-3xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Filter transactions</p>
              <button onClick={() => setFilterOpen(false)} aria-label="Close filters">
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-4 text-xs font-semibold text-muted-foreground">Date range</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["week", "month", "all"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "rounded-2xl px-3 py-2 text-xs font-semibold transition-all",
                    range === r
                      ? "gradient-red text-primary-foreground"
                      : "border border-border bg-secondary/50 text-muted-foreground",
                  )}
                >
                  {r === "week" ? "7 days" : r === "month" ? "30 days" : "All time"}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs font-semibold text-muted-foreground">Transaction type</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCat(c.key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                    cat === c.key
                      ? "gradient-red text-primary-foreground"
                      : "border border-border bg-secondary/50 text-muted-foreground",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setFilterOpen(false)}
              className="gradient-red glow-red mt-5 h-12 w-full rounded-2xl text-sm font-bold text-primary-foreground transition-transform active:scale-95"
            >
              Apply filters
            </button>
          </div>
        </div>
      ) : null}

      {selected ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="glass-card w-full max-w-md rounded-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-bold">{selected.title}</p>
                <p className="truncate text-xs text-muted-foreground">{selected.description}</p>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close details">
                <X className="size-5" />
              </button>
            </div>
            <p
              className={cn(
                "mt-5 text-3xl font-black",
                selected.amount >= 0 ? "text-emerald-400" : "text-foreground",
              )}
            >
              {selected.amount >= 0 ? "+ " : "- "}
              {formatNaira(Math.abs(selected.amount))}
            </p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                    statusTone(selected.status),
                  )}
                >
                  {selected.status}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="font-medium">{stamp(selected.created_at)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium capitalize">{selected.cat}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Reference</dt>
                <dd className="truncate font-mono text-xs">{selected.id}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}

      <BottomNav active={tab} onChange={onNav} />
    </div>
  );
}
