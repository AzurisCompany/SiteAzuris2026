import Image from "next/image";
import cv from "@/lib/cv.json";
import { Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/BrandIcons";

export function Founder() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-4 relative">
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-slate/60 bg-deep">
              <Image
                src="/binhara.webp"
                alt={cv.name}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 33vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-4 -right-4 size-24 rounded-full blur-2xl bg-cyan-brand/30 pointer-events-none" />
          </div>

          <div className="md:col-span-8">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-brand mb-3">
              Quem está por trás
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
              {cv.shortName}
            </h2>
            <p className="text-lg md:text-xl text-foam/80 leading-relaxed mb-6">
              {cv.headline}
            </p>
            <p className="text-base text-foam/60 leading-relaxed mb-8">
              Fundador do <span className="text-foam">DSSBR</span>, ex-RD
              Station, ex-Buscapé, professor de pós em Big Data na Positivo,
              palestrante e mentor de times em Sicredi, Logcomex e Unimed.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={cv.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-slate/60 bg-deep px-4 py-2.5 text-sm hover:border-cyan-brand/60 hover:text-cyan-brand transition-colors"
              >
                <LinkedinIcon className="size-4" /> LinkedIn
              </a>
              <a
                href={cv.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-slate/60 bg-deep px-4 py-2.5 text-sm hover:border-cyan-brand/60 hover:text-cyan-brand transition-colors"
              >
                <GithubIcon className="size-4" /> GitHub
              </a>
              <a
                href={`mailto:${cv.email}`}
                className="inline-flex items-center gap-2 rounded-md border border-slate/60 bg-deep px-4 py-2.5 text-sm hover:border-cyan-brand/60 hover:text-cyan-brand transition-colors"
              >
                <Mail className="size-4" /> {cv.email}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
