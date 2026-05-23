-- Schema da tabela de inscricoes do curso Lakehouse
-- Roda apenas uma vez (CREATE TABLE IF NOT EXISTS é idempotente)

CREATE TABLE IF NOT EXISTS inscricoes (
  id                SERIAL PRIMARY KEY,
  curso_slug        TEXT NOT NULL,                  -- 'lakehouse-comunidade'
  lote              TEXT NOT NULL,                  -- 'lote1' | 'lote2'

  -- dados do aluno
  nome              TEXT NOT NULL,
  email             TEXT NOT NULL,
  cpf_cnpj          TEXT NOT NULL,                  -- só dígitos (sem máscara)
  telefone          TEXT,

  -- dados do pagamento
  billing_type      TEXT NOT NULL,                  -- 'PIX' | 'CREDIT_CARD'
  valor_centavos    INTEGER NOT NULL,               -- valor cobrado (já com desconto se PIX)
  installments      INTEGER NOT NULL DEFAULT 1,
  status            TEXT NOT NULL DEFAULT 'pending',-- pending | paid | overdue | cancelled | refunded

  -- referência Asaas
  asaas_customer_id TEXT,
  asaas_payment_id  TEXT UNIQUE,
  asaas_invoice_url TEXT,

  -- tracking
  utm_source        TEXT,
  utm_medium        TEXT,
  utm_campaign      TEXT,
  utm_content       TEXT,
  utm_term          TEXT,

  -- timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inscricoes_email ON inscricoes(email);
CREATE INDEX IF NOT EXISTS idx_inscricoes_status ON inscricoes(status);
CREATE INDEX IF NOT EXISTS idx_inscricoes_lote_status ON inscricoes(lote, status);

-- View auxiliar pra contar vagas pagas/pendentes por lote
CREATE OR REPLACE VIEW v_vagas_por_lote AS
SELECT
  lote,
  COUNT(*) FILTER (WHERE status = 'paid')      AS pagas,
  COUNT(*) FILTER (WHERE status = 'pending')   AS pendentes,
  COUNT(*) FILTER (WHERE status IN ('paid','pending')) AS reservadas
FROM inscricoes
WHERE curso_slug = 'lakehouse-comunidade'
GROUP BY lote;
