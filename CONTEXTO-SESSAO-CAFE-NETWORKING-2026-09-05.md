# Sessão 2026-09-05 (parte 2) — o café do DSSBR entra, e a página de evento vira componente

**Tipo:** produto novo em produção — `/cafe-networking` — que virou refactor: em vez de
duplicar a página do GU, ela foi generalizada. Dois bugs latentes apareceram no caminho.

**Estado do repo ao fim:** working tree limpa. Um commit de código (`7c12c65`) + este contexto.

**Deploy:** 1, verificado no ar rota por rota. **Migração de prod:** rodada, 46/46 (era 45) —
o seed dos dois tipos do café entrou por ela, sem cadastro manual. **Testes:** 252 passando
(24 arquivos), eram 238. Build limpo, 89 rotas (eram 85).

Doc novo: [`docs/EVENTOS-PRESENCIAIS.md`](./docs/EVENTOS-PRESENCIAIS.md) — a mecânica que
agora serve os dois eventos. O doc do GU virou ponteiro pra ele + histórico próprio.

---

## 1. O pedido

*"criar um novo checkout com novo ingresso para [o post do café de 06/10] como essa aqui
[/gubigdata] mas pode criar uma nova url .. e desabilite as inscrições do último café"*

Decisões tomadas com o Binhara antes do código: **dois tipos** (Geral pago + Convidado
gratuito), **Geral a R$ 30**, **sem limite de vagas no sistema**, e URL **`/cafe-networking`**
(página de evento + `/inscricao`, no padrão do GU).

## 2. "Desabilitar o último café" — não era nosso

O café anterior (07/08, IEP) foi vendido pelo **Sympla**
(`sympla.com.br/evento/cafe-da-manha-do-dssbr-.../3431274`), e a página de lá já mostra
"Evento encerrado". No nosso banco não existe nenhum produto de café: os únicos com tipos
cadastrados eram `dss-2026`, os três `gubigdata-*` e `preparatorio-dados`. **Nada a desligar
do nosso lado** — se sobrar algo aberto, é no painel do Sympla.

Este café é, portanto, o **primeiro** do DSSBR a vender pelo checkout próprio.

## 3. A página não foi duplicada — virou componente

O caminho fácil era copiar `gubigdata/page.tsx` (212 linhas) e `InscricaoGuForm.tsx` (362
linhas) e trocar os textos. O precedente contra isso está no repo: a **escada duplicada do One
Day** viveu em dois arquivos, sem teste, com bug aberto de julho até 25/08.

O que ficou:

```
lib/eventos/tipos.ts          EventoPresencial + MarcaEvento  ← contrato
lib/eventos/carregar.ts       tipos do banco → props (tolerante a banco fora)
lib/eventos/rotas.ts          ROTAS_EVENTO — a lista que os widgets globais consultam
components/evento/            PaginaEvento · PaginaCheckoutEvento · TicketBox ·
                              InscricaoEventoForm — nenhum sabe qual evento renderiza
app/gubigdata/evento.ts       EVENTO_GU + MARCA_GU
app/cafe-networking/evento.ts EVENTO_CAFE + MARCA_CAFE
```

As quatro rotas (`page.tsx` × 2, `inscricao/page.tsx` × 2) viraram ~25 linhas cada: metadata,
carregamento e o componente. Rota, endpoint, regra de endereço de PJ e a lista do select de
associação **saem do objeto do evento**, não de constante local — o canário reprova rota
escrita dentro de componente compartilhado.

**A marca é dado:** `MarcaEvento` traz logo, cor do header, site e o texto do produtor. É o que
faz a mesma página parecer do GU numa rota (`#0A0F1C`, logo do GU) e do DSSBR na outra
(`#04120F`, logo do DSS 2026, ambos baixados dos sites de origem).

## 4. Dois bugs que só apareceram porque a rota mudou

- **O WhatsApp da Azuris voltou a cobrir o card de ingressos.** A regra "sem widgets Azuris em
  página de evento" estava escrita como a string `'/gubigdata'` **dentro de cada widget**
  (`WhatsAppFab`, `CourseFloatingBanner`). Rota nova, bug de volta — o mesmo que o gotcha nº 2
  do doc do GU já tinha custado uma vez. Virou `lib/eventos/rotas.ts`, com canário amarrando a
  lista ao `baseUrl` de cada evento em cartaz.
