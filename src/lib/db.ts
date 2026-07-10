// Helper de conexão Postgres (Vercel Postgres / Neon).
// Usado pelas route handlers da inscrição e do webhook do Asaas.

import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

// Inicialização preguiçosa — só conecta na primeira query.
// Necessário pra build não quebrar quando POSTGRES_URL não está disponível
// (Vercel Postgres env vars são "sensitive" e não vêm em vercel env pull).
let _sql: NeonQueryFunction<false, false> | null = null

function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql
  const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('POSTGRES_URL/DATABASE_URL não configurada em runtime. Veja Vercel Storage.')
  }
  _sql = neon(connectionString)
  return _sql
}

// Proxy que delega tudo pra getSql(). Permite usar `sql\`...\`` igual antes.
export const sql = new Proxy(((..._args: unknown[]) => {}) as unknown as NeonQueryFunction<false, false>, {
  apply(_target, _thisArg, args: unknown[]) {
    return (getSql() as unknown as (...a: unknown[]) => unknown)(...args)
  },
  get(_target, prop: string) {
    const realSql = getSql() as unknown as Record<string, unknown>
    return realSql[prop]
  },
})

// --- Tipos ---

// PIX/CREDIT_CARD/BOLETO = método fixo; UNDEFINED = cliente escolhe entre os
// meios ativos na conta Asaas (usado só nas cobranças avulsas com 2+ meios).
export type BillingType = 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED'
export type InscricaoStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
export type Lote = 'lote1' | 'lote2' | 'unico'

export interface InscricaoRow {
  id: number
  curso_slug: string
  lote: Lote
  tipo_ingresso: string | null
  nome: string
  email: string
  cpf_cnpj: string
  telefone: string | null
  billing_type: BillingType
  valor_centavos: number
  installments: number
  status: InscricaoStatus
  asaas_customer_id: string | null
  asaas_payment_id: string | null
  asaas_invoice_url: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  created_at: string
  updated_at: string
  paid_at: string | null
  // --- dados extras do cliente (capturados no checkout) ---
  empresa: string | null
  cargo: string | null
  pessoa_tipo: 'PF' | 'PJ' | null
  razao_social: string | null
  nf_endereco: Record<string, string> | null
  como_conheceu: string | null
  consentimento_lgpd: boolean
  consentimento_em: string | null
  // --- consolidação financeira (Asaas) ---
  valor_liquido_centavos: number | null
  taxa_centavos: number | null
  due_date: string | null
  asaas_status: string | null
  pago_em: string | null
  last_synced_at: string | null
  // --- marcação manual ---
  is_teste: boolean // registro de teste/sandbox: some da lista e dos KPIs por padrão
  // --- Nota Fiscal (Asaas NFS-e) ---
  nf_id: string | null
  nf_status: string | null
  nf_numero: string | null
  nf_pdf_url: string | null
  nf_xml_url: string | null
}

// --- Config financeira (meta mensal, alíquota de imposto) ---

/** Lê toda a config financeira como mapa chave→valor. Tolerante à tabela ainda não existir. */
export async function getConfigsFinanceiro(): Promise<Record<string, string>> {
  try {
    const rows = (await sql`SELECT chave, valor FROM config_financeiro`) as Array<{ chave: string; valor: string }>
    const m: Record<string, string> = {}
    for (const r of rows) m[r.chave] = r.valor
    return m
  } catch {
    return {} // tabela ainda não migrada — degrada pra vazio
  }
}

/** Upsert de um parâmetro de config financeira. */
export async function setConfigFinanceiro(chave: string, valor: string): Promise<void> {
  await sql`
    INSERT INTO config_financeiro (chave, valor, updated_at) VALUES (${chave}, ${valor}, NOW())
    ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()
  `
}

// --- Capacidade de lote ---

export const LOTE_CAPACIDADE: Record<'lote1' | 'lote2', number> = {
  lote1: 15,
  lote2: 20,
}

