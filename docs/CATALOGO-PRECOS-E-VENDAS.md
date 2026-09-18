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
                 ├──> /cafe-networking/inscricao│
                 ├──> /preparatorio-dados/reserva
                 └──> /admin/cobranca (opções + preço sugerido)

produtos.ts ─────┬──> /dssbr-2026/one-day · /fullpass-curso · /ett/adesao (preço único)
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

## 6. O que está à venda — snapshot de 2026-08-25

⚠️ **Isto é uma foto, não a verdade.** A verdade vive em `/admin/ingressos`, `/admin/cupons` e
no registry. Se esta seção divergir do painel, o painel está certo.

**Encontro GU BigData 24/09** (tipos, `/admin/ingressos`)

| tipo | preço | parcelas | vagas | prazo |
|---|---|---|---|---|
| Geral | R$ 30 | 3x | sem limite | sem prazo |
| Associado IEP / GU / DSSBR | grátis | — | sem limite | sem prazo |

**DSS 2026** (tipos, `/admin/ingressos`)

| tipo | preço | âncora | parcelas | vagas | onde aparece |
|---|---|---|---|---|---|
| Lote 2 | R$ 670 | R$ 820 | 3x | 100 | vitrine do checkout |
| Estudante | R$ 400 | R$ 670 | 3x | **50** | só por `?tipo=estudante` |
| ~~Lote 1~~ | ~~R$ 570~~ | | | | **desativado em 25/08/2026** — fica no cadastro pro histórico saber o nome do que vendeu |

**DSS 2026 — VIP e Business** (tipos, `/admin/ingressos`; **lote vira sozinho por quantidade**, desde 14/09)

| produto | checkout | Lote 1 | Lote 2 | Lote 3 | total |
|---|---|---|---|---|---|
| VIP (`dss-vip-2026`) | `/dssbr-2026/vip` | 10 × R$ 957 | 15 × R$ 1.275 | 15 × R$ 1.657 | 40 |
| Business (`dss-business-2026`) | `/dssbr-2026/business` | 10 × R$ 757 | 10 × R$ 984 | 10 × R$ 1.279 | 30 |

3x no cartão, sem âncora, sem prazo. Ver §7.2 e [DSS-VIP-BUSINESS-LOTES-POR-QUANTIDADE.md](./DSS-VIP-BUSINESS-LOTES-POR-QUANTIDADE.md).

**Preço único (registry, exige deploy pra mudar)**

| produto | preço | observação |
|---|---|---|
| One Day | R$ 290 | Lote 2; escada 247 → 290 → 357 mora em `one-day/lotes.ts` (um dono só, lida pela landing e pelo checkout) e tem canário em `precos-one-day.test.ts` |
| FullPass + portal do curso | R$ 750 | combo vigente; sem âncora; **fulfillment do portal é manual**. O FullPass sozinho é R$ 670 — o portal entra por R$ 80 |
| ~~One Day + portal do curso~~ | ~~R$ 360~~ | **encerrado em 25/08/2026**: em `PRODUTOS_ENCERRADOS`, checkout removido, `/dssbr-2026/one-day-curso` redireciona pro combo vigente |
| ETT adesão | R$ 67 | assinatura (R$ 37/mês) é outro fluxo, `/ett/assinatura` |
| Café DSSBR | R$ 30 / grátis | edição em cartaz é **06/10**, com a Bindflow (`cafe-networking-2026-10`; até 18/09 era a Arlequim, mesmo produto); Geral R$ 30 e Convidado grátis. Mesma mecânica do GU — ver [EVENTOS-PRESENCIAIS.md](./EVENTOS-PRESENCIAIS.md) |
| GU BigData | R$ 30 / grátis | encontro em cartaz é **24/09** (`gubigdata-2026-09`); os tipos vivem no catálogo, o registry é só fallback. Os de 30/07 e 26/08 são eventos passados — ver `PRODUTOS_ENCERRADOS` |
| Preparatório | R$ 0 | reserva de interesse, nunca cobra |
| Lakehouse | R$ 750 | **preço único desde 25/08/2026** — acabaram o preço de comunidade (R$ 550) e o bônus do ingresso do DSSBR incluso. O perfil membro/não-membro sobrou só pra segmentar vaga e histórico. Canário: `precos-lakehouse.test.ts` |

**Cupons ativos** (`/admin/cupons`)

| código | tipo | % | prazo |
|---|---|---|---|
| `databricks-152026` | parceiro | 15% | sem prazo (link fixo) |
| `bin01` | vendedora | 10% | 48h por link gerado |

## 7. Mudanças que você vai querer fazer

