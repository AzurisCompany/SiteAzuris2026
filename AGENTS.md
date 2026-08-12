<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Regra: toda página carrega o Google Tag Manager

Container **`GTM-T7647L5K`**, ID único em `src/lib/gtm.ts`.

- **Rotas do App Router:** herdam do root layout (`src/app/layout.tsx`). Página nova não precisa fazer nada.
- **HTML estático em `public/`:** cole o snippet à mão — loader no topo do `<head>`, `<noscript>` como primeiro filho do `<body>`. Copie de `public/lakehouse-comunidade/index.html`.
- O canário `src/lib/__tests__/gtm.test.ts` varre `public/**/*.html` e reprova quem esquecer.

O gtag legado (`GT-NNZW5FW` → GA4 `G-0231JKF0F0`) continua no ar em paralelo, e é ele que
`src/lib/gtag.ts` usa pros eventos. **Não configure uma tag GA4 dessa mesma propriedade dentro
do container** — pageview sairia dobrado.
<!-- END:nextjs-agent-rules -->