/** Retorna o lote atualmente vendendo (lote1 enquanto tiver vaga; senão lote2). */
export async function determinarLoteAtivo(): Promise<{
  lote: Lote
  vagasRestantes: number
  preco_centavos: number
}> {
  const rows = (await sql`
    SELECT lote, reservadas
    FROM v_vagas_por_lote
  `) as Array<{ lote: Lote; reservadas: number }>

  const reservadasMap: Record<string, number> = {}
  for (const r of rows) reservadasMap[r.lote] = Number(r.reservadas)

  const reservadasLote1 = reservadasMap.lote1 ?? 0
  if (reservadasLote1 < LOTE_CAPACIDADE.lote1) {
    return {
      lote: 'lote1',
      vagasRestantes: LOTE_CAPACIDADE.lote1 - reservadasLote1,
      preco_centavos: 55000, // R$ 550,00
    }
  }

  const reservadasLote2 = reservadasMap.lote2 ?? 0
  return {
    lote: 'lote2',
    vagasRestantes: Math.max(0, LOTE_CAPACIDADE.lote2 - reservadasLote2),
    preco_centavos: 75000, // R$ 750,00
  }
}

/**
 * Modelo por AUDIENCIA (não por esgotamento):
 * - membro do GU BigData IA / ex-participante do DSSBR → lote1, R$ 550
 * - não-membro → lote2, R$ 750
 */
export type PerfilLakehouse = 'membro' | 'nao-membro'

export const PRECO_POR_PERFIL: Record<
  PerfilLakehouse,
  { lote: 'lote1' | 'lote2'; preco_centavos: number }
> = {
  membro: { lote: 'lote1', preco_centavos: 55000 }, // R$ 550,00
  'nao-membro': { lote: 'lote2', preco_centavos: 75000 }, // R$ 750,00
}

export function normalizarPerfil(v: unknown): PerfilLakehouse {
  return v === 'nao-membro' ? 'nao-membro' : 'membro'
}

/** Retorna lote/preço/vagas pro perfil escolhido (self-declared no checkout). */
export async function determinarLotePorPerfil(perfil: PerfilLakehouse): Promise<{
  lote: Lote
  vagasRestantes: number
  preco_centavos: number
}> {
  const { lote, preco_centavos } = PRECO_POR_PERFIL[perfil]

  const rows = (await sql`
    SELECT lote, reservadas
    FROM v_vagas_por_lote
  `) as Array<{ lote: Lote; reservadas: number }>

  const reservadasMap: Record<string, number> = {}
  for (const r of rows) reservadasMap[r.lote] = Number(r.reservadas)

  const reservadas = reservadasMap[lote] ?? 0
  const capacidade = LOTE_CAPACIDADE[lote as 'lote1' | 'lote2']
  return {
    lote,
    vagasRestantes: Math.max(0, capacidade - reservadas),
    preco_centavos,
  }
}

// --- CRUD ---

export interface NovaInscricaoPendente {
  curso_slug: string
  lote: Lote
  tipo_ingresso?: string | null
  nome: string
  email: string
  cpf_cnpj: string
  telefone: string | null
  billing_type: BillingType
  valor_centavos: number
  installments: number
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  // dados extras
  empresa: string | null
  cargo: string | null
  pessoa_tipo: 'PF' | 'PJ' | null
  razao_social: string | null
  nf_endereco: Record<string, string> | null
  como_conheceu: string | null
  consentimento_lgpd: boolean
  consentimento_em: string | null
}

/**
 * Grava a inscrição como 'pending' ANTES de chamar o Asaas, com todos os dados do
 * cliente. Garante que o lead nunca se perde mesmo se o Asaas falhar depois.
 * Os campos asaas_* ficam nulos até vincularAsaas().
 */
export async function criarInscricaoPendente(i: NovaInscricaoPendente): Promise<InscricaoRow> {
  const rows = (await sql`
    INSERT INTO inscricoes (
      curso_slug, lote, tipo_ingresso, nome, email, cpf_cnpj, telefone,
      billing_type, valor_centavos, installments,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      empresa, cargo, pessoa_tipo, razao_social, nf_endereco, como_conheceu,
      consentimento_lgpd, consentimento_em
    ) VALUES (
      ${i.curso_slug}, ${i.lote}, ${i.tipo_ingresso ?? null}, ${i.nome}, ${i.email}, ${i.cpf_cnpj}, ${i.telefone},
      ${i.billing_type}, ${i.valor_centavos}, ${i.installments},
      ${i.utm_source}, ${i.utm_medium}, ${i.utm_campaign}, ${i.utm_content}, ${i.utm_term},
      ${i.empresa}, ${i.cargo}, ${i.pessoa_tipo}, ${i.razao_social},
      ${i.nf_endereco ? JSON.stringify(i.nf_endereco) : null}::jsonb, ${i.como_conheceu},
      ${i.consentimento_lgpd}, ${i.consentimento_em}
    )
    RETURNING *
  `) as InscricaoRow[]
  return rows[0]
}