- **`palestrantes` vazio precisava sumir a seção.** A peça do café anuncia a *empresa*
  (Arlequim), não pessoas: sem o guard, a página renderizaria "Quem apresenta" vazio.

## 5. O que mudou no banco de produção

Nada na mão: o **seed da migração** criou os dois tipos, e `POST /api/admin/migrate` (46/46)
os aplicou depois do deploy.

| tipo | preço | parcelas | vagas | prazo |
|---|---|---|---|---|
| `geral` | R$ 30 | 3x | sem limite | sem prazo |
| `convidado` (Convidado e associado) | grátis | — | sem limite | sem prazo |

⚠️ A peça do DSSBR diz **"vagas limitadas"**, mas `limite_qtd` é NULL — decisão do Binhara: o
checkout não fecha sozinho, o controle é na mão.

## 6. Verificado no ar (não no build)

| rota | o que se viu |
|---|---|
| `/cafe-networking` | título, data (06/10, terça), agenda 08h00→10h30, Geral **R$ 30,00** e Convidado **Grátis**, produtor DSSBR |
| assets | `banner-outubro.jpg` (310KB) e `logo-dss-2026.svg` — 200 |
| `/cafe-networking/inscricao?tipo=convidado` | abre no gratuito → "Confirmar inscrição gratuita", select com "Convidado da Arlequim" |
| `/gubigdata` | **sem regressão**: 24/09, Churn, R$ 30,00, Grátis |
| WhatsAppFab | 0 em `/cafe-networking` e `/gubigdata`, 1 na home |

Local, antes do deploy: fluxo gratuito E2E nos **dois** eventos — inscrição criada → reenvio
devolve `duplicada` → tipo inválido **400** → POST sem `consentimento` **400**.

## 7. Armadilhas desta sessão

- **`pkill -f "next start"` não mata o `next start`.** Matou o próprio pipeline do comando; o
  servidor seguiu vivo na 3123 e a subida seguinte falhou com `EADDRINUSE` — silenciosamente,
  porque o log ia pra arquivo. Resultado: passei a conversar com um **build velho**, e só notei
  porque a migração local devolveu 45 statements em vez de 46. Receita certa:
  `ss -lptn 'sport = :3123'` → `kill <pid>`, e esperar a porta liberar.
- **`grep -oE "R\$ 30,00"` entre aspas duplas mente** — de novo. O `\$` vira `$`, o grep lê como
  fim de linha e a página "não tem" o preço que tem. Aspas simples.
- O post do DSSBR ainda diz **"Inscrições em breve"** e tem o botão "Garantir minha vaga"
  comentado no HTML, esperando o link — que agora existe.

## Fica pendente

**Desta sessão:**

- **Colar o link no post do DSSBR**: `https://www.azuris.com.br/cafe-networking` (o post é do
  site do DSSBR, fora deste repo).
- **Fluxo PAGO do café sem 1 PIX real** — mesmo pipeline do GU e do DSS, mas o café é produto
  novo e nunca cobrou.
- A peça anuncia "vagas limitadas" e o sistema não limita: se lotar, o checkout continua
  aceitando.
- Nenhum caminho leva ao café a partir do site da Azuris (nem home, nem `/comunidade`) — só o
  link direto. Proposital por ora: é evento do DSSBR.

**De antes, inalterado:** DSS a **52 dias** (27–29/10) com Lote 2 R$ 670 sem virada marcada ·
copy pré-evergreen do curso na home (`Ecosystem.tsx`, `CourseCallout`, `lakehouse-og`) · zero
pagamento real nos produtos de 25/08 · GU sem 1 PIX real · NFS-e no Portal Nacional · Resend
nunca conferido numa venda real · `CUPOM_SECRET` ausente na Vercel · bug do bloco "Regerar" ·
PostHog sem chave · deploy ainda é `vercel --prod` na mão.

Última revisão: **2026-09-05**.
