# Handoff — Instrumentação GA4 + investigação chaves Asaas (2026-06-03)

Sessão focada em (1) revisar o estado do projeto e (2) instrumentar GA4 pra
rastrear conversão. Inclui a descoberta de que a **API key de produção do Asaas
é irrecuperável**.

---

## 🟡 Estado: trabalho GA4 PRONTO mas NÃO commitado nem deployado

`git status` na entrada já mostrava as mudanças abaixo. **Nada foi commitado
nesta sessão** — decidir se commita/deploya na próxima.

### Arquivos novos (untracked)

| Arquivo | O quê |
|---|---|
| `src/lib/gtag.ts` | helper `gaEvent(name, params)` — `transport_type: beacon` pra sobreviver ao redirect pro Asaas; noop se `window.gtag` ausente (SSR / adblock) |
| `src/components/LeadLink.tsx` | `<a>` client que dispara `generate_lead` com `method` (email/phone) no onClick |
| `src/components/CourseCallout.tsx` | bloco CTA do curso Lakehouse, reusável em blog/serviços, linka `/lakehouse-comunidade/` |
| `src/app/lakehouse-og/route.tsx` | OG image dinâmica do curso (166 ln) |
| `sql/check-asaas-prod.mjs` | sanity check da API key Asaas (já existia do cutover, ainda untracked) |

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/app/layout.tsx` | injeta **gtag.js** (`next/script`, `afterInteractive`) com tag **`GT-NNZW5FW`** + cross-domain linker pra `azuris.com.br` |
| `src/app/lakehouse-comunidade/inscricao/InscricaoForm.tsx` | dispara `begin_checkout` (ecommerce: BRL, value, payment_type, item `lakehouse-pipeline`) antes do redirect |
| `src/app/contato/page.tsx` | troca `<a>` de email/telefone por `<LeadLink>` |
| `src/app/page.tsx`, `src/app/servicos/page.tsx`, `src/app/blog/[slug]/page.tsx` | inserem `<CourseCallout>` |
| `src/components/WhatsAppFab.tsx` | +2 linhas (provável evento de clique) |
| `public/lakehouse-comunidade/index.html`, `ementa.html` | ajustes na landing estática |

Total: **9 modificados + 5 novos**.

### Eventos GA4 implementados
- `generate_lead` — clique em email/telefone no `/contato`
- `begin_checkout` — submit do form de inscrição (antes do redirect Asaas)
- ❌ `purchase` confirmado **ainda não** — exige GA4 Measurement Protocol no webhook
  (ver `project_lakehouse_checkout.md`, seção tracking).

---

## 🔑 Chaves Asaas — o que dá e o que não dá pra recuperar

| Credencial | Valor | Onde |
|---|---|---|
| API key **SANDBOX** | `$aact_hmlg_000Mzkw...` (completa) | `web/.env.development.local` |
| **Webhook token** (sandbox **e** prod) | `31e8dc1a...e85e0f9c358b8` (48 hex) | `web/.webhook-token.txt` (gitignored) |
| Base URL prod | `https://www.asaas.com/api/v3` | conhecida |
| API key **PRODUÇÃO** (`$aact_prod_...`) | **IRRECUPERÁVEL** | sensitive no Vercel; não está em arquivo nenhum |

**A chave de produção não volta.** É *sensitive* no Vercel → `vercel env pull
--environment=production` devolve `ASAAS_API_KEY=""` (testado nesta sessão).
Não foi salva localmente (boa prática). Único jeito de tê-la em mãos:
gerar **nova** no painel Asaas (Configurações → Integrações → API), o que
**invalida a atual em produção** — então tem que atualizar no Vercel na hora:

```bash
vercel env rm ASAAS_API_KEY production
vercel env add ASAAS_API_KEY production   # cola nova, marca sensitive
vercel --prod
```

Estado seguro atual = deixar onde está (invisível). Só regerar se houver
necessidade real (rodar `check-asaas-prod.mjs` local contra prod, outra integração).

---

## 🎯 Próxima sessão
- Decidir: commitar + deployar o bloco GA4? (Está funcional, só não foi pro ar.)
- Verificar no GA4 Realtime se `begin_checkout`/`generate_lead` chegam depois do deploy.
- Pendências de sempre: `purchase` via Measurement Protocol, Resend transacional,
  área do aluno, painel admin, rate-limit/captcha no form.

Última revisão: **2026-06-03**.