/**
 * Anti-duplicação: procura uma cobrança IDÊNTICA já criada (com fatura no Asaas)
 * numa janela curta — mesmo produto, documento, valor e tipo. Serve pra barrar
 * clique/submit duplicado (2 faturas pro mesmo cliente). Ignora canceladas e
 * inscrições que não chegaram a gerar cobrança (asaas_payment_id nulo).
 */
export interface ChaveDedupe {
  curso_slug: string
  cpf_cnpj: string
  valor_centavos: number
  tipo_ingresso?: string | null
  janelaMin?: number
}

export async function buscarCobrancaDuplicada(k: ChaveDedupe): Promise<InscricaoRow | null> {
  const janela = k.janelaMin ?? 10
  const rows = (await sql`
    SELECT *
      FROM inscricoes
     WHERE curso_slug = ${k.curso_slug}
       AND cpf_cnpj = ${k.cpf_cnpj}
       AND valor_centavos = ${k.valor_centavos}
       AND tipo_ingresso IS NOT DISTINCT FROM ${k.tipo_ingresso ?? null}
       AND asaas_payment_id IS NOT NULL
       AND status <> 'cancelled'
       AND created_at > NOW() - make_interval(mins => ${janela})
     ORDER BY created_at DESC
     LIMIT 1
  `) as InscricaoRow[]
  return rows[0] ?? null
}

/** Vincula os dados do Asaas à inscrição depois que a cobrança foi criada. */
export interface VinculoAsaas {
  asaas_customer_id: string | null
  asaas_payment_id: string | null
  asaas_invoice_url: string | null
  valor_liquido_centavos: number | null
  taxa_centavos: number | null
  due_date: string | null
  asaas_status: string | null
}

export async function vincularAsaas(id: number, v: VinculoAsaas): Promise<void> {
  await sql`
    UPDATE inscricoes
       SET asaas_customer_id = ${v.asaas_customer_id},
           asaas_payment_id = ${v.asaas_payment_id},
           asaas_invoice_url = ${v.asaas_invoice_url},
           valor_liquido_centavos = ${v.valor_liquido_centavos},
           taxa_centavos = ${v.taxa_centavos},
           due_date = ${v.due_date},
           asaas_status = ${v.asaas_status},
           updated_at = NOW()
     WHERE id = ${id}
  `
}

/** Conjunto de asaas_payment_id já presentes no banco — pra diferenciar o que
 *  existe só no Asaas (cobrança criada no painel). */
export async function idsAsaasNoBanco(): Promise<Set<string>> {
  const rows = (await sql`
    SELECT asaas_payment_id FROM inscricoes WHERE asaas_payment_id IS NOT NULL
  `) as Array<{ asaas_payment_id: string }>
  return new Set(rows.map((r) => r.asaas_payment_id))
}

/** Dados pra importar uma cobrança que já existe no Asaas mas não no banco. */
export interface InscricaoImportada {
  curso_slug: string
  nome: string
  email: string
  cpf_cnpj: string
  telefone: string | null
  billing_type: BillingType
  valor_centavos: number
  installments: number
  status: InscricaoStatus
  asaas_customer_id: string
  asaas_payment_id: string
  asaas_invoice_url: string | null
  valor_liquido_centavos: number | null
  taxa_centavos: number | null
  due_date: string | null
  asaas_status: string | null
  pago_em: string | null
  como_conheceu: string | null // guarda a descrição original do Asaas
  is_teste: boolean
}

/**
 * Cria uma inscrição a partir de uma cobrança já existente no Asaas (criada no
 * painel, fora do nosso checkout). Idempotente: se o asaas_payment_id (UNIQUE) já
 * existir, não duplica e devolve a linha existente. lote='unico' (avulso não tem lote).
 */
