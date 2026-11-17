// Link "Adicionar à Google Agenda" (template de evento, sem API nem OAuth): abre a
// agenda da pessoa com título, horário, local e descrição preenchidos. Puro — vai
// no e-mail de confirmação do ingresso online ([[eventos/tipos]] `transmissao`).

export interface EventoAgenda {
  titulo: string
  /** `AAAAMMDDTHHMMSSZ` (UTC) */
  inicioUTC: string
  fimUTC: string
  detalhes: string
  local: string
}

export function linkGoogleAgenda(e: EventoAgenda): string {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.titulo,
    dates: `${e.inicioUTC}/${e.fimUTC}`,
    details: e.detalhes,
    location: e.local,
    ctz: 'America/Sao_Paulo',
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}
