import { Link } from "@tanstack/react-router";
import { ArrowLeft, Bell } from "lucide-react";
import { RedpayLogo } from "./Logo";

export function PageHeader({
  title,
  subtitle,
  unread = 0,
}: {
  title: string;
  subtitle?: string;
  unread?: number;
}) {
  return (
    <header
      className="glass-card sticky top-0 z-30 rounded-none border-x-0 border-t-0"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto w-full max-w-md px-4 py-3">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <Link
            to="/dashboard"
            aria-label="Back to dashboard"
            className="grid size-10 place-items-center rounded-full border border-border bg-secondary/60 transition-transform active:scale-90"
          >
            <ArrowLeft className="size-[18px]" strokeWidth={1.75} />
          </Link>
          <div className="flex min-w-0 items-center justify-center gap-2">
            <RedpayLogo size={28} />
            <span className="truncate text-base font-bold tracking-tight">
              Red<span className="text-primary">Pay</span>
            </span>
          </div>
          <button
            aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
            className="relative grid size-10 place-items-center rounded-full border border-border bg-secondary/60 transition-transform active:scale-90"
          >
            <Bell className="size-[18px]" strokeWidth={1.75} />
            {unread > 0 ? (
              <span className="gradient-red absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold text-primary-foreground">
                {unread}
              </span>
            ) : null}
          </button>
        </div>
        <div className="mt-3 text-center">
          <h1 className="text-xl font-black tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
