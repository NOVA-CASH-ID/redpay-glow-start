import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  UserRound,
  Mail,
  Phone,
  Globe,
  Gift,
  Wallet,
  ChevronRight,
  LogOut,
  Headphones,
  History,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav, type NavKey } from "@/components/redpay/BottomNav";
import { useSession, useProfile, formatNaira } from "@/hooks/useRedpay";

export const Route = createFileRoute("/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Profile — REDPAY" },
      {
        name: "description",
        content: "Manage your REDPAY account details, referral code, wallet balance and sign out.",
      },
      { property: "og:title", content: "Profile — REDPAY" },
      { property: "og:description", content: "Your REDPAY account at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading } = useSession();
  const userId = session?.user.id;
  const profile = useProfile(userId);
  const [tab, setTab] = useState<NavKey>("profile");

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login", replace: true });
  }, [loading, session, navigate]);

  const p = profile.data;
  const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "REDPAY User";
  const initials =
    ((p?.first_name?.[0] ?? "") + (p?.last_name?.[0] ?? "")).toUpperCase() ||
    (session?.user.email?.[0]?.toUpperCase() ?? "R");

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  function onNav(k: NavKey) {
    setTab(k);
    if (k === "home" || k === "wallet") navigate({ to: "/dashboard" });
    if (k === "activity") navigate({ to: "/activity" });
    if (k === "support") navigate({ to: "/support" });
  }

  const details = [
    { icon: Mail, label: "Email", value: session?.user.email ?? "—" },
    { icon: Phone, label: "Phone", value: p?.phone || "—" },
    { icon: Globe, label: "Country", value: p?.country || "—" },
    { icon: Gift, label: "Referral code", value: p?.referral_code || "—" },
  ];

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
            Profile
          </h1>
          <span className="grid size-10 place-items-center rounded-2xl border border-primary/40 bg-secondary/60 text-primary">
            <UserRound className="size-[18px]" strokeWidth={1.75} />
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-4">
        <section className="glass-card relative overflow-hidden rounded-3xl p-5 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 left-1/2 size-48 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl"
          />
          <div className="relative">
            <span className="gradient-red glow-red mx-auto grid size-20 place-items-center rounded-full text-2xl font-black text-primary-foreground">
              {initials}
            </span>
            <p className="mt-3 truncate text-lg font-bold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">
              ID: {p?.account_id ?? "—"}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-secondary/50 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Balance</p>
                <p className="mt-0.5 truncate text-sm font-black text-primary">
                  {formatNaira(p?.balance)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/50 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Referrals
                </p>
                <p className="mt-0.5 text-sm font-black">{p?.referral_count ?? 0}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card mt-5 rounded-3xl p-4">
          <h2 className="px-1 text-sm font-semibold">Account details</h2>
          <ul className="mt-2 divide-y divide-border">
            {details.map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex items-center gap-3 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary/70 text-primary">
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <span className="flex-1 text-xs text-muted-foreground">{label}</span>
                <span className="min-w-0 truncate text-sm font-medium">{value}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-5 space-y-3">
          {[
            { to: "/history", icon: History, label: "Transaction history" },
            { to: "/refer", icon: Gift, label: "Refer & earn" },
            { to: "/activity", icon: Wallet, label: "Activity" },
            { to: "/support", icon: Headphones, label: "Support" },
          ].map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="glass-card flex items-center gap-3 rounded-2xl p-4 transition-transform active:scale-[0.98]"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary/70 text-primary">
                <Icon className="size-4" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </section>

        <button
          onClick={signOut}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-primary/50 bg-primary/10 text-sm font-semibold text-primary transition-transform active:scale-95"
        >
          <LogOut className="size-4" /> Log out
        </button>
      </main>

      <BottomNav active={tab} onChange={onNav} />
    </div>
  );
}
