# Sessão 2026-07-01 — Preço por perfil (membro/não-membro) + poda da página duplicada

Tudo em **PROD** (azuris.com.br, Vercel). 4 deploys nesta sessão (todos `readyState: READY`, aliased em azuris.com.br). **NÃO commitado no git** — deploy sobe do working tree; o `main` no GitHub ainda não tem esses diffs.

## 1. Preço por AUDIÊNCIA no checkout (mudança de fundo)

O preço deixou de ser escada por esgotamento de lote. Agora é **auto-declarado** (honra, sem verificação — o Binhara removeu o gate por WhatsApp):
- **Membro do GU BigData IA / ex-participante do DSSBR → R$ 550** (mapeado pra `lote1`).
- **Não-membro → R$ 750** (mapeado pra `lote2`).

Arquivos:
- `src/lib/db.ts` — nova `determinarLotePorPerfil(perfil)` + `PRECO_POR_PERFIL` + `normalizarPerfil()`. A antiga `determinarLoteAtivo()` ficou sem uso (mantida exportada).
- `src/app/api/inscricao/route.ts` — lê `body.perfil`, deriva preço **100% server-side** (cliente só informa o perfil, nunca o valor).
- `src/app/lakehouse-comunidade/inscricao/InscricaoForm.tsx` — seletor de perfil no topo (2 cards radio, preço reativo), envia `perfil` no POST, trata esgotado por perfil. Props novas: `perfilInicial` + `precos: Record<Perfil,{base,pix,vagas}>`.
- `src/app/lakehouse-comunidade/inscricao/page.tsx` — busca os 2 perfis via `Promise.all`, lê `searchParams.perfil`, passa `precos` pro form. Card-resumo antigo (preço/lote/vagas) virou só "O que está incluso".

## 2. Landing estática — elegibilidade, WhatsApp fab, card R$750

`public/lakehouse-comunidade/index.html` + `ementa.html`:
- Card **R$750 habilitado** com CTA real (`?perfil=nao-membro`, campaign `lakehouse-t1-l2`); card R$550 → `?perfil=membro`.
- Card destaque = R$750, com ribbon **"★ Mais escolhido"** (vem do CSS `.lote-destaque::before`, NÃO do badge — havia duplicação, corrigida: badge do card destaque = "Não-membros", label da esquerda = "Membros GU / DSSBR").
- Removido o override `.lote-destaque .lote-badge` (gradient/branco) → badge "Não-membros" usa o estilo padrão, igual ao "Membros GU / DSSBR".
- Card membro mostra **"Restam 7 vagas"** (número editorial, hardcoded no HTML — não vem do banco). CTA final também "Restam 7 vagas" (alinhado).
- Box âmbar de elegibilidade **abaixo** dos cards: "Preço de comunidade (R$ 550): exclusivo para membros do GU BigData IA e ex-participantes do DSSBR. Não é membro? O investimento é R$ 750." **Sem** frase de WhatsApp (removida a pedido).
- Parágrafo de intro da seção investimento **removido**.
- Adendo corporativo (🏢 venda corporativa / grupos de devs → WhatsApp) abaixo do bônus DSSBR.
- **WhatsApp fab** (`.wa-fab`, verde #25D366, pulse) nos 2 estáticos, antes de `</body>`. Número `5541998003687`.
- FAQ "Quem tem direito ao preço de comunidade (R$ 550)?" (visível + JSON-LD), sem menção a confirmar via WhatsApp.

## 3. `/produtos/curso-pipelines` deixou de ser espelho duplicado

Era um espelho React completo da landing → conteúdo duplicado (2 URLs indexáveis, cada uma canônica de si, ambas no sitemap). Agora é **página-teaser**: só o hero (eyebrow + título + subtítulo + chips MinIO/Iceberg/Spark/Airflow/Superset + 3 botões: "Ver landing completa" → /lakehouse-comunidade/, "Ementa detalhada" → ementa.html, "Quero garantir vaga" → /inscricao). Todo o corpo (diagnóstico, cenário, metodologia, stack, investimento/lotes, calendário, FAQ, CTA) **removido**.
- `canonical` da página → `/lakehouse-comunidade/`.
- Rota **removida do `src/app/sitemap.ts`**.
- **Regra nova:** copy do curso agora só nos 2 HTMLs estáticos; NÃO reintroduzir o corpo no page.tsx.

## Validado / não validado

- ✅ Build + `tsc --noEmit` limpos. Render conferido local + em prod (seletor de perfil com R$ 550,00 e R$ 750,00; teaser sem corpo; canonical; sitemap; badges).
- ⚠️ **Pagamento real ponta-a-ponta NÃO testado** no perfil não-membro (exigiria gerar cobrança no Asaas de prod). Falta: 1 PIX real de R$ 750 (não-membro) → confirmar valor + webhook fechando.
- ⚠️ **"Restam 7 vagas" é número editorial hardcoded** no HTML estático — não reflete o banco. Atualizar à mão quando quiser.

## Pendências herdadas (seguem abertas)
Aba Tráfego GA4 (Data API travada), PostHog key, GitHub auto-deploy, Bing Webmaster, fusão TTSpeak×ETT, ano do Hadoop.com.br. Ver memória.
