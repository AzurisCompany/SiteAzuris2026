# Sessão 2026-08-11 — a tag do Google e o 403 do painel Tráfego (achamos a causa)

**Tipo:** releitura do projeto + auditoria de tag do Google + diagnóstico do `/admin/trafego`.
**Estado do repo ao fim:** `main` = `b0d93e2`, **12 commits não pushados** pro GitHub. Working tree
limpa exceto **este próprio arquivo, ainda não commitado**.
**Commits desta sessão:** nenhum. **Deploys:** nenhum.
**Resultado:** a causa do 403 que travava o painel desde 17/06 foi **identificada**. A correção depende de 3 passos manuais no console (seção 6).

Continuação de [`CONTEXTO-SESSAO-GA4-DESTRAVE-2026-06-17.md`](./CONTEXTO-SESSAO-GA4-DESTRAVE-2026-06-17.md), que parou exatamente aqui e chutou a causa errada.

---

## 1. Estado do projeto na releitura

- **149/149 testes** passando (16 arquivos), working tree limpa.
- Último deploy de produção: **06/08**, Ready em 48s — o `d388228` (FullPass R$570 + fim do "pré-venda"). Nada foi ao ar entre 06/08 e hoje.
- 41 rotas de página, 29 rotas de API, 2 crons na Vercel (`reconciliar` 6h UTC, `vigia-vendas` 12h UTC).

## 2. Qual tag do Google o site usa (a pergunta que abriu a sessão)

**Google tag `GT-NNZW5FW`**, que resolve pro GA4 **`G-0231JKF0F0`**.

O `G-` não aparece em lugar nenhum do código — foi obtido baixando o próprio
`https://www.googletagmanager.com/gtag/js?id=GT-NNZW5FW` e lendo os destinos configurados.
É o único destino. Propriedade GA4: **421271387**.

**Instalação:** `src/app/layout.tsx:100-111` — dois `<Script strategy="afterInteractive">`
(loader + `gtag("config", …)` com `linker` pro domínio `azuris.com.br`). Por estar no root
layout, cobre as 41 rotas. **Confirmado no HTML de produção** em `/`, `/dssbr-2026` e
`/dssbr-2026/inscricao`.

**Eventos customizados** — `src/lib/gtag.ts` expõe `gaEvent()` com `transport_type: "beacon"`
(sem isso o evento morre no redirect pro Asaas):

| Evento | Onde |
|---|---|
| `begin_checkout` | DSSBR, ETT assinatura, GU, Lakehouse (4 formulários) |
| `generate_lead` | reserva do preparatório, `WhatsAppFab`, `LeadLink` |
| `select_promotion` | `CourseFloatingBanner` |

**Três buracos de medição** (nenhum é bug, são decisões nunca tomadas):

1. **Não há GTM.** Sem container `GTM-`; é gtag direto no código. Mudar tracking = mudar código e deployar.
2. **Não há tag do Google Ads** (`AW-`). Se rodar Ads, não existe conversão importável.
3. **Não há evento `purchase`.** O funil termina em `begin_checkout`. Quem sabe que o pagamento
   aconteceu é o webhook do Asaas, no servidor, e ele não fala com o GA4 (faltaria Measurement
   Protocol). **O GA4 vê intenção, nunca receita.** Todo cálculo de ROI hoje sai do `/admin`, não do GA4.

Existe também **PostHog** (`PostHogProvider`, autocapture + pageview manual), mas só liga se
`NEXT_PUBLIC_POSTHOG_KEY` existir — e essa key continua não configurada. Na prática, morto.

## 3. O erro do painel Tráfego

```
GA4 403: "Google Analytics Data API has not been used in project 670444873738
before or it is disabled." — reason: SERVICE_DISABLED
```

Testado **direto contra a API**, sem passar pelo app (então não é cache, build velho nem env
da Vercel):

