# Sessão 2026-08-14 — ingresso de estudante do DSS (R$ 400), só por link

**Tipo:** releitura do projeto + produto novo (variante de ingresso do DSS 2026).
**Estado do repo ao fim:** `main` = `720de7a` (ingresso oculto `f6bdefe` + cobrança avulsa `720de7a`) + os commits de doc. Working tree limpa.
**Deploys:** **3**, todos verificados no ar. Migração de prod rodada (43/43; era 42 antes da coluna nova).
**Testes:** 198 passando (19 arquivos), eram 184. Build ok.

Doc de referência: [`docs/INGRESSO-OCULTO-ESTUDANTE.md`](./docs/INGRESSO-OCULTO-ESTUDANTE.md).

---

## 1. O pedido

Um ingresso de estudante do DSS a **R$ 400** — ao lado do FullPass Lote 1, que está R$ 570.

## 2. A decisão que mudou o tamanho do trabalho

Cadastrar um tipo novo no admin seria **zero código**. Só que um card "Estudante R$ 400"
na vitrine é 30% de desconto **aberto a qualquer um** — ninguém valida matrícula na hora
da compra. Escolha do Binhara: **só por link**, 50 vagas. Isso não existia, e é o que
justificou o deploy.

## 3. O que foi construído

Coluna `tipos_ingresso.oculto` + duas regras:

- `listarTiposAtivos` virou **`listarTiposPublicos`** (`ativo AND NOT oculto`). O rename
  é o ponto: "ativo" tinha virado sinônimo de "aparece", e agora não é mais.
- **`aplicarTipoDoLink`** (pura, 7 testes) decide o que o `?tipo=` concede. Link bom →
  o oculto entra na lista e já vem marcado. Id inexistente, esgotado ou desligado →
  vitrine no preço cheio **com tarja explicando**, nunca página de erro — mesma
  filosofia do cupom vencido.

Vale no checkout do DSS e no do GU (que já lia `?tipo=` pra pré-seleção; sem isso um
tipo oculto do GU teria link quebrado). No admin: checkbox "oculto", link pronto pra
copiar e tarja "só por link" na tabela.

Preço segue derivado no servidor — o client manda `tipo_id`, nunca valor.

## 4. Em produção

`dss-2026` / `estudante` · R$ 400 · âncora R$ 570 · até 3x · **50 vagas** · sem prazo ·
descrição "Com comprovante de matrícula — conferido na entrada do evento".

**Link:** `https://azuris.com.br/dssbr-2026/inscricao?tipo=estudante`

Verificado no ar: vitrine mostra só Lote 1 (570/820, **nenhum 400 na página**) · com o
link aparecem os dois cards e o botão já nasce **"Gerar PIX de R$ 400,00"** · `?tipo=estudantee`
cai na tarja "não existe mais" · landing `/dssbr-2026` não vazou o preço de estudante.

## 5. Onda 2 — o seletor da cobrança avulsa (`?` → deploy 2)

Binhara foi vender na mão e **o ingresso não estava lá**: `/admin/cobranca` listava só
*produtos*, e tipo de ingresso é outra coisa. Escolher "Ingresso DSS" e digitar R$400
funcionaria, mas a venda nasceria **sem `tipo_ingresso`** — fora da lotação das 50
vagas e fora do breakdown "Por tipo".

Agora cada tipo ATIVO do catálogo vira opção logo abaixo do produto dele, com preço
sugerido do catálogo. Tipo novo em `/admin/ingressos` aparece lá **sem deploy**.
Oculto entra (vender na mão é o caso dele); gratuito não (cobrança de R$ 0 não existe).
A opção passou a ser identificada por `slug:tipo`. A API confere o tipo contra o banco
e carimba na venda — mas **não** checa prazo nem lotação: venda manual é decisão do admin.

Verificado no ar: seletor traz "Ingresso DSS — Lote 1", "Ingresso DSS — Estudante" e
"Ingresso GU — Geral"; o Associado (grátis) ficou de fora. Tipo inexistente e tipo de
outro produto → **400 antes de qualquer cobrança nascer**.

