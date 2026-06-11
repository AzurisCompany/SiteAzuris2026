"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ArrowRight, GraduationCap } from "lucide-react";
import posthog from "posthog-js";
import { gaEvent } from "@/lib/gtag";

/**
 * Banner flutuante de chamada do curso nas páginas internas.
 * - Some na home (já tem o CourseBanner) e nas páginas do próprio curso / takeover.
 * - Dismissível com persistência em localStorage.
 * - Fica embaixo-esquerda pra NÃO colidir com o WhatsAppFab (embaixo-direita, z-50).
 */

const KEY = "course_floating_dismissed";
const HIDE_PREFIXES = ["/lakehouse-comunidade", "/produtos/curso-pipelines", "/azuriz"];

export function CourseFloatingBanner() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const hidden =
      pathname === "/" || HIDE_PREFIXES.some((p) => pathname.startsWith(p));
    if (hidden || localStorage.getItem(KEY) === "1") {
      setShow(false);
      return;
    }
    const t = setTimeout(() => {
      setShow(true);
      try {
        posthog.capture("course_floating_shown", { path: pathname });
      } catch {}
    }, 1200);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (!show) {
      setEntered(false);
      return;
    }
    const r = setTimeout(() => setEntered(true), 20);
    return () => clearTimeout(r);
  }, [show]);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setShow(false);
    try {
      posthog.capture("course_floating_dismissed");
    } catch {}
  };

  const onCta = () => {
    gaEvent("select_promotion", {
      promotion_name: "lakehouse_floating",
      creative_slot: "floating_banner",
    });
    try {
      posthog.capture("course_floating_clicked", { path: pathname });
    } catch {}
  };

  return (
    <div
      className={`fixed bottom-4 left-4 right-24 z-40 transition-all duration-300 sm:right-auto sm:max-w-sm ${
        entered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-cyan-brand/35 bg-deep/95 px-4 py-3 shadow-2xl shadow-cyan-brand/10 backdrop-blur-xl">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan-brand/30 bg-cyan-brand/15 text-cyan-brand">
          <GraduationCap className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-widest text-cyan-brand">
            Curso · Lote 1 aberto
          </div>
          <Link
            href="/lakehouse-comunidade/?utm_source=floating&utm_medium=banner&utm_campaign=lakehouse-t1-l1"
            onClick={onCta}
            className="group inline-flex items-center gap-1 text-sm font-semibold text-foam transition-colors hover:text-cyan-brand"
          >
            Lakehouse: Pipeline na Prática
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="grid size-7 shrink-0 place-items-center rounded-md text-foam/40 hover:bg-slate/40 hover:text-foam"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