| Teste | Resultado |
|---|---|
| Assinar JWT → token OAuth | ✅ 200. Chave **válida**, `client_id 110792940143697520586`, escopo `analytics.readonly` |
| `runReport` na propriedade 421271387 | ❌ 403 `SERVICE_DISABLED` |
| SA ligar a API sozinho (`serviceusage …:enable`) | ❌ 403 — não tem `serviceusage.services.enable` |
| SA **ler** o estado do serviço (`serviceusage …get`) | ❌ 403 — nem leitura |
| Admin API (`analyticsadmin`) de brinde | ❌ 403 `SERVICE_DISABLED` **também** |
| Leitor na propriedade GA4 | ✅ confirmado pelo Binhara na tela de acesso |

Depois que o Binhara ativou a API no console: **20 tentativas automáticas ao longo de ~15
minutos**, todas `SERVICE_DISABLED`, sempre citando o mesmo projeto. Propagação não explica isso.

## 4. A causa — dois projetos GCP com nomes parecidos

A URL do console onde a API aparece como **Ativada**:

```
https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com?project=siteazuris
```

E o `project_id` dentro da chave em `GA_SERVICE_ACCOUNT_JSON`:

```
my-project-websiteazuris     (= número 670444873738)
```

**`siteazuris` ≠ `my-project-websiteazuris`.** Project ID no Google é único e imutável, então
não há como serem o mesmo projeto com dois nomes. São dois projetos distintos:

| | Projeto |
|---|---|
| Onde a **API está ligada** | `siteazuris` |
| Onde a **credencial vive** | `my-project-websiteazuris` / 670444873738 |

O site autentica por um projeto e a API está ligada no outro. Toda vez que o Binhara clicava
"Ativar", o console — que só enxerga `siteazuris` na conta logada — ligava a API no projeto errado.
O link com `?project=670444873738` **não resolve**: o console cai silenciosamente no `siteazuris`
sem avisar que trocou, e a tela de "Detalhes de API/serviço" não mostra o número do projeto.
Foi por isso que a coisa pareceu resolvida três vezes seguidas.

**Correção ao doc de 17/06:** ele afirmava *"Confirmado: 670444873738 é o número do projeto
`my-project-websiteazuris` (mesmo projeto do SA), então não é erro de projeto"*. A primeira
metade está certa; a conclusão não. O erro de projeto não estava na credencial — estava em
**qual projeto o console abria na hora de clicar Ativar**.

## 5. O que NÃO é o problema (pra ninguém refazer)

- ❌ **Não é credencial faltando.** A frase "talvez seja necessário criar credenciais" na tela
  da API é texto padrão que o Google mostra em toda API ativada, não um diagnóstico. A chave
  atual assina e emite token 200.
- ❌ **Não é permissão no GA4.** O SA já é **Leitor** na propriedade 421271387.
- ❌ **Não é propagação.** 20 tentativas em ~15 minutos.
- ❌ **Não é código.** `src/lib/ga4.ts` e `/admin/trafego` estão corretos; o painel só repete
  o que a API responde. Nada a mexer lá.
- ❌ **Não é env da Vercel.** O teste roda local, contra `.env.local`, sem tocar no app.

## 6. Plano acordado — credencial nova no projeto `siteazuris`

Escolhido em vez de "ligar a API no 670444873738" porque esse projeto **não aparece no seletor
do console** com a conta que o Binhara usa. Provavelmente vive em outra conta Google (o doc de
17/06 já suspeitava de uma `@gmail.com`). Caçar isso é incerto; e mesmo achando, deixaria
credencial e API em projetos separados de novo.

**Passos manuais (Binhara, no navegador):**

1. **Criar service account** em `https://console.cloud.google.com/iam-admin/serviceaccounts/create?project=siteazuris`
   — nome `ga4-reader`. **Pular a etapa de papéis do IAM**: acesso ao GA4 não é IAM, papel de
   projeto aqui não serviria pra nada além de conceder mais do que precisa.
