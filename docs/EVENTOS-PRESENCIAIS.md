# Eventos presenciais — a página que serve os dois

Página de evento estilo marketplace (Sympla-like) + checkout com ingresso pago e gratuito.
Hoje serve **dois** eventos, com a mesma estrutura e marcas diferentes:

| rota | evento | produtor | em cartaz |
|---|---|---|---|
| `/gubigdata` | Encontro presencial do GU Big Data & IA | GU Big Data & IA | **24/09/2026** — Churn Antes que Aconteça (Onetopia + Tecnofit) |
| `/cafe-networking` | Café da manhã de networking do DSSBR | Data Science Summit Brasil | **06/10/2026** — Bindflow (Lucas Moraes), AtendeVet: telemedicina veterinária com IA |

Em produção: GU desde 2026-07-11, café desde 2026-09-05.

## A regra que vale pros dois

**Uma edição = um produto** (`<evento>-AAAA-MM`) e **a URL é SEMPRE a corrente** — não existe
página de edição passada. O `curso_slug` gravado na venda é o que separa receita, lotação e aba
do painel de um mês pro outro.

A URL não muda de edição pra edição **porque ela é divulgada por terceiros**: o post do
gubigdata.com.br e o do dssbr.com.br trazem o botão de inscrição apontando pra cá. Link
divulgado que muda de endereço é funil quebrado.

## Quem sabe o quê

```
lib/eventos/tipos.ts        contrato: EventoPresencial + MarcaEvento
        ↑ satisfies
app/gubigdata/evento.ts     EVENTO_GU   + MARCA_GU      (conteúdo do encontro corrente)
app/cafe-networking/evento.ts  EVENTO_CAFE + MARCA_CAFE (conteúdo da edição corrente)
        ↓ passa pra
components/evento/          PaginaEvento · PaginaCheckoutEvento
                            TicketBox · InscricaoEventoForm      (nenhum sabe qual evento é)
lib/eventos/carregar.ts     tipos do banco → props, tolerante a banco fora
```

**Nenhum componente compartilhado tem rota, data, preço ou nome de palestrante escrito
dentro.** Onde o botão leva sai de `evento.baseUrl`; pra onde o form posta, de `evento.apiUrl`;
a regra de endereço de PJ, de `evento.enderecoObrigatorioPJ` (que o teste amarra ao registry).
O canário `lib/__tests__/eventos-presenciais.test.ts` reprova rota escrita nos componentes e
`dd/mm` solto nos arquivos de rota.

**A marca é dado, não código:** `MarcaEvento` traz logo, cor do header, site e o texto do
produtor. É o que faz a mesma página parecer do GU numa rota e do DSSBR na outra. Header
sempre escuro — os dois logos têm traços claros e sumiriam num fundo branco.

**Palestrante é opcional.** Quando a peça anuncia só a *empresa* (a Arlequim, na primeira versão
do café de 06/10), `palestrantes` vazio faz a seção "Quem apresenta" sumir sozinha.

## Trocar de edição (a receita, 7 passos)

1. `app/<evento>/evento.ts` — novo slug + conteúdo da edição.
2. `lib/produtos.ts` — entrada nova (fallback R$ 30, 3x, PJ sem endereço).
3. `lib/admin-queries.ts` — `PRODUTO_LABEL`, `PRODUTO_TAB`, `CHECKOUT_URL` e
   `precosSugeridosCobranca`; a edição que saiu entra em **`PRODUTOS_ENCERRADOS`**.
4. `lib/email/conteudo.ts` — mais um `case` (o texto não cita data, é só encaixar o slug).
5. Seed dos dois tipos na migração (`sql/admin-migration.sql` + `api/admin/migrate/route.ts`),
   **sem `vendas_ate`**. Rodar `POST /api/admin/migrate` depois do deploy.
6. Banner e fotos em `public/<evento>/` (o canário reprova caminho que não existe).
7. **Desligar os tipos da edição anterior** em `/admin/ingressos` (`ativo=false`, nunca
   deletar — o histórico precisa do nome).

