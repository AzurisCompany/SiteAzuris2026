# Sessão 2026-08-12 — GTM `GTM-T7647L5K` em todas as páginas, como regra

**Tipo:** releitura do projeto + instalação do Google Tag Manager em todo o site.
**Estado do repo ao fim:** `main` = (ver commits abaixo), working tree limpa.
**Deploys:** **nenhum** — prod segue em `d388228` (06/08). A tag **não está no ar ainda**.
**Testes:** 153 passando (17 arquivos), eram 149/16. Build ok.

Continuação de [`CONTEXTO-SESSAO-GA4-PROJETO-ERRADO-2026-08-11.md`](./CONTEXTO-SESSAO-GA4-PROJETO-ERRADO-2026-08-11.md),
que mapeou a medição do site e achou o 403 do painel Tráfego.

---

## 1. O pedido

Instalar o container **`GTM-T7647L5K`** "em todas as páginas velhas e novas, **como regra**".
O "como regra" é a parte que dá trabalho: não bastava colar em 43 arquivos, precisava ser
impossível uma página nova nascer sem a tag.

## 2. O que existe de página neste projeto

Levantado antes de mexer:

| Universo | Quantidade | Como recebe tag |
|---|---|---|
| Rotas do App Router | 41 | root layout — **automático, inclusive futuras** |
| HTML estático em `public/` | 2 páginas + 1 template | snippet à mão |
| `materiais/landpageCurso/` | 3 HTMLs | **não é deploy** — fora do `web/` |
| `mirror/` | 17 HTMLs | **não é deploy** — wget do WordPress velho |

Só o `web/` sobe pra Vercel (projeto `site-azuris-2026`). O `materiais/landpageCurso/` parecia
candidato — é a origem das páginas do curso — mas está **625 linhas divergentes** atrás do que
está em `public/lakehouse-comunidade/`. Ancestral morto. Editar ali daria a impressão errada de
que é fonte de alguma coisa.

## 3. O que foi feito

| Arquivo | Mudança |
|---|---|
| `src/lib/gtm.ts` **(novo)** | `GTM_ID = "GTM-T7647L5K"` — fonte única |
| `src/app/layout.tsx` | `<noscript>` como 1º filho do `<body>` + `<Script id="gtm-init" strategy="afterInteractive">` montado a partir de `GTM_ID` |
| `public/lakehouse-comunidade/index.html` | snippet no topo do `<head>` (após `<meta charset>`) + `noscript` após `<body>` |
| `public/lakehouse-comunidade/ementa.html` | idem |
| `src/lib/__tests__/gtm.test.ts` **(novo)** | canário: varre `public/**/*.html` e reprova página sem tag |
| `AGENTS.md` | a regra, pra valer nas próximas sessões |
| `docs/GOOGLE-TAG-MANAGER.md` **(novo)** | doc de referência |

**`afterInteractive`, não `beforeInteractive`:** o snippet do Google já cria um `<script async>`;
subir a prioridade não adianta coleta, só atrasa o first paint. É o mesmo default do
`@next/third-parties`, que **não** foi adotado — evitaria colar snippet à mão mas adiciona
dependência e o componente dele não traz o `<noscript>`.

O template `public/lakehouse-comunidade/assets/og-image-preview.html` ficou **de fora de
propósito**: não é página, é o que o headless renderiza pra gerar imagem de OG. Medir screenshot
de build sujaria a audiência. A exclusão está nomeada (`NAO_SAO_PAGINAS`) dentro do teste.

## 4. Por que o canário tem um teste "achou alguma coisa?"

`it.each([])` passa. Se um refactor movesse ou renomeasse o `public/`, a varredura voltaria
vazia e a suíte ficaria **verde sem checar nada** — exatamente o tipo de proteção que some sem
avisar. Daí o `expect(paginas.length).toBeGreaterThan(0)`.

## 5. ⚠️ A armadilha: pageview dobrado

O gtag legado **`GT-NNZW5FW`** (→ GA4 `G-0231JKF0F0`, propriedade 421271387) **continua no ar em
paralelo**, no layout e nas 2 estáticas. Não deu pra remover: é o `window.gtag` dele que
`src/lib/gtag.ts` usa nos eventos (`begin_checkout` ×4, `generate_lead`, `select_promotion`).
O GTM injeta `dataLayer`, não `gtag` — apagar quebraria os 6 eventos em silêncio.

**Se o container receber uma tag GA4 apontando pra `G-0231JKF0F0`, cada pageview conta 2×.**

Decisão pendente do Binhara, duas saídas limpas:

1. o container mede **outra coisa** (Ads, Clarity, pixel) e a propriedade 421271387 segue só no gtag; **ou**
2. migrar os eventos pro `dataLayer.push()`, pôr o GA4 dentro do GTM e aí apagar o gtag do layout
   e das estáticas — `gaEvent()` some junto.

Até alguém decidir: **nada de tag GA4 dessa propriedade dentro do `GTM-T7647L5K`**.

## 6. Verificação feita

- `pnpm test` → 153/153 (as 4 novas incluídas).
- `pnpm build` → ok, 41 rotas.
- HTML pré-renderizado conferido: `.next/server/app/index.html` e `sobre.html` trazem loader
  e `ns.html?id=GTM-T7647L5K`, 1× cada. `/dssbr-2026` é dinâmica, não gera arquivo no build.

## Fica pendente

**Desta sessão:**

- **Deployar** (`vercel --prod`). Prod está em `d388228` de 06/08; a tag só existe no repo.
  O deploy leva **só** esta mudança — o que veio antes já está no ar.
- Decidir o item 5 **antes** de configurar qualquer tag GA4 no container.
- Conferir no ar depois do deploy (`docs/GOOGLE-TAG-MANAGER.md`, última seção).

**De antes, inalterado:**

- Os 3 passos manuais no console pra destravar `/admin/trafego` (sessão de 11/08, seção 6).
- **Nenhum PIX real de ponta a ponta**, em nenhum produto. O e-mail do Resend nunca passou por
  pagamento de verdade.
- Commits não pushados pro GitHub (auto-deploy segue inexistente; prod vai por CLI).
- 6 erros da sincronização Asaas de 01/08, sem diagnóstico.
- Home do **englishtalktime.com.br** ainda anuncia R$ 70 / R$ 39 / R$ 390.
- Escada de lotes do One Day duplicada entre `produtos.ts` e `one-day/page.tsx:13`, sem teste.
- Bug antigo: campos do bloco "Regerar" ficam velhos após `router.refresh()`.
- `NEXT_PUBLIC_POSTHOG_KEY` nunca configurada — PostHog morto na prática.
- Sem evento `purchase` no GA4: o funil termina em `begin_checkout`, ROI só sai do `/admin`.

Última revisão: **2026-08-12**.
