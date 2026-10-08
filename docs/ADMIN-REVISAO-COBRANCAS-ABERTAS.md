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

### Não mexidas — aguardando decisão

- **Testes vivos no Asaas (9):** #7, #15, #16, #32 (pending); #14, #59, #118, #122, #216 (overdue).
  **#216** (One Day R$ 290 do Binhara) **não está marcada como teste** — entra nos KPIs de vencidas.
- **Testes só no banco (4):** #1, #2, #5, #6 (sandbox de maio). Nada a cancelar no Asaas.
- **Abandono real — contatar antes de cancelar (5):**

  | # | quem | o quê | venceu |
  |---|---|---|---|
  | 55 | Jussara Pinheiro (Maxpar, PJ) | cobrança manual R$ 940 | 26/07 |
  | 114 | Daniel Pinheiro | DSS R$ 570 | 15/08 |
  | 182 | João Paulo Abadia (Checkpoint Eng.) | Business R$ 757 | 18/09 |
  | 264 | Gustavo Allemand (Volvo) | DSS R$ 887 | 04/10 |
  | 18 | Marco Antonio Ribeiro Junior | Lakehouse R$ 550 cartão | 25/06 — **marcada teste, parece real** |

  FullPass fechado no site: se #114 ou #264 ainda quiserem, é cobrança avulsa.

### Pendentes de verdade (4)

| # | quem | o quê | valor | vence |
|---|---|---|---|---|
| 292 | Diego Prando (Unimed Litoral, PJ) | DSS FullPass | R$ 887 PIX | 10/10 |
| 295 | Gabriel Vernalha | camiseta palestrante | R$ 55 PIX | 11/10 |
| 260 | Iandra Rocha (Energisa, PJ) | cobrança manual | R$ 1.774 boleto | 15/10 |
| 290 | Vitor Rebello (SESI, PJ) | cobrança manual | R$ 1.685,30 boleto | 26/10 |

## 4. O que fica pra depois

- Cliente Asaas compartilhado por CNPJ: não há correção de código decidida. Opções: criar o
  cliente Asaas por **e-mail + documento** em vez de só documento, ou bloquear no checkout
  um segundo comprador com o mesmo CNPJ e mandar pro WhatsApp de grupos.
- "Marcar teste" não cancela no Asaas. Vale a tela de teste avisar quando a cobrança ainda está viva lá.

Última revisão: **2026-10-08**.
