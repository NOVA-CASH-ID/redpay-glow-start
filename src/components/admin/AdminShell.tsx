import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, ShieldCheck, LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/bank", label: "Bank" },
  { to: "/admin/withdrawals", label: "Withdrawals" },
  { to: "/admin/support", label: "Support" },
  { to: "/admin/community", label: "Community" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, loading, session } = useIsAdmin();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!session || !isAdmin) navigate({ to: "/admin/login", replace: true });
  }, [loading, session, isAdmin, navigate]);

  async function signOut() {
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  if (loading || !isAdmin) {
    return (
      <div className="grid min-h-[100dvh] place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden pb-16">
      <header
        className="glass-card sticky top-0 z-30 rounded-none border-x-0 border-t-0"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-foreground text-background">
              <ShieldCheck className="size-5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-black tracking-tight">Admin</h1>
              <p className="truncate text-[11px] text-muted-foreground">Redpay control panel</p>
            </div>
            <button
              onClick={() => queryClient.invalidateQueries()}
              aria-label="Refresh data"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-secondary/60 transition-transform active:scale-90"
            >
              <RefreshCw className="size-[18px]" strokeWidth={1.75} />
            </button>
            <button
              onClick={signOut}
              className="gradient-red flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-bold text-primary-foreground transition-transform active:scale-95"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </div>

          <nav className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {NAV.map((n) => {
              const active = path === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                    active
                      ? "gradient-red text-primary-foreground"
                      : "border border-border bg-secondary/60 text-foreground",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-5">{children}</main>
    </div>
  );
}

export function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="glass-card mt-4 rounded-3xl p-4">
      <h2 className="text-sm font-bold">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block px-1 text-[11px] font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        type={type}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-border bg-secondary/50 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/70"
      />
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl border border-border bg-secondary/40 px-3 py-3 text-sm"
    >
      <span className="font-medium">{label}</span>
      <span
        className={cn(
          "grid h-6 w-11 items-center rounded-full px-0.5 transition-colors",
          checked ? "gradient-red" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "size-5 rounded-full bg-background transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}

export function SaveButton({
  onClick,
  saving,
  message,
}: {
  onClick: () => void;
  saving: boolean;
  message: string;
}) {
  return (
    <>
      <button
        onClick={onClick}
        disabled={saving}
        className="gradient-red mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : null} Save Changes
      </button>
      {message ? (
        <p className="mt-3 rounded-2xl bg-primary/10 px-3 py-2.5 text-xs font-medium text-primary">
          {message}
        </p>
      ) : null}
    </>
  );
}
