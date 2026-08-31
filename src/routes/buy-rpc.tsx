import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Wallet, Minus, Plus, Sparkles, Signal, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/redpay/PageHeader";
import { RpcCodeInput, type RpcBenefit } from "@/components/redpay/RpcCodeInput";
import { ConfirmSheet, type PurchaseStatus } from "@/components/redpay/ConfirmSheet";
import { BottomNav, type NavKey } from "@/components/redpay/BottomNav";
import { useSession, useProfile, useNotifications, formatNaira } from "@/hooks/useRedpay";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/buy-rpc")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Buy Recharge Card — REDPAY" },
      {
        name: "description",
        content: "Buy MTN, Airtel, Glo and 9mobile airtime recharge cards instantly with REDPAY.",
      },
      { property: "og:title", content: "Buy Recharge Card — REDPAY" },
      { property: "og:description", content: "Instant airtime recharge cards from your REDPAY wallet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BuyRpc,
});

const NETWORKS = ["MTN", "Airtel", "Glo", "9mobile"];
const DENOMINATIONS = [100, 200, 500, 1000, 2000, 5000];

function BuyRpc() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading } = useSession();
  const userId = session?.user.id;
  const profile = useProfile(userId);
  const notifications = useNotifications(userId);

  const [network, setNetwork] = useState("MTN");
  const [denomination, setDenomination] = useState(200);
  const [quantity, setQuantity] = useState(1);
  const [benefit, setBenefit] = useState<RpcBenefit | null>(null);
  const [status, setStatus] = useState<PurchaseStatus>("idle");
  const [message, setMessage] = useState<string>();
  const [tab, setTab] = useState<NavKey>("home");

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login", replace: true });
  }, [loading, session, navigate]);

  const subtotal = denomination * quantity;
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

  async function confirm() {
    setStatus("loading");
    const { data, error } = await supabase.rpc("purchase_card", {
      _network: network,
      _card_type: "Airtime Card",
      _plan_label: `${formatNaira(denomination)} Airtime`,
      _phone: profile.data?.phone ?? "",
      _denomination: denomination,
      _quantity: quantity,
      _code: benefit?.code ?? "",
    });
    const res = (data ?? {}) as { ok?: boolean; error?: string };
    if (error || !res.ok) {
      setMessage(error?.message ?? res.error ?? "Purchase could not be completed.");
      setStatus("failed");
      return;
    }
    setBenefit(null);
    setMessage(undefined);
    setStatus("successful");
    await queryClient.invalidateQueries();
  }

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden">
      <PageHeader
        title="Buy Recharge Card"
        subtitle="Instant airtime, delivered to your wallet"
        unread={(notifications.data ?? []).filter((n) => !n.read).length}
      />

      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-4">
        {/* Wallet */}
        <section className="gradient-red glow-red flex items-center justify-between gap-3 rounded-3xl p-4 text-primary-foreground">
          <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest opacity-85">
            <Wallet className="size-4" /> Wallet Balance
          </span>
          <span className="text-xl font-black">{formatNaira(balance)}</span>
        </section>

        {/* Network */}
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

        {/* Card type */}
        <section className="mt-6">
          <h2 className="px-1 text-sm font-semibold">Card Type</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button className="glass-card flex items-center justify-center gap-2 rounded-2xl border-primary/70 py-3.5 text-sm font-semibold text-primary">
              <Signal className="size-4" /> Airtime Card
            </button>
            <button
              onClick={() => navigate({ to: "/buy-data" })}
              className="glass-card flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-transform active:scale-95"
            >
              <Wifi className="size-4" /> Data Card
            </button>
          </div>
        </section>

        {/* Denomination */}
        <section className="mt-6">
          <h2 className="px-1 text-sm font-semibold">Select Denomination</h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {DENOMINATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDenomination(d)}
                className={cn(
                  "glass-card rounded-2xl py-3.5 text-sm font-bold transition-all active:scale-95",
                  d === denomination && "border-primary/70 text-primary",
                )}
              >
                {formatNaira(d)}
              </button>
            ))}
          </div>
        </section>

        <RpcCodeInput benefit={benefit} onChange={setBenefit} />

        {/* Quantity + summary */}
        <section className="mt-6">
          <h2 className="px-1 text-sm font-semibold">Order Summary</h2>
          <div className="glass-card mt-3 rounded-3xl p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="grid size-9 place-items-center rounded-xl border border-border bg-secondary/60 transition-transform active:scale-90"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-6 text-center text-sm font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  aria-label="Increase quantity"
                  className="gradient-red grid size-9 place-items-center rounded-xl text-primary-foreground transition-transform active:scale-90"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
              <Row label="Subtotal" value={formatNaira(subtotal)} />
              {discount > 0 ? (
                <Row label="RPC benefit" value={`− ${formatNaira(discount)}`} accent />
              ) : null}
              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-black text-primary">{formatNaira(total)}</span>
              </div>
            </div>

            <p className="mt-3 flex items-center gap-2 rounded-2xl bg-secondary/50 px-3 py-2.5 text-[11px] text-muted-foreground">
              <Sparkles className="size-3.5 shrink-0 text-primary" /> Earn 2% RedPay rewards on
              every recharge card purchase.
            </p>
          </div>
        </section>

        <button
          onClick={() => setStatus("confirm")}
          disabled={!benefit || total > balance}
          className="gradient-red glow-red mt-6 h-14 w-full rounded-2xl text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-45"
        >
          {!benefit ? "Enter RPC code to continue" : total > balance ? "Insufficient balance" : `Buy Now · ${formatNaira(total)}`}
        </button>
      </main>

      <ConfirmSheet
        status={status}
        rows={[
          { label: "Network", value: network },
          { label: "Card Type", value: "Airtime Card" },
          { label: "Denomination", value: formatNaira(denomination) },
          { label: "Quantity", value: String(quantity) },
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

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", accent && "text-primary")}>{value}</span>
    </div>
  );
}
