# Sessão 2026-10-02: VIP pula pro Lote 2 + revisão do dssbr.com.br

**Tipo:** releitura do projeto, troca de preço no banco de prod e conferência do site do evento.

**Estado do repo ao fim:** `main` = `origin/main`. **Código:** nada mudou. **Banco de prod:** 1 tipo
alterado pela API do admin. **Deploy:** nenhum. **Migração:** nenhuma.

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

## Fica pendente

- Business 30 × 40 (texto do card ou cadastrar mais 10 vagas).
- **Herdado:** desligar tipos 35/36 do GU 24/09 (segue vendendo); desligar 50/51 do café depois de
  06/10; prazo da camiseta congressista 20/10 × 15/10; 1 compra real de camiseta; 1 venda real com
  cupom fora do FullPass; estender cupons de parceiro; 50 NFs a emitir.

Última revisão: **2026-10-02**.
