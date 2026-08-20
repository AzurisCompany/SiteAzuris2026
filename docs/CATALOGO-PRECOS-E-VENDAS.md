# Onde mora cada preço, e como uma venda nasce

Mapa geral do que a Azuris vende pelo site: **onde cada número vive**, quem lê quem, e o
caminho completo de uma venda — do link até a linha no `/admin`.

Escrito porque o preço de um mesmo produto pode vir de **três lugares diferentes**, e já
custou caro confundi-los: o registry ficou em R$ 470 por três semanas enquanto o checkout
cobrava R$ 570.

> **Regra que sai daqui:** nome de lote e preço **não** entram em texto fixo de página.
> Quem diz o preço é a fonte da verdade de cada produto — sempre lida no servidor.

---

## 1. As três fontes de preço

| fonte | onde | quem usa | muda com |
|---|---|---|---|
| **Catálogo de tipos** (`tipos_ingresso`) | banco, editável em `/admin/ingressos` | DSS 2026, GU BigData, reserva do preparatório | **sem deploy** |
| **Registry** (`src/lib/produtos.ts`) | código | One Day, combo One Day+Curso, adesão ETT — e **fallback** de todo mundo | deploy |
| **Lote do Lakehouse** (`determinarLoteAtivo` + `PRECO_POR_PERFIL`, `src/lib/db.ts`) | código + vagas no banco | curso Lakehouse | deploy |

**A regra de precedência, num produto que tem tipos:** existe tipo ativo → o preço é dele.
Não existe (ou o banco caiu) → cai no registry, **sem quebrar a página**. Por isso o número
do registry precisa acompanhar o lote vigente: fallback velho mostra preço que ninguém pratica.

Fora dessas três, o preço só é livre num lugar: **cobrança avulsa** (`/admin/cobranca`), onde
você digita o valor. Lá o produto/tipo escolhido decide o balde, a descrição e a regra de
endereço de PJ — nunca o valor.

## 2. Quem lê o quê

```
tipos_ingresso ──┬──> /dssbr-2026 (landing, "a partir de")
   (admin)       ├──> /dssbr-2026/inscricao   ─┐
                 ├──> /gubigdata/inscricao     ├─ vitrine = listarTiposPublicos()
                 ├──> /preparatorio-dados/reserva
                 └──> /admin/cobranca (opções + preço sugerido)

produtos.ts ─────┬──> /dssbr-2026/one-day · /one-day-curso · /ett/adesao (preço único)
                 └──> fallback de qualquer checkout quando não há tipo

db.ts (lotes) ───────> /lakehouse-comunidade/inscricao
```

**Nada disso confia no client.** O navegador manda `tipo_id` e, quando há, o cupom; o valor é
derivado no servidor em `processarCheckout` ([`checkout-produto.ts`](../src/lib/checkout-produto.ts)).

## 3. Os três modificadores de preço

Aplicados **sempre no servidor**, nesta ordem:

1. **Cupom** (`?d=` token de vendedora, `?c=` código de parceiro) — concede um **percentual**,
   nunca um preço. Entra no preço do ingresso **antes** das regras de PIX e parcelamento, então
   os juros de 2x–3x incidem sobre o valor já com desconto. Teto de 20%. Ver
   [CUPONS-DESCONTO.md](./CUPONS-DESCONTO.md).
2. **PIX / cartão** — `pix_desconto_pct` e `cartao_acrescimo_pct` do tipo (hoje 0/0 em tudo).
3. **Parcelamento** — 1x à vista; 2x+ com juros de 2,99% a.m. (tabela Price,
   [`parcelamento.ts`](../src/lib/parcelamento.ts)). Teto do site: 5x; do DSS: 3x.

## 4. Como uma venda nasce (caminho completo)

