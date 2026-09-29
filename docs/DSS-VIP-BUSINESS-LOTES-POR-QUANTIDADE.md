# Ingressos VIP e Business do DSS 2026: lote que vira por quantidade

Em produção desde **2026-09-14** (commit `a825797`, migração 49/49).

Pedido do Binhara: *"VIP 10 primeiros R$ 957, depois 15 a R$ 1.275 e último lote 15 a
R$ 1.657; Business 10 a R$ 757, 10 a R$ 984 e último lote de 10 a R$ 1.279. Crie os checkouts
pra esses ingressos."*

> Os preços abaixo são uma **foto de 14/09**. A verdade é `/admin/ingressos`.

---

> **Estado em 29/09:** o **Business está no Lote 2 (R$ 984)**. O Lote 1 (id 73) foi desligado a
> pedido do Binhara, antes de esgotar (ver §9). O VIP continua na virada por quantidade.

## 1. Links e lotes

| produto | slug | checkout | API |
|---|---|---|---|
| VIP | `dss-vip-2026` | `/dssbr-2026/vip` | `POST /api/dss-vip/inscricao` |
| Business | `dss-business-2026` | `/dssbr-2026/business` | `POST /api/dss-business/inscricao` |

Link com UTM pro dssbr.com.br (mesmo padrão do botão do One Day):
`https://www.azuris.com.br/dssbr-2026/vip?utm_source=azuris&utm_medium=landing&utm_campaign=dssbr-2026`
(e o mesmo com `/business`).

| produto | Lote 1 | Lote 2 | Lote 3 | total |
|---|---|---|---|---|
| VIP | 10 × R$ 957 | 15 × R$ 1.275 | 15 × R$ 1.657 | **40** |
| Business | 10 × R$ 757 | 10 × R$ 984 | 10 × R$ 1.279 | **30** |

Nos dois: PIX à vista ou cartão em até 3x (2x–3x com juros), sem âncora riscada, sem prazo
(`vendas_ate` NULL), PJ só fecha com endereço (vira nota).

**Benefícios** (vêm dos cards do dssbr.com.br):
- **VIP:** Jantar Oficial com curadoria de mesa · Roundtable C-level (20 vagas/sessão) · Agenda
  com palestrantes · Áreas VIP exclusivas · Acesso a patrocinadores e big techs.
- **Business:** Coffee Break Premium · Agenda com expositores e patrocinadores · Área de coworking
  · Acervo pós-evento (slides).
- Nos dois, o checkout também lista **"Os 3 dias de evento (tudo do FullPass)"**. É uma
  **suposição** que ainda precisa da confirmação do Binhara.

## 2. Por que não é a escada do FullPass

O FullPass vira de lote **na mão**: desliga o Lote 1 e liga o Lote 2 no admin
([CATALOGO §7.1](./CATALOGO-PRECOS-E-VENDAS.md)). Aqui a regra é **quantidade**: o 11º
comprador do VIP já paga R$ 1.275, e ninguém fica de plantão pra virar o lote na hora certa.
Depender de alguém lembrar de virar o lote é o mesmo erro que manteve o GU de 26/08 vendendo por
10 dias depois do evento.

## 3. A mecânica

```
tipos_ingresso (3 lotes ATIVOS, cada um com limite_qtd)
      + contarInscritosPorTipo (paid + pending, sem teste)
      ↓
escadaPorQuantidade()  — lib/lotes-quantidade.ts (pura)
      ↓ vigente = 1º por `ordem` com vaga
  ┌───────────────┴────────────────┐
página (CheckoutPorLotes)      servidor (processarCheckout)
 escada + "restam X"             tipoObrigatorio: só aceita o vigente
 form com SÓ o vigente
```

- **Página** (`src/app/dssbr-2026/CheckoutPorLotes.tsx`): mostra o preço do vigente, "restam X
  ingressos neste lote" e a escada (encerrado · vendendo agora · em breve). O formulário
  (`InscricaoForm`) recebe **só** o tipo vigente.
- **Servidor** (`checkout-produto.ts`): o produto tem `tipoObrigatorio: true` no registry.
  - POST sem `tipo` → **400**. Sem esse bloqueio, o pedido cairia no `precoCentavos` do registry,
    que é o preço do Lote 1, mesmo com o Lote 1 esgotado.
  - POST com um lote que não é o vigente → **409** *"O lote mudou enquanto você preenchia — agora
    é Lote 2. Recarregue a página pra ver o valor."*
  - Tudo vendido → **409** *"Ingressos esgotados"*.
- **Estados da página sem lote vigente:** tudo vendido → "Ingressos esgotados" + WhatsApp. Sem
  catálogo (banco fora ou migração não rodada) → "As vendas abrem em instantes" + WhatsApp.
- **Lotes semeados pela migração** (`INSERT … ON CONFLICT DO NOTHING`): re-rodar a migração não
  sobrescreve o que for editado no admin.

## 4. Operação

| quero… | onde | deploy? |
|---|---|---|
| mudar preço ou vagas de um lote | `/admin/ingressos` → `dss-vip-2026` / `dss-business-2026` | não |
| pular um lote | desligar o lote (`ativo=false`); ele some da escada | não |
| fechar tudo | desligar os três | não |
| vender na mão | `/admin/cobranca` → "Ingresso DSS VIP/Business" + **o lote certo** no seletor | não |
| ver vendas | `/admin/vendas`, abas **VIP DSS** e **Business DSS** | — |
| marcar ingresso gerado | `/admin/vendas`, botão "marcar gerado" | — |

## 5. Armadilhas

- **`limite_qtd = 0` não fecha o lote.** A API do admin grava 0 como `null`, que significa *sem
  limite*, e o lote passa a vender pra sempre. Pra fechar um lote, **desligue**.
