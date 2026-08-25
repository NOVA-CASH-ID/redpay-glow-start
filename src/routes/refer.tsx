import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Gift,
  Copy,
  Check,
  Send,
  MessageCircle,
  Users,
  TrendingUp,
  Wallet,
  History,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/redpay/PageHeader";
import { BottomNav, type NavKey } from "@/components/redpay/BottomNav";
import {
  useSession,
  useProfile,
  useNotifications,
  useTransactions,
  formatNaira,
} from "@/hooks/useRedpay";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/refer")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Refer & Earn — REDPAY" },
      {
        name: "description",
        content:
          "Invite friends to REDPAY, join our Telegram and WhatsApp groups and earn cash rewards.",
      },
      { property: "og:title", content: "Refer & Earn — REDPAY" },
      {
        property: "og:description",
        content: "Share your REDPAY referral link and earn rewards for every friend.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Refer,
});

type Channel = "telegram" | "whatsapp";

function useReferralRewards(userId?: string) {
  return useQuery({
    queryKey: ["referral_rewards", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_rewards")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useAppConfig() {
  return useQuery({
    queryKey: ["app_config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_config").select("*");
      if (error) throw error;
      const map: Record<string, Record<string, unknown>> = {};
      for (const row of data ?? []) map[row.key] = (row.value ?? {}) as Record<string, unknown>;
      return map;
    },
  });
}

function Refer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading } = useSession();
  const userId = session?.user.id;

  const profile = useProfile(userId);
  const notifications = useNotifications(userId);
  const transactions = useTransactions(userId);
  const rewards = useReferralRewards(userId);
  const config = useAppConfig();

  const [tab, setTab] = useState<NavKey>("home");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<Channel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login", replace: true });
  }, [loading, session, navigate]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const code = profile.data?.referral_code ?? "";
  const link = origin && code ? `${origin}/?ref=${code}` : "";

  const referralCfg = config.data?.["referral"] ?? {};
  const amountFor = (c: Channel) => Number(referralCfg[`${c}_reward`] ?? 2500);
  const groupLink = (c: Channel) => String(referralCfg[`${c}_group`] ?? "");

  const rows = rewards.data ?? [];
  const rewardFor = (c: Channel) => rows.find((r) => r.channel === c);

  const verified = rows.filter((r) => r.status === "verified");
  const pending = rows.filter((r) => r.status !== "verified");
  const totalEarned = verified.reduce((s, r) => s + Number(r.amount), 0);
  const pendingTotal = pending.reduce((s, r) => s + Number(r.amount), 0);
  const referralTx = (transactions.data ?? []).filter((t) => t.type === "referral");

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Couldn't copy the link. Long-press to copy it manually.");
    }
  }

  function share(channel: Channel) {
    const text = `Join me on REDPAY and get a welcome bonus! ${link}`;
    const url =
      channel === "telegram"
        ? `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Join me on REDPAY and get a welcome bonus!")}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function joinGroup(channel: Channel) {
    setError(null);
    setBusy(channel);
    const { data, error: rpcError } = await supabase.rpc("start_group_reward", {
      _channel: channel,
    });
    const res = (data ?? {}) as { ok?: boolean; error?: string };
    setBusy(null);
    if (rpcError || !res.ok) {
      setError(rpcError?.message ?? res.error ?? "Couldn't start this reward.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["referral_rewards", userId] });
    const target = groupLink(channel);
    if (target) window.open(target, "_blank", "noopener,noreferrer");
  }

  async function verify(channel: Channel) {
    setError(null);
    setBusy(channel);
    const { data, error: rpcError } = await supabase.rpc("verify_group_reward", {
      _channel: channel,
    });
    const res = (data ?? {}) as { ok?: boolean; error?: string };
    setBusy(null);
    if (rpcError || !res.ok) {
      setError(rpcError?.message ?? res.error ?? "Verification failed.");
      return;
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["referral_rewards", userId] }),
      queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
      queryClient.invalidateQueries({ queryKey: ["transactions", userId] }),
    ]);
  }

  const stats = [
    { label: "Total Referrals", value: String(profile.data?.referral_count ?? 0), icon: Users },
    { label: "Active Referrals", value: String(verified.length), icon: TrendingUp },
    { label: "Total Earned", value: formatNaira(totalEarned), icon: Wallet },
  ];

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden">
      <PageHeader
        title="Refer & Earn"
        subtitle="Invite friends and earn rewards on every join"
        unread={(notifications.data ?? []).filter((n) => !n.read).length}
      />

      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-4">
        <section className="gradient-red glow-red relative overflow-hidden rounded-3xl p-5 text-primary-foreground">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-white/15 blur-2xl"
          />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Gift className="size-5" />
              <p className="text-xs font-medium uppercase tracking-widest opacity-85">
                Total Earnings
              </p>
            </div>
            <p className="mt-1.5 text-4xl font-black tracking-tight">{formatNaira(totalEarned)}</p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { k: "Available", v: formatNaira(profile.data?.balance) },
                { k: "Pending", v: formatNaira(pendingTotal) },
                { k: "Withdrawn", v: formatNaira(0) },
              ].map((i) => (
                <div key={i.k} className="rounded-2xl bg-white/15 px-2 py-2.5 backdrop-blur-sm">
                  <dt className="text-[10px] uppercase tracking-wide opacity-85">{i.k}</dt>
                  <dd className="mt-0.5 truncate text-sm font-bold">{i.v}</dd>
                </div>
              ))}
            </dl>
            <button className="mt-4 h-12 w-full rounded-2xl bg-background/85 text-sm font-semibold text-foreground transition-transform active:scale-95">
              Withdraw Earnings →
            </button>
          </div>
        </section>

        {error ? (
          <p className="glass-card mt-4 flex items-center gap-2 rounded-2xl p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </p>
        ) : null}

        <section className="mt-6">
          <h2 className="px-1 text-sm font-semibold">Your Referral Link</h2>
          <div className="glass-card mt-3 rounded-3xl p-4">
            <p className="truncate rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-xs text-muted-foreground">
              {link || "Loading your link…"}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                onClick={copyLink}
                className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-border bg-secondary/60 text-xs font-semibold transition-transform active:scale-95"
              >
                {copied ? (
                  <Check className="size-4 text-primary" />
                ) : (
                  <Copy className="size-4 text-primary" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => share("whatsapp")}
                className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-border bg-secondary/60 text-xs font-semibold transition-transform active:scale-95"
              >
                <MessageCircle className="size-4 text-primary" /> WhatsApp
              </button>
              <button
                onClick={() => share("telegram")}
                className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-border bg-secondary/60 text-xs font-semibold transition-transform active:scale-95"
              >
                <Send className="size-4 text-primary" /> Telegram
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="px-1 text-sm font-semibold">How You Earn</h2>
          <div className="mt-3 space-y-3">
            {(["telegram", "whatsapp"] as Channel[]).map((c) => {
              const r = rewardFor(c);
              const done = r?.status === "verified";
              return (
                <article key={c} className="glass-card rounded-3xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-secondary/70 text-primary">
                      {c === "telegram" ? (
                        <Send className="size-5" strokeWidth={1.75} />
                      ) : (
                        <MessageCircle className="size-5" strokeWidth={1.75} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold capitalize">Join our {c} group</p>
                      <p className="text-[11px] text-muted-foreground">
                        Verified by REDPAY before payout
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-black text-primary">
                      {formatNaira(amountFor(c))}
                    </span>
                  </div>
                  <div className="mt-3">
                    {done ? (
                      <p className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-primary/50 bg-primary/10 text-xs font-semibold text-primary">
                        <Check className="size-4" /> Joined &amp; rewarded
                      </p>
                    ) : r ? (
                      <button
                        onClick={() => verify(c)}
                        disabled={busy === c}
                        className="gradient-red flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-xs font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-60"
                      >
                        {busy === c ? <Loader2 className="size-4 animate-spin" /> : null}
                        Verify &amp; Claim
                      </button>
                    ) : (
                      <button
                        onClick={() => joinGroup(c)}
                        disabled={busy === c}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/60 text-xs font-semibold transition-transform active:scale-95 disabled:opacity-60"
                      >
                        {busy === c ? <Loader2 className="size-4 animate-spin" /> : null}
                        Join group
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="px-1 text-sm font-semibold">Referral Statistics</h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="glass-card rounded-2xl px-2 py-3 text-center">
                <span className="mx-auto grid size-9 place-items-center rounded-xl bg-secondary/70 text-primary">
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <p className="mt-2 truncate text-sm font-black">{value}</p>
                <p className="text-[10px] leading-tight text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="px-1 text-sm font-semibold">Reward History</h2>
          <div className="glass-card mt-3 rounded-3xl p-4">
            {referralTx.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No rewards yet — invite a friend to get started.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {referralTx.map((t) => (
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
                    <span className={cn("shrink-0 text-sm font-semibold text-primary")}>
                      {formatNaira(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
