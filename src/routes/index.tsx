import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Check,
  Loader2,
} from "lucide-react";
import { RedpayLogo, Particles } from "@/components/redpay/Logo";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Create Account — REDPAY" },
      {
        name: "description",
        content:
          "Join REDPAY for fast, secure payments and rewards. Create your account in seconds.",
      },
      { property: "og:title", content: "Create Account — REDPAY" },
      {
        property: "og:description",
        content: "Join REDPAY and enjoy fast, secure payments and rewards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Register,
});

const COUNTRIES = ["Nigeria", "Ghana", "Kenya", "South Africa", "Egypt", "Rwanda"];

type Fields = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  country: string;
};

function validate(f: Fields) {
  const e: Partial<Record<keyof Fields, string>> = {};
  if (f.firstName.trim().length < 2) e.firstName = "Enter your first name";
  if (f.lastName.trim().length < 2) e.lastName = "Enter your last name";
  if (!/^\+?[0-9\s-]{10,17}$/.test(f.phone.trim())) e.phone = "Enter a valid phone number";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()))
    e.email = "Enter a valid email address";
  if (f.password.length < 8) e.password = "Password must be at least 8 characters";
  if (!f.country) e.country = "Select your country";
  return e;
}

function Field({
  icon: Icon,
  error,
  children,
}: {
  icon: React.ElementType;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border bg-secondary/50 px-3 transition-all duration-200",
          "focus-within:border-primary/70 focus-within:bg-secondary focus-within:ring-4 focus-within:ring-primary/20",
          error ? "border-destructive/60" : "border-border",
        )}
      >
        <Icon className="size-4 shrink-0 text-primary" />
        {children}
      </div>
      {error ? <p className="mt-1.5 pl-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

const inputCls =
  "min-w-0 flex-1 bg-transparent py-3.5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground";

function Register() {
  const navigate = useNavigate();
  const [f, setF] = useState<Fields>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    country: "Nigeria",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [terms, setTerms] = useState(false);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = validate(f);
  const valid = Object.keys(errors).length === 0 && terms;
  const set = (k: keyof Fields) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const err = (k: keyof Fields) => (touched[k] ? errors[k] : undefined);
  const blur = (k: keyof Fields) => () => setTouched((p) => ({ ...p, [k]: true }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setTouched({
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      password: true,
      country: true,
    });
    if (!valid) {
      setError(terms ? "Please fix the highlighted fields." : "Please accept the terms to continue.");
      return;
    }
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          first_name: f.firstName.trim(),
          last_name: f.lastName.trim(),
          phone: f.phone.trim(),
          country: f.country,
        },
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(
        signUpError.message.toLowerCase().includes("already")
          ? "An account with this email already exists. Try signing in instead."
          : signUpError.message || "We couldn't create your account. Please try again.",
      );
      return;
    }

    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: f.email.trim(),
        password: f.password,
      });
      if (signInError) {
        setLoading(false);
        setError("Account created, but we couldn't sign you in automatically. Please try again.");
        return;
      }
    }

    setLoading(false);
    navigate({ to: "/welcome", search: { name: f.firstName.trim() }, replace: true });
  }


  return (
    <main className="relative min-h-[100dvh] w-full overflow-x-hidden px-5 pb-10 pt-10">
      <Particles />
      <div className="relative mx-auto w-full max-w-md">
        <header className="rise-in flex flex-col items-center text-center">
          <RedpayLogo size={64} />
          <h1 className="mt-5 text-3xl font-bold tracking-tight">
            Create <span className="text-primary text-glow">Account</span>
          </h1>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Join REDPAY and enjoy fast, secure payments and rewards.
          </p>
        </header>

        <form
          onSubmit={submit}
          className="glass-card rise-in mt-7 space-y-4 rounded-3xl p-5"
          style={{ animationDelay: "80ms" }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field icon={User} error={err("firstName")}>
              <input
                className={inputCls}
                placeholder="First name"
                value={f.firstName}
                onChange={(e) => set("firstName")(e.target.value)}
                onBlur={blur("firstName")}
                onFocus={(e) =>
                  setTimeout(
                    () => e.target.scrollIntoView({ block: "center", behavior: "smooth" }),
                    250,
                  )
                }
                autoComplete="given-name"
              />
            </Field>
            <Field icon={User} error={err("lastName")}>
              <input
                className={inputCls}
                placeholder="Last name"
                value={f.lastName}
                onChange={(e) => set("lastName")(e.target.value)}
                onBlur={blur("lastName")}
                autoComplete="family-name"
              />
            </Field>
          </div>

          <Field icon={Phone} error={err("phone")}>
            <input
              className={inputCls}
              inputMode="tel"
              placeholder="+234 800 000 0000"
              value={f.phone}
              onChange={(e) => set("phone")(e.target.value)}
              onBlur={blur("phone")}
              onFocus={(e) =>
                setTimeout(
                  () => e.target.scrollIntoView({ block: "center", behavior: "smooth" }),
                  250,
                )
              }
              autoComplete="tel"
            />
          </Field>

          <Field icon={Mail} error={err("email")}>
            <input
              className={inputCls}
              inputMode="email"
              placeholder="john@example.com"
              value={f.email}
              onChange={(e) => set("email")(e.target.value)}
              onBlur={blur("email")}
              onFocus={(e) =>
                setTimeout(
                  () => e.target.scrollIntoView({ block: "center", behavior: "smooth" }),
                  250,
                )
              }
              autoComplete="email"
            />
          </Field>

          <div>
            <Field icon={Lock} error={err("password")}>
              <input
                className={inputCls}
                type={show ? "text" : "password"}
                placeholder="Password"
                value={f.password}
                onChange={(e) => set("password")(e.target.value)}
                onBlur={blur("password")}
                onFocus={(e) =>
                  setTimeout(
                    () => e.target.scrollIntoView({ block: "center", behavior: "smooth" }),
                    250,
                  )
                }
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-primary"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </Field>
            <p
              className={cn(
                "mt-1.5 flex items-center gap-1.5 pl-1 text-xs",
                f.password.length >= 8 ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Check className="size-3.5" /> At least 8 characters
            </p>
          </div>

          <Field icon={Globe} error={err("country")}>
            <select
              className={cn(inputCls, "appearance-none pr-1")}
              value={f.country}
              onChange={(e) => set("country")(e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c} className="bg-popover text-popover-foreground">
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <label className="flex cursor-pointer items-start gap-3 pt-1">
            <span
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-all",
                terms ? "gradient-red border-transparent" : "border-border bg-secondary/60",
              )}
            >
              {terms ? <Check className="size-3.5 text-primary-foreground" /> : null}
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
            />
            <span className="text-xs leading-relaxed text-muted-foreground">
              I agree to the{" "}
              <a href="#" className="font-medium text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="font-medium text-primary hover:underline">
                Privacy Policy
              </a>
            </span>
          </label>

          {error ? (
            <p
              role="alert"
              className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs text-destructive"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold transition-all duration-200 active:scale-[0.97]",
              valid && !loading
                ? "gradient-red glow-red text-primary-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" /> Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
