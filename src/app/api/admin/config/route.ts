// POST /api/admin/config  (protegido)
// Salva um parâmetro de config financeira (meta mensal / alíquota de imposto).
import { NextResponse } from 'next/server'
import { estaLogado } from '@/lib/admin-auth'
import { setConfigFinanceiro } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CHAVES_NUMERICAS = new Set(['meta_mensal_centavos', 'aliquota_imposto_pct'])
const CHAVES_TEXTO = new Set(['nf_servico_descricao', 'nf_municipal_service_code', 'nf_municipal_service_name'])
/** Texto multilinha (cadastro de vendedoras — ver [[cupom]]); cabe mais que os 500 do resto. */
const CHAVES_TEXTO_LONGO = new Set(['vendedoras'])
const LIMITE_TEXTO = 500
const LIMITE_TEXTO_LONGO = 4000

export async function POST(request: Request) {
  if (!(await estaLogado())) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  }
  let body: { chave?: string; valor?: string | number }
  try {
    body = (await request.json()) as { chave?: string; valor?: string | number }
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const chave = body.chave
  if (!chave || (!CHAVES_NUMERICAS.has(chave) && !CHAVES_TEXTO.has(chave) && !CHAVES_TEXTO_LONGO.has(chave))) {
    return NextResponse.json({ error: 'chave inválida' }, { status: 400 })
  }

  let canonico: string
  if (CHAVES_TEXTO.has(chave) || CHAVES_TEXTO_LONGO.has(chave)) {
    const limite = CHAVES_TEXTO_LONGO.has(chave) ? LIMITE_TEXTO_LONGO : LIMITE_TEXTO
    canonico = String(body.valor ?? '').trim().slice(0, limite)
  } else {
    const num = Number(body.valor)
    if (!Number.isFinite(num) || num < 0) {
      return NextResponse.json({ error: 'valor inválido' }, { status: 400 })
    }
    if (chave === 'aliquota_imposto_pct' && num > 100) {
      return NextResponse.json({ error: 'alíquota deve estar entre 0 e 100' }, { status: 400 })
    }
    // meta guardada em centavos (inteiro); alíquota em % (aceita 2 casas).
    canonico = chave === 'meta_mensal_centavos' ? String(Math.round(num)) : String(Number(num.toFixed(2)))
  }

  await setConfigFinanceiro(chave, canonico)
  return NextResponse.json({ ok: true, chave, valor: canonico })
}
