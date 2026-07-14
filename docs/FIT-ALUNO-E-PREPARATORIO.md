# Fit do aluno + reserva do preparatório — doc técnico

**Em produção desde 2026-07-14.** Landing do Lakehouse (`/lakehouse-comunidade/`) +
novo produto de captura de lead (`/preparatorio-dados/reserva`).

Commits: `5bb0e9a` (copiar emails) · `5c47449` (reserva) · `660607b` (fit + Founder) · `e99e1f7` (WhatsApp).

---

## O problema que originou tudo

Binhara relatou que a seção de fit "não enfatiza o suficiente" e soa seca — "propaganda de
redpill", que atrai justamente quem não tem fit. E que o card **Founder (R$ 197, só por convite)**
gerava mais revolta em quem paga R$ 750 do que qualquer benefício.

**O diagnóstico foi mais fundo que a queixa.** A causa não estava na tabela de fit: estava na
seção **"Diagnóstico"**, logo depois do hero, que lista dores ("Nunca subiu um pipeline real",
"Você só tem a teoria", "Stack moderno não tá no seu portfólio") e concluía:

> **Marcou 2 ou mais?** Esse curso foi feito **pra você**.

Quem não tem base marca os 5 — honestamente — e é convidado. Trezentas linhas abaixo, a tabela
o expulsa ("NÃO é pra você se nunca programou em Python"). **A página se contradizia, e a
primeira mensagem é a que fisga.** Suavizar a tabela sem consertar o veredito não resolveria:
o texto-ponte novo remaria contra o convite feito antes.

---

## Arquitetura — reserva do preparatório

Reaproveita **integralmente** o fluxo de ingresso gratuito já exercitado no GU BigData
(ver [GUBIGDATA-EVENTO-CHECKOUT.md](./GUBIGDATA-EVENTO-CHECKOUT.md)). Nenhuma arquitetura nova.

```
/preparatorio-dados/reserva (page.tsx, server)
  └── ReservaForm.tsx (client) — nome + email + WhatsApp + consentimento
        └── POST /api/preparatorio-dados/inscricao
              └── processarCheckout('preparatorio-dados', body)   ← lib/checkout-produto.ts
                    ├── tipo 'reserva' tem preco_centavos = 0 → fluxo GRATUITO
                    ├── sem CPF, sem Asaas, sem cobrança
                    ├── dedupe por email (buscarInscricaoGratuita)
                    └── criarInscricaoPendente + confirmarInscricaoGratuita
```

- **Produto:** `preparatorio-dados` em `src/lib/produtos.ts` (fonte da verdade do preço no servidor).
- **Tipo:** `reserva`, preço 0, semeado pela migração (`ON CONFLICT DO NOTHING` — o admin nunca
  é sobrescrito por re-migração).
- **Admin:** aba "Preparatório (reservas)" em `/admin/vendas` (`PRODUTO_LABEL`), com o botão de
  copiar emails servindo de exportação.
- **GA:** evento `generate_lead` (não `begin_checkout` — não há cobrança), só em reserva nova.

### `telefoneObrigatorio` — por que existe

`processarCheckout` **rejeitava com 400 qualquer cadastro sem telefone**, nos dois fluxos,
inclusive o gratuito. A premissa inicial ("telefone é opcional no backend") estava errada.

Em vez de afrouxar a regra pra todo mundo, virou campo do registry:

| produto | telefoneObrigatorio |
|---|---|
| `dss-2026` | `true` (comportamento idêntico ao de sempre) |
| `gubigdata-2026-07` | `true` (idem) |
| `preparatorio-dados` | `true` — **desde `e99e1f7`** |

O preparatório nasceu com `false` (atrito mínimo na captura) e voltou a `true` a pedido do
Binhara: **o lead existe pra conversar**, e a ementa do preparatório vai ser montada a partir do
que essas pessoas já sabem. Um lead que não dá pra entrevistar não serve ao propósito da lista.

Telefone **malformado** continua sendo rejeitado mesmo onde o campo é opcional.

### Consentimento LGPD

`processarCheckout` exige `consentimento === true` e grava `consentimento_lgpd`. **Não hardcodar
`true` no form** — gravaria consentimento que o usuário não deu. É checkbox de verdade.

