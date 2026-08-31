import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Wallet, Phone, Wifi, Signal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/redpay/PageHeader";
import { RpcCodeInput, type RpcBenefit } from "@/components/redpay/RpcCodeInput";
import { ConfirmSheet, type PurchaseStatus } from "@/components/redpay/ConfirmSheet";
import { BottomNav, type NavKey } from "@/components/redpay/BottomNav";
import { useSession, useProfile, useNotifications, formatNaira } from "@/hooks/useRedpay";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/buy-data")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Buy Data — REDPAY" },
      {
        name: "description",
        content: "Buy daily, weekly and monthly data plans on MTN, Airtel, Glo and 9mobile with REDPAY.",
      },
      { property: "og:title", content: "Buy Data — REDPAY" },
      { property: "og:description", content: "Affordable data plans straight from your REDPAY wallet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BuyData,
});

const NETWORKS = ["MTN", "Airtel", "Glo", "9mobile"];
type Cycle = "daily" | "weekly" | "monthly";
const PLANS: Record<Cycle, { label: string; size: string; price: number; validity: string }[]> = {
  daily: [
    { label: "100MB", size: "100MB", price: 100, validity: "1 day" },
    { label: "250MB", size: "250MB", price: 200, validity: "1 day" },
    { label: "500MB", size: "500MB", price: 350, validity: "2 days" },
    { label: "1GB", size: "1GB", price: 500, validity: "1 day" },
  ],
  weekly: [
    { label: "1.5GB", size: "1.5GB", price: 1000, validity: "7 days" },
    { label: "2GB", size: "2GB", price: 1500, validity: "7 days" },
    { label: "6GB", size: "6GB", price: 2500, validity: "7 days" },
    { label: "11GB", size: "11GB", price: 3500, validity: "7 days" },
  ],
  monthly: [
    { label: "10GB", size: "10GB", price: 4500, validity: "30 days" },
    { label: "20GB", size: "20GB", price: 7500, validity: "30 days" },
    { label: "40GB", size: "40GB", price: 11000, validity: "30 days" },
    { label: "75GB", size: "75GB", price: 18000, validity: "30 days" },
  ],
};

