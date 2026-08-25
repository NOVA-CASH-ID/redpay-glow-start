import { useState } from "react";
import { KeyRound, QrCode, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type RpcBenefit = {
  code: string;
  benefit_type: "discount" | "percent" | string;
  benefit_value: number;
  label: string;
};

export function RpcCodeInput({
  benefit,
  onChange,
}: {
  benefit: RpcBenefit | null;
  onChange: (b: RpcBenefit | null) => void;
}) {
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function apply() {
    const trimmed = code.trim();
    if (!trimmed) return;
    setState("loading");
    setError("");
    const { data, error: err } = await supabase.rpc("check_rpc_code", { _code: trimmed });
    const res = (data ?? {}) as {
      valid?: boolean;
      error?: string;
      benefit_type?: string;
      benefit_value?: number;
      label?: string;
    };
    if (err || !res.valid) {
      setState("error");
      setError(err?.message ?? res.error ?? "Invalid code");
      onChange(null);
      return;
    }
    setState("idle");
    onChange({
      code: trimmed.toUpperCase(),
      benefit_type: res.benefit_type ?? "discount",
      benefit_value: Number(res.benefit_value ?? 0),
      label: res.label ?? "Discount applied",
    });
  }

  function clear() {
    setCode("");
    setError("");
    setState("idle");
    onChange(null);
  }

  return (
    <section className="mt-6">
      <h2 className="px-1 text-sm font-semibold">Enter RPC Code</h2>
      <div className="glass-card mt-3 rounded-3xl p-4">
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl border bg-secondary/50 px-3 transition-colors focus-within:border-primary/70",
            benefit ? "border-primary/60" : "border-border",
          )}
        >
          <KeyRound className="size-[18px] shrink-0 text-primary" strokeWidth={1.75} />
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (benefit) onChange(null);
              setState("idle");
              setError("");
            }}
            placeholder="Enter RPC Code"
            aria-label="RPC code"
            autoCapitalize="characters"
            className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {code ? (
            <button
              onClick={clear}
              aria-label="Clear code"
              className="grid size-7 shrink-0 place-items-center rounded-full bg-muted/60 transition-transform active:scale-90"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
          <button
            onClick={() => setError("QR scanning is coming soon — enter the code manually.")}
            aria-label="Scan QR code"
            className="flex shrink-0 items-center gap-1 rounded-xl border border-border px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-transform active:scale-95"
          >
            <QrCode className="size-3.5" /> Scan QR
          </button>
        </div>

        <button
          onClick={apply}
          disabled={!code.trim() || state === "loading"}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-primary transition-transform active:scale-95 disabled:opacity-45"
        >
          {state === "loading" ? <Loader2 className="size-4 animate-spin" /> : null}
          Apply Code
        </button>

        {benefit ? (
          <p className="mt-1 flex items-center gap-2 rounded-2xl bg-primary/10 px-3 py-2.5 text-xs font-medium text-primary">
            <CheckCircle2 className="size-4 shrink-0" /> Code valid — {benefit.label}
          </p>
        ) : error ? (
          <p className="mt-1 flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