Passos 1–6 são deploy; o **7 é banco**, e os dois precisam acontecer:

> 🚨 **Nada expira sozinho também significa que nada FECHA sozinho.** O encontro do GU de
> 26/08 seguiu comprável por **10 dias depois de acontecer**, porque o deploy trocou a página
> mas ninguém desligou o tipo velho. Deploy sem o passo 7 deixa o ingresso do evento passado à
> venda; passo 7 sem deploy deixa a página anunciando um evento que já foi.

## Trocar a apresentação da MESMA edição (mesmo dia e local)

Nem toda mudança é edição nova. Quando o produtor troca quem apresenta, mas mantém data e local
(caso do café de 06/10, que passou da Arlequim pra Bindflow em 18/09), a receita é outra:

1. **Contar as inscrições do produto** antes de decidir:
   `/admin/vendas?curso=<slug>`. O parâmetro é `curso`: com `produto`, a lista ignora o filtro e
   mostra todas as vendas.
   - **Zero inscrições** → troque só o conteúdo (passos 2–4). Produto, tipos, URL e endpoint
     continuam os mesmos.
   - **Já tem inscrito** → essas pessoas compraram pra ver outra apresentação. Decida com o
     Binhara: ou avisa os inscritos e troca o conteúdo, ou trata como edição nova (receita dos 7
     passos acima).
2. `app/<evento>/evento.ts`: título, chamada, tema, horário, metas, descrição, agenda,
   palestrantes, realização e a opção "Convidado da <empresa>" em `associacoes`.
3. `lib/produtos.ts`: a `descricao` do registry, se o horário mudou.
4. Assets com **nome novo** (`banner-<empresa>-<mês>.jpg`), com `git rm` no antigo. Com o mesmo
   nome, o cache do otimizador de imagem e dos crawlers de OG segue servindo a arte velha. Foto de
   palestrante: recortar no rosto em 400×400, porque o componente mostra 64px em círculo.

Não mexe em banco, em migração nem no e-mail (o texto do e-mail não cita empresa nem data).
**Até o deploy subir, a página no ar continua com a apresentação antiga.**

## Rotas

| Rota | O quê |
|---|---|
| `/<evento>` | Página de EVENTO (tema claro, indexável, OG do banner). Banner → título/data/local → descrição/programação/palestrantes/local/produtor à esquerda + card **Ingressos** sticky à direita (stepper 0/1, botão verde) |
| `/<evento>/inscricao` | Checkout no MESMO tema claro (noindex). `?tipo=` pré-seleciona o ingresso vindo do card, e pode apontar pra um ingresso oculto |
| `POST /api/<evento>/inscricao` | Rota fina → `processarCheckout(SLUG, body)` — a rota não sabe a data |

## Checkout (`lib/checkout-produto.ts`)

Mesmo pipeline do DSSBR, parametrizado pelo slug do registry:

- **PAGO**: validação (CPF obrigatório — exigência do Asaas) → preço SEMPRE derivado no
  servidor (tipo do catálogo, ou preço único do registry) → `criarCobranca` → `{ invoiceUrl }`.
- **GRATUITO** (tipo com `preco_centavos = 0`): sem CPF e sem Asaas. Dedupe por
  `(curso_slug, email, tipo)` → INSERT confirmado (`status='paid'`, `billing_type='GRATIS'`,
  `pago_em=NOW()`) → `{ gratuito: true }`. Reenvio devolve `duplicada` (idempotente).
  O select "sou associado/convidado de" vai em `como_conheceu` (conferência na porta).
- `consentimento: true` é exigido **antes** de qualquer validação de tipo (LGPD) — POST sem
  ele responde 400 e parece bug de tipo.

## Tipos de ingresso

