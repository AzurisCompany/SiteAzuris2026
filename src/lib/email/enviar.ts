import 'server-only'
// MOTOR de envio. `server-only` no topo: se algum componente client importar isto
// (direto ou por tabela), o build quebra na hora em vez de vazar a RESEND_API_KEY
// no bundle. Seguindo o guia portável do Mailia (docs/setup-resend-portavel.md).
//
// Sem chave configurada, `enviar*` devolve { ok:false } em vez de explodir — e-mail
// é efeito colateral: ambiente sem key (preview, CI, dev de outra pessoa) tem que
// continuar funcionando, só sem mandar nada.

import { Resend } from 'resend'
import { CompraConfirmada } from '@/emails/CompraConfirmada'
import { AlertaVendas } from '@/emails/AlertaVendas'
import type { ConteudoEmail } from '@/lib/email/conteudo'
import type { Alerta } from '@/lib/vigilancia'

export type ResultadoEnvio =
  | { readonly ok: true; readonly id: string }
  | { readonly ok: false; readonly erro: string }

const REMETENTE_PADRAO = 'Azuris <no-reply@send.azuris.com.br>'

/** Domínio verificado no Resend (conta Azuris). Remetente fora dele não entrega. */
export const DOMINIO_ENVIO = 'send.azuris.com.br'

function chave(): string | null {
  const k = process.env.RESEND_API_KEY
  return k && k.trim().length > 0 ? k.trim() : null
}

/** Config visível pra tela de saúde/teste — nunca expõe a key, só se existe. */
export function configEmail(): { keyConfigurada: boolean; remetente: string; responderPara: string | null } {
  return { keyConfigurada: chave() !== null, remetente: remetente(), responderPara: responderPara() }
}

function remetente(): string {
  const v = process.env.EMAIL_REMETENTE
  return v && v.trim().length > 0 ? v.trim() : REMETENTE_PADRAO
}

/** Resposta cai numa caixa que alguém lê — o remetente é um no-reply de subdomínio. */
function responderPara(): string | null {
  const v = process.env.EMAIL_RESPONDER_PARA
  return v && v.trim().length > 0 ? v.trim() : null
}

/** Pra onde vão os alertas internos (vigia de vendas). Cai no replyTo se não houver. */
export function destinoAlertas(): string | null {
  const v = process.env.EMAIL_ALERTAS
  return v && v.trim().length > 0 ? v.trim() : responderPara()
}

/** Base dos links dentro dos e-mails. */
export function baseUrl(): string {
  const v = process.env.EMAIL_BASE_URL
  return v && v.trim().length > 0 ? v.trim().replace(/\/+$/, '') : 'https://azuris.com.br'
}

function resultado(data: { id: string } | null, error: { message: string } | null): ResultadoEnvio {
  if (error) return { ok: false, erro: error.message }
  if (!data) return { ok: false, erro: 'Resend não retornou um id de envio.' }
  return { ok: true, id: data.id }
}

/** Alerta interno do vigia de vendas ([[vigilancia]]) — vai pra nós, não pro cliente. */
export async function enviarAlertaVendas(alertas: ReadonlyArray<Alerta>): Promise<ResultadoEnvio> {
  const key = chave()
  if (!key) return { ok: false, erro: 'RESEND_API_KEY ausente — envio desligado neste ambiente.' }
  const para = destinoAlertas()
  if (!para) return { ok: false, erro: 'Sem destino de alerta (defina EMAIL_ALERTAS ou EMAIL_RESPONDER_PARA).' }

  const criticos = alertas.filter((a) => a.severidade === 'critico').length
  const assunto =
    criticos > 0
      ? `🔴 ${criticos} alerta(s) crítico(s) de venda — checkout em risco`
      : `🟡 ${alertas.length} alerta(s) de venda`

  try {
    const { data, error } = await new Resend(key).emails.send({
      from: remetente(),
      to: [para],
      subject: assunto,
      react: AlertaVendas({ alertas, urlAdmin: `${baseUrl()}/admin/ingressos` }),
    })
    return resultado(data, error)
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : 'Falha inesperada no envio.' }
  }
}

export interface EnviarCompraConfirmadaInput {
  readonly para: string
  readonly conteudo: ConteudoEmail
}

export async function enviarCompraConfirmada(input: EnviarCompraConfirmadaInput): Promise<ResultadoEnvio> {
  const key = chave()
  if (!key) return { ok: false, erro: 'RESEND_API_KEY ausente — envio desligado neste ambiente.' }

  const reply = responderPara()
  try {
    const { data, error } = await new Resend(key).emails.send({
      from: remetente(),
      to: [input.para],
      subject: input.conteudo.assunto,
      ...(reply ? { replyTo: reply } : {}),
      // `react` faz o SDK gerar HTML e a versão texto plano — não renderizamos à mão.
      react: CompraConfirmada({ conteudo: input.conteudo }),
    })
    return resultado(data, error)
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : 'Falha inesperada no envio.' }
  }
}
