import { ReactNode } from "react";
import { DataFlowHero } from "@/components/three/DataFlowHero";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  /** lado direito do header (foto, mockup, badge, etc.) */
  aside?: ReactNode;
  /** densidade da malha — internas usam menos pontos que a home */
  particleCount?: number;
  /** altura do header */
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASS = {
  sm: "py-20 md:py-24 min-h-[40svh]",
  md: "py-24 md:py-32 min-h-[55svh]",
  lg: "py-28 md:py-40 min-h-[70svh]",
};

export function PageHeader({
  eyebrow,
  title,
  intro,
  aside,
  particleCount = 1800,
  size = "md",
  className,
}: Props) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden border-b border-slate/40",
        SIZE_CLASS[size],
        className,
      )}
    >
      {/* Animação 3D dosada (menos partículas que a home) */}
      <DataFlowHero count={particleCount} />

      {/* Vinheta extra para o texto ler bem por cima da animação */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[5]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(6,16,28,0.6) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 h-full flex items-center">
        <div
          className={cn(
            "grid gap-10 items-center w-full",
            aside ? "md:grid-cols-12" : "",
          )}
        >
          <div className={cn(aside ? "md:col-span-7" : "max-w-4xl")}>
            {eyebrow ? (
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
                {eyebrow}
              </div>
            ) : null}
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[0.95]">
              {title}
            </h1>
            {intro ? (
              <div className="mt-8 text-lg md:text-xl text-foam/80 leading-relaxed max-w-2xl">
                {intro}
              </div>
            ) : null}
          </div>
          {aside ? <div className="md:col-span-5">{aside}</div> : null}
        </div>
      </div>
    </section>
  );
}
