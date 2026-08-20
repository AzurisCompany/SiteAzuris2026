# Sessão 2026-08-20 — encontro do GU de 26/08: evento novo, produto novo

**Tipo:** releitura do projeto → ingresso novo pro encontro presencial do GU BigData & IA de
**26 de agosto** (Geral R$ 30 · associado grátis), no mesmo molde do de 30/07 → e, no caminho,
a decisão de como o site trata "o próximo encontro" daqui pra frente.

**Estado do repo ao fim:** working tree limpa. `ef28273` (código) e `26d7739` (docs) — mais o
commit de fechamento deste contexto.

**Deploy:** 1, verificado no ar. **Migração de prod:** rodada, 44/44 (era 43).
**Testes:** 206 passando (20 arquivos), eram 198. Build limpo.

**No ar ao fim da sessão:** `/gubigdata` serve o encontro de 26/08 com os dois ingressos;
os tipos do encontro de 30/07 estão **desativados** em produção.

Docs: [`docs/GUBIGDATA-EVENTO-CHECKOUT.md`](./docs/GUBIGDATA-EVENTO-CHECKOUT.md) (receita de
trocar de encontro) e [`docs/CATALOGO-PRECOS-E-VENDAS.md`](./docs/CATALOGO-PRECOS-E-VENDAS.md).

---

## 1. O pedido

Um ingresso novo pro encontro do GU divulgado em `gubigdata.com.br/email/encontro-26-08/`:
checkout com **Geral R$ 30** e **associado (IEP / GU BigData / DSSBR) gratuito** — igual ao
evento anterior.

## 2. A decisão que definiu o tamanho do trabalho

Dava pra cadastrar dois tipos novos no produto `gubigdata-2026-07` e não tocar em código.
Custo escondido: a receita, a lotação e a aba do painel dos dois encontros ficariam no mesmo
balde, e a descrição que vai pro Asaas (e daí pra nota) continuaria dizendo **30/07**.

Escolha: **cada encontro é um produto** (`gubigdata-AAAA-MM`). E, junto, a regra de que
**`/gubigdata` é sempre o encontro corrente** — nunca um arquivo de eventos passados.

## 3. O que foi construído

`src/app/gubigdata/evento.ts` (`EVENTO_GU`) concentra o encontro em cartaz: slug, título,
data, local, agenda, palestrantes e banner. Página do evento, checkout, rota de API e o card
da `/comunidade` leem de lá — **nenhum deles tem data escrita à mão**. O card da comunidade
anunciava 30 de julho havia três semanas; isso era o sintoma.

Trocar de encontro passou a ser uma receita de 6 passos (no doc), coberta por um canário de
7 testes: registry com R$ 30/3x, rótulo e aba no admin, cobrança avulsa apontando pro
corrente, e-mail com texto próprio, seed com os dois tipos **sem data de encerramento**, e as
imagens existindo no `public/`. Nenhum desses erros quebra build: o site sobe bonito e a
venda cai no balde errado.

**`PRODUTOS_ENCERRADOS`** é o outro lado: encontro que saiu de cartaz continua no registry e
nos mapas de rótulo (o histórico precisa saber o nome do que foi vendido), mas sai do
`CHECKOUT_URL` e do seletor da cobrança avulsa. Apontar o admin pro `/gubigdata` do evento de
julho mandaria ele pra página de outro evento.

Assets: banner e as duas fotos vieram da peça de divulgação — as fotos saíram recortadas do
próprio banner com `ffmpeg` (não há foto solta dos palestrantes no site do GU).

## 4. Em produção

| tipo | preço | parcelas | prazo | vagas |
|---|---|---|---|---|
| Geral | R$ 30 | 3x | **sem prazo** | sem limite |
| Associado IEP, GU BigData e Participante DSSBR | grátis | — | **sem prazo** | sem limite |

`vendas_ate` vazio é deliberado: foi uma data digitada aí que fechou o checkout do GU à
meia-noite do dia 30/07, na cara do público.

Os tipos foram cadastrados **pela API do admin**, antes do deploy — catálogo é banco, não
código. O seed da migração existe pra reproduzir o ambiente do zero; rodado depois, ele não
sobrescreveu nada (`ON CONFLICT DO NOTHING`).

**Os dois tipos de 30/07 foram desativados** (`ativo=false`) — estavam vivos com prazo
vencido desde o evento.

Verificado no ar: `/gubigdata` mostra Geral R$ 30,00 em até 3x e Associado grátis, ambos com
"Vagas limitadas" · `?tipo=associado` abre com o gratuito marcado ("Confirmar inscrição
gratuita") · `?tipo=geral` nasce com "Gerar PIX de R$ 30,00" · inscrição gratuita real criada,
reenvio devolveu `duplicada`, tipo inexistente levou 400 antes de gravar. A inscrição de
teste (#123) ficou marcada `is_teste`.

**Links:** `azuris.com.br/gubigdata` (divulgação) · `/gubigdata/inscricao` ·
`?tipo=geral` · `?tipo=associado`.

## 5. Armadilhas

- **A peça do GU anuncia "Entrada gratuita".** Decisão do Binhara (20/08): mantém R$ 30 no
  geral e gratuito pro associado, como em 30/07. Quem chegar pela peça vai ver o pago.
- **Link antigo continua funcionando, apontando pro evento novo.** `?tipo=associado` é o mesmo
  path de julho; hoje ele cai no gratuito de agosto. É o comportamento desejado — mas vale
  lembrar que `tipo_id` repetido entre encontros é o que faz isso acontecer.
- **`/gubigdata` é sempre o corrente.** Não existe página do encontro passado: depois do
  deploy, o de julho só existe como histórico de vendas.

## Fica pendente

**Desta sessão:**

- **Divulgar o link** — o site do GU aponta pra página do post, não pro checkout.
- O checkout do GU **não mostra tarja** quando o `?tipo=` não existe: cai calado na vitrine de
  preço cheio. O do DSS mostra (`recusaLink`). Vale espelhar na próxima mexida.
- Fluxo **pago** do GU segue sem 1 PIX real (mesmo pipeline do DSS, que já tem venda paga).

**De antes, inalterado:** e-mail do Resend nunca conferido numa venda real · `CUPOM_SECRET`
ausente na Vercel e `BIN01`/`CEL01` fracos · 3 passos manuais do `/admin/trafego` · commits
não pushados pro GitHub · 6 erros da sync Asaas de 01/08 · escada do One Day duplicada ·
bug do bloco "Regerar" · PostHog sem chave e sem `purchase` no GA4.

Última revisão: **2026-08-20**.
