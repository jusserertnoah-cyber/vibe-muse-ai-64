import { cn } from "@/lib/utils";

export const VibeLogo = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "font-serif text-3xl font-semibold tracking-[0.3em] text-foreground",
      className
    )}
  >
    VIBE
  </span>
);