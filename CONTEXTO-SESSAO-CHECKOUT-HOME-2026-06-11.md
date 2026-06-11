# Handoff — GA4 no ar + novo modelo de parcelamento + divulgação do curso na home (2026-06-11)

Sessão com 3 frentes, **tudo commitado e em produção** (working tree limpo).

---

## 1. GA4 destravado (commit `1efd97d`)

O bloco GA4 parado desde 03/06 foi commitado e deployado. Confirmado via curl:
gtag `GT-NNZW5FW` na home, `/lakehouse-og` 200 image/png, CourseCallout no ar.

**Falta (painel GA4, Binhara):** marcar `generate_lead` + `begin_checkout` como
Eventos-chave; verificar eventos no Realtime.

## 2. Novo modelo de pagamento do curso (commits `aea38b9` → `be43d67`)

**Modelo final: PIX à vista (5% off) · Cartão 1x a 5x — 1x à vista, 2x-5x com
juros POR CONTA DO CLIENTE.**

História da decisão (não revisitar):
1. Tentamos delegar parcelas ao checkout do Asaas (cobrança avulsa sem
   `installmentCount`) + config de juros no painel → **NÃO funciona: o checkout
   hospedado do Asaas não mostra seletor de parcelas em cobrança avulsa**
   (testado em prod, seletor não apareceu).
2. Solução: seletor 1-5x na NOSSA tela; juro embutido por nós.

Implementação:
- **`src/lib/parcelamento.ts`** (novo) — tabela Price, `TAXA_JUROS_AM = 0.0299`
  (2,99% a.m.), `MAX_PARCELAS = 5`. Form e API usam o mesmo cálculo.
- `InscricaoForm.tsx` — dropdown 1-5x mostra parcela + total com juros.
- `api/inscricao/route.ts` — valida 1-5, manda `installmentCount` +
  `installmentValue` (juro dentro) pro Asaas.
- Valores pro Lote 1 (R$ 550): 2x R$ 287,39 (total 574,78) · 3x R$ 194,40
  (583,20) · 4x R$ 147,93 (591,72) · 5x R$ 120,06 (600,30).
- Copy atualizada em: inscrição, `/produtos/curso-pipelines` (lotes + FAQ),
  landing estática `index.html` (lote-status + FAQ texto + JSON-LD FAQPage).
- **Painel Asaas: NÃO precisa de config de juros** (cálculo é nosso).
- ⚠️ **PENDENTE: teste real de cartão parcelado em prod** (escolher 5x e
  conferir se o checkout Asaas abre parcelado certo). PIX e cartão 1x já
  tinham sido validados em 25/05.

**Fix de CTA:** 3 botões de `/produtos/curso-pipelines` apontavam pra
`/contato?ref=lakehouse-t1-l1` (página de contato, sem checkout). Agora os 3
vão pra `/lakehouse-comunidade/inscricao` com UTM.

## 3. Divulgação do curso na home + banner flutuante (commits `e74ca0d` → `280b8d5`)

- **`CourseFloatingBanner.tsx`** — flutuante global nas páginas internas
  (embaixo-esquerda, não colide com WhatsAppFab), dismissível via localStorage
  (`course_floating_dismissed`), some em `/`, `/lakehouse-comunidade*`,
  `/produtos/curso-pipelines`, `/azuriz`. Eventos GA4 `select_promotion` +
  PostHog shown/clicked/dismissed. **Funcionou de primeira.**
- **Home: saga do banner invisível.** Card decorado (CourseBanner.tsx) não
  aparecia pro Binhara (adblock — filtro cosmético). Renomear id com "banner"
  não bastou; o card decorado seguia invisível. **Solução final: seção SIMPLES
  inline no `page.tsx`** logo após o Hero (eyebrow/h2/p/2 CTAs, padrão das
  outras seções). `CourseBanner.tsx` deletado. **User confirmou que apareceu.**
  Lição completa em memória `reference_adblock_headless.md`: não usar
  "banner"/"ad"/"promo" em atributos DOM; conteúdo promocional = estrutura chã.

## Ferramenta nova no repo

