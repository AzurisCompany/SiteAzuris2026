# Handoff — Boleto/multi-meio + upgrade financeiro em 4 ondas (2026-07-09)

Sessão grande. **Pushado e DEPLOYADO em produção** (azuris.com.br). Working tree limpo. Commits até `bbf2fd7`.

```
bbf2fd7 fix(financeiro): fronteiras de dia em BRT (off-by-one UTC)
711115e docs: resultado da revisão + follow-ups
8e4e097 test: Vitest + 40 testes unitários
b9d2ecf refactor(financeiro): correções P0/P1 da revisão de arquitetura
66e2147 docs: upgrade financeiro
43255a7 feat(admin): upgrade financeiro — boleto/multi-meio, confiabilidade, financeiro, NF e assinaturas
791d9cc content(lakehouse): modelo evergreen (autoguiado, sem turma com data fixa)
```

Doc técnico completo: [docs/ADMIN-FINANCEIRO-ONDAS-2026-07-09.md](./docs/ADMIN-FINANCEIRO-ONDAS-2026-07-09.md).

## Estado do deploy (fim da sessão)

- **Deploy prod OK** (Vercel CLI, `site-azuris-2026`, aliased `azuris.com.br`).
- **CRON_SECRET** setado na Vercel + redeploy. Cron `/api/cron/reconciliar` **verificado end-to-end**: 200, sincronizou **9 de 15** cobranças não-finais.
- Revisão de arquitetura (azuris-arquiteto) aplicada: P0.1/P0.2, refactor P1.1/P1.2, P1.4 (datas BRT) + **40 testes** (`pnpm test`).

## ⏭️ AMANHÃ (2026-07-10) — pendências

1. **Investigar os 6 erros de conciliação.** O cron reportou `sincronizadas:9, erros:6` de 15. Hipótese: linhas de teste/sandbox com `asaas_payment_id` que não existe mais na conta Asaas de produção (bate com "banco local ≠ prod"). Rodar `/admin/saude` e/ou o cron autenticado, listar as inscrições que falham no `getPayment`, e decidir: marcar como teste (`is_teste`) ou limpar. Comando de teste do cron (com o secret salvo na Vercel):
   `curl -H "Authorization: Bearer <CRON_SECRET>" https://azuris.com.br/api/cron/reconciliar`
2. **Rodar a migração** (`POST /api/admin/migrate` logado no /admin) — ainda NÃO rodou. Sem ela, `/admin/assinaturas` e config de NF dão banner de erro.
3. **Setar** meta/alíquota/descrição-NF em `/admin/financeiro`.
4. **Config fiscal na conta Asaas** (inscrição municipal/serviço/regime) pra NF emitir.
5. **Testar em sandbox**: emitir 1 NF, criar 1 assinatura de teste e ver o ciclo materializar.

---

## O que entrou

**Boleto + múltiplos meios** na cobrança avulsa (checkboxes; 1=fixo, 2+=UNDEFINED) + lista de cobranças geradas.

Depois, um roadmap de especialista selecionado pelo Binhara, em 4 ondas:

- **Onda 1 — Confiabilidade:** validação CPF/CNPJ (dígito verificador), anti-duplicação de cobrança, conciliação automática diária (Vercel Cron), painel `/admin/saude`.
- **Onda 2 — Operação:** editar vencimento/valor de fatura pendente + reenviar link.
- **Onda 3 — Financeiro:** `/admin/financeiro` (recebíveis por vencimento, gráfico de vendas + meta, DRE mensal); meta/alíquota editáveis no admin.
- **Onda 4 — Fiscal + recorrência:** NF via Asaas (emitir/sincronizar/cancelar), assinaturas recorrentes genéricas (webhook materializa cada ciclo como venda).

Verificado com `tsc` + `eslint` + `next build` a cada onda. **Não** exercitado contra Asaas/banco reais.

---

## Lakehouse evergreen (commit à parte)

O `791d9cc` era trabalho que já estava **pendente no working tree desde 06/07** (não fui eu que escrevi nesta sessão) — a reescrita do Lakehouse pro modelo evergreen. Estava uncommitted; entrou como commit próprio. Ver [[project_curso_lakehouse_pages]].

---

## FEITO nesta sessão

- ✅ `git push` (origin/main) + **deploy prod** (Vercel).
- ✅ `CRON_SECRET` setado + cron verificado.

## FALTA (ver "AMANHÃ" acima)

- Investigar os 6 erros de conciliação · rodar `migrate` · setar config financeiro · config fiscal Asaas · testar NF/assinatura em sandbox.

---

## Deixado de fora (de propósito, não selecionado)

Login hardening (rate-limit + log de auditoria), export CSV, cancelar/estornar pelo admin, notificação de nova venda, régua de cobrança (dunning), link de pagamento reutilizável. Candidatos naturais pra uma próxima leva — **login hardening + export CSV** são os mais recomendados.
