import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  mode?: "image" | "logo";
  accent?: string;
  className?: string;
  priority?: boolean;
};

/**
 * Cartela visual padronizada para capa de post.
 * - mode="image": foto full-bleed com gradient overlay
 * - mode="logo": logo centralizado em tile escuro com aura de cor accent
 */
export function BlogCover({
  src,
  alt,
  mode = "image",
  accent = "#14b7de",
  className,
  priority,
}: Props) {
  if (mode === "logo") {
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-gradient-to-br from-deep via-ink to-ink",
          className,
        )}
      >
        {/* aura de cor da marca */}
        <div
          className="absolute inset-0 opacity-40 transition-opacity duration-500 group-hover:opacity-60"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${accent} 0%, transparent 65%)`,
          }}
        />
        {/* grid pattern */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative h-full w-full p-8 md:p-10 flex items-center justify-center">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-contain transition-transform duration-500 group-hover:scale-105"
            style={{ padding: "10%" }}
            priority={priority}
          />
        </div>
      </div>
    );
  }

  // image mode (default)
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-deep",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        priority={priority}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `linear-gradient(135deg, transparent 0%, ${accent}30 100%)`,
        }}
      />
    </div>
  );
}