- **`playwright-core` (devDep, commit `2b3ab9f`)** pra screenshot headless
  confiável no WSL (Chrome do Windows headless renderiza só o Hero).
  Setup: `PLAYWRIGHT_BROWSERS_PATH=0 pnpm exec playwright-core install chromium`;
  binário em `node_modules/.pnpm/playwright-core@*/.../chrome-headless-shell-linux64/`.
  Script: launch com executablePath + `--no-sandbox`, goto networkidle,
  **rolar a página via evaluate** (dispara observers/lazy), screenshot.

## Commits da sessão (ordem)

```
1efd97d feat(analytics): instrumentação GA4 + CourseCallout + OG do curso
aea38b9 feat(checkout): modelo PIX à vista (5% off) ou cartão até 5x (1-2x s/ juros)  [intermediário]
be43d67 feat(checkout): cartão 1x a 5x com juros do cliente (seletor próprio)  [modelo final]
e74ca0d feat(home): banner de chamada do curso + banner flutuante
624bc90 fix(home): banner com destaque e mais acima  [superseded]
65c2fd7 fix(home): ids sem a palavra "banner"  [superseded]
a36b109 fix: comentário JSX inválido
2b3ab9f chore: playwright-core (dev)
280b8d5 refactor(home): divulgação do curso vira seção simples inline  [FINAL]
```

## 🎯 Próxima sessão

1. **Testar cartão parcelado em prod** (4x/5x, valor real, estornar depois).
2. Pendências de sempre: `purchase` via Measurement Protocol no webhook,
   cases Sicredi/Unimed (material em `/mnt/d/2026/siteAzuris2026/cases/`),
   GitHub auto-deploy, PostHog key, Bing Webmaster.

Última revisão: **2026-06-11**.

---

## 4. Staging sandbox criado e E2E validado (parte 2 da sessão)

**Projeto Vercel separado `azuris-sandbox`** → https://azuris-sandbox.vercel.app
(produção intocada).

- **Banco Neon NOVO isolado** (via `vercel integration add neon` no projeto
  staging) + schema `inscricoes`/`v_vagas_por_lote` aplicado. Testes não
  consomem vagas reais.
- Envs no projeto staging: `ASAAS_BASE_URL` sandbox, `ASAAS_WEBHOOK_TOKEN`
  (mesmo token), `ASAAS_API_KEY` sandbox **NOVA** — a de 22/05 tinha expirado
  (Asaas expira sandbox keys por inatividade; 401). Nova chave também salva em
  `.env.development.local`.
- **Webhook sandbox repontado via API** (PUT /v3/webhooks/632c466a...) pra
  `https://azuris-sandbox.vercel.app/api/webhook/asaas`. Webhook de produção
  intocado.
- `.env.local` agora aponta pro banco do STAGING (pull do projeto sandbox) —
  bom pra dev local.

### E2E validado (banco do staging)

| id | teste | parcelas | valor | status |
|---|---|---|---|---|
| 1 | PIX (Claude) | — | R$ 522,50 | pending (não pago) |
| 2 | Cartão 5x (Claude, pago via API c/ cartão teste) | 5 | R$ 600,30 | **paid** |
| 3 | Cartão 3x (**Binhara, fluxo real no browser**) | 3 | R$ 583,20 | **paid** |

Valores batem com a tabela Price (2,99% a.m.) de `src/lib/parcelamento.ts`.
Webhook → status `paid` automático nos dois pagos. Guard 7x rejeitado.
**Modelo 1-5x com juros do cliente 100% validado — produção já roda esse código.**

### Como operar o staging depois

- Cartão de teste sandbox: `5162 3062 1937 8829`, validade futura (ex. 05/2028), CVV qualquer.
- Deploy no staging: `rm -rf .vercel && cp -r .vercel.sandbox-backup .vercel && vercel --prod`
  e DEPOIS restaurar: `.vercel/project.json` de produção =
  `{"projectId":"prj_Jitz3rgm66NsPdW3WgvRV7TEjF47","orgId":"team_zKeJA7pJoxEF32yViWYEQmQk","projectName":"site-azuris-2026"}`.
- `.vercel` atual do repo → produção (verificado com `vercel ls`).
