# Revisão das cobranças em aberto (pendentes e vencidas)

Como separar, entre as cobranças "Pendente" e "Vencido", **as que de fato esperam pagamento**
das que são duplicada, teste ou abandono — e como encerrar as que não valem nada.

Primeira rodada: **08/10/2026**. 39 em aberto; 17 duplicadas canceladas; só 4 pendentes de verdade.

---

## 1. O caso que disparou a revisão

O admin mostrava **Clovis (Multiplike) como pago**; o painel do Asaas mostrava uma cobrança
**vencida** no nome dele (fatura 849090975). Os dois estavam certos:

| # | quem | documento | fatura | estado |
|---|---|---|---|---|
| 20 | Clovis | CNPJ Multiplike | 849084254 | pago |
| 21, 22 | Lucas Scottini | **mesmo CNPJ** | 849085470, **849090975** | vencidas (abandonadas) |
| 23 | Lucas Scottini | CPF dele | 849101399 | pago |

**Causa:** `findOrCreateCustomer` (`src/lib/asaas.ts`) procura o cliente no Asaas por
`cpfCnpj`. O Lucas digitou o CNPJ da empresa, achou o cadastro que o Clovis criou minutos antes,
e as duas tentativas nasceram **penduradas no cliente do Clovis** — no Asaas aparecem com nome,
e-mail e SMS dele. Ele recebeu cobrança atrasada de 06/07 a 27/07 por um ingresso que não era o seu.

No nosso banco as linhas #21/#22 estavam marcadas como **teste** — some da lista e dos KPIs,
mas **continua viva no Asaas**. Marcar teste não cancela nada lá fora.

> **Regra que sai daqui:** duas pessoas da mesma empresa comprando com o mesmo CNPJ viram **um
> cliente só** no Asaas. Compra de grupo vai por cobrança avulsa / WhatsApp de grupos. A regra de
> 1 ingresso por CPF/CNPJ (`88205b6`, 02/10) reduz, mas não elimina.

## 2. Receita da revisão