- **Pendente segura vaga** até a cobrança vencer (3 dias). Num lote de 10, PIX abandonado pode
  virar o lote antes de 10 pagarem.
- **Concorrência:** duas compras simultâneas no 10º ingresso podem gerar 11 no lote (a checagem
  não trava a linha). O impacto é de uma ou duas vendas no preço do lote anterior.
- **Cobrança avulsa não confere o lote vigente.** É deliberado (vender na mão é decisão), mas a
  venda **ocupa vaga** do lote escolhido.
- **Texto do dssbr.com.br é fixo.** "A partir de R$ 957" vira mentira quando o Lote 1 fecha. No
  site, mostrar os três lotes.
- **Widgets flutuantes** (WhatsApp da Azuris, card do curso) aparecem nesses checkouts, como em
  todos os checkouts do DSS. O card do curso fecha no X.

## 6. Verificado em produção (14/09)

| passo | resultado |
|---|---|
| integridade antes | 176 inscrições · 12 tipos |
| depois do deploy, antes da migração | `/vip` e `/business` → "As vendas abrem em instantes" |
| migração | 49/49 · 176 inscrições · **18** tipos |
| lotes | os 6 com preço, vagas, 3x e sem prazo conferidos pela API do admin |
| páginas | VIP **R$ 957,00**, Business **R$ 757,00**, "restam 10", lotes 2 e 3 "em breve" |
| POST sem tipo | 400 "Tipo de ingresso obrigatório" |
| POST `lote-2` | 409 "o lote mudou — agora é Lote 1" |
| POST `lote-1` | passa do portão; parou no CPF inválido de propósito (**nenhuma cobrança gerada**) |
| regressão | FullPass com a escada 570 · 670 · 820 intacta; One Day 200 |

Local, antes do deploy: com o Lote 1 do VIP desligado, a página foi pra **R$ 1.275** ("restam 15")
e o POST `lote-1` devolveu 409 citando o Lote 2. Religado, voltou a R$ 957. Screenshot em 400px:
escada em 3 colunas sem quebrar linha.

**Nunca exercitado:** um pagamento real (PIX ou cartão) de ponta a ponta, e a virada de lote
**por venda de verdade** em prod. A contagem usa a mesma `contarInscritosPorTipo` do GU.

## 7. Arquivos

**Novos:** `src/lib/lotes-quantidade.ts` · `src/app/dssbr-2026/CheckoutPorLotes.tsx` ·
`src/app/dssbr-2026/{vip,business}/page.tsx` · `src/app/api/dss-{vip,business}/inscricao/route.ts` ·
`src/lib/__tests__/lotes-quantidade.test.ts` · este doc.

**Alterados:** `src/lib/produtos.ts` (2 produtos + `tipoObrigatorio`) · `src/lib/checkout-produto.ts`
(portão do lote vigente) · `src/app/api/admin/migrate/route.ts` + `sql/admin-migration.sql` (seeds)
· `src/lib/admin-queries.ts` (rótulo, aba, `CHECKOUT_URL`, preço sugerido) ·
`src/lib/cobranca-manual.ts` · `src/lib/email/conteudo.ts` (e-mail próprio) ·
`src/app/dssbr-2026/inscricao/InscricaoForm.tsx` (escada com milhar e sem quebra, vale pro FullPass).

**Testes (canário):** `lotes-quantidade.test.ts` trava os 6 lotes da migração **e** do espelho SQL
nos preços e vagas combinados, o `tipoObrigatorio` e o fallback = Lote 1, e as respostas 400/409
do servidor.

## 8. Em aberto

- **Business soma 30**, e o card do dssbr.com.br diz "Apenas 40 ingressos".
- Confirmar se VIP e Business incluem os 3 dias do FullPass.
- Trocar os botões "Lista de espera" do dssbr.com.br (`pipeline-azuris.vercel.app/lp/vip` e
  `/lp/bussiness`) pelos checkouts. O guia com o texto pronto dos cards foi entregue ao Binhara em
  `/mnt/d/2026/siteAzuris2026/DSS-2026-LINKS-CHECKOUT-VIP-BUSINESS.md` (fora do repo).
- Divergências do dssbr.com.br com o checkout: FullPass Lote 3 **R$ 887** × "no dia" R$ 820;
  One Day Lote 3 **R$ 350** × R$ 357.
- VIP e Business **não aceitam cupom** (`/admin/cupons` só lista FullPass e One Day) e **não
  estão na landing** `/dssbr-2026`: a vitrine é o dssbr.com.br.
- Zero pagamento real.

## 9. Pular lote na mão (Business, 29/09)

Pedido: *"muda no checkout o preço do business para o lote 2"*.

- Feito pela API do admin de prod: `POST /api/admin/ingressos` com o registro do `lote-1`
  (id 73) **inteiro** e só `ativo:false` (o upsert troca o registro todo). Sem deploy, sem migração.
- Conferido no ar: `/dssbr-2026/business` mostra **R$ 984,00** "vendendo agora", "restam 10",
  Lote 3 "em breve". O Lote 1 some da escada (desligado não aparece como "encerrado").
- **As vagas do Lote 2 começam cheias (10).** As vendas do Lote 1 contam só pro Lote 1, e o Lote 2 vira
  pro 3 depois de 10 vendas **nele**.
- Cobranças pendentes que já tinham sido geradas no Lote 1 continuam valendo R$ 757.
- Pra desfazer: religar o Lote 1 em `/admin/ingressos` → `dss-business-2026`.
- O card do dssbr.com.br, se disser "a partir de R$ 757", ficou errado.

Última revisão: **2026-09-29**.
