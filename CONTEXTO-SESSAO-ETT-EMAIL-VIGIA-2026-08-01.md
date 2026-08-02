# Sessão 2026-08-01 — ETT no gateway, e-mail transacional e vigia de vendas

**Tipo:** 3 features novas + 1 correção de painel + 1 migração de produção + mudança de política.
**Estado do repo ao fim:** `main` = `59b6130`, working tree limpa, **13 commits ainda não pushados** pro GitHub (prod está atualizado via CLI; auto-deploy segue inexistente).
**Deploys:** 5 em produção, todos READY e verificados no ar.

Docs técnicos gerados nesta sessão:
- [`docs/ETT-ADESAO-E-ASSINATURA.md`](./docs/ETT-ADESAO-E-ASSINATURA.md)
- [`docs/EMAIL-TRANSACIONAL-RESEND.md`](./docs/EMAIL-TRANSACIONAL-RESEND.md) (inclui o vigia de vendas)

---

## 1. Dois produtos do ETT no gateway (`4369f58`, repreçado em `4f6b102`)

| Produto | URL | Preço |
|---|---|---|
| Adesão | https://azuris.com.br/ett/adesao | **R$ 67**, cobrança única, PIX ou cartão 1–3x |
| Trilha de Dedicação | https://azuris.com.br/ett/assinatura | **R$ 37/mês** ou **R$ 370/ano** |

Começaram em 70/39/390 e foram repreçados no mesmo dia a pedido do Binhara.

**O anual virou derivado da mensalidade** (`MENSAL_CENTAVOS * 10`) em vez de um
segundo número digitado: a home promete "dois meses de desconto", e com dois
literais soltos o próximo reajuste quebraria a conta em silêncio.

A adesão é só mais um registro no registry (`lib/produtos.ts`) usando o
`processarCheckout()` compartilhado. A assinatura é o **primeiro checkout público
recorrente do site**: cria uma `subscription` no Asaas, com `billingType=UNDEFINED`
(o cliente escolhe PIX, boleto ou cartão na fatura; no cartão a renovação é
automática). Criar subscription **não devolve `invoiceUrl`** — daí
`getSubscriptionPayments()`, sem o qual a pessoa assina e sai da tela sem nada pra
pagar.

Trava de duplicidade por e-mail+produto; a linha em `assinaturas` nasce antes do
Asaas e é apagada se o Asaas falhar (verificado: 502 sem chave → zero linhas órfãs).

## 2. E-mail transacional com Resend (`926dc10`)

Até hoje o app **não mandava e-mail nenhum** — quem falava com o cliente depois da
compra era só o Asaas. Agora pagamento confirmado dispara e-mail nosso.

Arquitetura do guia portável do Mailia (`D:\2026\Mailia\docs\setup-resend-portavel.md`):
motor `server-only` + templates react-email + borda best-effort.

- `send.azuris.com.br` **já estava verificado** na conta Resend da Azuris — nenhum
  mexer em DNS. Criei uma **key send-only dedicada** pra este app (ela nem consulta
  status de entrega: `401 restricted_api_key`).
- 5 variáveis configuradas na Vercel (produção). **Sem `RESEND_API_KEY` o app roda
  igual, só não envia.**
- **Uma vez só por inscrição:** o Asaas manda `PAYMENT_CONFIRMED` **e**
  `PAYMENT_RECEIVED` pro mesmo pagamento, e reenvia quando demoramos. A trava é um
  UPDATE condicional em `inscricoes.email_confirmacao_em`, reservado antes do envio
  e devolvido se o envio falhar. **Verificado: 3 eventos de webhook → 1 e-mail.**
- **Nunca derruba o webhook:** a borda engole o próprio erro e loga.
- O texto muda por `curso_slug` (`lib/email/conteudo.ts`, puro e testado). Onde o
  acesso é liberado na mão — ETT, One Day + curso, Lakehouse — o e-mail promete
  "em até 1 dia útil" em vez de mandar a pessoa caçar um login que não existe.

## 3. Vigia de vendas (`594fd47`)

`GET /api/cron/vigia-vendas`, diário às 9h BRT. Manda e-mail **só quando há
alerta** — caixa cheia de "está tudo ok" vira caixa ignorada.

| Situação | |
|---|---|
| Produto sem NENHUMA opção disponível | 🔴 crítico |
| Prazo vencendo em ≤ 3 dias | 🟡 aviso (🔴 se for a última opção viva) |
| Lotação ≥ 80% | 🟡 aviso (🔴 se for a última opção viva) |
| Fechado há mais de 7 dias | silêncio — evento passado não é incidente |

