import { Home, Wallet, Activity, Headphones, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { key: "home", label: "Home", icon: Home },
  { key: "wallet", label: "Wallet", icon: Wallet },
  { key: "activity", label: "Activity", icon: Activity },
  { key: "support", label: "Support", icon: Headphones },
  { key: "profile", label: "Profile", icon: User },
] as const;

export type NavKey = (typeof ITEMS)[number]["key"];

export function BottomNav({
  active,
  onChange,
}: {
  active: NavKey;
  onChange: (k: NavKey) => void;
}) {
  return (
    <nav
      className="glass-card fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-x-0 border-b-0"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="mx-auto grid w-full max-w-md grid-cols-5 px-2 py-2">
        {ITEMS.map(({ key, label, icon: Icon }) => {
          const on = key === active;
          return (
            <li key={key} className="min-w-0">
              <button
                onClick={() => onChange(key)}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-2xl py-2 transition-all active:scale-90",
                  on ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-xl transition-all",
                    on && "gradient-red glow-red text-primary-foreground",
                  )}
                >
                  <Icon className="size-[18px]" strokeWidth={1.75} />
                </span>
                <span className="truncate text-[10px] font-medium">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
