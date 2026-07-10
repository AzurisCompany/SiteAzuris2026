# Handoff — Reconciliação, importação e diagnóstico Asaas (2026-07-10)

**Tudo pushado e DEPLOYADO em produção** (azuris.com.br). Working tree limpo. Commits até `0da384d`.

```
0da384d feat(admin): filtrar importação por data de criação (default jun/2026)
2a289f3 feat(admin): agrupar parceladas na importação — 1 venda por parcelamento
2c9c85b feat(admin): diagnóstico das falhas de conciliação (/admin/conciliacao)
8a295b3 feat(admin): importar cobranças criadas no painel do Asaas (mapeamento)
d9ea600 feat(admin): reconciliação de caixa — saldo Asaas × líquido do banco
91822bb feat(admin): trocar meio de pagamento (estava represado, foi junto)
```

Doc técnico completo: [docs/ADMIN-RECONCILIACAO-IMPORTACAO.md](./docs/ADMIN-RECONCILIACAO-IMPORTACAO.md).
Integração Asaas ponta a ponta: [docs/ASAAS-INTEGRACAO-COMPLETA.md](./docs/ASAAS-INTEGRACAO-COMPLETA.md).

---

## De onde partiu

Binhara notou uma **diferença** entre o "Líquido recebido" do dash (R$ 5.352,62) e o saldo do Asaas
(R$ 7.670,39). Diagnóstico: **não é bug** — saldo de caixa ≠ receita reconhecida; ele tinha sacado
R$5k via antecipação e o parcelado traz parcelas futuras pro saldo. Isso disparou 3 ferramentas.

## O que entrou (5 features, todas em prod)

1. **Reconciliação de caixa** (`/admin/saude`, bloco no topo) — Saldo Asaas × Líquido do banco ×
   diferença + extrato das últimas 60 movimentações agrupado por tipo. `getBalance` +
   `getFinanceTransactions` + `lib/reconciliacao.ts`.

2. **Importar cobranças do painel** (`/admin/importar`) — varre `GET /payments`, faz diff contra o
   banco, lista o que existe só no Asaas e importa no bucket `avulso-asaas`. Idempotente.

3. **Parcelado agrupado** — a importação agrupa por `installment` e importa como UMA venda (soma das
   parcelas, status agregado). Antes vinha 1 linha por parcela, sem sentido.

4. **Filtro por data** — `/admin/importar` só lista cobranças criadas a partir de **jun/2026** por
   padrão (atalhos jun/jul/2026, `?desde=YYYY-MM-DD`). Usa `dateCreated[ge]`.

5. **Diagnóstico de falhas de conciliação** (`/admin/conciliacao`) — dry-run que mostra QUAIS
   cobranças o cron não sincroniza e POR QUÊ, classifica teste-vs-erro-real, com "marcar teste".

Também: `91822bb` (trocar meio de pagamento) foi deployado junto — estava commitado mas represado.
E o texto de pagamento do curso Lakehouse foi corrigido no rascunho obsoleto
`materiais/landpageCurso/` (o que está no ar já estava certo).

---

## ⏭️ PENDÊNCIAS do Binhara (ações manuais, nada de código)

1. **Importar a venda do Tiago** em `/admin/importar` — cartão 3x, R$550, agora agrupada numa linha
   só. Clicar "Importar venda (3x)". (Foi o caso que originou tudo — criado direto no painel.)
2. **Rodar `/admin/conciliacao`** — marcar `is_teste` nas amarelas ("não existe no Asaas"). Se
   aparecer alguma **vermelha** (erro não-404), mandar a mensagem pro Claude investigar.
3. **Rodar a migração** `POST /api/admin/migrate` (ainda não rodou) — destrava assinaturas/NF.
4. Config financeira (meta/alíquota/NF), config fiscal Asaas, antecipação no painel Asaas.

## ⚠️ Não exercitado contra o Asaas real

Toda a integração roda **em produção** (chave só no Vercel) — não deu pra testar da CLI local.
Verificado só com `tsc` + `next build` + 40 testes unitários. **Testar com a venda do Tiago primeiro**;
se der erro, aparece na própria tela. Caveats: `order=desc` do extrato e a soma das parcelas via
`GET /payments?installment=` — conferir se os valores batem.

## Deixado de fora (de propósito)
Importar em lote (só individual), sub-registros das parcelas 2..N como receita, tela de edição do
bucket avulso. Login hardening + export CSV continuam como candidatos da próxima leva.