export async function criarInscricaoImportada(i: InscricaoImportada): Promise<{ row: InscricaoRow; jaExistia: boolean }> {
  const paid_at = i.status === 'paid' ? i.pago_em ?? new Date().toISOString() : null
  const rows = (await sql`
    INSERT INTO inscricoes (
      curso_slug, lote, nome, email, cpf_cnpj, telefone,
      billing_type, valor_centavos, installments, status,
      asaas_customer_id, asaas_payment_id, asaas_invoice_url,
      valor_liquido_centavos, taxa_centavos, due_date, asaas_status, pago_em, paid_at,
      como_conheceu, consentimento_lgpd, is_teste, last_synced_at
    ) VALUES (
      ${i.curso_slug}, 'unico', ${i.nome}, ${i.email}, ${i.cpf_cnpj}, ${i.telefone},
      ${i.billing_type}, ${i.valor_centavos}, ${i.installments}, ${i.status},
      ${i.asaas_customer_id}, ${i.asaas_payment_id}, ${i.asaas_invoice_url},
      ${i.valor_liquido_centavos}, ${i.taxa_centavos}, ${i.due_date}, ${i.asaas_status}, ${i.pago_em}, ${paid_at},
      ${i.como_conheceu}, false, ${i.is_teste}, NOW()
    )
    ON CONFLICT (asaas_payment_id) DO NOTHING
    RETURNING *
  `) as InscricaoRow[]
  if (rows.length > 0) return { row: rows[0], jaExistia: false }
  // Conflito: já existia — devolve a linha atual.
  const existentes = (await sql`
    SELECT * FROM inscricoes WHERE asaas_payment_id = ${i.asaas_payment_id} LIMIT 1
  `) as InscricaoRow[]
  return { row: existentes[0], jaExistia: true }
}

/** Atualiza valores de uma cobrança editada no Asaas (novo valor/vencimento). */
export async function atualizarCobrancaEditada(
  id: number,
  v: { valor_centavos: number; valor_liquido_centavos: number | null; taxa_centavos: number | null; due_date: string | null }
): Promise<InscricaoRow | null> {
  const rows = (await sql`
    UPDATE inscricoes
       SET valor_centavos = ${v.valor_centavos},
           valor_liquido_centavos = ${v.valor_liquido_centavos},
           taxa_centavos = ${v.taxa_centavos},
           due_date = ${v.due_date},
           updated_at = NOW()
     WHERE id = ${id}
    RETURNING *
  `) as InscricaoRow[]
  return rows[0] ?? null
}

/** Re-vincula uma inscrição a uma cobrança recém-criada (troca de meio de pagamento).
 *  Atualiza forma/parcelas/valor + os campos financeiros do Asaas e volta o status pra
 *  'pending', mantendo o mesmo lead (não cria linha nova). */
export async function trocarMeioCobranca(
  id: number,
  v: {
    billing_type: BillingType
    installments: number
    valor_centavos: number
    asaas_customer_id: string | null
    asaas_payment_id: string
    asaas_invoice_url: string | null
    valor_liquido_centavos: number | null
    taxa_centavos: number | null
    due_date: string | null
    asaas_status: string | null
  }
): Promise<InscricaoRow | null> {
  const rows = (await sql`
    UPDATE inscricoes
       SET billing_type = ${v.billing_type},
           installments = ${v.installments},
           valor_centavos = ${v.valor_centavos},
           asaas_customer_id = ${v.asaas_customer_id},
           asaas_payment_id = ${v.asaas_payment_id},
           asaas_invoice_url = ${v.asaas_invoice_url},
           valor_liquido_centavos = ${v.valor_liquido_centavos},
           taxa_centavos = ${v.taxa_centavos},
           due_date = ${v.due_date},
           asaas_status = ${v.asaas_status},
           status = 'pending',
           updated_at = NOW()
     WHERE id = ${id}
    RETURNING *
  `) as InscricaoRow[]
  return rows[0] ?? null
}

/** Grava/atualiza os dados da NFS-e (Asaas) na inscrição. */
export async function atualizarNf(
  id: number,
  nf: { nf_id: string | null; nf_status: string | null; nf_numero: string | null; nf_pdf_url: string | null; nf_xml_url: string | null }
): Promise<InscricaoRow | null> {
  const rows = (await sql`
    UPDATE inscricoes
       SET nf_id = ${nf.nf_id},
           nf_status = ${nf.nf_status},
           nf_numero = ${nf.nf_numero},
           nf_pdf_url = ${nf.nf_pdf_url},
           nf_xml_url = ${nf.nf_xml_url},
           updated_at = NOW()
     WHERE id = ${id}
    RETURNING *
  `) as InscricaoRow[]
  return rows[0] ?? null
}

/** Marca uma inscrição pendente como cancelada (ex.: cobrança no Asaas falhou). */
export async function cancelarInscricao(id: number): Promise<void> {
  await sql`UPDATE inscricoes SET status = 'cancelled', updated_at = NOW() WHERE id = ${id}`
}