`vendas_ate DATE` (NULL = sem prazo) e `limite_qtd INTEGER` (NULL = sem limite), com
`disponibilidadeDoTipo(tipo, hoje, inscritos)` puro: inativo/prazo → "encerrado", lotado →
"esgotado". Checado no server da página, do checkout **e** da API — o POST recusa tipo
indisponível mesmo com request forjado.

Os tipos por evento hoje:

| evento | tipo | preço | parcelas | vagas |
|---|---|---|---|---|
| GU 24/09 | Geral | R$ 30 | 3x | sem limite |
| GU 24/09 | Associado IEP, GU BigData e Participante DSSBR | grátis | — | sem limite |
| Café 06/10 | Geral | R$ 30 | 3x | sem limite |
| Café 06/10 | Convidado e associado | grátis | — | sem limite |

⚠️ **O café diz "vagas limitadas" na peça, mas `limite_qtd` é NULL** — decisão do Binhara em
05/09: o checkout não fecha sozinho, o controle de lotação é na mão.

## Gotchas

1. **SSR do Next 16 engole o espaço depois de `</strong>`** (`IA</strong> é` virou `IAé`).
   Fix: string explícita começando com espaço.
2. **Widgets globais** (WhatsAppFab, CourseFloatingBanner) escondidos nas rotas de evento —
   quebravam a cara de marketplace e cobriam o card de ingressos no mobile.
3. **Logo SVG largo** em flex com `shrink-0` estourava a largura no mobile. Fix: empilhar
   (`flex-col sm:flex-row`) + `max-w`.
4. `ADMIN_PASSWORD` do `web/.env.local` **funciona contra produção** — dá pra logar via curl e
   chamar `/api/admin/migrate`, `/api/admin/ingressos` da CLI ([[reference_operar_prod_via_admin_api]]).
5. Descrição do tipo não deve repetir o subtítulo de parcelas do card.
6. **Banco local ≠ banco de prod**: rodar a migração local semeia os tipos só lá.

## Histórico

- **2026-07-11** — GU no ar (`gubigdata-2026-07`), primeiro evento com página + checkout.
- **2026-07-30** — 🚨 incidente: o seed nasceu com `vendas_ate='2026-07-29'` e os dois tipos
  fecharam à meia-noite do dia do evento, **inclusive o gratuito**. Desde 01/08 a regra é
  `vendas_ate` vazio. Daí o vigia de vendas (`lib/vigilancia.ts`).
- **2026-08-20** — encontro de 26/08; nasce a regra "1 encontro = 1 produto".
- **2026-09-05** — encontro de 24/09 entra e o de 26/08 sai (10 dias tarde); duas `description`
  de metadata com data fixa consertadas; **café do DSSBR criado** e a página vira componente
  compartilhado.
- **2026-09-18** — o café de 06/10 troca de apresentação: sai a Arlequim (DaaS), entra a
  **Bindflow** com Lucas Moraes (AtendeVet), 8h às 10h. **Mesmo produto** (`cafe-networking-2026-10`),
  mesmos tipos e mesma URL — era o mesmo dia e local, e havia **zero inscrições** no produto, então
  não havia comprador a migrar. Trocar só o conteúdo de `evento.ts` + assets; nada no banco.
  Virou a receita "Trocar a apresentação da MESMA edição". Contexto:
  [`CONTEXTO-SESSAO-CAFE-BINDFLOW-2026-09-18.md`](../CONTEXTO-SESSAO-CAFE-BINDFLOW-2026-09-18.md).

> **08/10/2026 — passo 7 em atraso:** os tipos do café 06/10 (ids 50/51, `cafe-networking-2026-10`) e
> do GU 24/09 (ids 35/36, `gubigdata-2026-09`) continuam **ativos** e `/cafe-networking/inscricao` e
> `/gubigdata/inscricao` vendem R$ 30 pra evento que já aconteceu. O post do café no dssbr.com.br
> ainda linka `/cafe-networking`. Desligar aguarda OK do Binhara.

Última revisão: **2026-10-08**.
