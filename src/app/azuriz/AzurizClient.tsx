"use client";

import { useEffect } from "react";
import { ArrowRight, Goal, Languages, Mic, Trophy } from "lucide-react";
import posthog from "posthog-js";

const ETT_URL = "https://englishtalktime.com.br/?utm_source=azuris&utm_medium=azuriz_takeover&utm_campaign=fc_redirect";

export function AzurizClient() {
  useEffect(() => {
    try {
      posthog.capture("azuriz_page_viewed", {
        referrer: document.referrer,
        variant: "takeover",
      });
    } catch {}
  }, []);

  const trackCta = (where: string) => {
    try {
      posthog.capture("azuriz_cta_clicked", { where, variant: "takeover" });
    } catch {}
  };

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-[80svh] flex items-center overflow-hidden bg-ink">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 20%, rgba(20,183,222,0.18) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-brand mb-6">
            <Goal className="size-4" />
            Ô, torcedor
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[0.95]">
            Site errado.
            <br />
            <span className="text-brand-gradient">
              Mas pode ser sua chance.
            </span>
          </h1>

          <p className="mt-8 max-w-2xl mx-auto text-lg md:text-xl text-foam/80 leading-relaxed">
            Você procurava o <span className="font-mono text-foam">azuri<b>z</b></span>{" "}
            (com Z, o time). Caiu no <span className="font-mono text-foam">azuri<b>s</b></span>{" "}
            (com S, engenharia de dados). Já que você tá aqui, presta atenção:
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Mic, text: "Quantos gols você não entendeu o comentário da TV gringa?" },
              { icon: Languages, text: "Quantas entrevistas do seu craque você não viu por causa do inglês?" },
              { icon: Trophy, text: "Quantos jogos você viu em sites duvidosos por não achar o oficial?" },
            ].map((q, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate/60 bg-deep/80 p-6 text-left"
              >
                <q.icon className="size-5 text-cyan-brand mb-3" />
                <p className="text-sm text-foam/80 leading-relaxed">{q.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <p className="text-lg md:text-xl text-foam/70 mb-8 max-w-xl mx-auto">
              A gente também tem um produto. Se chama{" "}
              <span className="text-cyan-brand font-semibold">English Talk Time</span>.
              Ensina inglês com IA, focado em quem ama esporte.
            </p>

            <a
              href={ETT_URL}
              onClick={() => trackCta("hero")}
              className="group inline-flex items-center gap-2 rounded-md bg-cyan-brand px-8 py-4 text-base md:text-lg font-medium text-ink hover:bg-mist transition-colors"
            >
              Quero ver inglês pra torcedor
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Pitch direto */}
      <section className="py-24 md:py-32 bg-deep">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6">
            Por que ETT funciona pra você?
          </h2>
          <ul className="space-y-4 text-lg text-foam/80">
            <li className="flex gap-4 items-start">
              <span className="shrink-0 size-7 grid place-items-center rounded-md bg-cyan-brand/15 text-cyan-brand font-mono text-sm font-semibold">
                1
              </span>
              <span>
                <strong className="text-foam">Conversação real</strong> — você fala com uma IA que
                escuta seu sotaque e te corrige na hora.
              </span>
            </li>
            <li className="flex gap-4 items-start">
              <span className="shrink-0 size-7 grid place-items-center rounded-md bg-cyan-brand/15 text-cyan-brand font-mono text-sm font-semibold">
                2
              </span>
              <span>
                <strong className="text-foam">Temas de esporte</strong> — vocabulário de comentarista,
                gírias de torcida, frases de entrevista pós-jogo.
              </span>
            </li>
            <li className="flex gap-4 items-start">
              <span className="shrink-0 size-7 grid place-items-center rounded-md bg-cyan-brand/15 text-cyan-brand font-mono text-sm font-semibold">
                3
              </span>
              <span>
                <strong className="text-foam">15 minutos por dia</strong> — no celular, no intervalo
                do jogo. Sem aula chata de gramática.
              </span>
            </li>
          </ul>

          <div className="mt-12 flex flex-wrap gap-4 items-center">
            <a
              href={ETT_URL}
              onClick={() => trackCta("middle")}
              className="inline-flex items-center gap-2 rounded-md bg-cyan-brand px-6 py-3.5 text-base font-medium text-ink hover:bg-mist transition-colors"
            >
              Conhecer o ETT
              <ArrowRight className="size-4" />
            </a>
            <a
              href="/"
              className="text-sm text-foam/50 hover:text-foam"
              onClick={() => trackCta("declined")}
            >
              Não, valeu — quero ver o site sério
            </a>
          </div>
        </div>
      </section>

      {/* Footer da landing */}
      <section className="py-16 bg-ink border-t border-slate/40">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm text-foam/40">
            P.S.: se você procurava engenharia de dados mesmo, bem-vindo. Dá uma olhada{" "}
            <a href="/" className="text-cyan-brand hover:text-mist">na home</a>.
          </p>
        </div>
      </section>
    </>
  );
}
