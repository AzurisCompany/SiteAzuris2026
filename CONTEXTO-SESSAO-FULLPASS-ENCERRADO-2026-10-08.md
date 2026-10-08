# Sessão 08/10/2026 — Business no Lote 3 e FullPass encerrado

## Estado no fim da sessão

| o quê | estado |
|---|---|
| Business no **Lote 3, R$ 1.279** (último) | **EM PROD**, mudança só no banco (sem deploy), verificada no ar |
| **FullPass + Estudante + combo FullPass + curso encerrados** | **EM PROD**: `e2365be`, deploy `dpl_6oqT2qZRc6dXdf39z4P4fHjP6NP8`, verificado no ar |
| docs | `c182bb7`, `b24b808` + este commit |
| push | feito até `b24b808` |

`main` = produção. No site, o DSS vende só **VIP, Business e camisetas**.

## 1. Releitura do projeto

Pedido: *"releia o projeto"*. Resumo do estado de 07/10, das pendências e dos docs que falavam do
One Day como se ele estivesse à venda (README, catálogo). Corrigidos nesta sessão.

## 2. Business: Lote 2 → Lote 3

Pedido: *"mudar o checkout do ingresso business, encerrar o lote 2 e abrir o lote 3"*.

- Login na API do admin de prod → `GET /api/admin/ingressos?produto=dss-business-2026`.
  O Lote 3 (id 75, R$ 1.279, 10 vagas) **já estava ativo**: os 3 lotes ficam ligados e vira por quantidade.
- `POST /api/admin/ingressos` com o `lote-2` (id 74) **inteiro** e só `ativo:false`.
- Conferido no ar: `/dssbr-2026/business` → "R$ 1.279,00 · Lote 3 · restam 10 ingressos".
- Último lote: as 10 vagas acabando, a página fica esgotada. Cobrança pendente do Lote 2 segue em R$ 984.
- Desfazer: religar o `lote-2` em `/admin/ingressos`.
- Docs: `DSS-VIP-BUSINESS-LOTES-POR-QUANTIDADE.md` (estado + §9) e o catálogo.

## 3. FullPass encerrado

Pedido: *"encerrar a venda do checkout do fullpass"*.

**Achado que decidiu o caminho:** desligar os tipos de `dss-2026` no banco **não fecha** o
FullPass. Sem tipo ativo, `/dssbr-2026/inscricao` cai no preço do registry (R$ 887) e continua
vendendo. Então foi código, no molde do One Day (`f10f6bc`).

Decisões do Binhara (perguntadas):
- Destino de quem abre o link: **página de "vendas encerradas"** (não redirect).
- Encerram juntos: **Estudante** (R$ 400) e **combo FullPass + curso** (R$ 850).

Feito: componente `VendasEncerradas` (aviso + VIP/Business sem preço + WhatsApp) na inscrição, no
combo e na landing; APIs dos dois checkouts apagadas; slugs em `PRODUTOS_ENCERRADOS` e fora de
`CHECKOUT_URL`, `/admin/links` e cupons; FAQ do Lakehouse sem o combo. Detalhe completo, receita e
desfazer em **[docs/DSS-VENDAS-ENCERRADAS.md](./docs/DSS-VENDAS-ENCERRADAS.md)**.

Verificação: vitest 318/318, build ok, smoke local com `next start`; **no ar**: aviso nas 3
páginas, One Day 308 → inscrição, os dois POSTs 404, Business R$ 1.279.

Tipos de `dss-2026` **continuam ativos no banco** de propósito: a cobrança avulsa usa.

## 4. Documentação

- Novo: `docs/DSS-VENDAS-ENCERRADAS.md`.
- Atualizados: README (rotas, índice), `CATALOGO-PRECOS-E-VENDAS.md`, `ARQUITETURA.md`,
  `RUNBOOK.md`, `CUPONS-DESCONTO.md`, `INGRESSO-OCULTO-ESTUDANTE.md`, `ADMIN-LINKS-DE-VENDA.md`,
  `ADMIN-VENDAS-COBRANCA-INGRESSOS.md`, `DSS-VIP-BUSINESS-LOTES-POR-QUANTIDADE.md`.

## 5. Ainda aberto

- **dssbr.com.br**: links pro checkout do FullPass/combo/One Day agora caem no aviso — trocar lá.
- Tipos 50/51 (café 06/10) e 35/36 (GU 24/09) **ainda ativos** — perguntado de novo, sem resposta.
- Herdado: PIX na chave CNPJ (decisão aberta) · card Business "40" × 30 no banco · prazo camiseta
  20/10 × 15/10 · ~50 NFs a emitir · erro `tsc` pré-existente em `checkout-produto.test.ts:26`.
