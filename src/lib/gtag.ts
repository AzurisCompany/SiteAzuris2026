// Helper pra enviar eventos ao GA4 (Google tag GT-NNZW5FW) com segurança no client.
// `window.gtag` é injetado pelo gtag.js carregado no layout. Se não existir (SSR,
// bloqueador de anúncios), o evento é simplesmente ignorado.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export type GaParams = Record<string, unknown>;

export function gaEvent(name: string, params: GaParams = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  // transport_type beacon garante o envio mesmo durante navegação
  // (ex.: redirect pro checkout do Asaas logo após o submit).
  window.gtag("event", name, { transport_type: "beacon", ...params });
}
