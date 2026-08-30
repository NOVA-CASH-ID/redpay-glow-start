import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Headphones, Send, MessageCircle, Mail, ArrowRight, LifeBuoy, Users } from "lucide-react";
import { BottomNav, type NavKey } from "@/components/redpay/BottomNav";
import { useAppSetting } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/support")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Support — REDPAY" },
      {
        name: "description",
        content: "Reach the REDPAY support team on Telegram, WhatsApp or email — we're here to help.",
      },
      { property: "og:title", content: "Support — REDPAY" },
      { property: "og:description", content: "Get help with your REDPAY account, 24/7." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupportPage,
});

type Channel = {
  icon: typeof Send;
  title: string;
  desc: string;
  cta: string;
  href: string;
};

function SupportPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<NavKey>("support");
  const support = useAppSetting("support");
  const community = useAppSetting("community");
  const s = (support.data ?? {}) as Record<string, string | boolean>;
  const c = (community.data ?? {}) as Record<string, string | boolean>;

  const channels: Channel[] = [];
  if (s["telegram_enabled"] !== false && s["telegram_link"])
    channels.push({
      icon: Send,
      title: String(s["telegram_text"] || "Telegram Support"),
      desc: "Chat with our support team on Telegram",
      cta: "Open Telegram",
      href: String(s["telegram_link"]),
    });
  if (s["whatsapp_enabled"] !== false && s["whatsapp_link"])
    channels.push({
      icon: MessageCircle,
      title: String(s["whatsapp_text"] || "WhatsApp Support"),
      desc: "Get quick assistance through WhatsApp",
      cta: "Open WhatsApp",
      href: String(s["whatsapp_link"]),
    });
  channels.push({
    icon: Mail,
    title: "Email Support",
    desc: "Send us an email and we'll get back to you",
    cta: "Send Email",
    href: "mailto:support@redpay.app",
  });

  const groups: Channel[] = [];
  if (c["whatsapp_enabled"] !== false && c["whatsapp_link"])
    groups.push({
      icon: Users,
      title: String(c["whatsapp_text"] || "Join WhatsApp Group"),
      desc: "Join the REDPAY community on WhatsApp",
      cta: "Open Group",
      href: String(c["whatsapp_link"]),
    });
  if (c["telegram_enabled"] !== false && c["telegram_link"])
    groups.push({
      icon: Users,
      title: String(c["telegram_text"] || "Join Telegram Group"),
      desc: "Join the REDPAY community on Telegram",
      cta: "Open Group",
      href: String(c["telegram_link"]),
    });

  const CHANNELS = [...channels, ...groups];

  function onNav(k: NavKey) {
    setTab(k);
    if (k === "home" || k === "wallet") navigate({ to: "/dashboard" });
    if (k === "activity") navigate({ to: "/activity" });
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
          <div className="min-w-0 text-center">
            <h1 className="truncate text-lg font-black tracking-tight text-glow">Support</h1>
            <p className="truncate text-[11px] text-muted-foreground">We're here to help</p>
          </div>
          <span className="grid size-10 place-items-center rounded-2xl border border-primary/40 bg-secondary/60 text-primary">
            <Headphones className="size-[18px]" strokeWidth={1.75} />
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md space-y-4 px-4 pb-32 pt-5">
        {CHANNELS.map(({ icon: Icon, title, desc, cta, href }) => (
          <section key={title} className="glass-card relative overflow-hidden rounded-3xl p-4">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 -top-10 size-28 rounded-full bg-primary/20 blur-3xl"
            />
            <div className="relative flex items-center gap-4">
              <span className="gradient-red glow-red grid size-12 shrink-0 place-items-center rounded-full text-primary-foreground">
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </div>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "gradient-red glow-red mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-primary-foreground transition-transform active:scale-95",
              )}
            >
              {cta}
              <ArrowRight className="size-4" />
            </a>
          </section>
        ))}

        <section className="glass-card relative overflow-hidden rounded-3xl p-5">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -bottom-12 size-40 rounded-full bg-primary/25 blur-3xl"
          />
          <div className="relative flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/40 bg-secondary/60 text-primary">
              <LifeBuoy className="size-6" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold">Need more help?</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Our support team is available to assist you with account and app-related questions.
              </p>
            </div>
            <span className="gradient-red glow-red grid size-12 shrink-0 place-items-center rounded-2xl text-[10px] font-black text-primary-foreground">
              24/7
            </span>
          </div>
          <a
            href="mailto:support@redpay.app"
            className="gradient-red glow-red mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-primary-foreground transition-transform active:scale-95"
          >
            <MessageCircle className="size-4" /> Contact Support
            <ArrowRight className="size-4" />
          </a>
        </section>
      </main>

      <BottomNav active={tab} onChange={onNav} />
    </div>
  );
}