Tudo pela API do admin de prod (login: [RUNBOOK §2](./RUNBOOK.md#2-falar-com-a-produção-sem-a-senha-do-banco)).

1. **Listar as abertas, com testes:**
   `/admin/vendas?status=pending&teste=1` e `/admin/vendas?status=overdue&teste=1`
   (sem `teste=1` as marcadas como teste somem — e elas podem estar vivas no Asaas).
2. **Para cada uma, achar as "irmãs":** `/admin/vendas?teste=1&busca=<CPF/CNPJ>` e `busca=<e-mail>`.
   A busca é `ILIKE` em nome, e-mail e documento. Para as que não baterem, tente **sobrenome** e
   **domínio do e-mail da empresa** (`busca=volvo`, `busca=energisa`).
   `curso=todos` **não** é filtro válido — devolve zero. Omita `curso`.
3. **Classificar:**

   | classe | critério | ação |
   |---|---|---|
   | **duplicada** | a mesma pessoa tem venda **paga** do mesmo produto (ou de um produto que a substitui: FullPass → VIP, cobrança manual que cobre o mesmo ingresso) | cancelar |
   | **teste vivo** | e-mail da casa / sandbox / "teste", com `Status Asaas` PENDING ou OVERDUE | cancelar (e marcar teste se não estiver) |
   | **teste só no banco** | sem `Status Asaas` | nada a fazer no Asaas |
   | **abandono real** | vencida e nenhuma irmã paga | **contatar antes**; cancelar depois |
   | **pendente de verdade** | vencimento no futuro, sem irmã paga | manter |

4. **Sincronizar antes de cancelar:** `POST /api/admin/sync` `{id}` em cada uma. Se voltar `paid`, sai da lista.
5. **Cancelar:** `POST /api/admin/cobranca/cancelar` `{id}`. A rota confere no Asaas se está paga
   (recusa com 409 se estiver), apaga a cobrança — ou o **parcelamento inteiro** quando é cartão
   parcelado — e marca a linha `cancelled`. Detalhe em
   [ADMIN-CANCELAR-E-COPIAR-COBRANCA.md](./ADMIN-CANCELAR-E-COPIAR-COBRANCA.md).
6. **Conferir:** as canceladas em `?status=cancelled&teste=1` e as pagas de origem ainda `Pago`.

Pra raspar o detalhe em lote, o `curl` funciona; o `urllib` do Python levou `Connection reset`
no WSL — chame o `curl` por subprocess.

## 3. Rodada de 08/10/2026

39 abertas (11 pending + 28 overdue, contando testes).

### Canceladas — duplicadas (17)

Sync antes (nenhuma tinha sido paga), cancelamento, conferência das pagas de origem: todas `Pago`.

| cancelada | quem | pagou em |
|---|---|---|
| #21, #22 | Lucas Scottini / Multiplike (caso do §1) | #23 |
| #48 | Laet Andrade (R$ 437,50, o valor errado do bug do "Regerar") | #56 R$ 550 |
| #49 | Rafael Cabral | #57 |
| #51, #58 | Juliano Klitzke (#58 era parcelado: parcelamento apagado) | #63 |
| #68 | José Carlos Catini (GU) | #70 |
| #73 | Angelo Rodrigues (GU) | #87 |
| #131 | Willian Kraft | #132 |
| #136 | Adalberto Aragão (tentou PF, pagou PJ) | #137 |
| #152 | André Ramiro | #155 |
| #168 | Nathan Pelicano — FullPass, trocou pelo VIP | #243 |
| #241 | Nathan Pelicano — VIP repetido | #243 |
| #178 | Fernanda Giacobbo (One Day) | #179 |
| #211 | Michel Colombo (Business) | #213 |
| #215 | Rodrigo Baldner / Jufap | #217 (cobrança manual FullPass + One Day, R$ 912) |
| #262 | Julio Motta, R$ 887 cartão | #263 R$ 957 |

### Canceladas — testes (13)

Com OK do Binhara, mesma sequência (sync → cancelar → conferir):

- **Vivos no Asaas (9):** #7, #15, #16 (parcelamento apagado), #32, #14, #59, #118, #122, #216.
  A **#216** (One Day R$ 290 do Binhara) não estava marcada como teste: marcada antes de cancelar.
- **Só no banco (4):** #1, #2, #5, #6 (sandbox de maio) — a rota respondeu `nao-existia` e
  encerrou só do nosso lado.

### Não mexidas — aguardando decisão

- **Abandono real — contatar antes de cancelar (5):**

  | # | quem | o quê | venceu |
  |---|---|---|---|
  | 55 | Jussara Pinheiro (Maxpar, PJ) | cobrança manual R$ 940 | 26/07 |
  | 114 | Daniel Pinheiro | DSS R$ 570 | 15/08 |
  | 182 | João Paulo Abadia (Checkpoint Eng.) | Business R$ 757 | 18/09 |
  | 264 | Gustavo Allemand (Volvo) | DSS R$ 887 | 04/10 |
  | 18 | Marco Antonio Ribeiro Junior | Lakehouse R$ 550 cartão | 25/06 — **marcada teste, parece real** |

  FullPass fechado no site: se #114 ou #264 ainda quiserem, é cobrança avulsa.

**Lista aberta depois da limpeza (08/10):** pending #18 260 290 292 295 · overdue #55 114 182 264.

### Pendentes de verdade (4)

| # | quem | o quê | valor | vence |
|---|---|---|---|---|
| 292 | Diego Prando (Unimed Litoral, PJ) | DSS FullPass | R$ 887 PIX | 10/10 |
| 295 | Gabriel Vernalha | camiseta palestrante | R$ 55 PIX | 11/10 |
| 260 | Iandra Rocha (Energisa, PJ) | cobrança manual | R$ 1.774 boleto | 15/10 |
| 290 | Vitor Rebello (SESI, PJ) | cobrança manual | R$ 1.685,30 boleto | 26/10 |

## 4. Cruzamento completo banco × Asaas (08/10, noite)

Feito **sem escrever nada** e sem a chave do Asaas de prod, em dois sentidos:

- **Banco → Asaas:** as 295 vendas do banco (`/admin/vendas?teste=1&page=N`), e pra cada uma a
  **página pública da fatura** (`asaas_invoice_url`, `https://www.asaas.com/i/<id>`). Ela diz a
  verdade atual: *"Pagamento efetuado em …"*, *"Fatura cancelada"* (removida pelo fornecedor),
  *"Aguardando Pagamento"*, *"Cobrança Vencida"*, *"Estornada"*. O "Status Asaas" do detalhe é só
  o último sync/webhook gravado.
- **Asaas → banco:** `/admin/importar?desde=2026-01-01` — lista o que existe no Asaas e não no banco
  (215 cobranças de 2026 escaneadas).

Limites: em parcelada, só a fatura da 1ª parcela foi aberta; a listagem do Asaas não traz cobrança
apagada (o lado "só no Asaas" cobre só as vivas).

### Bateu (290 de 295)

| situação | qtde |
|---|---|
| pagas, iguais nos dois lados | 144 |
| gratuitas (GU, café, reserva) — sem cobrança no Asaas | 92 |
| canceladas nos dois lados | 22 + 13 testes |
| estornadas nos dois lados | 1 (#33 CEUMA) + 4 testes (#8, #9, #110, #111) |
| pendentes/vencidas iguais | 8 |

### Inconsistências (3) — correção aguarda OK

1. **#18 Marco Antonio Ribeiro Junior** (Lakehouse R$ 550 cartão): banco `pending` (marcada teste),
   Asaas **"Fatura cancelada"**. Encerrar do nosso lado.
   **Causa sistêmica:** `sincronizarInscricao` (`src/lib/asaas-sync.ts`) não olha o campo
   `deleted` do pagamento — cobrança apagada no Asaas continua com `status` antigo e o sync mantém
   `pending`. Só o webhook `PAYMENT_DELETED` fecha; se ele falhar, a linha fica pendente pra sempre.
   Fix de uma linha (tratar `p.deleted === true` como `cancelled`), **precisa de deploy**.
2. **GoCloud Soluções em Nuvem S/A** — R$ 10.000 PIX, **paga**, venc. 02/04 — só no Asaas.
3. **Tiago Nelson** — "Curso Pipeline de dado + DSSBR", R$ 550 em 3x cartão, 3/3 pagas — só no Asaas.

2 e 3 = receita recebida fora do `/admin` (falta no financeiro/DRE). Corrigir = botão "Importar" em
`/admin/importar?desde=2026-01-01` (idempotente).

### Em aberto no Asaas, sem duplicidade (8)

Aguardando: #292 Diego Prando (Unimed Litoral) R$ 887 PIX, 10/10 · #295 Gabriel Vernalha camiseta
R$ 55 PIX, 11/10 · #260 Iandra Rocha (Energisa) R$ 1.774 boleto, 15/10 · #290 Vitor Rebello (SESI)
R$ 1.685,30 boleto, 26/10.

Vencidas: #264 Gustavo Allemand (Volvo) R$ 887 PIX, 04/10 · #182 João Paulo Abadia (Checkpoint)
Business R$ 757 PIX, 18/09 · #114 Daniel Pinheiro R$ 570 cartão, 15/08 · #55 Jussara Pinheiro
(Maxpar) "2 ingressos FullPass" R$ 940 boleto, 26/07.

## 5. O que fica pra depois

- Cliente Asaas compartilhado por CNPJ: não há correção de código decidida. Opções: criar o
  cliente Asaas por **e-mail + documento** em vez de só documento, ou bloquear no checkout
  um segundo comprador com o mesmo CNPJ e mandar pro WhatsApp de grupos.
- "Marcar teste" não cancela no Asaas. Vale a tela de teste avisar quando a cobrança ainda está viva lá.

Última revisão: **2026-10-08**.