export async function atualizarStatusPorAsaasId(
  asaas_payment_id: string,
  status: InscricaoStatus,
  paid_at: string | null
): Promise<InscricaoRow | null> {
  const rows = (await sql`
    UPDATE inscricoes
       SET status = ${status},
           paid_at = COALESCE(${paid_at}, paid_at),
           updated_at = NOW()
     WHERE asaas_payment_id = ${asaas_payment_id}
    RETURNING *
  `) as InscricaoRow[]
  return rows[0] ?? null
}

/**
 * Consolida SÓ os valores financeiros (líquido/taxa/vencimento) a partir do objeto
 * de pagamento do webhook. COALESCE preserva o que já existe quando o Asaas manda
 * um evento sem netValue. Necessário pros ciclos de assinatura, que são criados
 * pelo Asaas (nunca passam por vincularAsaas) — sem isso a taxa fica nula e o DRE
 * superestima a receita recorrente. [[project_admin_roadmap]]
 */
export async function atualizarFinanceiroPorAsaasId(
  asaas_payment_id: string,
  v: { valor_liquido_centavos: number | null; taxa_centavos: number | null; due_date: string | null; asaas_status: string | null }
): Promise<void> {
  await sql`
    UPDATE inscricoes
       SET valor_liquido_centavos = COALESCE(${v.valor_liquido_centavos}, valor_liquido_centavos),
           taxa_centavos = COALESCE(${v.taxa_centavos}, taxa_centavos),
           due_date = COALESCE(${v.due_date}, due_date),
           asaas_status = COALESCE(${v.asaas_status}, asaas_status),
           last_synced_at = NOW(),
           updated_at = NOW()
     WHERE asaas_payment_id = ${asaas_payment_id}
  `
}

/** Marca/desmarca uma inscrição como registro de teste (esconde da lista e dos KPIs). */
export async function marcarTeste(id: number, teste: boolean): Promise<InscricaoRow | null> {
  const rows = (await sql`
    UPDATE inscricoes
       SET is_teste = ${teste},
           updated_at = NOW()
     WHERE id = ${id}
    RETURNING *
  `) as InscricaoRow[]
  return rows[0] ?? null
}

/** Grava um evento de webhook do Asaas, cru, pra auditoria/histórico. */
export async function registrarEvento(
  asaas_payment_id: string | null,
  event: string,
  payload: unknown
): Promise<void> {
  await sql`
    INSERT INTO asaas_eventos (asaas_payment_id, event, payload)
    VALUES (${asaas_payment_id}, ${event}, ${JSON.stringify(payload)}::jsonb)
  `
}

/** Consolida os dados financeiros vindos do Asaas (sincronização ou webhook). */
export interface ConsolidacaoAsaas {
  status: InscricaoStatus
  asaas_status: string
  valor_liquido_centavos: number | null
  taxa_centavos: number | null
  due_date: string | null
  pago_em: string | null
  paid_at: string | null
}

export async function consolidarAsaas(
  asaas_payment_id: string,
  c: ConsolidacaoAsaas
): Promise<InscricaoRow | null> {
  const rows = (await sql`
    UPDATE inscricoes
       SET status = ${c.status},
           asaas_status = ${c.asaas_status},
           valor_liquido_centavos = ${c.valor_liquido_centavos},
           taxa_centavos = ${c.taxa_centavos},
           due_date = ${c.due_date},
           pago_em = ${c.pago_em},
           paid_at = COALESCE(${c.paid_at}, paid_at),
           last_synced_at = NOW(),
           updated_at = NOW()
     WHERE asaas_payment_id = ${asaas_payment_id}
    RETURNING *
  `) as InscricaoRow[]
  return rows[0] ?? null
}

// --- Assinaturas (cobrança recorrente) ---

export type AssinaturaStatus = 'active' | 'cancelled'

export interface AssinaturaRow {
  id: number
  asaas_subscription_id: string | null
  asaas_customer_id: string | null
  nome: string
  email: string
  cpf_cnpj: string
  telefone: string | null
  billing_type: BillingType
  valor_centavos: number
  cycle: string
  descricao: string | null
  status: AssinaturaStatus
  is_teste: boolean
  created_at: string
  updated_at: string
}

export interface NovaAssinatura {
  nome: string
  email: string
  cpf_cnpj: string
  telefone: string | null
  billing_type: BillingType
  valor_centavos: number
  cycle: string
  descricao: string | null
  is_teste?: boolean
}

