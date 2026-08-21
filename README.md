# Azuris 2026

Site institucional da **Azuris** — engenharia de dados e IA.

Reconstrução completa do `azuris.com.br` substituindo a versão WordPress/Divi por
uma stack moderna, dark-first, focada em profissionais de dados.

O que começou como site institucional hoje também **vende**: checkout próprio (Asaas) pro
DSS 2026, One Day, GU BigData, ETT e o curso Lakehouse, com área administrativa financeira
em `/admin`. O mapa disso está em
**[docs/CATALOGO-PRECOS-E-VENDAS.md](./docs/CATALOGO-PRECOS-E-VENDAS.md)** — comece por ele.

## Documentação

**Comece aqui**
- [ARQUITETURA.md](./docs/ARQUITETURA.md) — as três metades do app, camadas, rotas, convenções
- [CATALOGO-PRECOS-E-VENDAS.md](./docs/CATALOGO-PRECOS-E-VENDAS.md) — onde mora cada preço e como uma venda nasce
- [RUNBOOK.md](./docs/RUNBOOK.md) — deploy, migração, receitas de venda e diagnóstico

**Plataforma**
- [BANCO-DE-DADOS.md](./docs/BANCO-DE-DADOS.md) — tabelas, colunas que fazem mais do que parecem, migração
- [AMBIENTE-E-INFRA.md](./docs/AMBIENTE-E-INFRA.md) — variáveis, deploy, crons, DNS, analytics
- [SITE-INSTITUCIONAL.md](./docs/SITE-INSTITUCIONAL.md) — home, blog, cases, produtos, SEO
- [EMAIL-TRANSACIONAL-RESEND.md](./docs/EMAIL-TRANSACIONAL-RESEND.md) — confirmação de pagamento e vigia de vendas
- [GOOGLE-TAG-MANAGER.md](./docs/GOOGLE-TAG-MANAGER.md) — GTM em toda página (regra do [AGENTS.md](./AGENTS.md))

**Vendas e preço**
- [CHECKOUT-ASAAS-REPRODUCAO.md](./docs/CHECKOUT-ASAAS-REPRODUCAO.md) — pipeline do checkout, do zero
- [ASAAS-INTEGRACAO-COMPLETA.md](./docs/ASAAS-INTEGRACAO-COMPLETA.md) — API, webhook, idempotência
- [CHECKOUT-PF-PJ-NOTA-FISCAL.md](./docs/CHECKOUT-PF-PJ-NOTA-FISCAL.md) — PF/PJ, endereço e nota
- [CUPONS-DESCONTO.md](./docs/CUPONS-DESCONTO.md) — link de vendedora e cupom de parceiro
- [INGRESSO-OCULTO-ESTUDANTE.md](./docs/INGRESSO-OCULTO-ESTUDANTE.md) — ingresso reservado, só por link
- [GUBIGDATA-EVENTO-CHECKOUT.md](./docs/GUBIGDATA-EVENTO-CHECKOUT.md) · [ETT-ADESAO-E-ASSINATURA.md](./docs/ETT-ADESAO-E-ASSINATURA.md) · [FIT-ALUNO-E-PREPARATORIO.md](./docs/FIT-ALUNO-E-PREPARATORIO.md)

**Admin**
- [ADMIN-VENDAS-COBRANCA-INGRESSOS.md](./docs/ADMIN-VENDAS-COBRANCA-INGRESSOS.md) — cobrança avulsa, tipos de ingresso, filtros e abas
- [ADMIN-FINANCEIRO-ONDAS-2026-07-09.md](./docs/ADMIN-FINANCEIRO-ONDAS-2026-07-09.md) — recebíveis, DRE, NF, assinaturas
- [ADMIN-RECONCILIACAO-IMPORTACAO.md](./docs/ADMIN-RECONCILIACAO-IMPORTACAO.md) · [ADMIN-TROCAR-MEIO-PAGAMENTO.md](./docs/ADMIN-TROCAR-MEIO-PAGAMENTO.md) · [ADMIN-CANCELAR-E-COPIAR-COBRANCA.md](./docs/ADMIN-CANCELAR-E-COPIAR-COBRANCA.md) · [ADMIN-EXPORT-CSV-CONTATOS.md](./docs/ADMIN-EXPORT-CSV-CONTATOS.md) · [ADMIN-COPIAR-DADOS-CLIENTE.md](./docs/ADMIN-COPIAR-DADOS-CLIENTE.md)

Cada sessão de trabalho deixa também um `CONTEXTO-SESSAO-*.md` na raiz — narrativa do que
mudou, por quê, e o que ficou pendente.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19.2**
- **Tailwind CSS v4** com tokens de design derivados da logo
- **react-three-fiber** + **three.js** para o hero 3D (data-flow particles)
- **motion** (Framer rebrand v12) para microinterações
- **Postgres (Neon)** + **Asaas** para inscrição, cobrança e webhook
- **Resend** para e-mail transacional (confirmação de pagamento, alertas do vigia)
- **MDX** (`next-mdx-remote`) no blog; cases são estruturas tipadas, não MDX
- **Proxy** (`src/proxy.ts`, ex-middleware do Next 16) para o tráfego incidental do Azuriz FC
- **GTM** em toda página + gtag legado; **PostHog** está no código, mas sem chave configurada

## Rotas

Mapa completo — institucional, checkout e admin — em
[docs/ARQUITETURA.md](./docs/ARQUITETURA.md). Resumo:

```
/                              Home (hero 3D, ecossistema, cases, comunidade, stack, founder)
/sobre  /cases  /blog          Institucional (estático)
/servicos + 5 landings         Serviços
/produtos  /produtos/[slug]    Ecossistema (7 produtos)
/comunidade                    Hadoop.com.br, GU BigData, grupo de estudos
/dssbr-2026 + /inscricao       DSS 2026 — landing e checkout (dinâmicos)
/dssbr-2026/one-day[-curso]    Passe de 1 dia e combo com o curso
/gubigdata  /ett  /preparatorio-dados  /lakehouse-comunidade   Outros checkouts
/vendas                        Vendedora gera o link de desconto dela
/admin/*                       Painel financeiro e operacional (senha única)
/azuriz                        Landing para o tráfego perdido do Azuriz FC
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

As duas variantes emitem evento pra medir conversão (hoje via GTM/gtag — o PostHog está sem
chave). ⚠️ Nunca use a palavra "banner" em `id`/`class`: adblock esconde o elemento.

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

São ~19 variáveis: banco, Asaas, senha do admin, Resend, cupons, crons e analytics. O que cada
uma faz — e **o que quebra sem ela** — está em
[docs/AMBIENTE-E-INFRA.md](./docs/AMBIENTE-E-INFRA.md).

## Testes

```bash
npx vitest run     # 19 arquivos, ~198 testes de regra pura (sem banco, sem rede)
```

## Deploy

Vercel, **por linha de comando** — não há auto-deploy pelo GitHub:

```bash
npx vitest run && npm run build
npx vercel --prod --yes
```

Mudou schema? Rode a migração logo depois (`POST /api/admin/migrate`). Passo a passo, rollback e
receitas de operação em [docs/RUNBOOK.md](./docs/RUNBOOK.md).

## Identidade visual

- Paleta dark-first derivada da logo: `#14b7de` cyan, `#06101c` ink, `#7dd3fc` mist
- Fontes: Geist Sans (display + body), Geist Mono (numbers/code)
- Logo: `AzurisMark.tsx` (SVG inline com gradiente animado — "dados fluindo
  pela marca") + wordmark "AZURIS" em letter-spacing wide
