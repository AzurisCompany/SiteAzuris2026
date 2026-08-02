// A BORDA do e-mail: quem decide se manda, garante que manda uma vez só, e nunca
// deixa uma falha de e-mail derrubar o que importa (o webhook do Asaas).
//
// Regra da casa: e-mail é efeito colateral. Toda função aqui engole o próprio
// erro e loga — quem chama não precisa de try/catch nem de await pra correção.

import { reservarEnvioConfirmacao, liberarEnvioConfirmacao, type InscricaoRow } from '@/lib/db'
import { conteudoCompraConfirmada } from '@/lib/email/conteudo'
import { enviarCompraConfirmada } from '@/lib/email/enviar'

/**
 * Manda a confirmação de pagamento de uma inscrição já marcada como paga.
 * Idempotente por `email_confirmacao_em` — chamar de novo não manda de novo.
 */
export async function notificarPagamentoConfirmado(row: InscricaoRow): Promise<void> {
  try {
    if (row.status !== 'paid') return
    if (!row.email || !row.email.includes('@')) return

    // Reserva ANTES de enviar: dois webhooks simultâneos, um e-mail só.
    if (!(await reservarEnvioConfirmacao(row.id))) return

    const r = await enviarCompraConfirmada({
      para: row.email,
      conteudo: conteudoCompraConfirmada({
        nome: row.nome,
        produtoSlug: row.curso_slug,
        valorCentavos: row.valor_centavos,
        tipoIngresso: row.tipo_ingresso,
      }),
    })

    if (r.ok) {
      console.log(`E-mail de confirmação enviado (inscricao ${row.id}, ${row.email}, resend ${r.id})`)
      return
    }

    // Devolve a reserva pra próxima tentativa (o Asaas reenvia o webhook).
    await liberarEnvioConfirmacao(row.id).catch(() => {})
    console.error(`Falha ao enviar confirmação da inscricao ${row.id}: ${r.erro}`)
  } catch (e) {
    console.error('Falha inesperada ao notificar pagamento confirmado:', e)
  }
}
