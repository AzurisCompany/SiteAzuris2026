import { permanentRedirect } from 'next/navigation'

// O combo One Day + curso (R$360) foi encerrado em 25/08/2026 — o combo com curso
// existe só no FullPass agora. A rota fica de pé porque o link circulou em WhatsApp e
// e-mail: em vez de 404, quem chega cai no combo vigente. O checkout antigo
// (/api/dss-one-day-curso) foi removido — ninguém compra mais pelo preço velho.
export default function OneDayCursoEncerrado() {
  permanentRedirect('/dssbr-2026/fullpass-curso')
}
