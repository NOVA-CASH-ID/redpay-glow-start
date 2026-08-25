import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User, Lock, Eye, EyeOff, ShieldCheck, Globe, Loader2 } from "lucide-react";
import { RedpayLogo, Particles } from "@/components/redpay/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useRedpay";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — REDPAY" },
      {
        name: "description",
        content: "Securely log in to your REDPAY account to manage payments and rewards.",
      },
      { property: "og:title", content: "Login — REDPAY" },
      { property: "og:description", content: "Log in to continue to your REDPAY account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

const inputCls =
  "min-w-0 flex-1 bg-transparent py-3.5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground";

function Login() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const id = identifier.trim();
    if (!id) return setError("Enter your email or phone number");
    if (password.length < 6) return setError("Enter your password");
    if (!id.includes("@"))
      return setError("Please log in with the email address on your account");

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: id,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError("Incorrect email or password. Please try again.");
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main
      className="relative min-h-[100dvh] w-full overflow-x-hidden px-5 pb-10"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 2rem)" }}
    >
      <Particles />
      <div className="relative mx-auto w-full max-w-md">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0" />
          <button className="glass-card flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-transform active:scale-95">
            <Globe className="size-3.5 text-primary" /> EN
          </button>
        </div>

        <header className="rise-in -mt-4 flex flex-col items-center text-center">
          <RedpayLogo size={68} />
          <p className="mt-3 text-lg font-bold tracking-tight">
            Red<span className="text-primary text-glow">Pay</span>
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">Welcome back!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Login to continue to your REDPAY account.
          </p>
        </header>

        <form
          onSubmit={submit}
          className="glass-card rise-in mt-7 space-y-4 rounded-3xl p-5"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-3 transition-all focus-within:border-primary/70 focus-within:bg-secondary focus-within:ring-4 focus-within:ring-primary/20">
            <User className="size-4 shrink-0 text-primary" />
            <input
              className={inputCls}
              placeholder="Enter your email or phone number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onFocus={(e) =>
                setTimeout(
                  () => e.target.scrollIntoView({ block: "center", behavior: "smooth" }),
                  250,
                )
              }
              autoComplete="username"
            />
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-3 transition-all focus-within:border-primary/70 focus-within:bg-secondary focus-within:ring-4 focus-within:ring-primary/20">
            <Lock className="size-4 shrink-0 text-primary" />
            <input
              className={inputCls}
              type={show ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) =>
                setTimeout(
                  () => e.target.scrollIntoView({ block: "center", behavior: "smooth" }),
                  250,
                )
              }
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-primary"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={async () => {
                if (!identifier.includes("@"))
                  return setError("Enter your email above to reset your password");
                await supabase.auth.resetPasswordForEmail(identifier.trim(), {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                setError("Password reset link sent to your email.");
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Forgot Password?
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
              "flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold transition-all active:scale-[0.97]",
              loading
                ? "cursor-not-allowed bg-secondary text-muted-foreground"
                : "gradient-red glow-red text-primary-foreground",
            )}
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" /> Logging in…
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div
          className="glass-card rise-in mt-5 flex items-start gap-3 rounded-2xl p-4"
          style={{ animationDelay: "160ms" }}
        >
          <ShieldCheck className="size-5 shrink-0 text-primary text-glow" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Secure Login</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Your account information is protected with secure authentication.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </p>

        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
          By continuing, you agree to our{" "}
          <a href="#" className="font-medium text-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="font-medium text-primary hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </main>
  );
}
