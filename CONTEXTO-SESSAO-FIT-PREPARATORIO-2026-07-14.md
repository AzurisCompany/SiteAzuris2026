# Handoff — Fit do aluno + reserva do preparatório (2026-07-14)

**Tudo pushado e DEPLOYADO em produção** (azuris.com.br). Working tree limpo.
**Migração de prod RODADA e verificada** nesta sessão (37/37, 42 inscrições antes = depois).

```
e99e1f7 feat(preparatorio): pedir WhatsApp na reserva
660607b feat(lakehouse): fit do aluno explícito, trava de pré-requisito e saída do Founder
5c47449 feat(preparatorio): reserva de interesse do curso preparatório
5bb0e9a feat(admin): copiar emails da lista de vendas por produto
```

Doc técnico completo: [docs/FIT-ALUNO-E-PREPARATORIO.md](./docs/FIT-ALUNO-E-PREPARATORIO.md).

## De onde partiu

Binhara: a seção de fit não enfatiza o suficiente e soa seca — *"parece propaganda de redpill…
e no final só atrai cabaço"*. E o card **Founder (R$197, só por convite)** gera mais revolta em
quem paga R$750 do que benefício. Pediu um texto entre o título e a tabela que suavize, deixe
claro pro zé mané que não é pra ele, **e ainda arrebanhe leads** pra um curso preparatório.

**A causa era mais funda que a queixa.** A seção **"Diagnóstico"**, logo após o hero, listava
"você só tem a teoria" e concluía **"Marcou 2 ou mais? Esse curso foi feito pra você"**. O zé mané
marcava os 5 — honestamente — e era convidado; 300 linhas depois a tabela o expulsava. A página
se contradizia, e o primeiro convite é o que fisga. Sem consertar isso, o texto-ponte novo remaria
contra a própria página.

## O que entrou (4 commits, todos em prod)

1. **Fit reenquadrado** — veredito do Diagnóstico qualificado (fecha a distância entre *teoria e
   prática*, não entre *zero e Python*); **texto-ponte** antes da grade; "NÃO é pra você" →
   **"Ainda não é a sua hora se…"** com a saída pro preparatório em cada item; hero e checkout
   dizem o corte antes do pagamento.
2. **Checklist de prontidão** (6 itens) no lugar da lista morta de pré-requisitos: o aluno se conta
   sozinho e o placar responde (0–3 → preparatório · 4–5 → entra com ressalva · 6 → pronto).
   Ninguém precisa chamá-lo de zé mané; ele conclui.
3. **Reserva do preparatório** (`/preparatorio-dados/reserva`) — captura de lead reaproveitando o
   fluxo gratuito do GU BigData. Nome + email + **WhatsApp** + consentimento. Sem pagamento.
   Aba própria no `/admin/vendas`.
4. **Founder fora da vitrine** — grade 4 → 3 cards (550 / 750 / mercado 1.197). O convite continua
   existindo fora da página. Não-membro ganhou caminho pro GU no lugar.
5. **Copiar emails** no `/admin/vendas` (estava represado desde 11/07) — botão por aba de produto,
   respeita filtros e ignora paginação. Serve de exportação das reservas.

## Decisões do Binhara nesta sessão

- Veredito do Diagnóstico: **manter qualificado**.
- Caminho pro GU: **suavizado** — sem "entrar é gratuito e leva um minuto" (não entregar o atalho
  do desconto mastigado; preserva os R$750). Tradeoff aceito conscientemente.
- Selo "MAIS ESCOLHIDO": **fica no R$750**.
- WhatsApp na reserva: **obrigatório** (pedido depois do 1º deploy).

## ⏭️ PENDÊNCIAS do Binhara

1. **O preparatório não existe.** A página diz isso honestamente ("sendo montado, sem data").
   Se as reservas engrenarem, a pergunta vira "quantos já estão esperando?" — o número que não
   havia. Decidir ementa/preço quando houver massa.
2. **"Restam 7 vagas"** na landing continua número editorial hardcoded (não vem do banco).
3. Continuam de sessões anteriores: link do post do GU (gubigdata.com.br → `azuris.com.br/gubigdata`),
   1 PIX real de teste (GU R$30 e DSSBR), importar venda do Tiago, rodar `/admin/conciliacao`,
   tipos DSSBR, antecipação no painel Asaas.
4. Opcional: unificar `maskPhone` (3 cópias byte-idênticas nos checkouts + a versão em
   `lib/format.ts`) — commit isolado, não misturar com mudança de regra.

## Gotchas novos (detalhe no doc técnico)

- **JS dos diagnósticos é escopado por `[data-diag]`** — há 2 checklists com polaridades opostas;
  contagem global (`document.querySelectorAll('.diag-check.checked')`) faria um corromper o outro.
- **`telefoneObrigatorio` no registry** — `processarCheckout` exigia telefone incondicionalmente;
  agora é por produto. Malformado segue rejeitado mesmo onde é opcional.
- **Consentimento LGPD é checkbox de verdade** e o texto tem que casar com o que se coleta
  (mudou pra "e-mail e WhatsApp" quando o telefone entrou).
- **Migração antes/junto do deploy** — sem o tipo `reserva` a página serve "abre em breve"
  enquanto a landing inteira aponta pra ela.
- `.lotes-grid` é grid fixo (era 4, virou 3 + max-width 900px).

## Sujeira conhecida

- **Deploy duplicado**: `660607b` foi deployado 2x por descuido (mesmo commit, ambos READY) —
  ocupa histórico, sem risco.
- **Leads de teste em prod** #43, #45, #46 marcados `is_teste` (invisíveis nas vendas reais).
- Banco **local** tem leads de teste do preparatório (é o de teste, 3 linhas — não é o de prod).