function BuyData() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading } = useSession();
  const userId = session?.user.id;
  const profile = useProfile(userId);
  const notifications = useNotifications(userId);

  const [network, setNetwork] = useState("MTN");
  const [phone, setPhone] = useState("");
  const [cycle, setCycle] = useState<Cycle>("daily");
  const [planIndex, setPlanIndex] = useState(0);
  const [benefit, setBenefit] = useState<RpcBenefit | null>(null);
  const [status, setStatus] = useState<PurchaseStatus>("idle");
  const [message, setMessage] = useState<string>();
  const [tab, setTab] = useState<NavKey>("home");

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login", replace: true });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (profile.data?.phone && !phone) setPhone(profile.data.phone);
  }, [profile.data?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  const plan = PLANS[cycle][planIndex] ?? PLANS[cycle][0]!;
  const subtotal = plan.price;
  const discount = useMemo(() => {
    if (!benefit) return 0;
    const d =
      benefit.benefit_type === "percent"
        ? (subtotal * benefit.benefit_value) / 100
        : benefit.benefit_value;
    return Math.min(d, subtotal);
  }, [benefit, subtotal]);
  const total = subtotal - discount;
  const balance = Number(profile.data?.balance ?? 0);
  const phoneValid = /^(\+?234|0)\d{9,11}$/.test(phone.replace(/\s/g, ""));

  async function confirm() {
    setStatus("loading");
    const { data, error } = await supabase.rpc("purchase_card", {
      _network: network,
      _card_type: "Data Card",
      _plan_label: `${plan.size} · ${plan.validity}`,
      _phone: phone,
      _denomination: plan.price,
      _quantity: 1,
      _code: benefit?.code ?? "",
    });
    const res = (data ?? {}) as { ok?: boolean; error?: string };
    if (error || !res.ok) {
      setMessage(error?.message ?? res.error ?? "Purchase could not be completed.");
      setStatus("failed");
      return;
    }
    setBenefit(null);
    setMessage(`${plan.size} has been sent to ${phone}.`);
    setStatus("successful");
    await queryClient.invalidateQueries();
  }

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden">
      <PageHeader
        title="Buy Data"
        subtitle="Fast, affordable data bundles"
        unread={(notifications.data ?? []).filter((n) => !n.read).length}
      />

      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-4">
        <section className="gradient-red glow-red flex items-center justify-between gap-3 rounded-3xl p-4 text-primary-foreground">
          <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest opacity-85">
            <Wallet className="size-4" /> Wallet Balance
          </span>
          <span className="text-xl font-black">{formatNaira(balance)}</span>
        </section>

        <section className="mt-6">
          <h2 className="px-1 text-sm font-semibold">Select Network</h2>
          <div className="mt-3 grid grid-cols-4 gap-2.5">
            {NETWORKS.map((n) => (
              <button
                key={n}
                onClick={() => setNetwork(n)}
                className={cn(
                  "glass-card flex flex-col items-center gap-1.5 rounded-2xl px-1 py-3 text-[11px] font-medium transition-all active:scale-95",
                  n === network && "border-primary/70 text-primary",
                )}
              >
                <Signal className="size-4" strokeWidth={1.75} />
                <span className="truncate">{n}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="px-1 text-sm font-semibold">Phone Number</h2>
          <div className="glass-card mt-3 flex items-center gap-2 rounded-2xl px-3 focus-within:border-primary/70">
            <Phone className="size-[18px] shrink-0 text-primary" strokeWidth={1.75} />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="+234 800 000 0000"
              aria-label="Phone number"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          {phone && !phoneValid ? (
            <p className="mt-1.5 px-1 text-xs text-destructive">Enter a valid Nigerian number.</p>
          ) : null}
        </section>

        <section className="mt-6">
          <h2 className="px-1 text-sm font-semibold">Data Plans</h2>
          <div className="glass-card mt-3 grid grid-cols-3 gap-1 rounded-2xl p-1">
            {(["daily", "weekly", "monthly"] as Cycle[]).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCycle(c);
                  setPlanIndex(0);
                }}
                className={cn(
                  "rounded-xl py-2.5 text-xs font-semibold capitalize transition-all active:scale-95",
                  c === cycle ? "gradient-red text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {PLANS[cycle].map((p, i) => (
              <button
                key={p.label}
                onClick={() => setPlanIndex(i)}
                className={cn(
                  "glass-card flex flex-col items-start gap-1 rounded-2xl p-3.5 text-left transition-all active:scale-95",
                  i === planIndex && "border-primary/70",
                )}
              >
                <span className="flex items-center gap-1.5 text-base font-black">
                  <Wifi className="size-4 text-primary" /> {p.size}
                </span>
                <span className="text-[11px] text-muted-foreground">{p.validity}</span>
                <span className="text-sm font-bold text-primary">{formatNaira(p.price)}</span>
              </button>
            ))}
          </div>
        </section>

        <RpcCodeInput benefit={benefit} onChange={setBenefit} />

        <section className="mt-6">
          <h2 className="px-1 text-sm font-semibold">Order Summary</h2>
          <div className="glass-card mt-3 space-y-2 rounded-3xl p-4 text-sm">
            <SummaryRow label="Network" value={network} />
            <SummaryRow label="Plan" value={`${plan.size} · ${plan.validity}`} />
            <SummaryRow label="Phone" value={phone || "—"} />
            <SummaryRow label="Subtotal" value={formatNaira(subtotal)} />
            {discount > 0 ? (
              <SummaryRow label="RPC benefit" value={`− ${formatNaira(discount)}`} accent />
            ) : null}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-black text-primary">{formatNaira(total)}</span>
            </div>
          </div>
        </section>

        <button
          onClick={() => setStatus("confirm")}
          disabled={!benefit || !phoneValid || total > balance}
          className="gradient-red glow-red mt-6 h-14 w-full rounded-2xl text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-45"
        >
          {!benefit
            ? "Enter RPC code to continue"
            : total > balance
              ? "Insufficient balance"
              : `Confirm & Buy · ${formatNaira(total)}`}
        </button>
      </main>

      <ConfirmSheet
        status={status}
        rows={[
          { label: "Network", value: network },
          { label: "Card Type", value: "Data Card" },
          { label: "Plan", value: `${plan.size} · ${plan.validity}` },
          { label: "Phone", value: phone },
          ...(benefit ? [{ label: "RPC Benefit", value: benefit.label }] : []),
        ]}
        total={total}
        message={message}
        onConfirm={confirm}
        onCancel={() => setStatus("idle")}
        onDone={() => setStatus("idle")}
      />

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("truncate font-medium", accent && "text-primary")}>{value}</span>
    </div>
  );
}
