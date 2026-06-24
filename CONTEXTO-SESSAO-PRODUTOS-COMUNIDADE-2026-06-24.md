# Sessão 2026-06-24 — Produtos novos + Seção/Página de Comunidade + Sub-páginas de produto

Tudo em **PROD** (azuris.com.br, deploy Vercel). 4 commits, do mais antigo ao mais novo:

```
f34e1a6 feat(home): 3 produtos novos (TTSpeak, PolenAI, PipeZeroOne) + seção Comunidade
fdb3d9d feat(comunidade): página dedicada /comunidade + teaser na home
a7712a6 copy(comunidade): refoca headline e intro em comunidade, sem ângulo comercial
e71e88f feat(produtos): sub-páginas /produtos/[slug] com resumo + link pro site
```

## 1. Produtos novos no Ecossistema (home)
Adicionados ao `src/components/sections/Ecosystem.tsx` com badge "✨ Novo":
- **TTSpeak** (ttspeak.com.br) — plataforma de videochamada com facilitação (breakout, transcrição por locutor, white-label, LMS/CRM). "por Azuris".
- **PolenAI** (polenai.com.br) — marketing AI-first; brief em PT vira campanha multi-canal. Claude/GPT/Gemini + LGPD. "by Azuris".
- **PipeZeroOne** (pipezeroone.com.br) — CRM AI-first; enriquece lead, escreve proposta, prioriza pipeline. "Seu pipeline acordou".

Intro do Ecossistema reescrita (tirou "comunidade", foca produtos: dados/vídeo/IA mkt e vendas).
Grid reorganizado: DSSBR 2x2 + 4 quadrados (ETT, OWorkshop, TTSpeak, PolenAI) + 2 faixas duplas (Lakehouse, PipeZeroOne).

## 2. Comunidade — separada dos produtos
Hadoop.com.br, GU BigData e Grupo de Estudos **saíram** do grid de produtos (estavam misturados) e viraram coisa própria:
- **`src/components/sections/Community.tsx`** — seção na home entre `HowWeWork` e `Cta`. Eyebrow VERDE (emerald `#10b981`) pra diferenciar do ciano. É teaser: linka pra `/comunidade`.
- **`src/app/comunidade/page.tsx`** — página dedicada: header 3D, 3 cards detalhados (resumo + 3 bullets + CTA cada), bloco "Comunidade que se constrói junta".
- Headline/copy final (após feedback do Binhara): **"Onde a comunidade de dados se encontra."** — foco 100% comunidade, **sem** ângulo comercial ("antes de vender", "não é comercial", "sem captura de lead/funil" foram REMOVIDOS).
- Adicionada ao **Navbar** ("Comunidade", entre Produtos e Blog) e ao **sitemap** (priority 0.75).

## 3. Sub-páginas de produto (resumo + link pro site)
Pedido: cada produto com sub-página rápida que linka pro site oficial.
- **`src/lib/produtos-catalogo.ts`** — catálogo de marketing (NÃO é o `lib/produtos.ts`, que é registry de preço/checkout Asaas). Data-driven: editar/adicionar produto = mexer no array `CATALOGO`.
- **`src/app/produtos/[slug]/page.tsx`** — rota dinâmica SSG (`generateStaticParams` + `generateMetadata`, assinatura `PageProps<"/produtos/[slug]">` + `await props.params` — padrão Next 16).
- 5 sub-páginas (todas 200 em prod): `/produtos/ttspeak`, `/polenai`, `/pipezeroone`, `/english-talk-time`, `/oworkshop`.
- Layout: header (emoji+categoria+badge), resumo 1 parágrafo, CTA pro site no topo, 4 cards de destaques, bloco "Para quem é", CTA final (botão + host).
- Copy de ETT e OWorkshop foi puxada dos sites reais (WebFetch), não inventada:
  - ETT = programa de aceleração de inglês pra profissionais tech/dados (encontros seg online + presencial Curitiba, metodologia ~3k palavras, IA+gamificação).
  - OWorkshop = workshop presencial 16h/2 dias de IA pra empresas (+1h consultoria bônus).
- **Cards do Ecossistema** dos 5 produtos externos agora apontam pra sub-página INTERNA (era link externo direto). Fluxo: card → sub-página → site. DSSBR (`/dssbr-2026`) e Lakehouse (`/produtos/curso-pipelines`) seguem indo pras páginas completas que já existiam.
- Sitemap: 5 rotas de produto adicionadas (via `getAllProdutoSlugs()`).

## Pendência / decisão aberta
- **TTSpeak vs English Talk Time**: hoje são 2 cards separados no ecossistema. ETT roda sobre a tecnologia do TTSpeak. Binhara ainda não decidiu se funde/relaciona os dois ou mantém separados. (Perguntei, sem resposta ainda.)
- Hadoop.com.br: na página de comunidade falei "uma das referências mais antigas" sem cravar ano (não tinha a data). Se Binhara passar o ano de criação, dá pra trocar por número real.
