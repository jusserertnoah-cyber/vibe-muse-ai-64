import { cn } from "@/lib/utils";
import { forwardRef } from "react";

/**
 * VIBE — Monogramme "V" streetwear bold.
 *
 * Le "V" est dessiné comme une forme géométrique pleine (pas une font système),
 * avec une coupe diagonale signature dans la pointe — accent éditorial.
 * Couleur via `currentColor` → s'adapte automatiquement aux 3 thèmes
 * (crème, mauve, mono) en utilisant `text-foreground` ou autre classe.
 *
 * - variant="icon" : V seul (favicon, app icon, bottom nav)
 * - variant="full" : V + wordmark "VIBE" sous la marque (header, splash)
 * - accent       : active la coupe en couleur d'accent (lime / mauve)
 */
export type VibeLogoProps = {
  className?: string;
  variant?: "icon" | "full";
  accent?: boolean;
};

export const VibeLogo = forwardRef<SVGSVGElement, VibeLogoProps>(({
  className,
  variant = "full",
  accent = true,
}, ref) => {
  if (variant === "icon") {
    return (
      <svg
        ref={ref}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-8 w-8 text-foreground", className)}
        aria-label="VIBE"
        role="img"
      >
        <VIcon accent={accent} idSuffix="i" />
      </svg>
    );
  }

  return (
    <svg
      ref={ref}
      viewBox="0 0 100 132"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-12 w-auto text-foreground", className)}
      aria-label="VIBE"
      role="img"
    >
      <VIcon accent={accent} idSuffix="f" />
      {/* Wordmark "VIBE" — typo géométrique, tracking large façon couture */}
      <text
        x="50"
        y="124"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={800}
        fontSize={14}
        letterSpacing="3"
      >
        VIBE
      </text>
    </svg>
  );
});
VibeLogo.displayName = "VibeLogo";

/**
 * "V" sculpté streetwear bold : deux trapèzes massifs qui se rejoignent
 * en pointe, avec une coupe diagonale signature dans la pointe (mask).
 * Couleur via currentColor → s'adapte au thème (text-foreground).
 */
const VIcon = ({ accent, idSuffix }: { accent: boolean; idSuffix: string }) => {
  const maskId = `vibe-cut-${idSuffix}`;
  const clipId = `vibe-shape-${idSuffix}`;
  return (
    <>
      <defs>
        <mask id={maskId}>
          <rect width="100" height="100" fill="white" />
          <polygon points="38,82 62,76 64,82 40,88" fill="black" />
        </mask>
        <clipPath id={clipId}>
          <polygon points="10,12 34,12 56,92 46,92" />
          <polygon points="66,12 90,12 54,92 44,92" />
        </clipPath>
      </defs>
      <g mask={`url(#${maskId})`} fill="currentColor">
        <polygon points="10,12 34,12 56,92 46,92" />
        <polygon points="66,12 90,12 54,92 44,92" />
      </g>
      {accent && (
        <polygon
          points="38,82 62,76 64,82 40,88"
          fill="hsl(var(--accent))"
          clipPath={`url(#${clipId})`}
        />
      )}
    </>
  );
};