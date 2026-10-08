# DSS 2026: vendas encerradas (One Day, FullPass, Estudante, combo)

O que o site do DSS 2026 parou de vender, quando, como foi fechado e o que sobrou. Escrito em
08/10/2026, quando o FullPass fechou e o site passou a vender só **VIP, Business e camisetas**.

> **Regra que sai daqui:** produto que lê o catálogo de tipos **não fecha pelo banco**. Sem tipo
> ativo, o checkout cai no preço do registry (`produtos.ts`) e continua vendendo. Fechar um
> produto é sempre **código + deploy**.

---

## 1. Linha do tempo

| data | produto (slug) | último preço | commit | o que a URL faz hoje |
|---|---|---|---|---|
| 25/08 | combo One Day + curso (`dss-one-day-curso-2026`) | R$ 360 | — | `/dssbr-2026/one-day-curso` → 308 → `/fullpass-curso` (aviso) |
| 07/10 | Passe One Day (`dss-one-day-2026`) | R$ 357 (Lote 3) | `f10f6bc` | `/dssbr-2026/one-day` → 308 → `/inscricao` (aviso) |
| **08/10** | **FullPass** (`dss-2026`, tipo `lote-3`) | R$ 887 (Lote 3) | `e2365be` | `/dssbr-2026/inscricao` → **aviso** |
| **08/10** | **Estudante** (`dss-2026`, tipo oculto `estudante`) | R$ 400 | `e2365be` | `/dssbr-2026/inscricao?tipo=estudante` → **aviso** |
| **08/10** | **combo FullPass + curso** (`dss-fullpass-curso-2026`) | R$ 850 | `e2365be` | `/dssbr-2026/fullpass-curso` → **aviso** + link pro curso avulso |

Deploy de 08/10: `dpl_6oqT2qZRc6dXdf39z4P4fHjP6NP8`, rodado pelo Binhara. Push feito (`b24b808`).

**Ainda à venda no site (08/10):** VIP (`/dssbr-2026/vip`, Lote 2 R$ 1.275), Business
(`/dssbr-2026/business`, **Lote 3 R$ 1.279, o último** — pulou em 08/10, ver
[DSS-VIP-BUSINESS-LOTES-POR-QUANTIDADE.md](./DSS-VIP-BUSINESS-LOTES-POR-QUANTIDADE.md) §9),
camiseta de palestrante e camiseta de congressista (até 20/10).

## 2. Por que aviso e não redirect

O One Day redirecionou pro FullPass porque havia um sucessor. O FullPass não tem: VIP e Business
custam bem mais e são outro produto. Decisão do Binhara em 08/10: **a URL fica de pé com um aviso**
(`src/app/dssbr-2026/VendasEncerradas.tsx`):

- "Inscrições do FullPass encerradas" + data e local do evento;
- botões pro **Ingresso VIP** e o **Ingresso Business** — **sem preço**: o preço é das páginas
  deles, lido do banco (regra do [CATALOGO-PRECOS-E-VENDAS.md](./CATALOGO-PRECOS-E-VENDAS.md));
- **WhatsApp** (41) 99800-3687 com mensagem pronta, pra quem ainda quer ir — vira venda pela
  cobrança avulsa.

O mesmo componente serve a landing (`/dssbr-2026`, seção `#ingressos`), a inscrição e o combo.

## 3. O que mudou no código (`e2365be`)

| onde | mudança |
|---|---|
| `src/app/dssbr-2026/inscricao/page.tsx` | virou o aviso (estático, `noindex`). Não lê mais cupom, tipo nem escada |
| `src/app/dssbr-2026/fullpass-curso/page.tsx` | aviso + "quer só o curso? → `/lakehouse-comunidade`" |
| `src/app/dssbr-2026/page.tsx` (landing) | sem cards de ingresso, sem linha de preço no hero, CTA "Ver ingressos" → aviso; descrição sem "a partir de R$ 357". **Voltou a ser estática** (não lê banco) |
| `src/app/api/dssbr-2026/inscricao/route.ts` | **apagado** → POST 404 |
| `src/app/api/dss-fullpass-curso/inscricao/route.ts` | **apagado** → POST 404 |
| `src/lib/admin-queries.ts` | `dss-2026` e `dss-fullpass-curso-2026` em `PRODUTOS_ENCERRADOS`, fora do `CHECKOUT_URL` (o canário `catalogo-admin.test.ts` exige as duas coisas juntas) |
| `src/lib/links-venda.ts` | os dois saem de `/admin/links` |
| `src/lib/cupom-produtos.ts` | os dois saem dos produtos com cupom (`/admin/cupons`, `/vendas`). Cupom antigo que os cite perde o produto na normalização |
| `src/app/admin/(painel)/ingressos/page.tsx` | `dss-2026` segue listado (pros tipos antigos), com a base do link fixa em texto |
| `src/lib/produtos.ts` | comentário "VENDAS ENCERRADAS"; registros ficam (histórico, e-mail, cobrança avulsa) |
| `public/lakehouse-comunidade/index.html` | FAQ deixa de oferecer o combo |
| `src/lib/__tests__/cupom-produtos.test.ts` | normalização testada com VIP/Business + caso do cupom antigo com `dss-2026` |

