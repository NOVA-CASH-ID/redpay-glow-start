import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  Eye,
  EyeOff,
  Gift,
  Send,
  ShoppingBag,
  Radio,
  Users,
  History,
  Headphones,
  UserRound,
  AlertCircle,
  LogOut,
  Loader2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { RedpayLogo } from "@/components/redpay/Logo";
import { BottomNav, type NavKey } from "@/components/redpay/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import {
  useSession,
  useProfile,
  useTransactions,
  useNotifications,
  useAnnouncements,
  formatNaira,
} from "@/hooks/useRedpay";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard — REDPAY" },
      {
        name: "description",
        content: "Your REDPAY wallet balance, quick actions and latest updates.",
      },
      { property: "og:title", content: "Dashboard — REDPAY" },
      { property: "og:description", content: "Manage your REDPAY wallet and payments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const QUICK_ACTIONS = [
  { icon: ShoppingBag, label: "Buy RPC", to: "/rpc-loading" },
  { icon: Radio, label: "Broadcast", to: "/buy-rpc" },
  { icon: Gift, label: "Refer & Earn", to: "/refer" },
  { icon: Users, label: "Community", to: "/refer" },
  { icon: History, label: "History", to: undefined },
  { icon: Headphones, label: "Support", to: undefined },
] as const;

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const ms = target.getTime() - now;
  if (ms <= 0) return null;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-secondary/70", className)} />;
}

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const profile = useProfile(userId);
  const tx = useTransactions(userId);
  const notifications = useNotifications(userId);
  const announcements = useAnnouncements();

  const [hidden, setHidden] = useState(false);
  const [tab, setTab] = useState<NavKey>("home");
  const [slide, setSlide] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && !session) navigate({ to: "/login", replace: true });
  }, [sessionLoading, session, navigate]);

  const slides = announcements.data ?? [];
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 3000);
    return () => clearInterval(t);
  }, [slides.length]);

  const unread = (notifications.data ?? []).filter((n) => !n.read).length;
  const initials =
    ((profile.data?.first_name?.[0] ?? "") + (profile.data?.last_name?.[0] ?? "")).toUpperCase() ||
    (session?.user.email?.[0]?.toUpperCase() ?? "R");

  const nextClaimAt = profile.data?.last_claim_at
    ? new Date(new Date(profile.data.last_claim_at).getTime() + 30 * 60 * 1000)
    : null;
  const countdown = useCountdown(nextClaimAt);

  async function claim() {
    if (claiming || countdown) return;
    setClaiming(true);
    setClaimMsg(null);
    const { data, error } = await supabase.rpc("claim_bonus");
    const res = (data ?? {}) as { ok?: boolean; error?: string; amount?: number };
    setClaiming(false);
    if (error || !res.ok) {
      setClaimMsg(error?.message ?? res.error ?? "Claim not available right now.");
    } else {
      setClaimMsg(`${formatNaira(res.amount)} added to your wallet 🎉`);
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
      queryClient.invalidateQueries({ queryKey: ["transactions", userId] }),
    ]);
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden">
      <header
        className="glass-card sticky top-0 z-30 rounded-none border-x-0 border-t-0"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto grid w-full max-w-md grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <RedpayLogo size={34} />
            <span className="truncate text-lg font-bold tracking-tight">
              Red<span className="text-primary">Pay</span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
              className="relative grid size-10 place-items-center rounded-full border border-border bg-secondary/60 transition-transform active:scale-90"
            >
              <Bell className="size-[18px] text-foreground" strokeWidth={1.75} />
              {unread > 0 ? (
                <span className="gradient-red absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold text-primary-foreground">
                  {unread}
                </span>
              ) : null}
            </button>
            <button
              onClick={signOut}
              aria-label="Account"
              className="gradient-red glow-red grid size-10 place-items-center rounded-full text-sm font-bold text-primary-foreground transition-transform active:scale-90"
            >
              {profile.isLoading ? <UserRound className="size-4" /> : initials}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-4">
        {/* Balance card */}
        <section className="gradient-red glow-red relative overflow-hidden rounded-3xl p-5 text-primary-foreground">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-white/15 blur-2xl"
          />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-widest opacity-85">
                Total Balance
              </p>
              <button
                onClick={() => setHidden((h) => !h)}
                aria-label={hidden ? "Show balance" : "Hide balance"}
                className="grid size-8 shrink-0 place-items-center rounded-full bg-white/20 transition-transform active:scale-90"
              >
                {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {profile.isLoading ? (
              <Skeleton className="mt-2 h-10 w-40 bg-white/25" />
            ) : profile.isError ? (
              <p className="mt-2 flex items-center gap-2 text-sm">
                <AlertCircle className="size-4" /> Couldn't load balance
              </p>
            ) : (
              <p className="mt-1.5 text-4xl font-black tracking-tight">
                {hidden ? "••••••" : formatNaira(profile.data?.balance)}
              </p>
            )}

            <p className="mt-1.5 text-xs opacity-85">
              ID:{" "}
              {profile.isLoading ? "…" : hidden ? "••••••" : (profile.data?.account_id ?? "—")}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={claim}
                disabled={claiming || !!countdown}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/20 text-sm font-semibold backdrop-blur-sm transition-transform active:scale-95 disabled:opacity-70"
              >
                {claiming ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Gift className="size-4" />
                )}
                {countdown ? countdown : "Claim"}
              </button>
              <button className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-background/85 text-sm font-semibold text-foreground transition-transform active:scale-95">
                <Send className="size-4 text-primary" /> Withdraw
              </button>
            </div>

            {claimMsg ? <p className="mt-2.5 text-center text-xs opacity-90">{claimMsg}</p> : null}
          </div>
        </section>

        {/* Quick actions */}
        <section className="mt-6">
          <h2 className="px-1 text-sm font-semibold">Quick Actions</h2>
          <div className="mt-3 grid grid-cols-3 gap-3 max-[340px]:grid-cols-2">
            {QUICK_ACTIONS.map(({ icon: Icon, label, to }) => {
              const inner = (
                <>
                  <span className="grid size-11 place-items-center rounded-xl border border-border bg-secondary/70 text-primary transition-colors group-active:bg-primary group-active:text-primary-foreground">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="truncate text-[11px] font-medium leading-tight">{label}</span>
                </>
              );
              const cls =
                "glass-card group flex flex-col items-center gap-2 rounded-2xl px-2 py-3.5 transition-all active:scale-95 active:border-primary/60";
              return to ? (
                <Link key={label} to={to} className={cls}>
                  {inner}
                </Link>
              ) : (
                <button key={label} className={cls}>
                  {inner}
                </button>
              );
            })}
          </div>
        </section>

        {/* Announcements */}
        <section className="mt-6">
          <h2 className="px-1 text-sm font-semibold">Latest Updates</h2>
          {announcements.isLoading ? (
            <Skeleton className="mt-3 h-28 w-full" />
          ) : announcements.isError ? (
            <p className="glass-card mt-3 flex items-center gap-2 rounded-2xl p-4 text-sm text-muted-foreground">
              <AlertCircle className="size-4 text-destructive" /> Updates unavailable right now.
            </p>
          ) : slides.length === 0 ? (
            <p className="glass-card mt-3 rounded-2xl p-4 text-sm text-muted-foreground">
              No updates yet.
            </p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-3xl">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${slide * 100}%)` }}
              >
                {slides.map((a) => (
                  <article key={a.id} className="w-full shrink-0 px-0.5">
                    <div className="glass-card h-full rounded-3xl p-4">
                      {a.image_url ? (
                        <img
                          src={a.image_url}
                          alt={a.title}
                          loading="lazy"
                          className="mb-3 h-28 w-full rounded-2xl object-cover"
                        />
                      ) : null}
                      <p className="text-sm font-semibold">{a.title}</p>
                      {a.subtitle ? (
                        <p className="mt-1 text-xs text-primary">{a.subtitle}</p>
                      ) : null}
                      {a.body ? (
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          {a.body}
                        </p>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
              <div className="mt-3 flex justify-center gap-1.5">
                {slides.map((a, i) => (
                  <button
                    key={a.id}
                    aria-label={`Show update ${i + 1}`}
                    onClick={() => setSlide(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === slide ? "gradient-red w-5" : "w-1.5 bg-muted",
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section className="mt-6">
          <h2 className="px-1 text-sm font-semibold">Recent Activity</h2>
          <div className="glass-card mt-3 rounded-3xl p-4">
            {tx.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : tx.isError ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="size-4 text-destructive" /> Couldn't load transactions.
              </p>
            ) : (tx.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transactions yet — your activity will appear here.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {tx.data!.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary/70 text-primary">
                      <History className="size-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.description || t.type}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()} · {t.status}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-sm font-semibold",
                        Number(t.amount) >= 0 ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {hidden ? "•••" : formatNaira(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <button
          onClick={signOut}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/50 text-sm font-medium text-muted-foreground transition-transform active:scale-95"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
