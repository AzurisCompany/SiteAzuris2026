# Handoff — Tentativa de destravar o painel Tráfego (GA4 Data API) (2026-06-17)

Sessão curta, **sem commits de código** (só um script de teste descartável + memória atualizada). Working tree do código intocado.

## Objetivo

Acender o painel `/admin/trafego` (commit `4a45381`), que lê a **GA4 Data API** via service account. Estava bloqueado por 2 pendências de acesso (ver handoff de 2026-06-16, seção 7).

## O que foi feito

### ✅ Passo 2 — Leitor na propriedade GA4 (FEITO pelo Binhara)
SA `mysiteazuris@my-project-websiteazuris.iam.gserviceaccount.com` adicionado como **Leitor** na propriedade `421271387`, via analytics.google.com → Administrador → Gerenciamento de acesso à propriedade.

### ❌ Passo 1 — habilitar a Analytics Data API (TRAVADO)
O `runReport` continua retornando **403 "Google Analytics Data API has not been used in project 670444873738 before or it is disabled"**.

- O **OAuth do SA funciona** (a chave é válida — token sai 200). O bloqueio é só a API não habilitada no projeto.
- **Nem o Binhara nem quem criou o projeto têm permissão de `Ativar`** a API no projeto `670444873738` (= `my-project-websiteazuris`).
- Causa provável: o projeto herdou a policy da org Azuris (Workspace `azuris.com.br` bloqueia habilitar API / criar key de SA), ou o projeto pessoal ficou inacessível.

## Diagnóstico técnico

Testado direto contra a API com as credenciais do `.env.local` (sem subir o app):
- `POST oauth2.googleapis.com/token` (JWT RS256) → **200** ✅ → a credencial do SA é boa.
- `POST analyticsdata.googleapis.com/.../runReport` → **403 PERMISSION_DENIED** ❌ → "API has not been used in project 670444873738".

Confirmado: `670444873738` **é** o número do projeto `my-project-websiteazuris` (mesmo projeto do SA), então não é erro de projeto — é a API não habilitada lá.

Script de teste descartável commitável: `web/sql/ga4-poll.mjs` (faz polling do runReport a cada 45s; distingue "API não habilitada" de "outro 403 = falta permissão na propriedade"). Rodar: `node --env-file=.env.local sql/ga4-poll.mjs`.

## Recomendação pra retomar (NÃO testada ainda)

**Antes de tudo (rápido):** garantir que ao clicar "Ativar" estava logado na conta **dona** do projeto (provável `@gmail.com`, não `binhara@azuris.com.br`). Conta errada é a causa #1 de "sem permissão". Trocar de conta no canto sup. direito do console e reabrir:
`https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=670444873738`

**Se ninguém alcança o projeto — solução definitiva (contorna a policy da org):**
1. Conta **`@gmail.com` PURA** (não-Workspace → sem org → sem policy). Binhara vira Owner.
2. console.cloud.google.com → **Criar projeto**.
3. Habilitar **"Google Analytics Data API"** (em projeto pessoal habilita na hora).
4. **IAM → Contas de serviço** → criar SA → **Chaves → adicionar chave JSON** (baixa).
5. No GA4: adicionar o **email do novo SA** como **Leitor** na propriedade `421271387` (passo 2, já sabido).
6. Trocar `GA_SERVICE_ACCOUNT_JSON` em prod (`vercel env add ... production`) + `.env.local`. Testar com `ga4-poll.mjs`.

O resto do código (`src/lib/ga4.ts`, painel `/admin/trafego`, `GA4_PROPERTY_ID=421271387`) **fica intacto** — só troca a credencial e acende.

**Fallback alternativo:** OAuth com a conta do Binhara (ele já enxerga os dados). Mais setup, não implementado.

## Estado das outras pendências (inalteradas desde 2026-06-16)

1. **1 PIX real em prod** pra validar o happy path do checkout reordenado.
2. **Limpar IDs 1–6** (teste) da `inscricoes` de prod (inflam contagem do Curso 11 reais → 17).
3. Renovar key sandbox do Asaas (E2E futuro).
4. De sempre: GitHub auto-deploy, PostHog key, Bing Webmaster, marcar eventos-chave no GA4, cases Sicredi/Unimed.

Última revisão: **2026-06-17**.
