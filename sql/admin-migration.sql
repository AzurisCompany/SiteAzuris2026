-- Migration da área financeira/admin.
-- Aditiva e idempotente — segura pra rodar em staging e produção.
-- Uso: node sql/run-migration.mjs sql/admin-migration.sql

-- === Dados extras do cliente (capturados no checkout) ===
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS empresa            TEXT;
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS cargo              TEXT;
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS pessoa_tipo        TEXT;   -- 'PF' | 'PJ'
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS razao_social       TEXT;   -- quando PJ
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS nf_endereco        JSONB;  -- { cep, logradouro, numero, complemento, bairro, cidade, uf }
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS como_conheceu      TEXT;
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS consentimento_lgpd BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS consentimento_em   TIMESTAMPTZ;

-- === Consolidação financeira (do Asaas) ===
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS valor_liquido_centavos INTEGER;       -- netValue (após taxa)
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS taxa_centavos          INTEGER;       -- value - netValue
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS due_date               DATE;          -- vencimento da cobrança
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS asaas_status           TEXT;          -- status cru do Asaas
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS pago_em                TIMESTAMPTZ;    -- data real do pagamento (clientPaymentDate)
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS last_synced_at         TIMESTAMPTZ;   -- última sincronização com o Asaas

-- === Auditoria: todo evento de webhook do Asaas, cru ===
CREATE TABLE IF NOT EXISTS asaas_eventos (
  id               BIGSERIAL PRIMARY KEY,
  asaas_payment_id TEXT,
  event            TEXT NOT NULL,
  payload          JSONB NOT NULL,
  received_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_asaas_eventos_payment ON asaas_eventos(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_asaas_eventos_received ON asaas_eventos(received_at);

-- Índice pra dashboard (filtra por produto + status o tempo todo)
CREATE INDEX IF NOT EXISTS idx_inscricoes_curso_status ON inscricoes(curso_slug, status);

-- === Marcação manual de teste ===
-- Esconde registros de teste/sandbox da lista de vendas e dos KPIs (sem apagar).
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS is_teste BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_inscricoes_is_teste ON inscricoes(is_teste);

-- === Tipo de ingresso (variante do produto) ===
-- Ex.: DSSBR terá Estudante/Profissional/VIP/Corporativo. NULL = produto sem variantes.
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS tipo_ingresso TEXT;
CREATE INDEX IF NOT EXISTS idx_inscricoes_tipo ON inscricoes(curso_slug, tipo_ingresso);

-- === Catálogo de tipos de ingresso (cadastrável pelo admin) ===
-- Fonte da verdade do preço por tipo. O checkout lê os tipos ATIVOS de um produto;
-- se não houver nenhum, cai no preço único de lib/produtos.ts. Percentuais em % (10 = 10%).
CREATE TABLE IF NOT EXISTS tipos_ingresso (
  id                   BIGSERIAL PRIMARY KEY,
  produto_slug         TEXT NOT NULL,           -- ex.: 'dss-2026'
  tipo_id              TEXT NOT NULL,           -- slug do tipo, gravado em inscricoes.tipo_ingresso (ex.: 'estudante')
  nome                 TEXT NOT NULL,           -- rótulo exibido (ex.: 'Estudante')
  descricao            TEXT,                    -- linha curta opcional
  preco_centavos       INTEGER NOT NULL,        -- preço cobrado (base)
  preco_de_centavos    INTEGER NOT NULL DEFAULT 0,   -- âncora "de" riscada (0 = sem âncora)
  pix_desconto_pct     NUMERIC NOT NULL DEFAULT 0,   -- % off no PIX (10 = 10%)
  cartao_acrescimo_pct NUMERIC NOT NULL DEFAULT 0,   -- % a mais no cartão (base)
  max_parcelas         INTEGER NOT NULL DEFAULT 1,   -- 1x à vista; 2x+ com juros
  ativo                BOOLEAN NOT NULL DEFAULT true,
  ordem                INTEGER NOT NULL DEFAULT 0,    -- ordem de exibição
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tipos_ingresso_uq ON tipos_ingresso(produto_slug, tipo_id);
CREATE INDEX IF NOT EXISTS idx_tipos_ingresso_ativo ON tipos_ingresso(produto_slug, ativo, ordem);

-- Config financeira editável no admin (meta de faturamento mensal, alíquota de imposto).
CREATE TABLE IF NOT EXISTS config_financeiro (
  chave      TEXT PRIMARY KEY,
  valor      TEXT NOT NULL,           -- guardado como texto; parse no app (ex.: meta_mensal_centavos, aliquota_imposto_pct)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Nota Fiscal (NFS-e emitida via Asaas) vinculada à inscrição.
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS nf_id      TEXT;   -- id da invoice no Asaas
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS nf_status  TEXT;   -- SCHEDULED | AUTHORIZED | CANCELED | ERROR...
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS nf_numero  TEXT;
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS nf_pdf_url TEXT;
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS nf_xml_url TEXT;

-- Assinaturas (cobrança recorrente). Cada ciclo cobrado é materializado como uma linha em inscricoes (curso_slug='assinatura').
CREATE TABLE IF NOT EXISTS assinaturas (
  id                     BIGSERIAL PRIMARY KEY,
  asaas_subscription_id  TEXT UNIQUE,
  asaas_customer_id      TEXT,
  nome                   TEXT NOT NULL,
  email                  TEXT NOT NULL,
  cpf_cnpj               TEXT NOT NULL,
  telefone               TEXT,
  billing_type           TEXT NOT NULL,
  valor_centavos         INTEGER NOT NULL,
  cycle                  TEXT NOT NULL,           -- MONTHLY | QUARTERLY | SEMIANNUALLY | YEARLY...
  descricao              TEXT,
  status                 TEXT NOT NULL DEFAULT 'active',  -- active | cancelled
  is_teste               BOOLEAN NOT NULL DEFAULT false,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quando o e-mail de confirmação de pagamento foi enviado (NULL = ainda não).
-- Trava contra duplicidade: o Asaas dispara CONFIRMED e RECEIVED pro mesmo pagamento.
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS email_confirmacao_em TIMESTAMPTZ;

-- Produto da assinatura (ex.: 'ett-assinatura'). NULL = avulsa criada no admin.
-- É o curso_slug que o ciclo materializado recebe — dá aba própria por produto no painel.
ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS produto_slug TEXT;
CREATE INDEX IF NOT EXISTS idx_assinaturas_produto_email ON assinaturas(produto_slug, email);

-- Janela de vendas e lotação por tipo de ingresso (eventos presenciais, ex.: GU BigData).
ALTER TABLE tipos_ingresso ADD COLUMN IF NOT EXISTS vendas_ate DATE;     -- última data de venda (inclusive); NULL = sem prazo
ALTER TABLE tipos_ingresso ADD COLUMN IF NOT EXISTS limite_qtd INTEGER;  -- lotação do tipo (paid+pending, sem is_teste); NULL = sem limite

-- Ingresso reservado: fora da vitrine, só compra quem chega com ?tipo=<tipo_id> (ex.: Estudante).
ALTER TABLE tipos_ingresso ADD COLUMN IF NOT EXISTS oculto BOOLEAN NOT NULL DEFAULT false;

-- Seed do encontro GU BigData 30/07 (idempotente; NÃO sobrescreve edições do admin).
INSERT INTO tipos_ingresso (produto_slug, tipo_id, nome, descricao, preco_centavos, max_parcelas, ordem, vendas_ate, limite_qtd)
VALUES
  ('gubigdata-2026-07', 'geral', 'Geral', 'Aberto ao público', 3000, 3, 0, DATE '2026-07-29', NULL),
  ('gubigdata-2026-07', 'associado', 'Associado IEP, GU BigData e Participante DSS', 'Gratuito — confirmação na entrada', 0, 1, 1, DATE '2026-07-29', NULL)
ON CONFLICT (produto_slug, tipo_id) DO NOTHING;

-- Seed da reserva do curso preparatório (idempotente; NÃO sobrescreve edições do admin).
INSERT INTO tipos_ingresso (produto_slug, tipo_id, nome, descricao, preco_centavos, max_parcelas, ordem, vendas_ate, limite_qtd)
VALUES
  ('preparatorio-dados', 'reserva', 'Reserva de interesse', 'Sem pagamento — aviso na abertura e desconto de fundador', 0, 1, 0, NULL, NULL)
ON CONFLICT (produto_slug, tipo_id) DO NOTHING;

-- Cupons de desconto (vendedoras e parceiros) — ver docs/CUPONS-DESCONTO.md.
-- A tabela guarda a REGRA, não os links. O link de vendedora é um token assinado com
-- prazo próprio; o de parceiro é o código puro (?c=CODIGO), sem prazo. Em ambos os
-- casos o checkout consulta esta linha: ativo=false mata todo mundo na hora.
CREATE TABLE IF NOT EXISTS cupons (
  id             BIGSERIAL PRIMARY KEY,
  codigo         TEXT NOT NULL,              -- normalizado em minúsculas
  nome           TEXT NOT NULL,              -- "Celeste", "Gaio Consultoria"
  tipo           TEXT NOT NULL DEFAULT 'vendedora', -- 'vendedora' | 'parceiro'
  produto_slug   TEXT NOT NULL,
  pct            INTEGER NOT NULL,           -- % inteiro; teto em lib/cupom.ts
  validade_horas INTEGER,                    -- NULL = link sem prazo (parceiro)
  limite_usos    INTEGER,                    -- NULL = ilimitado
  ativo          BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cupons_codigo ON cupons(codigo);
