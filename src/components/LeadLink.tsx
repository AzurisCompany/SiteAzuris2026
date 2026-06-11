"use client";

import type { ReactNode } from "react";
import { gaEvent } from "@/lib/gtag";

interface Props {
  href: string;
  /** Canal do contato — vira o parâmetro `method` do evento generate_lead. */
  method: string;
  className?: string;
  target?: string;
  rel?: string;
  children: ReactNode;
}

/**
 * Link de contato que dispara `generate_lead` no GA4 ao ser clicado.
 * Usado nos cards de email/telefone do /contato.
 */
export function LeadLink({ href, method, className, target, rel, children }: Props) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={className}
      onClick={() => gaEvent("generate_lead", { method })}
    >
      {children}
    </a>
  );
}
