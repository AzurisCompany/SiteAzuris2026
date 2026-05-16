"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import posthog from "posthog-js";

/**
 * Subtle top banner for "lost football fans" traffic.
 * Shows when: cookie `az_fc=1` is set by proxy.ts OR `?fc=1` in URL.
 * Tracks visibility, dismissal, and CTA clicks in PostHog.
 */

const KEY = "az_fc_banner_dismissed";

export function AzurizBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const cookieHit = document.cookie.includes("az_fc=1");
    const urlHit = new URLSearchParams(window.location.search).get("fc") === "1";
    const dismissed = localStorage.getItem(KEY) === "1";

    if ((cookieHit || urlHit) && !dismissed) {
      setShow(true);
      try {
        posthog.capture("azuriz_banner_shown", {
          source: urlHit ? "url" : "cookie",
        });
      } catch {}
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setShow(false);
    try {
      posthog.capture("azuriz_banner_dismissed");
    } catch {}
  };

  const trackCta = () => {
    try {
      posthog.capture("azuriz_banner_cta_clicked", { variant: "subtle" });
    } catch {}
  };

  return (
    <div className="fixed top-16 inset-x-0 z-40 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3 rounded-xl border border-cyan-brand/40 bg-deep/95 backdrop-blur-xl shadow-2xl shadow-cyan-brand/10 px-4 py-3">
          <span className="text-xl shrink-0" aria-hidden>
            ⚽
          </span>
          <p className="text-sm flex-1">
            <span className="font-medium">Procurando o time?</span>{" "}
            <span className="text-foam/70">
              Você caiu no Azuris (com <code className="text-cyan-brand font-mono">S</code>).
              Que tal aprender inglês ouvindo seu time na Premier League?
            </span>{" "}
            <Link
              href="/azuriz"
              onClick={trackCta}
              className="font-medium text-cyan-brand hover:text-mist underline-offset-4 hover:underline"
            >
              Quero ver →
            </Link>
          </p>
          <button
            onClick={dismiss}
            aria-label="Fechar"
            className="shrink-0 size-7 grid place-items-center rounded-md text-foam/40 hover:text-foam hover:bg-slate/40"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
