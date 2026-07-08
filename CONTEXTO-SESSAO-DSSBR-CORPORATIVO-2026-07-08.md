# Sessão 2026-07-08 — DSSBR: CTA de pacotes para grupos/corporativo (WhatsApp)

Tudo em **PROD** (azuris.com.br, Vercel). 3 deploys nesta sessão, todos `Ready`/aliased.
**Commitado e pushado** (main): `a497592`, `8392ac6`, `8018b44`.

## Motivação
O Binhara pediu pra deixar claro que o checkout do DSSBR é para **compra individual**, e
oferecer um canal de **compras em grupo / corporativas** via WhatsApp, com pacotes especiais
(desconto por volume + benefícios extras).

## O que foi feito (2 arquivos)
1. `src/app/dssbr-2026/page.tsx` (landing)
   - Novo box **"Compra para grupo ou empresa?"** ("Temos pacotes com desconto por volume e
     benefícios extras — fale com a gente.") + botão verde **"Falar no WhatsApp"**.
   - **Posição final:** no **HERO**, logo abaixo do CTA/nota de preço ("Garantir minha vaga…" /
     "ver a programação ↓") e **antes** da seção de stats. (Começou no rodapé da seção de preço,
     movido pro topo a pedido do Binhara.)
   - Ajuste de microcopy no CTA do card final: "…PIX ou cartão · **inscrição individual**".
   - Constante `WA_CORP` = `https://wa.me/5541998003687?text=...` (prefill "vim pela página do DSSBR…").
2. `src/app/dssbr-2026/inscricao/page.tsx` (checkout)
   - Subtítulo: "Esta página é para **inscrição individual**."
   - **Mesmo box compacto** da landing, no topo (logo após o H1, antes do resumo do ingresso).
   - Prefill do WhatsApp diferente ("Estava no checkout do DSSBR…") pra rastrear origem do lead.

## Iterações da sessão (histórico das decisões)
- v1 (`a497592`): box grande "Grupos & empresas" na landing (final) + box compacto no checkout.
- v2 (`8392ac6`): removido "nota fiscal" do TEXTO do box; landing passou a usar o **mesmo box
  compacto** do checkout (dropou o bloco grande). Import `MessageCircle` removido (ficou sem uso).
- v3 (`8018b44`): box movido do rodapé pro **hero** (topo).

## Detalhes importantes
- **Número WhatsApp:** `5541998003687` (mesmo do `WhatsAppFab` e do rodapé do DSSBR). Ambos os
  boxes abrem `wa.me` com prefill (variação landing vs checkout).
- **"nota fiscal"** foi tirado só do TEXTO do box. O **checkbox "Preciso de nota fiscal"** do
  formulário de inscrição continua (é campo do checkout, fora de escopo) — não confundir.
- Ícone usado: `Users` (lucide-react). `MessageCircle` NÃO é mais importado na landing.

## Validado
- ✅ `tsc --noEmit` limpo + `next build` OK nas 3 iterações.
- ✅ Live em prod: box presente 1x na landing (hero, antes dos stats) e 1x no checkout (topo).
  Texto sem "nota fiscal"; botão "Falar no WhatsApp" com `wa.me/5541998003687`.

## Gotcha de deploy
- `npx vercel --prod --yes` às vezes estoura o timeout de 5min do comando Bash (build no servidor
  demora). O deploy **continua e completa** no servidor — checar com `npx vercel ls --prod` até
  `● Ready` em vez de rerodar.

## ⚠️ Pendência herdada (NÃO tocada nesta sessão)
Working tree ainda tem **8 arquivos modificados não commitados** + 2 `CONTEXTO-*.md` untracked,
de sessões anteriores (Lakehouse evergreen 07-06, preço-perfil 07-01, telefone 06-25). **Já estão
em PROD**, só faltam ir pro git. Não commitei porque estão fora do escopo do DSSBR:
```
public/lakehouse-comunidade/ementa.html, index.html
src/app/lakehouse-comunidade/inscricao/page.tsx, InscricaoForm.tsx
src/app/produtos/curso-pipelines/page.tsx
src/app/api/inscricao/route.ts
src/lib/db.ts
src/app/sitemap.ts
+ CONTEXTO-SESSAO-LAKEHOUSE-EVERGREEN-2026-07-06.md
+ CONTEXTO-SESSAO-LAKEHOUSE-PRECO-PERFIL-2026-07-01.md
```
Herdadas: GA4 Data API, PostHog key, GitHub auto-deploy, Bing Webmaster, 1 PIX real ponta-a-ponta.

## Deploy
`cd web && npx vercel --prod --yes`. Projeto `site-azuris-2026`, alias `azuris.com.br`. Não é
automático por push.
