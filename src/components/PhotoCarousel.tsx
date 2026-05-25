"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

type Photo = {
  src: string;
  alt: string;
  caption?: string;
};

type Props = {
  photos: Photo[];
};

export function PhotoCarousel({ photos }: Props) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const total = photos.length;
  const current = photos[index];

  const goTo = useCallback(
    (i: number) => setIndex(((i % total) + total) % total),
    [total],
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Teclado: setas navegam, ESC fecha lightbox
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightbox) {
          e.preventDefault();
          setLightbox(false);
        }
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, lightbox]);

  // Trava scroll body quando lightbox aberto
  useEffect(() => {
    if (lightbox) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [lightbox]);

  if (total === 0) return null;

  return (
    <>
      <div className="relative">
        {/* STAGE — fundo escuro com object-contain (sem corte, sem upscale agressivo) */}
        <div
          className="relative rounded-2xl border border-slate/60 overflow-hidden group/stage"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(20,183,222,0.08) 0%, transparent 60%), linear-gradient(180deg, #0a1422 0%, #06101c 100%)",
          }}
        >
          {/* Subtle inner grid pattern para dar textura */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Photo */}
          <button
            type="button"
            onClick={() => setLightbox(true)}
            aria-label="Abrir foto em tela cheia"
            className="relative block w-full aspect-[16/10] sm:aspect-[3/2] max-h-[520px] cursor-zoom-in"
          >
            <Image
              key={current.src}
              src={current.src}
              alt={current.alt}
              fill
              sizes="(min-width: 1024px) 800px, 100vw"
              className="object-contain p-4 sm:p-6 md:p-8 transition-opacity duration-300"
              priority={index === 0}
            />
          </button>

          {/* Botão expand (canto) */}
          <button
            type="button"
            onClick={() => setLightbox(true)}
            aria-label="Abrir em tela cheia"
            className="absolute top-3 right-3 size-9 inline-flex items-center justify-center rounded-full bg-ink/80 border border-slate/60 text-foam/70 hover:text-cyan-brand hover:border-cyan-brand/60 transition-colors backdrop-blur"
          >
            <Expand className="size-4" />
          </button>

          {/* Counter */}
          <div className="absolute top-3 left-3 text-[11px] font-mono text-foam/60 bg-ink/80 border border-slate/60 rounded-full px-3 py-1 backdrop-blur tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>

          {/* Arrows (sempre visíveis em mobile, aparecem no hover em desktop) */}
          {total > 1 ? (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 size-10 inline-flex items-center justify-center rounded-full bg-ink/85 border border-slate/60 text-foam/80 hover:text-cyan-brand hover:border-cyan-brand/60 transition-all backdrop-blur sm:opacity-0 sm:group-hover/stage:opacity-100 focus:opacity-100"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Próxima foto"
                className="absolute right-3 top-1/2 -translate-y-1/2 size-10 inline-flex items-center justify-center rounded-full bg-ink/85 border border-slate/60 text-foam/80 hover:text-cyan-brand hover:border-cyan-brand/60 transition-all backdrop-blur sm:opacity-0 sm:group-hover/stage:opacity-100 focus:opacity-100"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          ) : null}
        </div>

        {/* Caption */}
        {current.caption ? (
          <p className="mt-4 text-sm text-foam/70 text-center max-w-2xl mx-auto">
            {current.caption}
          </p>
        ) : null}

        {/* THUMBNAILS */}
        {total > 1 ? (
          <div className="mt-5 flex gap-2 justify-center flex-wrap">
            {photos.map((p, i) => (
              <button
                key={p.src}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ir para foto ${i + 1}`}
                aria-current={i === index}
                className={`relative h-16 w-20 sm:h-20 sm:w-24 rounded-lg overflow-hidden border-2 transition-all ${
                  i === index
                    ? "border-cyan-brand opacity-100 scale-105"
                    : "border-slate/50 opacity-50 hover:opacity-90 hover:border-slate"
                }`}
              >
                <Image
                  src={p.src}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
                {i === index ? (
                  <span className="absolute inset-0 ring-2 ring-cyan-brand/40 rounded-md pointer-events-none" />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* LIGHTBOX */}
      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto em tela cheia"
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightbox(false)}
        >
          {/* Photo container — não fecha ao clicar */}
          <div
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full max-w-6xl">
              <Image
                src={current.src}
                alt={current.alt}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {current.caption ? (
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-foam/85 bg-ink/85 border border-slate/60 rounded-full px-4 py-2 backdrop-blur max-w-[90%] text-center">
                {current.caption}
              </p>
            ) : null}

            {/* Close */}
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label="Fechar"
              className="absolute top-3 right-3 size-10 inline-flex items-center justify-center rounded-full bg-ink/85 border border-slate/60 text-foam hover:text-cyan-brand hover:border-cyan-brand/60 transition-colors backdrop-blur"
            >
              <X className="size-5" />
            </button>

            {/* Counter no lightbox */}
            <div className="absolute top-3 left-3 text-xs font-mono text-foam/80 bg-ink/85 border border-slate/60 rounded-full px-3 py-1.5 backdrop-blur tabular-nums">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </div>

            {/* Arrows no lightbox */}
            {total > 1 ? (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Foto anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-12 inline-flex items-center justify-center rounded-full bg-ink/85 border border-slate/60 text-foam hover:text-cyan-brand hover:border-cyan-brand/60 transition-colors backdrop-blur"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Próxima foto"
                  className="absolute right-3 top-1/2 -translate-y-1/2 size-12 inline-flex items-center justify-center rounded-full bg-ink/85 border border-slate/60 text-foam hover:text-cyan-brand hover:border-cyan-brand/60 transition-colors backdrop-blur"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
