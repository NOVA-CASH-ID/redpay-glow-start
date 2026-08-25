import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Share2,
  Wallet,
  ShieldCheck,
  Zap,
  Gift,
  Sparkles,
  Check,
  ArrowRight,
} from "lucide-react";
import { RedpayLogo, Particles } from "@/components/redpay/Logo";
import { useProfile, useSession, formatNaira } from "@/hooks/useRedpay";

export const Route = createFileRoute("/welcome")({
  validateSearch: (s: Record<string, unknown>) => ({
    name: typeof s["name"] === "string" ? (s["name"] as string) : "there",
  }),
  head: () => ({
    meta: [
      { title: "Account Created — REDPAY" },
      {
        name: "description",
        content:
          "Your REDPAY account is ready. Claim your welcome bonus and start making instant, secure payments.",
      },
      { property: "og:title", content: "Account Created — REDPAY" },
      {
        property: "og:description",
        content: "Your REDPAY account is ready to go, with a welcome bonus in your wallet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

const BENEFITS = [
  { icon: ShieldCheck, top: "Secure", bottom: "Transactions" },
  { icon: Zap, top: "Instant", bottom: "Payments" },
  { icon: Gift, top: "Exciting", bottom: "Rewards" },
];

function Welcome() {
  const search = Route.useSearch();
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const name =
    search.name && search.name !== "there"
      ? search.name
      : profile?.first_name || "there";


  return (
    <main className="relative min-h-[100dvh] w-full overflow-x-hidden px-5 pb-10 pt-8">
      <Particles />
      <div className="relative mx-auto w-full max-w-md">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0" />
          <button
            aria-label="Share"
            className="glass-card grid size-10 shrink-0 place-items-center rounded-full transition-transform active:scale-95"
          >
            <Share2 className="size-4 text-primary" />
          </button>
        </div>

        <header className="rise-in -mt-6 flex flex-col items-center text-center">
          <div className="relative">
            <RedpayLogo size={72} />
            <span className="gradient-red glow-red absolute -bottom-2 -right-2 grid size-8 place-items-center rounded-full border-2 border-background">
              <Check className="size-4 text-primary-foreground" />
            </span>
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">
            Welcome, <span className="text-primary text-glow">{name}</span>!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Your account is ready to go</p>
        </header>

        <section
          className="glass-card rise-in mt-8 rounded-3xl p-6 text-center"
          style={{ animationDelay: "100ms" }}
        >
          <span className="gradient-red glow-red mx-auto grid size-14 place-items-center rounded-2xl">
            <Wallet className="size-7 text-primary-foreground" />
          </span>
          <p className="mt-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Welcome Bonus
          </p>
          <p className="text-glow mt-2 text-5xl font-black tracking-tight text-primary">
            {profile?.balance != null ? formatNaira(profile.balance) : "₦160,000"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            has been added to your wallet 🎉
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-5">
            {BENEFITS.map(({ icon: Icon, top, bottom }) => (
              <div key={top} className="flex min-w-0 flex-col items-center gap-1.5">
                <Icon className="size-5 shrink-0 text-primary" strokeWidth={1.5} />
                <span className="text-xs font-semibold">{top}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">
                  {bottom}
                </span>
              </div>
            ))}
          </div>
        </section>

        <Link
          to="/dashboard"
          className="gradient-red glow-red rise-in mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
          style={{ animationDelay: "180ms" }}
        >
          Go to Dashboard <ArrowRight className="size-5" />
        </Link>

        <div
          className="glass-card rise-in mt-5 flex items-center gap-3 rounded-2xl p-4"
          style={{ animationDelay: "240ms" }}
        >
          <Sparkles className="size-5 shrink-0 text-primary text-glow" />
          <p className="min-w-0 text-sm text-muted-foreground">
            Start exploring RedPay and enjoy seamless payments
          </p>
        </div>
      </div>
    </main>
  );
}