| quero… | onde | precisa deploy? |
|---|---|---|
| virar o lote do DSS | `/admin/ingressos`: cria o tipo novo, **desliga** o velho (nunca apaga — ver escada abaixo) | não — **mas** atualize `produtos.ts` + `precos-dss.test.ts` no próximo deploy |
| criar ingresso reservado | `/admin/ingressos` com **oculto** marcado | não |
| dar desconto pra alguém vender | `/admin/cupons` (vendedora tem prazo; parceiro é link fixo) | não |
| revogar um link | desligar o cupom **ou** o tipo (`ativo=false`) — mata o que já circula | não |
| virar o lote do One Day | `produtos.ts` (`precoCentavos`) **e** o `atual` em `one-day/lotes.ts` — o canário reprova se discordarem | **sim** |
| mudar preço do combo/ETT | `produtos.ts` | **sim** |
| mudar preço do curso Lakehouse | `PRECO_POR_PERFIL` em `db.ts` **e** os dois HTMLs de `public/lakehouse-comunidade/` — o canário varre a página estática | **sim** |
| tirar um produto de cartaz | `PRODUTOS_ENCERRADOS` + apaga a rota de API + a página vira `permanentRedirect` pro sucessor. Fica no registry: o histórico precisa do nome e do preço | **sim** |
| cobrar valor negociado | `/admin/cobranca` — escolha produto **ou tipo**, digite o valor | não |

## 7.1 A escada de lotes do checkout

O checkout do DSS mostra, acima do seletor, de onde o preço veio e pra onde vai:

```
  Lote 1          Lote 2            No dia
  R̶$̶ ̶5̶7̶0̶          R$ 670            R$ 820
  encerrado    vendendo agora
```

Ela é **derivada do catálogo** ([`escada-lotes.ts`](../src/lib/escada-lotes.ts)), não de
texto fixo: o degrau riscado é o tipo antigo que continua cadastrado com `ativo=false`, e o
último degrau é a âncora (`preco_de_centavos`) do lote vigente. Consequências práticas:

- **Apagar o tipo do lote encerrado apaga o degrau riscado.** Desligue, não delete — é o
  mesmo motivo de sempre (o histórico precisa do nome), agora com efeito visível na página.
- **Inativo mais barato que o vigente = "encerrado"; mais caro = "em breve".** A escada
  não olha data nenhuma, só preço.
- **Ingresso oculto não é degrau.** O Estudante ficaria à vista na vitrine — exatamente o
  que o link discreto evita.
- Um lote sozinho e sem âncora não vira escada: renderizar um degrau só é ruído.
- Com link de desconto, o degrau vigente mostra o preço de tabela riscado e o do cupom
  embaixo. Os outros degraus seguem em preço de tabela — são momentos da venda, não ofertas.

O **One Day** tem escada própria e fixa em [`one-day/lotes.ts`](../src/app/dssbr-2026/one-day/lotes.ts):
ele não tem tipos cadastrados, então não há catálogo de onde derivar. Canário
`precos-one-day.test.ts` amarra o `atual` de lá ao `precoCentavos` do registry.

## 7.2 Lote que vira por quantidade (VIP e Business)

O FullPass vira de lote **na mão** (desliga um, liga o outro). VIP e Business não: os três
lotes de cada um ficam **ativos ao mesmo tempo**, cada um com `limite_qtd`, e
[`lotes-quantidade.ts`](../src/lib/lotes-quantidade.ts) escolhe o vigente — o primeiro, por
`ordem`, que ainda tem vaga. Fechou o 10º do Lote 1, a página e o servidor passam a vender o
Lote 2 sem ninguém mexer.

- **O servidor só aceita o lote vigente** (`tipoObrigatorio` no registry). POST sem `tipo` →
  400 (o fallback do registry é o preço do Lote 1). POST com lote que fechou enquanto a pessoa
  preenchia → 409 "o lote mudou — agora é Lote 2, recarregue".
- **Lotação conta pendente.** PIX gerado e não pago segura a vaga até vencer (3 dias) — pode
  empurrar alguém pro lote seguinte antes do lote fechar de verdade.
- **Pular um lote:** desligue ele no admin (`ativo=false`); some da escada.
- **Mudar vagas ou preço:** edite o tipo no admin — sem deploy. **Não use limite 0** pra
  "fechar" um lote: o admin grava 0 como *sem limite*. Pra fechar, desligue.
- **Cobrança avulsa não confere o lote vigente** — escolher o lote certo no seletor é o que
  ocupa a vaga certa.

## 8. Armadilhas registradas

- **Nada expira sozinho — o que também significa que nada FECHA sozinho.** Política do Binhara
  desde 01/08: `vendas_ate` vazio ao cadastrar tipo, porque uma data digitada já fechou o
  checkout do GU na cara do público no dia do evento. O preço a pagar é o outro lado: o
  encontro de 26/08 continuou comprável por **10 dias depois de acontecer**. Trocar de evento
  inclui **desligar o tipo do anterior** (`ativo=false`) — passo 7 da receita em
  [GUBIGDATA-EVENTO-CHECKOUT.md](./GUBIGDATA-EVENTO-CHECKOUT.md).
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
| [DSS-VIP-BUSINESS-LOTES-POR-QUANTIDADE.md](./DSS-VIP-BUSINESS-LOTES-POR-QUANTIDADE.md) | VIP e Business, lote por quantidade |
| [CHECKOUT-PF-PJ-NOTA-FISCAL.md](./CHECKOUT-PF-PJ-NOTA-FISCAL.md) | PF/PJ, endereço e nota |
| [EMAIL-TRANSACIONAL-RESEND.md](./EMAIL-TRANSACIONAL-RESEND.md) | e-mail de pagamento confirmado e vigia de vendas |

Última revisão: **2026-09-14**.
