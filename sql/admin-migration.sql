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
