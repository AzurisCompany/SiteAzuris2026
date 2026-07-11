# Handoff — Evento + checkout GU BigData 30/07 (2026-07-11)

**Tudo pushado e DEPLOYADO em produção** (azuris.com.br). Working tree limpo.
**Migração de prod RODADA nesta sessão** (a que estava pendente desde 07-09/07-10).

```
b50e1f7 chore(gubigdata): descrição do tipo Geral vira 'Aberto ao público' no seed
081a8af fix(gubigdata): checkout no tema claro + widgets Azuris fora do evento
46d487f feat(gubigdata): página de evento estilo marketplace antes do checkout
3c48332 feat(admin): aba GU BigData + tipos com prazo/lotação e preço zero
3814a95 feat(gubigdata): página de inscrição do encontro 30/07 + CTA na comunidade
1075fca feat(checkout): checkout genérico por produto + ingresso gratuito (GU BigData)
```

Doc técnico completo: [docs/GUBIGDATA-EVENTO-CHECKOUT.md](./docs/GUBIGDATA-EVENTO-CHECKOUT.md).

## O que entrou

1. **Página de evento `/gubigdata`** estilo Sympla (tema claro, banner real, descrição +
   programação + palestrantes + local + produtor, card Ingressos sticky com stepper e botão
   verde). Indexável, OG image pro WhatsApp. **Este é o link de divulgação.**
2. **Checkout `/gubigdata/inscricao`** no mesmo tema claro, `?tipo=` pré-selecionado.
   Geral R$ 30 (PIX/cartão 3x, CPF só aqui) · Associado IEP/GU/DSS **grátis** (sem CPF,
   sem Asaas, confirmação na hora, dedupe por email).
3. **Checkout genérico** `lib/checkout-produto.ts` — DSSBR e GU compartilham; DSSBR intacto.
4. **`tipos_ingresso` + vendas_ate/limite_qtd** + preço R$ 0 = gratuito, tudo editável em
   `/admin/ingressos`. Aba **GU BigData** no admin. Filtro de meio "Grátis".
5. CTA do encontro na `/comunidade`. Widgets Azuris (WhatsApp/toast curso) fora de `/gubigdata/*`.

## Verificado em prod

- `POST /api/admin/migrate`: 36/36 ok, 35 inscrições antes = depois, 2 tipos semeados.
- Gratuito E2E real: inscrição #36 (criada → duplicada → tipo inválido 400), marcada `is_teste`.
- Screenshots desktop/mobile conferidos (sem overflow, sem widgets, espaçamento ok).
- 49 testes unitários, tsc e build limpos.

## ⏭️ PENDÊNCIAS do Binhara

1. **Trocar o link no post** do gubigdata.com.br → `azuris.com.br/gubigdata`
   (hoje aponta pra eventos.gubigdata.com.br/tenhointeresse).
2. **1 PIX real de R$ 30** pra exercitar o fluxo pago (mesmo pipeline do DSSBR, nunca
   exercitado por este produto). Depois estornar/marcar teste se for o caso.
3. Opcional: domínio `inscricao.gubigdata.com.br` → CNAME + domínio extra no Vercel.
4. Continuam de sessões anteriores: importar venda do Tiago, rodar /admin/conciliacao,
   antecipação no painel Asaas, fonte do bot "12x sem juros", tipos DSSBR + PIX teste DSSBR.

## Gotchas novos (detalhe no doc técnico)

- SSR Next 16 engole espaço após `</strong>` → string explícita.
- `ADMIN_PASSWORD` do `.env.local` funciona contra PROD via curl (login → cookie → APIs admin).
- Seed usa `ON CONFLICT DO NOTHING` — edições do admin nunca são sobrescritas por re-migração.
