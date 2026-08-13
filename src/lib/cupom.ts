// Cupom de desconto de vendedora — link assinado, sem tabela.
//
// A vendedora gera o link sozinha em /vendas; o link carrega um token assinado
// (HMAC-SHA256) e NUNCA um preço. Quem calcula o valor é sempre o servidor, em
// [[checkout-produto]]: o cupom só concede o PERCENTUAL, aplicado em cima do
// preço que o checkout já derivou do tipo de ingresso.
//
// O prazo de validade está DENTRO do que é assinado — esticar a data invalida a
// assinatura. Por isso o link expira sozinho, sem banco e sem cron.
//
// Contrapartida assumida (ver doc): sem tabela, um link não é revogável antes de
// vencer. Ele morre em VALIDADE_HORAS_PADRAO e ponto.
import { createHmac, timingSafeEqual } from 'node:crypto'
import { TZ_BR } from '@/lib/format'

/** Teto de desconto que o sistema aceita conceder, aconteça o que acontecer. */
export const CUPOM_PCT_MAX = 20
/** Quanto tempo um link recém-gerado vale. */
export const VALIDADE_HORAS_PADRAO = 48
/** Desconto padrão da vendedora. */
export const CUPOM_PCT_PADRAO = 10

export interface Cupom {
  /** código do cupom (minúsculas) — vira utm_content e liga a venda ao dono */
  codigo: string
  /** slug do produto ao qual o cupom se aplica */
  produto: string
  /** desconto em % inteiro (10 = 10%) */
  pct: number
  /** expiração em epoch ms */
  exp: number
}

const SEPARADOR = '|'
const RE_CODIGO = /^[a-z0-9-]{3,40}$/
const RE_PRODUTO = /^[a-z0-9-]{2,60}$/

/**
 * Forma canônica de um código: minúsculas, sem acento, só letras/números/hífen.
 * A pessoa digita `CEL 01`, `cel-01` ou `CEL01` e tudo bate na mesma linha —
 * ninguém deveria errar um cupom por causa de caixa alta.
 */
export function normalizarCodigo(bruto: string | null | undefined): string {
  return (bruto ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

/** True se o código tem forma utilizável (3+ caracteres depois de normalizado). */
export function codigoValido(codigo: string): boolean {
  return RE_CODIGO.test(codigo)
}

/**
 * Segredo da assinatura. `CUPOM_SECRET` de preferência; cai no mesmo segredo da
 * sessão admin pra não exigir env nova só pra isto funcionar.
 */
function secret(): string {
  return process.env.CUPOM_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || ''
}

function sign(data: string, chave: string): string {
  // 32 hex = 128 bits de assinatura. Suficiente e mantém o link curto pro WhatsApp.
  return createHmac('sha256', chave).update(data).digest('hex').slice(0, 32)
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

/** Assina um cupom. Lança se não houver segredo — melhor quebrar do que emitir link forjável. */
export function assinarCupom(c: Cupom): string {
  const chave = secret()
  if (!chave) throw new Error('Sem segredo pra assinar cupom (CUPOM_SECRET / ADMIN_SESSION_SECRET / ADMIN_PASSWORD)')
  if (!RE_CODIGO.test(c.codigo)) throw new Error(`Código de cupom inválido: ${c.codigo}`)
  if (!RE_PRODUTO.test(c.produto)) throw new Error(`Produto inválido: ${c.produto}`)
  if (!Number.isInteger(c.pct) || c.pct < 1 || c.pct > CUPOM_PCT_MAX) throw new Error(`Percentual inválido: ${c.pct}`)
  const payload = Buffer.from([c.codigo, c.produto, String(c.pct), String(c.exp)].join(SEPARADOR)).toString(
    'base64url'
  )
  return `${payload}.${sign(payload, chave)}`
}

/**
 * Lê e valida um token. Devolve null pra QUALQUER coisa suspeita — assinatura
 * errada, vencido, produto diferente, percentual acima do teto. Null = checkout
 * segue no preço cheio, nunca um erro na cara do cliente.
 */
export function lerCupom(token: string | null | undefined, produtoEsperado: string, agoraMs = Date.now()): Cupom | null {
  if (!token) return null
  const chave = secret()
  if (!chave) return null // sem segredo não há como verificar: nega.

  const ponto = token.lastIndexOf('.')
  if (ponto < 1) return null
  const payload = token.slice(0, ponto)
  const sig = token.slice(ponto + 1)
  if (!safeEqual(sig, sign(payload, chave))) return null

  let partes: string[]
  try {
    partes = Buffer.from(payload, 'base64url').toString().split(SEPARADOR)
  } catch {
    return null
  }
  if (partes.length !== 4) return null

  const [codigo, produto, pctStr, expStr] = partes
  const pct = Number(pctStr)
  const exp = Number(expStr)

  if (!RE_CODIGO.test(codigo)) return null
  if (produto !== produtoEsperado) return null
  // Percentual fora do teto = bug nosso ou segredo vazado. Nos dois casos, nega.
  if (!Number.isInteger(pct) || pct < 1 || pct > CUPOM_PCT_MAX) return null
  if (!Number.isFinite(exp) || exp <= agoraMs) return null

  return { codigo, produto, pct, exp }
}

/** Cria um cupom válido por N horas a partir de agora. */
export function criarCupom(
  entrada: { codigo: string; produto: string; pct?: number; horas?: number },
  agoraMs = Date.now()
): { token: string; cupom: Cupom } {
  const cupom: Cupom = {
    codigo: entrada.codigo,
    produto: entrada.produto,
    pct: entrada.pct ?? CUPOM_PCT_PADRAO,
    exp: agoraMs + (entrada.horas ?? VALIDADE_HORAS_PADRAO) * 60 * 60 * 1000,
  }
  return { token: assinarCupom(cupom), cupom }
}

/**
 * Aplica o desconto sobre um valor em centavos, arredondando pro centavo mais
 * próximo. Centavos (inteiro) justamente pra não acumular erro de float no
 * caminho até o Asaas.
 */
export function aplicarDesconto(centavos: number, pct: number): number {
  if (!Number.isInteger(pct) || pct < 1) return centavos
  const efetivo = Math.min(pct, CUPOM_PCT_MAX)
  return Math.round(centavos * (1 - efetivo / 100))
}

/** "15/08 às 14h32" no fuso de Curitiba — o que a vendedora e o cliente leem. */
export function formatarValidade(expMs: number): string {
  const d = new Date(expMs)
  const data = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ_BR, day: '2-digit', month: '2-digit' }).format(d)
  const hora = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ_BR,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
  return `${data} às ${hora.replace(':', 'h')}`
}
