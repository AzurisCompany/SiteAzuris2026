import Link from "next/link";
import { cn } from "@/lib/utils";
import { AzurisMark } from "./AzurisMark";

export function Logo({
  size = 40,
  className,
  href = "/",
  wordmark = true,
  animated = true,
  glow = true,
}: {
  /** altura do ícone "A" em pixels */
  size?: number;
  className?: string;
  href?: string | null;
  /** mostra o "AZURIS" ao lado do ícone */
  wordmark?: boolean;
  /** gradiente animado dentro do A (efeito de fluxo de dados) */
  animated?: boolean;
  /** drop-shadow cyan sutil */
  glow?: boolean;
}) {
  const wordmarkSize = Math.round(size * 0.62);
  const inner = (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 group select-none",
        className,
      )}
    >
      <AzurisMark
        animated={animated}
        style={{
          width: Math.round(size * 1.44), // aspect ratio do A: ~234:163
          height: size,
          filter: glow
            ? "drop-shadow(0 0 14px rgba(20,183,222,0.45))"
            : undefined,
        }}
        className="transition-transform duration-300 group-hover:scale-105"
      />
      {wordmark ? (
        <span
          aria-label="Azuris"
          className="font-semibold tracking-[0.18em] text-foam leading-none"
          style={{ fontSize: wordmarkSize }}
        >
          AZURIS
        </span>
      ) : (
        <span className="sr-only">Azuris</span>
      )}
    </span>
  );

  if (!href) return inner;
  return (
    <Link href={href} aria-label="Azuris">
      {inner}
    </Link>
  );
}
