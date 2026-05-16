# Azuris 2026

Site institucional da **Azuris** — engenharia de dados e IA.

Reconstrução completa do `azuris.com.br` substituindo a versão WordPress/Divi por
uma stack moderna, dark-first, focada em profissionais de dados.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19.2**
- **Tailwind CSS v4** com tokens de design derivados da logo
- **react-three-fiber** + **three.js** para o hero 3D (data-flow particles)
- **motion** (Framer rebrand v12) para microinterações
- **PostHog** para analytics, A/B testing e session replay
- **Proxy** (`src/proxy.ts`, ex-middleware do Next 16) para detecção de
  tráfego incidental e roteamento condicional
- **MDX** (planejado) para blog e cases

## Rotas

```
/                              Home (hero 3D, ecossistema, cases, parceiros, stack, founder)
/sobre                         Quem somos + pilares + bio
/cases                         Cases reais com KPIs
/produtos                      Hub dos produtos
/produtos/curso-pipelines      LP do curso em lançamento
/blog                          (stub MDX)
/contato                       Canais diretos
/azuriz                        Landing dedicada para tráfego incidental do Azuriz FC
```

## Ecossistema

A home destaca produtos próprios e parceiros:

- **DSSBR 2026** — Data Science Summit Brasil
- **English Talk Time** — inglês com IA
- **OWorkshop** — workshops técnicos
- **Hadoop.com.br** — portal de conteúdo PT-BR
- **Curso Pipelines + IA** — lançamento via GU BigData
- Parceiros: **Snowflake**, **Acceldata**, **Gaio Data OS**

## Tráfego Azuriz FC

O domínio `azuris.com.br` recebe tráfego acidental de quem busca o `azuriz.com.br`
(clube de futebol). Implementado em duas camadas A/B:

1. **Banner sutil** no topo da home (acionado por `proxy.ts` via referrer ou
   `?fc=1`) — `AzurizBanner.tsx`
2. **Landing dedicada** em `/azuriz` (takeover) com CTA pro ETT, UTMs trackeáveis

Ambas as variantes emitem eventos PostHog para medir conversão.

## Desenvolvimento

```bash
pnpm install
pnpm dev
```

Servidor sobe em `http://localhost:3000`. Em WSL/Windows, use o IP da WSL
(`ip -4 addr show eth0`) — já há `allowedDevOrigins` configurado no
`next.config.ts`.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Sem a chave, o site funciona normalmente — apenas o tracking fica inativo.

## Deploy

Vercel é o destino. `vercel link` → `vercel --prod`.

## Identidade visual

- Paleta dark-first derivada da logo: `#14b7de` cyan, `#06101c` ink, `#7dd3fc` mist
- Fontes: Geist Sans (display + body), Geist Mono (numbers/code)
- Logo: `AzurisMark.tsx` (SVG inline com gradiente animado — "dados fluindo
  pela marca") + wordmark "AZURIS" em letter-spacing wide
