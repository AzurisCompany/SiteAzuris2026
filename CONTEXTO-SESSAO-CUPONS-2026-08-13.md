# Sessão 2026-08-13 — cupons de desconto (vendedoras e parceiros), do zero ao ar

**Tipo:** releitura do projeto + construção de link de desconto pras vendedoras, em duas ondas.
**Estado do repo ao fim:** `main` = `bf9d0ae` + o commit deste doc. Working tree limpa.
**Commits desta sessão:** `a9e5696` (onda 1 — token assinado) e `bf9d0ae` (onda 2 — tabela + aba).
**Deploys:** **dois**, ambos verificados no ar. O primeiro levou junto o GTM parado desde 12/08.
**Migração de prod:** rodada (`POST /api/admin/migrate`, 42/42, 115 inscrições antes e depois).
**Testes:** 184 passando (19 arquivos), eram 153/17. Build ok.

Doc de referência: [`docs/CUPONS-DESCONTO.md`](./docs/CUPONS-DESCONTO.md).

---

## 1. O pedido

Link de venda do FullPass com **10% de desconto** que as vendedoras gerassem **sozinhas**, de
forma simples, e que **expirasse em 2 dias**.

## 2. Onda 1 — token assinado, sem tabela (`a9e5696`)

A regra que sustenta tudo: **o link concede um percentual, nunca um preço.** Quem calcula o
valor é `processarCheckout()`, como sempre. O link carrega
`base64url("codigo|produto|pct|expira_em") + "." + HMAC-SHA256`.

A validade fica **dentro do que é assinado** — esticar a data quebra a assinatura. Foi assim que
deu pra ter prazo por link sem tabela, sem cron e sem estado.

Cadastro de quem podia gerar: caixa de texto (`Nome: CODIGO`) na config do admin. **Escolha
errada** — ver seção 4.

## 3. O deploy que destravou o GTM

O primeiro `vercel --prod` da sessão levou junto o commit `cd0e147`, parado no repo desde 12/08.
A home passou a servir `GT-NNZW5FW` **+ `GTM-T7647L5K`**. Segue valendo: **não configurar tag GA4
da propriedade 421271387 dentro do container** — o gtag legado continua no ar em paralelo e é ele
que dispara os `begin_checkout`; duplicaria pageview.

## 4. O que deu errado (e por que a onda 2 existiu)

Três tropeços seguidos, todos de interface — nenhum de lógica:

| Sintoma | Causa real |
|---|---|
| "não consigo logar, senha `q1w2E#R$`" | senha de outro sistema. A do admin é a do `.env.local`, confirmada com 401 vs 200 contra a prod |
| "não tem caixa Vendedoras" | **a feature não estava no ar** — eu tinha dito isso enterrado no meio de outras coisas, e não como primeira linha |
| "código não confere" (2×, com `BIN01` e `CEL01`) | texto digitado e **nunca salvo**: o botão `salvar` era pequeno e ficava embaixo da caixa |
| "não entendo de onde vem esse código" | ninguém explicou que **o código é inventado por quem cadastra**. A caixa de texto não ensinava nada |

O padrão é o mesmo nos quatro: a lógica funcionava e a tela não contava a história. Caixa de
texto livre transfere pro usuário a obrigação de decorar um formato — e some com o erro quando
ele decora errado.

## 5. Onda 2 — tabela `cupons` + aba `/admin/cupons` (`bf9d0ae`)

O pedido de "cupom de 15% pro parceiro, **sem limite de tempo**" forçou o redesenho: sem prazo e
sem tabela não há como revogar, e um link permanente vazado vira o preço novo pra sempre. "Sem
prazo" **exige** botão de desligar.

A tabela guarda a **regra**, não os links. O checkout consulta a linha a cada uso, o que destrava:

- **desligar mata links já distribuídos**, na hora;
- **o percentual da linha vence o do token** — mudar 15% pra 12% vale pros links que já circulam;
- **quanto cada cupom vendeu**, cruzando com as colunas `utm_*` que já existiam.

Duas formas de link, e a trava entre elas:

| | Vendedora | Parceiro |
|---|---|---|
| URL | `?d=<token assinado>` | `?c=CODIGO` |
| Prazo | `validade_horas` (48) | nenhum |
| Quem gera | ela, em `/vendas` | você, uma vez, na aba |

**Cupom com prazo é recusado na forma `?c=`.** Sem isso bastaria usar o código da vendedora numa
URL pra ter link permanente e furar as 48h. Tem teste.

## 6. O que ficou no ar

- `/vendas` — vendedora digita a senha, recebe link com **Copiar** e **Enviar no WhatsApp**.
- `/admin/cupons` — formulário (nome, código com botão de sortear, %, produto, prazo, limite),
  link fixo do parceiro pronto pra copiar, ligar/desligar, e vendas por cupom.
- Checkout do DSS lendo `?d=` e `?c=`, com tarja verde e preço já descontado.
- Cadastrados em prod: `bin01` (Binhara) e `cel01` (Celeste), ambos 10% / 48h.

Verificado no ar: sem cupom R$570 · link da vendedora **R$513** · código como link fixo
**recusado** · código inexistente **401** · aba do admin **200**.

## 7. Armadilhas pra quem mexer nisso depois

- **Trocar o código de um cupom zera o histórico dele.** As inscrições ficam gravadas com o
  código velho (`utm_content`). Renomeie o `nome` à vontade; o código, não.
- **`limite_usos` conta pending**, igual à lotação de ingresso: quem abandonou o checkout ocupa
  vaga até a cobrança vencer.
- **Teto de 20%** (`CUPOM_PCT_MAX`) conferido na leitura do token **e** na gravação do cadastro.
- **Falha fechada:** sem segredo de assinatura, ou com o banco fora do ar, o desconto é negado —
  nunca concedido no escuro.
- Links gerados **antes** de `bf9d0ae` morreram: o campo 1 do token passou de slug do nome pro
  código do cupom.
- A chave `vendedoras` da `config_financeiro` ficou **órfã** no banco de prod. Pode apagar.

## Fica pendente

**Desta sessão:**

- **Nenhum PIX real ainda** — o teste de ponta a ponta com dinheiro de verdade continua sem
  acontecer, agora também pro fluxo de cupom. Um link de 10% pro próprio Binhara resolveria isso
  e o e-mail do Resend de uma vez.
- Trocar `BIN01`/`CEL01` por códigos fortes antes de distribuir (5 caracteres, adivinháveis).
- `CUPOM_SECRET` não foi definida na Vercel — a assinatura está caindo no
  `ADMIN_SESSION_SECRET`. Funciona, mas amarra as duas coisas no mesmo segredo.
- Cupom de parceiro nunca foi criado em produção (só testado local).

**De antes, inalterado:**

- Os 3 passos manuais no console pra destravar `/admin/trafego` (sessão de 11/08, seção 6).
- Commits não pushados pro GitHub (auto-deploy segue inexistente; prod vai por CLI).
- 6 erros da sincronização Asaas de 01/08, sem diagnóstico.
- Home do **englishtalktime.com.br** ainda anuncia R$ 70 / R$ 39 / R$ 390.
- Escada de lotes do One Day duplicada entre `produtos.ts` e `one-day/page.tsx:13`, sem teste.
- Bug antigo: campos do bloco "Regerar" ficam velhos após `router.refresh()`.
- `NEXT_PUBLIC_POSTHOG_KEY` nunca configurada — PostHog morto na prática.
- Sem evento `purchase` no GA4: o funil termina em `begin_checkout`.

Última revisão: **2026-08-13**.
