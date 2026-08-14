# Banco de dados

Postgres na Neon, acessado por `@neondatabase/serverless` (`src/lib/db.ts`). Seis tabelas e uma
view. Toda mudança de schema entra por **migração aditiva e idempotente** — o app precisa
continuar de pé com o banco velho.

---

## 1. As tabelas

| tabela | o que guarda |
|---|---|
| **`inscricoes`** | a venda. Toda compra, de qualquer produto, vira uma linha aqui |
| **`tipos_ingresso`** | catálogo de variantes de um produto (Lote 1, Estudante, Associado) — fonte da verdade do preço |
| **`cupons`** | a **regra** do desconto (não os links): quem, quantos %, prazo, limite, ligado/desligado |
| **`assinaturas`** | cobrança recorrente (ETT). Cada ciclo cobrado vira também uma linha em `inscricoes` |
| **`asaas_eventos`** | log dos webhooks recebidos — é o que torna o webhook idempotente |
| **`config_financeiro`** | configuração editável no admin (meta mensal, alíquota), chave/valor |
| **`v_vagas_por_lote`** *(view)* | vagas restantes por lote do curso Lakehouse |

## 2. `inscricoes` — a linha que importa

Nasceu enxuta (curso, pessoa, valor, status, Asaas, UTMs) e cresceu por migração. Os grupos de
colunas, por função:

| grupo | colunas | quem preenche |
|---|---|---|
| identidade da venda | `curso_slug`, `lote`, `tipo_ingresso` | o produto e o tipo escolhido |
| pessoa | `nome`, `email`, `cpf_cnpj`, `telefone`, `pessoa_tipo`, `razao_social`, `empresa`, `cargo` | o formulário |
| dinheiro | `billing_type`, `valor_centavos`, `installments`, `valor_liquido_centavos`, `taxa_centavos` | checkout + sync com o Asaas |
| Asaas | `asaas_customer_id`, `asaas_payment_id`, `asaas_invoice_url`, `asaas_status`, `due_date`, `pago_em`, `last_synced_at` | pipeline e webhook |
| nota fiscal | `nf_id`, `nf_status`, `nf_numero`, `nf_pdf_url`, `nf_xml_url`, `nf_endereco` (JSONB) | emissão via Asaas |
| origem | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` | URL, cupom ou `admin` |
| LGPD | `consentimento_lgpd`, `consentimento_em` | checkbox do checkout |
| operação | `status`, `is_teste`, `como_conheceu`, `email_confirmacao_em`, `created_at`, `updated_at` | painel e webhook |

**Três colunas que fazem mais do que parecem:**

- **`tipo_ingresso`** — acende o breakdown "Por tipo" no painel **e** conta pra lotação do lote.
  Venda sem ele fica invisível nas duas coisas (foi o que motivou a mudança na cobrança avulsa).
- **`utm_source`** — vira as abas de origem de `/admin/vendas`: `vendedora` / `parceiro` (tipo do
  cupom) ou `admin` (cobrança manual).
- **`is_teste`** — esconde a linha de listas e KPIs **sem apagar**. É o jeito certo de fazer teste
  em produção.

`status`: `pending` → `paid` (webhook) · `canceled` · `refunded`. Gratuitos entram já confirmados,
sem passar pelo Asaas.

## 3. `tipos_ingresso`

Chave lógica: `(produto_slug, tipo_id)` — única. `tipo_id` é o que fica gravado na venda, então
**nunca troque**: quebra links distribuídos e desconecta o histórico.

| coluna | papel |
|---|---|
| `nome`, `descricao` | o que a pessoa lê no card |
| `preco_centavos` | o preço cobrado. **0 = ingresso gratuito** (só cadastro, sem Asaas) |
| `preco_de_centavos` | âncora "de" riscada (0 = sem âncora) |
| `pix_desconto_pct`, `cartao_acrescimo_pct` | modificadores por meio de pagamento (% inteiro) |
| `max_parcelas` | teto de parcelas (o site limita em 5x) |
| `ativo` | pode ser vendido? |
| `oculto` | **fora da vitrine**: só vende por `?tipo=<tipo_id>` |
| `vendas_ate` | último dia de venda, inclusive. **Política: deixe vazio** |
| `limite_qtd` | lotação — conta pagas **+ pendentes**, sem testes |
| `ordem` | ordem de exibição |

`ativo` e `oculto` são coisas diferentes: **inativo não vende; oculto vende, só não se anuncia.**

## 4. `cupons`

Guarda a regra, não os links. O checkout consulta a linha **a cada uso**, e é isso que torna
"sem prazo" defensável: desligar mata todos os links na hora, inclusive os que já estão na mão
do cliente.

| coluna | papel |
|---|---|
| `codigo` | normalizado em minúsculas; é o que vai gravado em `utm_content` |
| `nome` | pessoa ou parceiro |
| `tipo` | `vendedora` (link com prazo) ou `parceiro` (link fixo) |
| `produto_slug`, `pct` | onde vale e quanto desconta (teto de 20%) |
| `validade_horas` | prazo do link gerado; `NULL` = sem prazo |
| `limite_usos` | conta pagas + pendentes; `NULL` = sem limite |
| `ativo` | o botão de revogar |

**O percentual da linha vence o do token:** mudar de 15% pra 12% vale pros links que já circulam.

## 5. Migração

**Único caminho:** `POST /api/admin/migrate`, logado no admin. Roda a mesma lista de statements
do `sql/admin-migration.sql`, toda em `ADD COLUMN IF NOT EXISTS` / `CREATE TABLE IF NOT EXISTS`.

- `GET /api/admin/migrate` devolve **integridade**: contagem de `inscricoes`, `asaas_eventos` e
  `tipos_ingresso`. Rode antes e depois — os números têm que bater.
- Sem migração rodada, telas novas **degradam**: banner de erro no admin, fallback de preço único
  no checkout. Nada quebra.
- Seeds (tipos do GU, reserva do preparatório) usam `ON CONFLICT DO NOTHING`: **não** sobrescrevem
  o que você editou no admin.

Hoje são **43 statements**. Os scripts em `sql/` (`run-migration.mjs`, `run-schema.mjs`,
`check-asaas-prod.mjs`, `ga4-poll.mjs`) são ferramentas locais, não fazem parte do deploy.

## 6. Cuidados

- **O banco local não é o de produção.** `web/.env.local` aponta pra um Neon de teste com
  pouquíssimas linhas. Query local nunca é verdade sobre vendas.
- **Não dá pra pegar a `DATABASE_URL` de produção pela CLI** — a Vercel devolve `[SENSITIVE]`. Pra
  mexer em dado real sem credencial de banco, use a API do admin ([RUNBOOK.md](./RUNBOOK.md)).
- **`DATE` do Postgres pode voltar como `Date` ou string**, dependendo do driver. Existe `isoDate()`
  em `tipos-ingresso.ts` justamente porque um `Date` cru dentro do JSX derruba o render.
- **Escrita por upsert manda o registro inteiro** (`POST /api/admin/ingressos`): omitir campo
  **zera** o campo. Sempre faça o GET antes e confira o objeto devolvido depois.

Última revisão: **2026-08-14**.
