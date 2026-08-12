# Google Tag Manager — container `GTM-T7647L5K`

Instalado em **2026-08-12**. Regra: **toda página do azuris.com.br carrega este container** —
as que existem hoje e as que ainda não foram escritas.

## Onde está o ID

`src/lib/gtm.ts` — `export const GTM_ID = "GTM-T7647L5K"`. Fonte única. O layout monta o
snippet a partir dele e o teste-canário usa o mesmo valor pra varrer o `public/`. Trocar de
container = trocar essa linha (e colar o ID novo nos HTMLs estáticos, que não importam TS).

## Como cada tipo de página é coberta

| Tipo | Como | Ação numa página nova |
|---|---|---|
| Rota do App Router | root layout `src/app/layout.tsx` | **nenhuma** — herda |
| HTML estático em `public/` | snippet colado à mão | copiar de `public/lakehouse-comunidade/index.html` |

**No layout:** `<noscript>` com o iframe é o **primeiro filho do `<body>`**; o loader vai num
`<Script id="gtm-init" strategy="afterInteractive">`.

Por que `afterInteractive` e não `beforeInteractive`: o snippet do Google já cria um
`<script async>` — subir a prioridade não adianta coleta, só atrasa o first paint. É também
o que o `@next/third-parties` faz por padrão (`node_modules/next/dist/docs/01-app/02-guides/third-party-libraries.md`).
Não usamos o `@next/third-parties` pra não adicionar dependência e porque o componente dele
não traz o fallback `<noscript>`.

**Nos HTMLs estáticos:** loader no topo do `<head>`, logo depois do `<meta charset>`;
`<noscript>` como primeiro filho do `<body>`. Hoje são 2 páginas —
`public/lakehouse-comunidade/index.html` e `ementa.html`.

Fica **de fora** `public/lakehouse-comunidade/assets/og-image-preview.html`: não é página, é o
template que o headless renderiza pra gerar a imagem de OG. Medir screenshot de build sujaria
a audiência. A exclusão está explícita em `NAO_SAO_PAGINAS`, no teste.

## O canário

`src/lib/__tests__/gtm.test.ts` (4 testes). Varre `public/**/*.html` recursivamente e exige,
em cada página: o snippet **antes** do `<body>` e o `ns.html?id=…` em qualquer lugar. Também
confere que o layout continua carregando os dois e montando a partir de `GTM_ID`.

Existe um teste extra checando que a varredura achou ao menos 1 arquivo — sem ele, um refactor
que movesse o `public/` faria os `it.each` passarem vazios, em silêncio.

## ⚠️ O gtag legado ainda está no ar — cuidado com pageview dobrado

O `GT-NNZW5FW` (→ GA4 `G-0231JKF0F0`, propriedade 421271387) **continua carregando em paralelo**,
tanto no layout quanto nas 2 estáticas. Não dá pra remover de bandeja: é o `window.gtag` dele
que `src/lib/gtag.ts` usa nos eventos (`begin_checkout` em 4 checkouts, `generate_lead`,
`select_promotion`). O GTM define `dataLayer`, não `gtag`.

**Se o container `GTM-T7647L5K` receber uma tag do GA4 apontando pra `G-0231JKF0F0`, cada
pageview conta duas vezes.** Duas saídas limpas:

1. o container mede outra coisa (Ads, Clarity, pixel) e a propriedade 421271387 segue só no gtag; **ou**
2. migrar os 6 eventos pro `dataLayer.push()`, deixar o GA4 dentro do GTM e aí sim apagar o
   gtag do layout e das estáticas — daí `gaEvent()` some junto.

Enquanto ninguém decidir, a regra é: **nada de tag GA4 dessa propriedade dentro do container**.

## Fora do escopo (não são deploy)

- `materiais/landpageCurso/` — ancestral morto das páginas do curso, **625 linhas atrás** da
  versão em produção. Fica fora do `web/`, a Vercel não serve.
- `mirror/` — wget do WordPress velho, 17 HTMLs. Idem.

Se algum dia esses voltarem a virar página pública, entram na regra e no canário.

## Verificar no ar

```bash
curl -s https://azuris.com.br/ | grep -oE "GTM-[A-Z0-9]+|GT-[A-Z0-9]+|G-[A-Z0-9]{8,}|AW-[0-9]+" | sort -u
curl -s https://azuris.com.br/lakehouse-comunidade/ | grep -c "GTM-T7647L5K"
```

Última revisão: **2026-08-12**.
