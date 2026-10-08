# Sessão 08/10/2026 — Business no Lote 3 e FullPass encerrado

## Estado no fim da sessão

| o quê | estado |
|---|---|
| Business no **Lote 3, R$ 1.279** (último) | **EM PROD**, mudança só no banco (sem deploy), verificada no ar |
| **FullPass + Estudante + combo FullPass + curso encerrados** | **EM PROD**: `e2365be`, deploy `dpl_6oqT2qZRc6dXdf39z4P4fHjP6NP8`, verificado no ar |
| docs | `c182bb7`, `b24b808` + este commit |
| push | feito até `b24b808` |
| **17 cobranças duplicadas** | **CANCELADAS** no Asaas + banco (tarde), via API do admin, sem deploy |

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

## 5. Verificação do dssbr.com.br (depois da correção do Binhara)

Pedido: *"verifique os links que estavam abertos, agora está corrigido"*.

**dssbr.com.br — OK:**
- Home: nenhum `href` pra `/dssbr-2026/inscricao`, `/fullpass-curso` ou `/one-day`. Os botões de
  compra apontam só pra `/dssbr-2026/vip` e `/dssbr-2026/business` (com UTM `utm_source=azuris`).
- Cards: One Day "Lote 3 R$357 · vendas encerradas"; FullPass "Lote 3 R$887 · vendas encerradas"
  com botão **"Entrar na lista de espera"** → WhatsApp (41) 99800-3687; Business "Lote 3 · último
  lote R$ 1.279 · Lote 2 R$984 · esgotado"; VIP "Lote 2 R$ 1.275 · Lote 1 R$957 · esgotado ·
  Lote 3 R$1.657". **Batem com os checkouts.**
- CTA inline "Lote 2 · aberto" e banner dos cafés: **comentados** no HTML, não renderizam.
- Varredura das **146 URLs do sitemap** (comentários HTML descontados): nenhum link pros checkouts
  encerrados. Único link pra azuris.com.br em evento: o post
  `/blog/cafe-networking-bindflow-outubro-2026/` → `/cafe-networking`.
- **Resolvido de tabela:** "Business 40 × 30" — o card do Business não mostra mais quantidade; o
  "Apenas 40 ingressos" que sobrou é do VIP (10+15+15 = 40, correto).

**Café/GU — NÃO corrigido** (consulta na API do admin, 08/10):

| id | produto | tipo | preço | estado |
|---|---|---|---|---|
| 50 | cafe-networking-2026-10 | geral | R$ 30 | **ativo** |
| 51 | cafe-networking-2026-10 | convidado | grátis | **ativo** |
| 35 | gubigdata-2026-09 | geral | R$ 30 | **ativo** |
| 36 | gubigdata-2026-09 | associado | grátis | **ativo** |

`/cafe-networking/inscricao` e `/gubigdata/inscricao` mostram R$ 30 e vendem eventos que já
aconteceram — e o post do café no dssbr.com.br leva até lá. Desligar = `ativo:false` pela API do
admin (registro inteiro), sem deploy. Oferecido; aguardando OK.

Também visto: tipos de `dss-2026` — `lote-3` (id 107) e `estudante` (id 20) ativos, `lote-1`/`lote-2`
desligados. Correto (não há rota de venda; servem à cobrança avulsa).

## 6. Revisão das cobranças em aberto (tarde)

Pedido: *"no nosso sistema [Clovis] aparece como pago, mas no Asaas aparece vencida"* e depois
*"faça uma revisão de todas as faturas que estão como pendentes… ou se estão em duplicidade"*.

- **Clovis pagou** (#20, fatura 849084254). A vencida no nome dele (849090975) é do **Lucas
  Scottini**, que comprou com o CNPJ da Multiplike e caiu no cliente Asaas do Clovis
  (`findOrCreateCustomer` busca por `cpfCnpj`). Lucas pagou depois com o CPF (#23).
- **39 abertas** revisadas (pendentes + vencidas, com testes), cada uma cruzada com as vendas da
  mesma pessoa. Resultado: 17 duplicadas · 9 testes vivos no Asaas · 4 testes só no banco ·
  5 abandonos reais · **4 pendentes de verdade**.
- **17 duplicadas CANCELADAS** com OK do Binhara (sync antes, `POST /api/admin/cobranca/cancelar`,
  pagas de origem conferidas): 21 22 48 49 51 58 68 73 131 136 152 168 178 211 215 241 262.
- Doc novo com receita + tabela completa:
  **[docs/ADMIN-REVISAO-COBRANCAS-ABERTAS.md](./docs/ADMIN-REVISAO-COBRANCAS-ABERTAS.md)**;
  RUNBOOK (receita + linha no diagnóstico) e README (índice) atualizados.

## 7. Ainda aberto

- **Cobranças:** cancelar os 9 testes vivos (#7 15 16 32 14 59 118 122 216) e marcar #216 como
  teste — aguarda OK; contatar os 5 abandonos (#55 114 182 264 18) antes de cancelar.
- **Desligar tipos 50/51 (café 06/10) e 35/36 (GU 24/09)** — prioridade, estão vendendo.
- Herdado: PIX na chave CNPJ (decisão aberta) · prazo camiseta 20/10 × 15/10 · ~50 NFs a emitir ·
  erro `tsc` pré-existente em `checkout-produto.test.ts:26` · `InscricaoForm` com endpoint default
  apontando pra rota apagada (inofensivo: o ETT passa o seu).

Última revisão: **2026-10-08**.