**Ficou de propósito:**

- `inscricao/InscricaoForm.tsx` — o checkout do ETT (`/ett/adesao`) reaproveita o formulário.
  O default `endpoint='/api/dssbr-2026/inscricao'` aponta pra rota apagada; quem usa passa o seu.
- `inscricao/obrigado` — PIX gerado antes do fechamento continua pagável na fatura do Asaas, e o
  webhook confirma normal (o webhook não depende da rota de checkout).
- **Tipos de `dss-2026` ativos no banco** (`lote-3`, `estudante`). Não vendem mais pelo site (não
  há rota), mas a cobrança avulsa usa o catálogo como opção e preço sugerido.
- Os casos de `dss-2026`/`dss-fullpass-curso-2026` em `lib/email/conteudo.ts` — e-mail de
  confirmação de quem paga depois.

## 4. Verificação (no ar, 08/10)

| checagem | resultado |
|---|---|
| `/dssbr-2026`, `/dssbr-2026/inscricao?tipo=estudante`, `/dssbr-2026/fullpass-curso` | texto "encerrad…" presente; landing sem "Garantir FullPass" |
| `/dssbr-2026/one-day` | 308 → `/dssbr-2026/inscricao` |
| `POST /api/dssbr-2026/inscricao` · `POST /api/dss-fullpass-curso/inscricao` | 404 |
| `/dssbr-2026/business` | R$ 1.279,00 · Lote 3 |
| local | vitest 318/318 (eram 320: 2 links a menos no canário de `/admin/links`); build ok; lint sem erro novo |

Pra repetir:

```bash
for u in /dssbr-2026 "/dssbr-2026/inscricao?tipo=estudante" /dssbr-2026/fullpass-curso; do
  printf "%s → " "$u"; curl -sL "https://azuris.com.br$u" | sed 's/<[^>]*>/\n/g' | grep -c encerrad; done
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://azuris.com.br/api/dssbr-2026/inscricao   # 404
```

## 5. Receita: encerrar um produto do DSS

1. Página do checkout: `permanentRedirect('<sucessor>')` **se houver sucessor**; senão, renderize
   `VendasEncerradas`. Nunca 404 — o link circulou em post, WhatsApp e dssbr.com.br.
2. Apague a rota `POST /api/<produto>/inscricao`.
3. `PRODUTOS_ENCERRADOS` + tire do `CHECKOUT_URL`, de `links-venda.ts` e de `cupom-produtos.ts`.
4. Tire da landing (card, linha de preço do hero, `description`/`ogDescription`) e de qualquer
   HTML em `public/` que linke a página (`grep -rn "<caminho>" src public`).
5. **Não** apague o registro em `produtos.ts` nem o caso do e-mail: histórico e PIX pendente.
6. `pnpm vitest run` + `pnpm build`, deploy, e verificar no ar (seção 4).

## 6. Desfazer

Reverter `e2365be` (`git revert e2365be`) e fazer deploy: volta página, API, landing e catálogos.
Os tipos no banco não foram tocados, então o preço volta a ser o do `lote-3` (R$ 887) e o
Estudante (R$ 400) sem nenhum passo no admin.

## 7. Pendências

- **dssbr.com.br**: botões/cards que apontam pro checkout do FullPass, do combo ou do One Day
  agora levam ao aviso — trocar lá (fora deste repo).
- Tipos do café 06/10 (50/51) e do GU 24/09 (35/36) **ainda ativos** — evento passado à venda.

Última revisão: **2026-10-08**.