/** Cria a assinatura como 'active' ANTES do Asaas (asaas_* nulos até vincular). */
export async function criarAssinatura(a: NovaAssinatura): Promise<AssinaturaRow> {
  const rows = (await sql`
    INSERT INTO assinaturas (nome, email, cpf_cnpj, telefone, billing_type, valor_centavos, cycle, descricao, is_teste)
    VALUES (${a.nome}, ${a.email}, ${a.cpf_cnpj}, ${a.telefone}, ${a.billing_type}, ${a.valor_centavos}, ${a.cycle}, ${a.descricao}, ${a.is_teste ?? false})
    RETURNING *
  `) as AssinaturaRow[]
  return rows[0]
}

export async function vincularAssinaturaAsaas(
  id: number,
  v: { asaas_subscription_id: string; asaas_customer_id: string }
): Promise<void> {
  await sql`
    UPDATE assinaturas
       SET asaas_subscription_id = ${v.asaas_subscription_id},
           asaas_customer_id = ${v.asaas_customer_id},
           updated_at = NOW()
     WHERE id = ${id}
  `
}

/** Remove o registro de assinatura (usado quando a criação no Asaas falha). */
export async function apagarAssinatura(id: number): Promise<void> {
  await sql`DELETE FROM assinaturas WHERE id = ${id}`
}

export async function cancelarAssinaturaRow(id: number): Promise<AssinaturaRow | null> {
  const rows = (await sql`
    UPDATE assinaturas SET status = 'cancelled', updated_at = NOW() WHERE id = ${id} RETURNING *
  `) as AssinaturaRow[]
  return rows[0] ?? null
}

export async function getAssinatura(id: number): Promise<AssinaturaRow | null> {
  const rows = (await sql`SELECT * FROM assinaturas WHERE id = ${id}`) as AssinaturaRow[]
  return rows[0] ?? null
}

export async function getAssinaturaPorAsaasId(subscriptionId: string): Promise<AssinaturaRow | null> {
  const rows = (await sql`
    SELECT * FROM assinaturas WHERE asaas_subscription_id = ${subscriptionId}
  `) as AssinaturaRow[]
  return rows[0] ?? null
}

export async function listarAssinaturas(): Promise<AssinaturaRow[]> {
  return (await sql`SELECT * FROM assinaturas ORDER BY created_at DESC LIMIT 100`) as AssinaturaRow[]
}

/**
 * Materializa um ciclo de assinatura como uma inscrição (curso_slug='assinatura').
 * Idempotente por asaas_payment_id: só insere se ainda não existe. Roda no webhook
 * quando chega um pagamento vinculado a uma subscription conhecida — assim cada mês
 * cobrado aparece em Vendas/Financeiro. O status real é ajustado logo depois pelo
 * fluxo normal do webhook (atualizarStatusPorAsaasId).
 */
export async function materializarCicloAssinatura(p: {
  id: string
  subscription?: string | null
  customer?: string
  value?: number
  billingType?: string
  invoiceUrl?: string
  dueDate?: string
  status?: string
}): Promise<InscricaoRow | null> {
  if (!p.subscription) return null
  const valorCentavos = typeof p.value === 'number' ? Math.round(p.value * 100) : 0
  const rows = (await sql`
    INSERT INTO inscricoes (
      curso_slug, lote, nome, email, cpf_cnpj, telefone,
      billing_type, valor_centavos, installments,
      asaas_customer_id, asaas_payment_id, asaas_invoice_url, due_date, asaas_status,
      status, como_conheceu, consentimento_lgpd, is_teste
    )
    SELECT 'assinatura', 'unico', a.nome, a.email, a.cpf_cnpj, a.telefone,
           COALESCE(${p.billingType ?? null}, a.billing_type), COALESCE(${valorCentavos > 0 ? valorCentavos : null}, a.valor_centavos), 1,
           ${p.customer ?? null}, ${p.id}, ${p.invoiceUrl ?? null}, ${p.dueDate ?? null}, ${p.status ?? null},
           'pending', ${'Assinatura: '} || COALESCE(a.descricao, ''), true, a.is_teste
      FROM assinaturas a
     WHERE a.asaas_subscription_id = ${p.subscription}
       AND NOT EXISTS (SELECT 1 FROM inscricoes i WHERE i.asaas_payment_id = ${p.id})
    RETURNING *
  `) as InscricaoRow[]
  return rows[0] ?? null
}
