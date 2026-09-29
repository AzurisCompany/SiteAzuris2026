# Sessão 2026-09-29: Business pula pro Lote 2

**Tipo:** releitura do projeto, depois uma troca de preço no banco de prod.

**Estado do repo ao fim:** `main` com 1 commit de docs à frente de `origin/main`. O push aguarda o OK do Binhara.
**Código:** nada mudou. **Banco de prod:** 1 tipo alterado pela API do admin. **Deploy:** nenhum.
**Migração:** nenhuma.

---

## 0. Releitura

- O repo estava limpo e igual ao GitHub (`c3bca1b`).
- Preços no ar, conferidos com curl: FullPass R$ 887 · One Day R$ 357 · café 06/10 (Bindflow) R$ 30.
- 🚨 **`/gubigdata/inscricao` continua vendendo o GU de 24/09** (R$ 30). Os tipos 35/36 de
  `gubigdata-2026-09` ainda não foram desligados, e o pedido sobrou de 27/09. Nesta sessão continuam ligados.

## 1. Business no Lote 2

Pedido: *"muda no checkout o preço do business para o lote 2"*.

| | antes | depois |
|---|---|---|
| lote vigente | Lote 1, R$ 757 (10 vagas) | **Lote 2, R$ 984** (10 vagas) |
| `lote-1` (id 73) | `ativo: true` | **`ativo: false`**, o resto igual |
| `lote-2` (id 74) / `lote-3` (id 75) | sem mudança | sem mudança |

- Como foi feito: login na API do admin de prod, `GET /api/admin/ingressos?produto=dss-business-2026`,
  depois um `POST` com o registro do `lote-1` **inteiro** e só `ativo:false`. Receita em
  [[reference_operar_prod_via_admin_api]]. Cookie jar apagado no fim.
- **Conferido no ar:** `/dssbr-2026/business` mostra **R$ 984,00** "vendendo agora", "restam 10",
  Lote 3 "em breve".
- O VIP não mudou e continua virando por quantidade.

### Consequências

- As 10 vagas do Lote 2 começaram cheias. O Business vira pro Lote 3 (R$ 1.279) depois de 10 vendas **no Lote 2**.
- Cobranças pendentes já geradas no Lote 1 continuam em R$ 757.
- **Desfazer:** religar o Lote 1 em `/admin/ingressos` → `dss-business-2026`.

## 2. Docs atualizados

- `docs/DSS-VIP-BUSINESS-LOTES-POR-QUANTIDADE.md`: estado no topo e §9 "Pular lote na mão".
- `docs/CATALOGO-PRECOS-E-VENDAS.md`: tabela VIP/Business com o Lote 2 do Business vigente.
- `docs/RUNBOOK.md`: receita de pular lote (desligar o atual).

## Fica pendente

**Desta sessão:**
- **dssbr.com.br:** o card do Business precisa dizer R$ 984, se hoje diz "a partir de R$ 757".
- Push do commit de docs.

**Herdado (27/09):**
- **Desligar os tipos 35/36 do GU de 24/09**, que continua vendendo.
- dssbr.com.br: FullPass R$ 887, One Day R$ 357, combo R$ 850.
- Relatório: ingressos do patrocínio · se 35/105 são o mesmo pedido · se 237 é duplicata do 209.
- Colar o link do café no post do DSSBR · marcar as NFs emitidas · Business 30 × 40 ·
  VIP/Business incluem FullPass? · desligar os tipos 50/51 do café depois de 06/10 · DSS **27–29/10**.

Última revisão: **2026-09-29**.
