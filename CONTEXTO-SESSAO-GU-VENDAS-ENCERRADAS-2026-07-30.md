# Sessão 2026-07-30 — "Vendas encerradas" no dia do evento do GU BigData

**Tipo:** incidente em produção, resolvido em dado (zero mudança de código, zero deploy, zero commit).
**Duração:** ~15 min. **Estado do repo ao fim:** `main` = `d232043`, working tree limpa.

## Sintoma
Dia do encontro presencial do GU BigData & IA (30/07, 18h30, IEP Curitiba). Binhara reportou que os
ingressos apareciam como encerrados e o pessoal não conseguia comprar.

## Causa
Não era bug de código. Os **dois** tipos de ingresso do produto `gubigdata-2026-07` estavam
cadastrados com `vendas_ate = '2026-07-29'` (valor vindo do seed da migração de 11/07):

| id | tipo_id     | preço  | ativo | vendas_ate |
|----|-------------|--------|-------|------------|
| 1  | `geral`     | R$30   | true  | 2026-07-29 |
| 2  | `associado` | grátis | true  | 2026-07-29 |

A regra de disponibilidade é `hoje > vendas_ate → encerrado`
(`src/lib/tipos-ingresso.ts:152`, `disponibilidadeDoTipo()`, `hoje` = `hojeBRT()`).
Logo, **à meia-noite do dia 30 os dois tipos fecharam sozinhos** — inclusive o gratuito de
associado — e tanto `/gubigdata` (TicketBox) quanto `/gubigdata/inscricao` passaram a renderizar
"Vendas encerradas", no dia do evento, sem nenhum alerta pra ninguém.

Confirmação no HTML público de prod antes do fix:
`"vendasAte":"29/07","disponivel":false,"motivo":"encerrado"` nos dois tipos.

## Correção aplicada
`vendas_ate` dos dois tipos → `2026-07-30` (cobre o dia inteiro até 23h59 BRT).

Feito pela **API do admin de produção**, não pelo banco:

1. `vercel env pull --environment=production` **não serve** — a Vercel devolve `[SENSITIVE]` em toda
   variável sensível (DATABASE_URL, PG*, ASAAS_API_KEY). Já estava documentado; perdi um passo aqui.
2. A `ADMIN_PASSWORD` do `web/.env.local` **é a mesma de produção** → login via
   `POST https://azuris.com.br/api/admin/login` com cookie jar do curl.
3. `GET /api/admin/ingressos?produto=gubigdata-2026-07` pra ler o estado real.
4. `POST /api/admin/ingressos` **uma vez por tipo, reenviando o registro inteiro** — o endpoint é
   upsert (`upsertTipo`, chave `produto_slug`+`tipo_id`); campo omitido é campo zerado.
5. Cookie jar e `.env.prod` apagados do scratchpad no fim.

Sem deploy: `/gubigdata` e `/gubigdata/inscricao` são `force-dynamic`, então valeu na hora.

**Verificado no ar** depois do fix: `disponivel:true, motivo:null` nos dois tipos, nas duas páginas.

## Fica pendente
- **⚠️ DSSBR: mesma armadilha, armada pra 11/08.** O tipo `lote-1` de `dss-2026` tem
  `vendas_ate='2026-08-10'` e `limite_qtd=100`. Quando expirar (ou esgotar), se não houver outro tipo
  ativo, o checkout do FullPass fica **sem opção de compra, em silêncio**. Criar o Lote 2 em
  `/admin/ingressos` antes de 10/08.
- **Não existe monitoramento** de tipo prestes a expirar sem sucessor. Ideia levantada e não
  construída: cron que avisa 2 dias antes.
- GU: link do post no gubigdata.com.br ainda aponta pro `eventos.gubigdata.com.br/tenhointeresse`;
  fluxo **pago** (R$30) segue sem nenhum teste real E2E.
- Bug de higiene achado de passagem, **não corrigido**: `isoDate()` em `src/lib/tipos-ingresso.ts:26`
  usa `toISOString()` num `Date` do Neon — exatamente o que o comentário de `src/lib/format.ts:76-88`
  manda evitar (existe `toISODate()` pronto). Em prod não morde porque a Vercel roda em UTC; rodando
  local em BRT devolve o dia anterior.

## Lição
`vendas_ate` é **o último dia em que se vende**, não a véspera. E prazo em ingresso **gratuito**
fecha a porta sem ninguém perceber — não há sinal de venda caindo pra denunciar.
