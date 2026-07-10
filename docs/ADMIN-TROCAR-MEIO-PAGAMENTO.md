# Admin — Trocar meio de pagamento de uma cobrança

> **Complementa** [ADMIN-FINANCEIRO-ONDAS-2026-07-09.md](./ADMIN-FINANCEIRO-ONDAS-2026-07-09.md) (editar valor/vencimento
> e reenviar link) e [ADMIN-VENDAS-COBRANCA-INGRESSOS.md](./ADMIN-VENDAS-COBRANCA-INGRESSOS.md) (cobrança avulsa).
> Reusa o mesmo pipeline Asaas (customer → payment → vínculo → webhook).

Permite trocar o **meio de pagamento** de uma cobrança **pendente/vencida** — ex.: cliente gerou PIX mas quer
pagar no cartão parcelado, ou o contrário. Fica no detalhe da venda, `/admin/vendas/[id]`.

## Por que "cancela + regera" (e não "edita")

O Asaas **não** deixa converter o `billingType` de uma cobrança existente (PIX↔cartão), e cartão parcelado não é
uma cobrança só — é um **parcelamento** (`installment`) que agrupa N pagamentos. Então "editar o tipo" não existe
de forma confiável. O caminho robusto é: **cancelar a cobrança atual no Asaas e gerar uma nova** com o meio escolhido,
re-vinculando a **mesma inscrição** (não duplica lead nem come vaga de novo).

> Isso é diferente do bloco "editar valor/vencimento" logo acima, que usa `PUT /payments/{id}` e serve só pra
> ajustar valor (não-parcelada) e data — sem trocar o meio.

## Fluxo (rota `POST /api/admin/cobranca/trocar-meio`)

1. **Guardas:** logado; inscrição existe; tem `asaas_payment_id`; status `pending` ou `overdue`. Valor base
   ≥ R$ 5,00. Se meio/parcelas/valor forem idênticos ao atual → `400` "Nada mudou".
2. **Cancela a anterior no Asaas, primeiro.**
   - `getPayment(id)` pra descobrir se é parcelada (campo `installment`).
   - Parcelada → `deleteInstallment(installmentId)` (apaga o **parcelamento inteiro**, todas as parcelas).
     Simples → `deletePayment(id)`.
   - Se o `getPayment` falhar (cobrança já não existe no Asaas), pula o delete e segue pra criação.
   - **Se o delete falhar → aborta com `502` e NÃO mexe no banco** (não pode ficar com duas cobranças ativas).
3. **Cria a nova** (`createPayment`, reusando o `asaas_customer_id` da inscrição; se não tiver, `findOrCreateCustomer`).
   - Juros só no cartão 2x+ (`lib/parcelamento.ts`, Price 2,99% a.m.). PIX/Boleto/UNDEFINED = valor base à vista.
   - Vencimento: mantém o atual se ainda for futuro (`>= hojeBRT()`); senão, hoje + 3 dias.
   - Descrição: pra `curso_slug='proposta'` reusa o texto de `como_conheceu`; senão, `labelProduto(curso_slug)`.
   - **Se a nova falhar** (anterior já cancelada) → marca a inscrição `cancelled` (preserva o lead) e retorna `502`
     avisando pra regerar pela Cobrança avulsa.
4. **Re-vincula** via `trocarMeioCobranca(id, …)`: atualiza `billing_type`, `installments`, `valor_centavos`,
   `asaas_*`, `valor_liquido/taxa`, `due_date`, `asaas_status` e volta `status='pending'`. Webhook fecha o pago.

## Arquivos

| Camada | Arquivo | O quê |
|---|---|---|
| Asaas | `src/lib/asaas.ts` | `deletePayment`, `deleteInstallment`, campo `installment` no `AsaasPayment` |
| DB | `src/lib/db.ts` | `trocarMeioCobranca()` (re-vincula a mesma inscrição à nova cobrança) |
| API | `src/app/api/admin/cobranca/trocar-meio/route.ts` | rota protegida (orquestra cancelar → criar → re-vincular) |
| UI | `src/app/admin/(painel)/vendas/[id]/AcoesCobranca.tsx` | bloco "Trocar meio de pagamento" (select meio/parcelas/valor base + prévia + link novo) |
| UI | `src/app/admin/(painel)/vendas/[id]/page.tsx` | passa `billingType` pro componente |

O bloco só renderiza quando a venda é editável (`pending`/`overdue` com `asaas_payment_id`), igual ao bloco de editar.
Antes de regerar, o navegador pede **confirmação** (é destrutivo — mata o link antigo).

## Sem migration

Zero mudança de schema — só usa colunas que já existem. Não precisa rodar `POST /api/admin/migrate` por causa disso.

## Falta validar (contra Asaas real)

O fluxo **não foi exercitado contra a API do Asaas** (só `tsc`/ESLint limpos). Testar em sandbox/prod com 1 cobrança de teste:
PIX → cartão 3x (confere que a antiga some no painel Asaas e a nova aparece parcelada); e cartão parcelado → PIX
(confere que o **parcelamento inteiro** foi apagado, não sobrou parcela). Depois marcar `is_teste`.
