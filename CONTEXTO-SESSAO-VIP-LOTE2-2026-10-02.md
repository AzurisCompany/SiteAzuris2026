# Sessão 2026-10-02: VIP pula pro Lote 2, dssbr.com.br, PIX na chave CNPJ e lista de vendas

**Tipo:** releitura do projeto, troca de preço no banco de prod, conferência do site do evento,
diagnóstico de PIX caindo fora da cobrança e revisão de layout do admin.

**Estado do repo ao fim:** `main` = `origin/main`. **Código:** 1 commit de tela (`b5f31e6`).
**Banco de prod:** 1 tipo alterado pela API do admin. **Deploy:** 1 (`dpl_9sMipNJJ…`, rodado pelo
Binhara com `!`; o auto mode negou `vercel --prod` de novo). **Migração:** nenhuma.
**Testes:** 302 passando. O erro de `tsc` em `checkout-produto.test.ts` (falta `oculto`) e o warning
`notaEmitida` não usado em `vendas/page.tsx` já existiam.

---

## 1. VIP no Lote 2

Pedido: *"vamos encerrar o lote 1 do Vip e habilitar o lote 2 com novo valor"*. O valor foi
confirmado depois: **mantém R$ 1.275**.

| | antes | depois |
|---|---|---|
| lote vigente | Lote 1, R$ 957 (10 vagas) | **Lote 2, R$ 1.275** (15 vagas) |
| `lote-1` (id 70) | `ativo: true` | **`ativo: false`**, o resto igual |
| `lote-2` (id 71) / `lote-3` (id 72) | sem mudança | sem mudança |

- Receita igual à do Business em 29/09: `GET /api/admin/ingressos?produto=dss-vip-2026`, depois
  `POST` com o registro do `lote-1` **inteiro** e só `ativo:false`. O diff antes × depois mostrou
  só esse campo. Cookie jar apagado.
- **Conferido no ar:** `/dssbr-2026/vip` mostra R$ 1.275,00 "vendendo agora", "restam 15", Lote 3
  R$ 1.657 "em breve".
- Backup: `backups/prod-2026-10-02-antes-vip-lote2/tipos-dss-vip-2026.json`.
- O Lote 2 vira pro 3 depois de 15 vendas **nele**. Cobranças pendentes do Lote 1 continuam em R$ 957.
- **Desfazer:** religar o Lote 1 em `/admin/ingressos` → `dss-vip-2026`.
- Docs: `docs/CATALOGO-PRECOS-E-VENDAS.md` e `docs/DSS-VIP-BUSINESS-LOTES-POR-QUANTIDADE.md` §9
  (commit `f60c86e`, pushed).

## 2. Revisão do dssbr.com.br (publicado 02/10 17:40 UTC)

| card | site | checkout |
|---|---|---|
| One Day | R$ 357 (Lote 3) | ✅ |
| FullPass | R$ 887 (Lote 3); JSON-LD `price` 887.00 | ✅ |
| Business | R$ 984 (Lote 2), próximo R$ 1.279 | ✅ |
| VIP | R$ 1.275 (Lote 2), próximo R$ 1.657 | ✅ |

Links de compra apontam pros checkouts certos (VIP/Business/One Day com UTM; FullPass → `/dssbr-2026/inscricao`).

Achados, decisão do Binhara:
- **Card do Business diz "Apenas 40 ingressos"; no banco são 30** (10+10+10). Pergunta aberta desde 14/09.
- Combo FullPass + curso (R$ 850) não aparece no dssbr.com.br.
- Lote 1 de VIP/Business aparece "esgotado" (foi encerrado na mão) — aceitável como comunicação.

Link útil passado ao Binhara: camiseta congressista → `https://azuris.com.br/dssbr-2026/camiseta-congressista`.

## 3. PIX feito na chave CNPJ (diagnóstico, nada mudou)

Relato do Binhara: *"temos pessoas fazendo o pix no cnpj — na tela do pix tem as informações
AZURIS · 14.645.365/0001-88 · site · e-mail · telefone · endereço … preciso tirar as informações
de CNPJ"*.

- **Esse cabeçalho não é nosso.** CNPJ e endereço não aparecem em lugar nenhum do código. Todos os
  checkouts mandam o comprador pro `invoiceUrl` do Asaas (`InscricaoForm.tsx:194`,
  `checkout-produto.ts:306`), e a fatura do Asaas mostra os dados comerciais da conta.
- **Efeito:** o PIX na chave CNPJ não se liga à cobrança → webhook não dispara → venda pendente,
  ingresso não sai. Precisa de baixa manual.
- **Opções levadas ao Binhara (sem decisão):** (1) painel do Asaas, ver o que dá pra ocultar da
  fatura (não confirmado que o CNPJ possa sair); (2) **recomendada:** tela nossa com QR +
  copia-e-cola via `GET /payments/{id}/pixQrCode`, cartão segue pro `invoiceUrl`; exige código
  novo em `lib/asaas.ts` + todos os checkouts + deploy; (3) em paralelo, conciliar quem já pagou na
  chave.
- Registrado em `docs/ASAAS-INTEGRACAO-COMPLETA.md` §6.2.

## 4. Lista `/admin/vendas` enxuta (`b5f31e6`, EM PROD)

Pedido: *"revise o layout da lista /admin/vendas, está bem ruim a visualização"*.

- Causa: coluna Ação de 112px empilhando até 6 botões → linhas de 160–230px, e a tabela (1223px)
  maior que o container (1118px).
- Feito: na linha só `+ ingresso` / `+ NF` (rótulo curto); o resto no menu ⋯ (`MaisAcoes.tsx`);
  Pgto sob o Valor, taxa sob o Líquido; abas de produto com 0 vendas somem; filtros em 2 linhas;
  admin em `max-w-7xl`, menu do topo rolável no celular.
- Conferido no ar: linhas 82–104px, página de 50 vendas de 10.100px → 5.091px, menu ⋯ abre, outras
  telas do admin 200.
- Detalhes: `docs/ADMIN-VENDAS-COBRANCA-INGRESSOS.md`, "Onda G".

## Fica pendente

- **PIX na chave CNPJ:** decidir entre painel do Asaas × PIX em tela nossa; conciliar quem já pagou
  na chave.
- Business 30 × 40 (texto do card ou cadastrar mais 10 vagas).
- **Herdado:** desligar tipos 35/36 do GU 24/09 (segue vendendo); desligar 50/51 do café depois de
  06/10; prazo da camiseta congressista 20/10 × 15/10; 1 compra real de camiseta; 1 venda real com
  cupom fora do FullPass; estender cupons de parceiro; 50 NFs a emitir.

Última revisão: **2026-10-02**.
