# Sessão 2026-08-14 — ingresso de estudante do DSS (R$ 400), só por link

**Tipo:** releitura do projeto + produto novo (variante de ingresso do DSS 2026).
**Estado do repo ao fim:** `main` = `f6bdefe` + o commit deste doc. Working tree limpa.
**Deploy:** 1, **verificado no ar**. Migração de prod rodada (43/43; era 42 antes da coluna nova).
**Testes:** 191 passando (19 arquivos), eram 184. Build ok.

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

## 5. Armadilhas

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

- **Nenhum PIX real, em nenhum produto** — nem DSS, nem One Day, nem GU, nem ETT, nem cupom.
  Agora tem mais um caminho sem teste com dinheiro de verdade.
- `CUPOM_SECRET` não definida na Vercel (assinatura caindo no `ADMIN_SESSION_SECRET`);
  trocar `BIN01`/`CEL01` por códigos fortes; cupom de parceiro nunca criado em prod.
- Os 3 passos manuais no console pra destravar `/admin/trafego` (sessão de 11/08, seção 6).
- Commits não pushados pro GitHub (auto-deploy segue inexistente; prod vai por CLI).
- 6 erros da sincronização Asaas de 01/08, sem diagnóstico.
- Home do **englishtalktime.com.br** ainda anuncia R$ 70 / R$ 39 / R$ 390.
- Escada de lotes do One Day duplicada entre `produtos.ts` e `one-day/page.tsx:13`, sem teste.
- Bug antigo: campos do bloco "Regerar" ficam velhos após `router.refresh()`.
- `NEXT_PUBLIC_POSTHOG_KEY` nunca configurada; sem evento `purchase` no GA4.

Última revisão: **2026-08-14**.
