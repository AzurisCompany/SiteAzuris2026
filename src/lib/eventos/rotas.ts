// Prefixos das rotas de evento presencial — a lista que os widgets globais consultam.
//
// Página de evento tem cara de marketplace do produtor (GU, DSSBR), não da Azuris:
// WhatsAppFab e CourseFloatingBanner são escondidos ali porque quebravam a ilusão e,
// no mobile, cobriam o card de ingressos. Isso vivia escrito em cada widget; virou
// lista única quando o café entrou e herdou o bug do GU (o botão de WhatsApp voltou
// a aparecer numa rota de evento). O canário amarra esta lista ao `baseUrl` de cada
// evento em cartaz — rota nova sem entrada aqui reprova.

export const ROTAS_EVENTO = ['/gubigdata', '/cafe-networking'] as const

/** true se o caminho é (ou está dentro de) uma rota de evento presencial. */
export function ehRotaDeEvento(pathname: string | null | undefined): boolean {
  return ROTAS_EVENTO.some((r) => pathname?.startsWith(r) ?? false)
}