Autentica por `Bearer CRON_SECRET` **ou** sessão de admin (dá pra abrir logado no
navegador). `?seco=1` diagnostica sem enviar.

Nasceu do incidente de 30/07 ([`CONTEXTO-SESSAO-GU-VENDAS-ENCERRADAS-2026-07-30.md`](./CONTEXTO-SESSAO-GU-VENDAS-ENCERRADAS-2026-07-30.md)).

## 4. Visão geral do admin (`59b6130`)

Sintoma reportado: "os produtos do ETT não estão aparecendo em Visão geral". Eram
**dois** problemas:

1. A tela é um `GROUP BY` em `inscricoes` — **produto sem nenhuma venda não existia
   em lugar nenhum do painel**, justamente o que mais precisa de olho. Não era só o
   ETT: DSSBR 2026, One Day e One Day + Curso também estavam invisíveis. Agora entram
   como card apagado "sem vendas ainda", com link pro próprio checkout (`CHECKOUT_URL`).
2. São **dois** mapas de rótulo — `PRODUTO_LABEL` (card) e `PRODUTO_TAB` (aba) — e o
   ETT só tinha entrada no segundo, então saía `ett-adesao` cru.

Teste novo cobra os dois mapas + `CHECKOUT_URL` pra todo produto do registry: produto
novo sem rótulo agora deixa a suíte vermelha antes de ir pro ar.

## 5. Migração de produção (rodada e conferida)

`POST /api/admin/migrate` — **40/40 statements ok**, `inscricoes` **104 → 104 linhas**
(nada se perdeu), colunas 43 → 44. Duas colunas novas:

```sql
ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS produto_slug TEXT;          -- aba por produto
ALTER TABLE inscricoes  ADD COLUMN IF NOT EXISTS email_confirmacao_em TIMESTAMPTZ; -- trava do e-mail
```

## 6. Política nova: nada expira sozinho

> "não quero que nenhuma venda expire… até eu solicitar"

`vendas_ate` do Lote 1 do DSS (R$ 570) → **NULL**. A bomba-relógio de 10/08 está
desarmada. **Ao cadastrar tipo novo em `/admin/ingressos`, deixar o prazo VAZIO.**

Decisões dele na mesma conversa: manter o `limite_qtd=100` do Lote 1 (~11 vendas,
longe de esgotar) e **deixar os 2 tipos do GU com o prazo 30/07 vencido** — o evento
já aconteceu; reabrir venderia ingresso pra encontro passado.

## Verificação

- **145/145 testes** (eram 115 no início da sessão), `tsc --noEmit` limpo, `eslint`
  limpo, `next build` compilando as 4 rotas novas.
- Envio real de e-mail exercitado 4x (3 locais + 1 a partir de prod), todos com id do
  Resend.
- Webhook simulado 3x contra o banco local → 1 e-mail, `email_confirmacao_em` gravado.
- 401 confirmado sem credencial no vigia e no `email-teste`, local e em prod.
- Preços conferidos **no ar**: botão "Gerar PIX de R$ 67,00" e "Assinar por R$ 37,00
  por mês".
- Sincronização geral com o Asaas em prod: **56/62 sincronizadas, 6 erros** (não
  diagnosticados — provavelmente cobranças apagadas no Asaas, que dão 404).
- Linhas e arquivos de teste limpos do banco local e do scratchpad ao fim.

## Fica pendente

- **Nenhum PIX real de ponta a ponta**, em nenhum produto. O e-mail de confirmação
  nunca passou por um pagamento de verdade — é o último elo não testado.
- **O GU vai gerar alerta diário até 06/08.** Desativar os 2 tipos em
  `/admin/ingressos` silencia e deixa o banco dizendo a verdade.
- **A home do englishtalktime.com.br** ainda anuncia R$ 70 / R$ 39 / R$ 390.
- **13 commits não pushados** pro GitHub.
- Os **6 erros da sincronização** não foram investigados.
- E-mail de inscrição **gratuita** (associado do GU, reserva do preparatório) não
  existe — só o de pagamento confirmado.
- Fulfillment do ETT é **manual**: pagar não libera nada automaticamente.
- Bug antigo, intocado: campos do bloco "Regerar" ficam velhos após `router.refresh()`.
