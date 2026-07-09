# Handoff — Boleto/multi-meio + upgrade financeiro em 4 ondas (2026-07-09)

Sessão grande. **Tudo commitado em `main`, NÃO pushado/deployado.** Working tree limpo. 2 commits.

```
43255a7 feat(admin): upgrade financeiro — boleto/multi-meio, confiabilidade, financeiro, NF e assinaturas
791d9cc content(lakehouse): modelo evergreen (autoguiado, sem turma com data fixa)
```

Doc técnico completo: [docs/ADMIN-FINANCEIRO-ONDAS-2026-07-09.md](./docs/ADMIN-FINANCEIRO-ONDAS-2026-07-09.md).

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

## FALTA (passos manuais, na ordem) — nada disso foi feito

1. **`git push` / deploy** Vercel.
2. **`POST /api/admin/migrate`** em prod → cria `config_financeiro`, `assinaturas`, colunas `nf_*`.
3. **`CRON_SECRET`** nas env vars da Vercel (senão o cron responde 500).
4. `/admin/financeiro`: setar meta, alíquota, descrição do serviço da NF.
5. Conta **Asaas**: dados fiscais (inscrição municipal, serviço, regime) pra NF emitir.
6. **Testar em sandbox** (checklist no doc técnico).

---

## Deixado de fora (de propósito, não selecionado)

Login hardening (rate-limit + log de auditoria), export CSV, cancelar/estornar pelo admin, notificação de nova venda, régua de cobrança (dunning), link de pagamento reutilizável. Candidatos naturais pra uma próxima leva — **login hardening + export CSV** são os mais recomendados.
