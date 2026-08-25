import { cn } from "@/lib/utils";

export function RedpayLogo({
  className,
  size = 64,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={cn(
        "gradient-red pulse-glow grid place-items-center rounded-3xl font-black tracking-tight text-primary-foreground",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-label="REDPAY logo"
    >
      R
    </div>
  );
}

export function Particles() {
  const dots = Array.from({ length: 14 });
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {dots.map((_, i) => (
        <span
          key={i}
          className="particle absolute block rounded-full bg-primary/60"
          style={{
            left: `${(i * 37) % 100}%`,
            bottom: `${(i * 17) % 60}%`,
            width: 4 + (i % 3) * 3,
            height: 4 + (i % 3) * 3,
            animationDelay: `${i * 0.7}s`,
          }}
        />
      ))}
    </div>
  );
}
