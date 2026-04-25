import { cn } from "@/lib/utils";

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

export const VibeLogo = ({
  className,
  variant = "full",
  accent = false,
}: VibeLogoProps) => {
  if (variant === "icon") {
    return (
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-8 w-8 text-foreground", className)}
        aria-label="VIBE"
        role="img"
      >
        <VIcon accent={accent} />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 100 130"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-12 w-auto text-foreground", className)}
      aria-label="VIBE"
      role="img"
    >
      <VIcon accent={accent} />
      {/* Wordmark "VIBE" — typo géométrique massive, tracking serré */}
      <g transform="translate(50 118)" textAnchor="middle">
        <text
          fill="currentColor"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={900}
          fontSize={18}
          letterSpacing="0.18em"
          style={{ fontStretch: "condensed" }}
        >
          VIBE
        </text>
      </g>
    </svg>
  );
};

/**
 * "V" sculpté : deux diagonales épaisses qui se rejoignent en pointe,
 * avec une encoche diagonale nette (accent éditorial signature).
 * Tracé en path unique (fill currentColor) pour rester lisible à 16px.
 */
const VIcon = ({ accent }: { accent: boolean }) => (
  <>
    {/* Le V principal — forme pleine, ultra-grasse, coupe asymétrique en bas */}
    <path
      d="M8 14 H30 L50 78 L70 14 H92 L60 100 L58 96 L78 22 H72 L52 86 H48 L28 22 H22 L42 76 L40 80 Z"
      fill="currentColor"
    />
    {/* Encoche diagonale signature dans la pointe du V */}
    <path
      d="M44 88 L56 88 L52 100 L48 100 Z"
      fill={accent ? "hsl(var(--accent))" : "currentColor"}
    />
  </>
);