"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

const NAV = [
  { label: "Sobre", href: "/sobre" },
  { label: "Cases", href: "/cases" },
  { label: "Produtos", href: "/produtos" },
  { label: "Blog", href: "/blog" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "backdrop-blur-xl bg-ink/70 border-b border-slate/50"
          : "bg-transparent",
      )}
    >
      <nav className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
        <Logo size={36} />

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

        <Link
          href="/contato"
          className="inline-flex items-center gap-1.5 rounded-md bg-cyan-brand px-4 py-2 text-sm font-medium text-ink hover:bg-mist transition-colors"
        >
          Falar com a equipe
          <ArrowUpRight className="size-4" />
        </Link>
      </nav>
    </header>
  );
}
