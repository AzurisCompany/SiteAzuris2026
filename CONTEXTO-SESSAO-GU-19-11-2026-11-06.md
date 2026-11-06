# Sessão 06/11/2026 — checkout do encontro GU BigData & IA de 19/11

## Estado no fim da sessão

| o quê | estado |
|---|---|
| encontro 19/11 em `/gubigdata` (`gubigdata-2026-11`) | **EM PROD** — commit `ae517ef`, deploy `428wsefq2`, verificado no ar |
| link de inscrição | `https://www.azuris.com.br/gubigdata/inscricao` (o post do GU já aponta pra ele) |
| tipos de ingresso | Geral R$ 30, 3x (id 238) · Associado grátis (id 239) — criados pela API do admin antes do deploy |
| encontro 24/09 | em `PRODUTOS_ENCERRADOS`; tipos 35/36 já inativos desde 09/10 |
| push | feito |

## 1. Releitura

`main` = `origin/main` = `da97dd6` (fim da sessão de 04/11). Nada pendente de deploy.

## 2. Encontro de 19/11

Pedido: *"crie um checkout de inscrição para o novo evento
gubigdata.com.br/2026/11/19/encontro-presencial-19-de-novembro-sua-ia-corporativa-parou-no-chat/"*.

Evento: "Sua IA corporativa parou no chat? Agentes, automações e apps com o Amazon Quick",
Iago Pimentel, 18h30, IEP. Realização GU Big Data & IA + **AWS User Group Curitiba**.

Feito pela receita de `docs/EVENTOS-PRESENCIAIS.md` (7 passos): `evento.ts`, `produtos.ts`,
`admin-queries.ts`, `email/conteudo.ts`, seed em `sql/admin-migration.sql` +
`api/admin/migrate/route.ts`, `public/gubigdata/banner-novembro.jpg` e `iago-pimentel.jpg`
(baixados do post).

Decisões tomadas sem perguntar (o post não define) — reverter é só editar o tipo no admin:
- **Preço** igual a setembro: Geral R$ 30 + associado grátis.
- **"Membro AWS User Group Curitiba"** entrou no select de associação e no nome do tipo gratuito.
- Realização na página: "GU Big Data & IA e AWS User Group Curitiba · Local: IEP" (sai Rede Sol/SUCESU).

Verificação: vitest 331/331, eslint sem erro, build ok. No ar: `/gubigdata`, `/gubigdata/inscricao`
e `?tipo=associado` 200 com 19/11, Iago, Amazon Quick, R$ 30,00; `/comunidade` com o tema novo;
nenhum "24 de setembro" ou "Vendas encerradas".

Deploy: o `vercel --prod` foi negado ao Claude pelo modo auto; o Binhara rodou `! cd web && npx vercel --prod --yes`
e funcionou (no dia 04/11 tinha dado "Not authorized" pra ele).

## Em aberto

- Fluxo **pago** do GU segue sem 1 PIX real de R$ 30 desde julho.
- Depois de 19/11: **desligar os tipos 238/239** (passo 7 — nada fecha sozinho).
- Confirmar com o GU se o preço/gratuidade AWS UG está certo.