2. **Gerar chave JSON**: o SA criado → aba **Chaves** → *Adicionar chave* → *Criar nova* → **JSON**.
3. **Dar Leitor na propriedade**: `https://analytics.google.com/analytics/web/#/p421271387/admin/suiteusermanagement/property`
   → adicionar `ga4-reader@siteazuris.iam.gserviceaccount.com` como **Leitor**, sem notificar por e-mail.

**Passos do agente, depois que o Binhara passar o caminho do JSON baixado:**

4. Compactar o JSON pra **uma linha só**. Ele vem formatado em várias linhas e o `private_key`
   tem `\n` que precisa sobreviver à conversão — é aqui que esse setup quebra em silêncio.
   Cuidado com o `.env.local`: aspas simples, e ver [`reference_neon_date_e_env`] sobre `$` sendo
   expandido pelo dotenv.
5. Trocar `GA_SERVICE_ACCOUNT_JSON` no `.env.local` **e** na Vercel:
   `vercel env rm GA_SERVICE_ACCOUNT_JSON production` + `vercel env add … production`.
6. **Redeployar** — mudança de env não vale pro deploy que já está no ar.
7. Testar com o script que já existe no repo (seção 7) e conferir a aba `/admin/trafego`.

`GA4_PROPERTY_ID=421271387` **não muda**. Código não muda.

## 7. Como reproduzir o diagnóstico

Script já commitado desde junho, ainda funciona:

```bash
cd web
node --env-file=.env.local sql/ga4-poll.mjs
```

Faz polling do `runReport` (28 dias, `totalUsers`/`sessions`/`screenPageViews`) e distingue
"API não habilitada" de outros 403. Lê `GA_SERVICE_ACCOUNT_JSON` e `GA4_PROPERTY_ID` do env.

Para saber **para qual GA4 uma Google tag aponta** (foi assim que saiu o `G-0231JKF0F0`):

```bash
curl -s "https://www.googletagmanager.com/gtag/js?id=GT-NNZW5FW" \
  | grep -oE "G-[A-Z0-9]{6,}|AW-[0-9]+" | sort -u
```

Para conferir a tag **no ar**:

```bash
curl -s https://azuris.com.br/ | grep -oE "GT-[A-Z0-9]+|G-[A-Z0-9]{8,}|GTM-[A-Z0-9]+|AW-[0-9]+" | sort -u
```

## Fica pendente

**Desta sessão:**

- Os **3 passos manuais** da seção 6 — nada mais trava o painel Tráfego além disso.
- A chave antiga (`mysiteazuris@my-project-websiteazuris…`) segue **válida e sem dono conhecido**,
  num projeto que ninguém administra. Revogar quando descobrir de qual conta é. Não é urgente,
  é do tipo que ninguém lembra até virar problema.
- Decidir se vale mandar **`purchase` pro GA4** via Measurement Protocol a partir do webhook do
  Asaas. Sem isso o GA4 nunca fecha o funil, e o painel Tráfego mostrará sessões sem receita.

**De antes, inalterado:**

- **Nenhum PIX real de ponta a ponta**, em nenhum produto. O e-mail de confirmação do Resend
  nunca passou por um pagamento de verdade.
- **12 commits não pushados** pro GitHub (auto-deploy segue inexistente; prod vai por CLI).
- **6 erros da sincronização Asaas** de 01/08, sem diagnóstico.
- Home do **englishtalktime.com.br** ainda anuncia R$ 70 / R$ 39 / R$ 390.
- Escada de lotes do One Day duplicada entre `produtos.ts` e `one-day/page.tsx:13`, sem teste.
- Bug antigo: campos do bloco "Regerar" ficam velhos após `router.refresh()`.
- `NEXT_PUBLIC_POSTHOG_KEY` nunca configurada.

Última revisão: **2026-08-11**.
