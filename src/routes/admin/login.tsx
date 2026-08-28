import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Login — REDPAY" },
      { name: "description", content: "Secure administrator sign-in for the REDPAY control panel." },
      { property: "og:title", content: "Admin Login — REDPAY" },
      { property: "og:description", content: "Authorised administrators only." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { isAdmin, session, loading: checking } = useIsAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!checking && session && isAdmin) navigate({ to: "/admin", replace: true });
  }, [checking, session, isAdmin, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError || !data.user) {
      setLoading(false);
      setError("Invalid administrator credentials.");
      return;
    }
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();
    setLoading(false);
    if (!role) {
      await supabase.auth.signOut();
      setError("This account is not authorised for the admin panel.");
      return;
    }
    navigate({ to: "/admin", replace: true });
  }

  return (
    <main className="grid min-h-[100dvh] w-full place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <header className="flex flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-foreground text-background">
            <ShieldCheck className="size-7" />
          </span>
          <h1 className="mt-4 text-2xl font-black tracking-tight">Admin Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Authorised administrators only. All actions are logged.
          </p>
        </header>

        <form onSubmit={submit} className="glass-card mt-6 space-y-4 rounded-3xl p-5">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-3 focus-within:border-primary/70">
            <Mail className="size-4 shrink-0 text-primary" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email address"
              aria-label="Email address"
              autoComplete="username"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-3 focus-within:border-primary/70">
            <Lock className="size-4 shrink-0 text-primary" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={show ? "text" : "password"}
              placeholder="Password"
              aria-label="Password"
              autoComplete="current-password"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="shrink-0 p-1 text-muted-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {error ? (
            <p role="alert" className="rounded-xl bg-destructive/15 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "flex h-13 w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold transition-transform active:scale-95",
              loading ? "bg-secondary text-muted-foreground" : "gradient-red text-primary-foreground",
            )}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null} Login
          </button>
        </form>
      </div>
    </main>
  );
}
