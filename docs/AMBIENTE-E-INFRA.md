# Ambiente, variáveis e infraestrutura

Onde isto roda, o que precisa estar configurado, e o que quebra sem cada peça.

---

## 1. Variáveis de ambiente

Local: `web/.env.local` (copiado de `.env.example`). Produção: painel da Vercel.

### Sem estas, produção não funciona

| variável | pra que | falta dela… |
|---|---|---|
| `DATABASE_URL` (ou `POSTGRES_URL`) | Postgres da Neon | checkout cai no preço-fallback, admin mostra banner de erro |
| `ASAAS_API_KEY` | cobrança | nenhuma cobrança nasce |
| `ASAAS_BASE_URL` | sandbox × produção | cobra no ambiente errado — confira ao trocar |
| `ASAAS_WEBHOOK_TOKEN` | autentica o webhook | status nunca fecha sozinho |
| `ADMIN_PASSWORD` | senha única do painel | ninguém entra no admin |
| `ADMIN_SESSION_SECRET` | assina o cookie de sessão | sessão do admin não valida |

### Importantes, com degradação suave

| variável | pra que | falta dela… |
|---|---|---|
| `CUPOM_SECRET` | assina o link da vendedora | **cai no `ADMIN_SESSION_SECRET`** — funciona, mas amarra os dois segredos. Pendente na Vercel |
| `RESEND_API_KEY` | e-mail transacional | pagamento confirma, cliente não recebe e-mail |
| `EMAIL_REMETENTE`, `EMAIL_RESPONDER_PARA`, `EMAIL_BASE_URL`, `EMAIL_ALERTAS`, `EMAIL_TESTE_DESTINO_PADRAO` | remetente, resposta, links e destino dos alertas | e-mail sai com padrão ou alerta não chega |
| `CRON_SECRET` | autentica os crons da Vercel | cron responde 401 (dá pra rodar logado no navegador) |
| `GA4_PROPERTY_ID`, `GA_SERVICE_ACCOUNT_JSON` | painel de tráfego | aba Tráfego em 403 — **é o estado atual** |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | analytics de produto | PostHog inerte — **é o estado atual** |

> ⚠️ **Armadilha registrada:** chave do Asaas com `$` no valor foi expandida pra vazio ao ser lida
> por dotenv. Se uma chave "está lá" e mesmo assim falha, cheque aspas e `$`.

## 2. Deploy

**Não existe auto-deploy.** O GitHub tem o remoto (`AzurisCompany/SiteAzuris2026`) mas os commits
locais costumam ficar à frente; produção vai por linha de comando:

```bash
cd web
npx vitest run          # a suíte inteira, sempre
npm run build           # o build de verdade, antes de subir
npx vercel --prod --yes
```

Depois de subir código que mexeu em schema: **rode a migração** (`POST /api/admin/migrate`) e
confira a integridade. Ver [RUNBOOK.md](./RUNBOOK.md).

Rollback: `npx vercel ls --prod` lista as produções anteriores; promover uma delas volta o site.

## 3. Crons (`vercel.json`)

| horário (UTC) | rota | o que faz |
|---|---|---|
| 06:00 | `/api/cron/reconciliar` | reconcilia caixa com o Asaas |
| 12:00 | `/api/cron/vigia-vendas` | avisa por e-mail se um produto ficou **sem opção de compra**, se um prazo está a ≤3 dias ou se a lotação passou de 80% |

O vigia nasceu do incidente de 30/07, em que os dois tipos do GU expiraram à meia-noite do dia do
evento e o público bateu em "Vendas encerradas". Nada de alerta = nenhum e-mail. `?seco=1`
diagnostica sem enviar. Autentica por `CRON_SECRET` **ou** sessão de admin — dá pra abrir logado
no navegador e ver o diagnóstico na hora.

## 4. Domínio e DNS

`azuris.com.br` está com os **nameservers da Vercel** (`ns1/ns2.vercel-dns.com`) desde 30/05/2026,
apontados no registro.br. A zona inteira vive na Vercel e se edita pela CLI (`vercel dns`).

Antes disso a zona era da Hostinger — e a migração aconteceu porque a IA de suporte deles apagou a
zona. Se algum registro antigo for procurado por lá, ele não existe mais: a verdade é a Vercel.

## 5. Analytics

Duas coisas convivendo, de propósito:

- **GTM `GTM-T7647L5K`** em toda página (regra do [AGENTS.md](../AGENTS.md), com canário no vitest).
- **gtag legado** `GT-NNZW5FW` → GA4 `G-0231JKF0F0` (propriedade 421271387), que é quem dispara
  `begin_checkout`.

**Não** configure uma tag GA4 dessa mesma propriedade dentro do container: o pageview sairia
dobrado. O funil termina em `begin_checkout` — **não existe evento `purchase`**.

O 403 da aba Tráfego é organizacional, não de código: a API está ligada num projeto do Google
Cloud (`siteazuris`) e a credencial pertence a outro (`my-project-websiteazuris`, 670444873738).
Enquanto os dois não forem o mesmo, a aba fica bloqueada.

## 6. Desenvolvimento

```bash
cd web
pnpm install
pnpm dev      # http://localhost:3000
```

No WSL, acesse pelo IP da WSL (`ip -4 addr show eth0`) — já existe `allowedDevOrigins` no
`next.config.ts`. Screenshot headless tem receita própria; e **nunca** use a palavra "banner" em
`id`/`class`, porque adblock esconde o elemento e a captura sai errada.

Última revisão: **2026-08-14**.
