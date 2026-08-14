# Site institucional

A metade do app que **não** vende: home, serviços, cases, blog, produtos, comunidade, sobre e
contato. Estático (SSG), dark-first, feito pra profissional de dados — não pra comprador de
agência.

Reconstrução completa do `azuris.com.br`, no ar desde 18/05/2026, substituindo WordPress/Divi.

---

## 1. Home

Seções, na ordem (`src/components/sections/`):

| seção | o que faz |
|---|---|
| `Hero` | data-flow em 3D (react-three-fiber) + proposta |
| `Ecosystem` | os produtos próprios e o que cada um é |
| `Cases` | resultados reais com KPI |
| `HowWeWork` | como o trabalho acontece |
| `Partners` | Snowflake, Acceldata, Gaio Data OS |
| `Stack` | 30 tecnologias com logo (`tech-stack.ts` + `TechChip`) |
| `Community` | Hadoop.com.br, GU BigData, grupo de estudos — **sem ângulo comercial** |
| `Founder` | bio |
| `Cta` | contato |

A seção de comunidade é deliberadamente não-comercial: ela existe pra mostrar o que a Azuris
sustenta na comunidade, não pra vender. Não transforme em funil.

## 2. Serviços

`/servicos` + 5 landings próprias: construção de data lake, migração de dados, redução de custo
em big data, ClickHouse e treinamento corporativo. Todas montadas pelo componente compartilhado
`ServiceLanding.tsx` — mesma estrutura, conteúdo diferente.

## 3. Blog

14 posts em `content/blog/*.mdx`, com `next-mdx-remote`, `remark-gfm`, `rehype-slug` e
`rehype-autolink-headings`. Tempo de leitura por `reading-time`, front-matter por `gray-matter`,
capa gerada em componente (`BlogCover`) — sem imagem por post.

## 4. Cases

`/cases` e `/cases/[slug]`. **Não são MDX**: são estruturas tipadas em `src/lib/cases.ts`, porque
case bom precisa de KPI, tabela comparativa, diagrama e galeria renderizados por componentes — não
de texto corrido.

## 5. Produtos do ecossistema

`/produtos` e `/produtos/[slug]`, a partir do catálogo tipado `src/lib/produtos-catalogo.ts`
(7 produtos): DSSBR, English Talk Time, OWorkshop, TTSpeak, PolenAI, PipeZeroOne e o curso.

⚠️ **Dois "produtos" diferentes no código:** `produtos-catalogo.ts` é vitrine (o que a Azuris tem);
`produtos.ts` é registry de **checkout** (o que tem preço e cobrança). Não confunda ao mexer.

## 6. Comunidade

`/comunidade` — Hadoop.com.br, GU BigData & IA e o grupo de estudos. Mesmo princípio da seção da
home: comunidade é comunidade.

## 7. Tráfego perdido do Azuriz FC

`azuris.com.br` recebe gente procurando o `azuriz.com.br` (clube de futebol). Duas camadas:

1. **Banner discreto** na home, acionado pelo `proxy.ts` via referrer ou `?fc=1`;
2. **Landing dedicada** `/azuriz`, com CTA pro English Talk Time e UTMs rastreáveis.

⚠️ Nunca use a palavra "banner" em `id`/`class` — adblock esconde o elemento, e o próprio
componente vira invisível em screenshot e, às vezes, pro usuário.

## 8. Identidade visual

- Paleta dark-first derivada da logo: ciano `#14b7de`, ink `#06101c`, mist `#7dd3fc`.
- Fontes Geist Sans (display e corpo) e Geist Mono (números e código).
- Logo `AzurisMark.tsx`: SVG inline com gradiente animado — "dados fluindo pela marca".

## 9. SEO

`sitemap.ts`, `robots.ts` e `opengraph-image.tsx` no App Router. Checkouts são **`noindex`** de
propósito: a página indexável é a landing do produto, não o formulário. O card social do DSS é
montado por `dssMetadata()`, pra que qualquer página do congresso compartilhe bonito no WhatsApp.

Toda página carrega o GTM — regra do [AGENTS.md](../AGENTS.md), com canário no vitest que reprova
HTML estático sem o container. Detalhes em [GOOGLE-TAG-MANAGER.md](./GOOGLE-TAG-MANAGER.md).

Última revisão: **2026-08-14**.
