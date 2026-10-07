import { permanentRedirect } from 'next/navigation'

// O Passe One Day teve as vendas encerradas em 07/10/2026 (último preço: Lote 3, R$357).
// A rota fica de pé porque o link circulou em WhatsApp, e-mail e com as vendedoras: em vez
// de 404, quem chega cai no FullPass. O checkout (/api/dss-one-day/inscricao) foi
// removido — ninguém compra mais One Day pelo site. Venda pontual: cobrança avulsa no admin.
export default function OneDayEncerrado() {
  permanentRedirect('/dssbr-2026/inscricao')
}