```
página (force-dynamic)          POST /api/<produto>/inscricao
  lê tipos + cupom da URL   ->    valida → deriva preço no SERVIDOR → criarCobranca
                                        ↓
                        Asaas: customer → payment → invoiceUrl
                                        ↓
                    inscricoes: status 'pending' + vínculo asaas_payment_id
                                        ↓
              cliente paga  →  webhook /api/webhook/asaas (idempotente)
                                        ↓
             status 'paid'  →  e-mail de confirmação (Resend)  →  /admin
```

O que fica gravado em cada venda, e por que importa:

| coluna | quem preenche | pra que serve |
|---|---|---|
| `curso_slug` | produto | aba do painel |
| `tipo_ingresso` | tipo escolhido (ou o da cobrança avulsa) | breakdown "Por tipo" **e lotação** do lote |
| `utm_source` | `vendedora` \| `parceiro` (cupom) · `admin` (cobrança manual) | **abas de origem** em `/admin/vendas` |
| `utm_content` | código do cupom | coluna "Cupom" — quem vendeu |
| `is_teste` | você, no painel | esconde de lista e KPIs sem apagar |

## 5. Ingressos reservados e cupons — quando usar qual

Os dois dão preço menor a um público específico, mas resolvem coisas diferentes:

| | **Ingresso oculto** (`?tipo=`) | **Cupom** (`?d=` / `?c=`) |
|---|---|---|
| o que concede | um **preço** próprio | um **percentual** sobre o preço vigente |
| teto | nenhum | 20% |
| segurança do link | **adivinhável** (sem assinatura) | token HMAC (vendedora) ou código no banco |
| prazo | não tem (só `vendas_ate` do tipo) | 48h no link de vendedora; parceiro sem prazo |
| lotação própria | **sim** (`limite_qtd`) | `limite_usos` do cupom |
| aparece como | tipo de ingresso na venda | origem + código na venda |

Regra prática: **desconto grande e público definido** (estudante, R$ 570 → R$ 400) → ingresso
oculto. **Comissão e campanha** (vendedora, parceiro) → cupom. Ver
[INGRESSO-OCULTO-ESTUDANTE.md](./INGRESSO-OCULTO-ESTUDANTE.md).

## 6. O que está à venda — snapshot de 2026-08-20

⚠️ **Isto é uma foto, não a verdade.** A verdade vive em `/admin/ingressos`, `/admin/cupons` e
no registry. Se esta seção divergir do painel, o painel está certo.

**Encontro GU BigData 26/08** (tipos, `/admin/ingressos`)

| tipo | preço | parcelas | vagas | prazo |
|---|---|---|---|---|
| Geral | R$ 30 | 3x | sem limite | sem prazo |
| Associado IEP / GU / DSSBR | grátis | — | sem limite | sem prazo |

**DSS 2026** (tipos, `/admin/ingressos`)

| tipo | preço | âncora | parcelas | vagas | onde aparece |
|---|---|---|---|---|---|
| Lote 1 | R$ 570 | R$ 820 | 3x | 100 | vitrine do checkout |
| Estudante | R$ 400 | R$ 570 | 3x | **50** | só por `?tipo=estudante` |

**Preço único (registry, exige deploy pra mudar)**

| produto | preço | observação |
|---|---|---|
| One Day | R$ 247 | escada 247 → 297 → 357 **duplicada** em `one-day/page.tsx:13`, sem teste |
| One Day + portal do curso | R$ 360 | sem âncora; **fulfillment do portal é manual** |
| ETT adesão | R$ 67 | assinatura (R$ 37/mês) é outro fluxo, `/ett/assinatura` |
| GU BigData | R$ 30 / grátis | encontro em cartaz é **26/08** (`gubigdata-2026-08`); os tipos vivem no catálogo, o registry é só fallback. O de 30/07 é evento passado — ver `PRODUTOS_ENCERRADOS` |
| Preparatório | R$ 0 | reserva de interesse, nunca cobra |
| Lakehouse | R$ 550 membro · R$ 750 não-membro | lote próprio em `db.ts` |

**Cupons ativos** (`/admin/cupons`)

