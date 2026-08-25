import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { RedpayLogo } from "@/components/redpay/Logo";

export const Route = createFileRoute("/withdraw-loading")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Preparing Withdrawal — REDPAY" },
      {
        name: "description",
        content: "Securing your REDPAY withdrawal session before you continue.",
      },
      { property: "og:title", content: "Preparing Withdrawal — REDPAY" },
      { property: "og:description", content: "Securing your REDPAY withdrawal session." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WithdrawLoading,
});

function WithdrawLoading() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/withdraw", replace: true }), 3000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="grid min-h-[100dvh] w-full place-items-center overflow-x-hidden px-6">
      <div className="rise-in flex w-full max-w-md flex-col items-center text-center">
        <div className="relative grid place-items-center">
          <span aria-hidden className="absolute size-32 rounded-full bg-primary/20 blur-2xl" />
          <span
            aria-hidden
            className="absolute size-24 animate-spin rounded-full border-2 border-primary/25 border-t-primary"
            style={{ animationDuration: "1.1s" }}
          />
          <RedpayLogo size={56} />
        </div>

        <p className="mt-8 flex items-center gap-2 text-sm font-medium text-foreground">
          <Loader2 className="size-4 animate-spin text-primary" />
          Preparing your withdrawal...
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Verifying your wallet securely. This only takes a moment.
        </p>

        <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-secondary/70">
          <div
            className="gradient-red h-full w-full origin-left"
            style={{ animation: "rpc-progress 3s linear forwards" }}
          />
        </div>
      </div>
    </div>
  );
}
