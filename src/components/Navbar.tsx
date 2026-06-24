"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Menu, X } from "lucide-react";

const NAV = [
  { label: "Serviços", href: "/servicos" },
  { label: "Cases", href: "/cases" },
  { label: "Produtos", href: "/produtos" },
  { label: "Comunidade", href: "/comunidade" },
  { label: "Blog", href: "/blog" },
  { label: "Sobre", href: "/sobre" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // lock scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled || open
            ? "backdrop-blur-xl bg-ink/70 border-b border-slate/50"
            : "bg-transparent",
        )}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          <Logo size={32} className="shrink-0" />

          <ul className="hidden md:flex items-center gap-1 text-sm">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="px-3 py-2 rounded-md text-foam/80 hover:text-foam hover:bg-slate/40 transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              href="/contato"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-cyan-brand px-4 py-2 text-sm font-medium text-ink hover:bg-mist transition-colors"
            >
              Falar com a equipe
              <ArrowUpRight className="size-4" />
            </Link>
            <Link
              href="/contato"
              aria-label="Falar com a equipe"
              className="sm:hidden inline-flex items-center gap-1.5 rounded-md bg-cyan-brand px-3 py-2 text-sm font-medium text-ink"
            >
              Falar
              <ArrowUpRight className="size-4" />
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              className="md:hidden inline-flex items-center justify-center size-10 rounded-md border border-slate/60 bg-deep/60 text-foam hover:border-cyan-brand/60 transition-colors"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-40 transition-opacity duration-300",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
      >
        <div
          className="absolute inset-0 bg-ink/80 backdrop-blur-md"
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <div
          className={cn(
            "absolute top-16 inset-x-0 border-b border-slate/50 bg-ink/95 backdrop-blur-xl",
            "transition-transform duration-300",
            open ? "translate-y-0" : "-translate-y-4",
          )}
        >
          <ul className="px-4 py-6 space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 rounded-md text-base text-foam/90 hover:bg-slate/40 hover:text-foam transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