| código | tipo | % | prazo |
|---|---|---|---|
| `databricks-152026` | parceiro | 15% | sem prazo (link fixo) |
| `bin01` | vendedora | 10% | 48h por link gerado |

## 7. Mudanças que você vai querer fazer

| quero… | onde | precisa deploy? |
|---|---|---|
| virar o lote do DSS | `/admin/ingressos`: cria o tipo novo, desliga o velho | não — **mas** atualize `produtos.ts` + `precos-dss.test.ts` no próximo deploy |
| criar ingresso reservado | `/admin/ingressos` com **oculto** marcado | não |
| dar desconto pra alguém vender | `/admin/cupons` (vendedora tem prazo; parceiro é link fixo) | não |
| revogar um link | desligar o cupom **ou** o tipo (`ativo=false`) — mata o que já circula | não |
| mudar preço do One Day/combo/ETT | `produtos.ts` (e a escada em `one-day/page.tsx`) | **sim** |
| cobrar valor negociado | `/admin/cobranca` — escolha produto **ou tipo**, digite o valor | não |

## 8. Armadilhas registradas

- **Nada expira sozinho.** Política do Binhara desde 01/08: `vendas_ate` vazio ao cadastrar tipo.
  Já fechou o checkout do GU na cara do público no dia do evento.
- **`tipo_id` e código de cupom são chaves lógicas.** Trocar quebra links distribuídos e
  desliga o histórico — as vendas antigas ficam com o valor velho gravado. Aconteceu: a venda
  paga de 14/08 aponta pro cupom `nil-2026`, que **não existe mais** no cadastro; ela some do
  relatório por cupom, mas continua visível na aba **Link de vendedora** de `/admin/vendas`.
- **Lotação conta pendente.** Carrinho abandonado ocupa vaga até a cobrança vencer — vale pro
  `limite_qtd` do tipo e pro `limite_usos` do cupom.
- **Fallback silencioso.** Se o banco não responde, o checkout cai no registry sem avisar
  ninguém: o preço fica plausível e errado. É o cenário que o número desatualizado transforma
  em prejuízo.
- **Falha fechada nos descontos.** Sem segredo de assinatura ou com banco fora, o cupom é
  **negado** — nunca concedido no escuro.
- **Cobrança manual não checa prazo nem lotação.** É deliberado: vender na mão é decisão sua,
  inclusive depois de esgotado. Mas a venda **passa a ocupar vaga** depois de gravada.

## 9. Documentos irmãos

| doc | assunto |
|---|---|
| [CHECKOUT-ASAAS-REPRODUCAO.md](./CHECKOUT-ASAAS-REPRODUCAO.md) | pipeline base do checkout, do zero |
| [ASAAS-INTEGRACAO-COMPLETA.md](./ASAAS-INTEGRACAO-COMPLETA.md) | API do Asaas, webhook, idempotência |
| [ADMIN-VENDAS-COBRANCA-INGRESSOS.md](./ADMIN-VENDAS-COBRANCA-INGRESSOS.md) | cobrança avulsa, tipos de ingresso, filtros |
| [ADMIN-FINANCEIRO-ONDAS-2026-07-09.md](./ADMIN-FINANCEIRO-ONDAS-2026-07-09.md) | recebíveis, DRE, conciliação, NF, assinaturas |
| [CUPONS-DESCONTO.md](./CUPONS-DESCONTO.md) | link de vendedora e cupom de parceiro |
| [INGRESSO-OCULTO-ESTUDANTE.md](./INGRESSO-OCULTO-ESTUDANTE.md) | ingresso reservado, só por link |
| [CHECKOUT-PF-PJ-NOTA-FISCAL.md](./CHECKOUT-PF-PJ-NOTA-FISCAL.md) | PF/PJ, endereço e nota |
| [EMAIL-TRANSACIONAL-RESEND.md](./EMAIL-TRANSACIONAL-RESEND.md) | e-mail de pagamento confirmado e vigia de vendas |

Última revisão: **2026-08-20**.