Quando o WhatsApp entrou, o texto do consentimento **teve que mudar** ("meu e-mail" → "meu e-mail
e meu WhatsApp"): coletar telefone sob autorização que só menciona e-mail é autorização inexistente.
Os textos da página que prometiam "só um e-mail" acompanharam.

---

## O que mudou na landing (`public/lakehouse-comunidade/index.html`)

| # | Mudança | Onde |
|---|---|---|
| 1 | Veredito do Diagnóstico **qualificado** — fecha a distância entre *teoria e prática*, não entre *zero e Python* | `.diagnostico-punchline` |
| 2 | **Texto-ponte** antes da grade de fit: a base é pré-requisito, faltar não é defeito, o preparatório é a saída | `.fit-ponte` |
| 3 | "NÃO é pra você" → **"Ainda não é a sua hora se…"**, cada item apontando o preparatório | `.para-quem-box.negativo` |
| 4 | Casos que **nunca** serão fit (vídeo passivo, MEC) separados dos "ainda não" | `.fit-nunca` |
| 5 | Pré-requisitos (lista morta) → **checklist de prontidão** de 6 itens com veredito por faixa | `#prontidao` |
| 6 | Pré-requisito dito **no hero** | `.hero-prereq` |
| 7 | Card **Founder removido**; grade 4 → 3 cards | `.lotes-grid` |
| 8 | Caminho pro não-membro conhecer o GU (ciano, não âmbar) | `.cond-virar-membro` |

### Por que "ainda não" e não "não"

O corte é o mesmo — o enquadramento não. "Não é pra você" fecha a porta e convida o sujeito a
se provar (o efeito "assista só se não for cabaço", que atrai exatamente quem não tem fit).
"**Ainda** não é a sua hora" transforma exclusão em **sequenciamento**: o item aponta a saída
(→ preparatório) em vez de bater a porta. Mesmo filtro, sem o tom de teste de virilidade.

**Vídeo passivo e MEC ficaram de fora dessa lista de propósito:** não são questão de tempo.
Prometer sequência ali seria falso — foram pro bloco `.fit-nunca`.

### Checklist de prontidão — por que interativo

O núcleo do problema é o zé mané **não saber que é zé mané**. Uma lista de bullets não o informa;
um placar que ele mesmo preenche, sim. Ninguém o chama de nada — ele se conta e conclui:

| marcados | classe | veredito |
|---|---|---|
| 6 | `.pronto` | "A base está lá — a dúvida é se você quer" → CTA do curso |
| 4–5 | `.quase` | "Falta pouco. Resolva antes do módulo 2" → CTA do curso |
| 0–3 | `.cedo` | "Ainda não é a sua hora — e tudo bem. **A gente não quer o seu dinheiro nessas condições**" → CTA da reserva |

---

## ⚠️ Gotchas

### 1. O JS dos diagnósticos é escopado por card — não desescope

Havia **um** checklist; agora há **dois** com polaridades opostas (dor vs prontidão). O JS antigo
contava global:

```js
document.querySelectorAll('.diag-check.checked').length   // ❌ conta os dois cards juntos
```

Um card corromperia o placar do outro. Agora itera `[data-diag]` e conta **dentro do card**:

```js
card.querySelectorAll('.diag-check.checked').length       // ✅
```

Se adicionar um terceiro checklist, dê a ele um `data-diag` próprio.

### 2. Migração é pré-requisito do deploy

Sem `POST /api/admin/migrate`, o tipo `reserva` não existe e a página mostra
**"a lista de reservas abre em breve"** no lugar do form — enquanto a landing inteira aponta
pra ela. Sequência: **commit → deploy → migrate → verificar**.

### 3. `maskPhone` está duplicado

Existia **byte-idêntico** em 3 checkouts (dss-2026, gubigdata, lakehouse). Foi movido pra
`lib/format.ts` e usado no form novo, mas **os 3 originais seguem com a cópia local** — dedup é
limpeza à parte, não entra junto com mudança de regra em formulário de pagamento.
Se for unificar, é commit isolado e fácil de reverter.

### 4. Âncoras herdam `scroll-margin-top: 80px`

`section { scroll-margin-top: 80px }` já cobre `#fit` e `#prontidao` — a navbar fixa não come o
topo. Vale pra qualquer `<section id="…">` nova.

### 5. `.lotes-grid` é grid fixo

Era `repeat(4, 1fr)` com 4 cards; virou `repeat(3, 1fr)` + `max-width: 900px`. Mexer no número
de cards exige mexer no grid.

---

## Verificação feita (2026-07-14, contra prod real)

- **Migração:** 37/37 ok. Baseline **antes** (42 inscrições / 31 eventos Asaas / 2 tipos) ==
  depois (42 / 31 / **3**). Nada perdido; único delta é o tipo semeado.
- **Reserva E2E em prod:** grava · duplicada não duplica · sem consentimento 400 ·
  **sem WhatsApp 400** (servidor, não só `required` do HTML).
- **Regressão do GU** (mesmo `processarCheckout`): continua funcionando.
- **Landing no ar:** zero "Founder"/"3 lotes" no HTML · 3 cards · checklist respondendo ·
  CTA do preparatório servindo o form (não o fallback).
- **Máscara:** `41999998888` → `(41) 99999-8888`.
- 55 testes, `tsc` limpo, `next build` ok.

Registros de teste em prod marcados `is_teste`: **#43, #45, #46** (não aparecem nas vendas reais).

---

## Rollback

Deploy anterior: `dpl_2hopNpdtzBZbCiENQJ3BQcKXtguK`.
**Voltar o código não desfaz a migração** — e não precisa: ela só **adicionou** uma linha em
`tipos_ingresso`. Nada foi alterado ou removido.