## 6. Onda 3 — abas de origem em `/admin/vendas` (deploy 3)

Pedido: ver separado o que veio pelo **link de desconto** (`/vendas`) e o que veio de
**parceiro**. Virou uma faixa "Origem" abaixo das abas de produto — as duas dimensões
valem juntas (DSS + vendedora, por exemplo). O filtro é o `utm_source` que o checkout
carimba, que é o **tipo do cupom**; a lista de abas sai de `TIPOS_CUPOM`, então tipo novo
nasce com aba.

Detalhes que importam:

- `contarPorOrigem` conta com os filtros da tela **ignorando o filtro de origem** — senão,
  com uma aba aberta, as outras mostrariam zero e pareceriam vazias.
- Nessas abas entra a coluna **Cupom** (`utm_content`): quem vendeu.
- Vazio diz "a aba acende sozinha na primeira venda", não "nenhum resultado".
- Canário novo: o `utm_source` gravado no checkout tem que ser exatamente o valor que a aba
  filtra. Sem isso a aba fica muda e ninguém percebe — "0 vendas" é um resultado plausível.
- Copiar e-mails e CSV já seguiam os filtros → valem por aba de graça.

**No ar:** a aba **Link de vendedora já tem 1 venda — e ela é REAL e PAGA**: FullPass Lote 1
por `NIL-2026`, **R$ 543,99 no cartão em 3x** (= R$ 513 com desconto de 10% + juros), status
**Pago**, hoje (14/08). É o **primeiro dinheiro de verdade** de ponta a ponta no checkout
novo: cupom → preço derivado no servidor → Asaas → webhook fechando o status. Parceiro
segue zerada.

## 7. Armadilhas

- **O link não é segredo.** Quem adivinhar `?tipo=estudante` compra a R$ 400 — não há
  assinatura HMAC como nos cupons. A barreira real é o comprovante na entrada. Se doer,
  revogar (`ativo=false`) e recriar com outro `tipo_id`.
- **`tipo_id` é chave lógica** e fica gravado em `inscricoes.tipo_ingresso`: trocar quebra
  o link distribuído e desliga o histórico. O `nome` pode mudar à vontade.
- `limite_qtd` conta **pendentes**: carrinho abandonado ocupa vaga até a cobrança vencer.
- Oculto ≠ inativo. Inativo não vende; oculto vende, só não se anuncia.

## Fica pendente

**Desta sessão:**

- Divulgar o link (nenhum canal ainda aponta pra ele).
- Decidir se o estudante entra como filtro/rótulo em algum relatório — hoje ele já
  aparece sozinho no breakdown "Por tipo" do `/admin`.

**De antes, inalterado:**

- ~~Nenhum pagamento real~~ — **caiu hoje**: a venda do `NIL-2026` (cartão 3x, R$ 543,99,
  Pago) fechou o ciclo com dinheiro de verdade. **PIX** e o **fluxo de estudante** seguem
  sem teste real, e o e-mail do Resend nunca foi conferido numa venda de verdade.
- `CUPOM_SECRET` não definida na Vercel (assinatura caindo no `ADMIN_SESSION_SECRET`);
  trocar `BIN01`/`CEL01` por códigos fortes. Cupom de **parceiro** ainda nunca usado em prod.
- Os 3 passos manuais no console pra destravar `/admin/trafego` (sessão de 11/08, seção 6).
- Commits não pushados pro GitHub (auto-deploy segue inexistente; prod vai por CLI).
- 6 erros da sincronização Asaas de 01/08, sem diagnóstico.
- Home do **englishtalktime.com.br** ainda anuncia R$ 70 / R$ 39 / R$ 390.
- Escada de lotes do One Day duplicada entre `produtos.ts` e `one-day/page.tsx:13`, sem teste.
- Bug antigo: campos do bloco "Regerar" ficam velhos após `router.refresh()`.
- `NEXT_PUBLIC_POSTHOG_KEY` nunca configurada; sem evento `purchase` no GA4.

Última revisão: **2026-08-14**.
