# Sessão 2026-10-01: camiseta de congressista + cupom em vários ingressos do DSS

**Tipo:** 2 produtos/funcionalidades novos em produção, ambos com migração aditiva.

**Estado do repo ao fim:** `main` = `origin/main`. Commits de código: `53462e5` (camiseta
congressista), `787c0e1` (cupom multi-produto), `a08c37e` (fix do 500 em /admin/cupons).
**Deploys:** 3, todos verificados no ar (`njnrwkavq`, `1meg3g75r`, `5sqaxxi73`), rodados pelo
Binhara com `!` (o auto mode bloqueou `vercel --prod` mesmo com "pode publicar").
**Migração de prod:** 53/53 (camiseta) e depois 54/54 (cupons). **Testes:** 302 passando (28
arquivos). Build limpo.

---

## 1. Camiseta oficial do DSS 2026 — congressista

Pedido: *"duplique esse check out para que a gente faça vendas para o congressista, valor de
pré-venda R$70 … preço no dia do evento é R$100 … compra antecipada até uma semana antes do
evento"*.

| | |
|---|---|
| checkout | `/dssbr-2026/camiseta-congressista` (indexável, **sem link na landing**) |
| produto | `camiseta-congressista-dss-2026` (aba "Camiseta Congressista") |
| API | `POST /api/dss-camiseta-congressista/inscricao` |
| tamanhos | tipos `p` · `m` · `g` · `gg` · `xgg`, R$ 70, 3x, **`vendas_ate` = 2026-10-20** |
| quantidade | 1 a 10 por pedido, preço × qtd no servidor (mesmo motor da de palestrante) |
| no dia | **R$ 100 no credenciamento, fora do site** — só texto na página (`PRECO_NO_DIA_REAIS`) |

A página mostra os dois preços lado a lado. Três estados:
- tipos abertos → formulário, "até 20/10";
- tipos cadastrados mas vencidos → "A compra antecipada encerrou… no credenciamento, por R$ 100";
- nenhum tipo (migração não rodada / tudo desligado) ou banco fora → "momentaneamente
  indisponível" + WhatsApp. **Não** confundir com "encerrou".

**Decisões minhas, a confirmar com o Binhara:**
- Prazo **20/10** ("uma semana antes do evento"). Ele também disse "2 próximas semanas" (=15/10).
  Trocar = editar `vendas_ate` dos 5 tamanhos em `/admin/ingressos`, sem deploy.
- "Tem que pagar os 2 valores" lido como **mostrar** os dois preços; online só vende R$ 70.
- Indexável, mas fora da landing.

Backup: `backups/prod-2026-10-01-antes-camiseta-congressista/` (integridade, tipos, deploy
anterior `8difcrury`). Tipos 24 → 29, os 24 antigos idênticos. Inscrições 266 → 266.

## 2. Cupom vale para vários ingressos do DSS

Pedido: *"em /admin/cupons … só consigo escolher um produto … quero poder escolher vários
tipos de ingresso do DSS"*.

- Coluna nova `cupons.produtos TEXT[]`. **NULL = só o `produto_slug`**, como antes — os 6
  cupons existentes não mudaram (conferido contra o backup). O admin grava os dois
  (`produto_slug` = 1º de `produtos`).
- Lista única em `src/lib/cupom-produtos.ts` (`PRODUTOS_COM_CUPOM`): FullPass, One Day, VIP,
  Business, FullPass + Curso. Serve às caixinhas do admin, ao link do parceiro e ao /vendas.
- Parceiro: **um link fixo por ingresso marcado** (`<caminho>?c=CODIGO`).
- Vendedora: `/api/vendas/link` devolve `links[]`, um token por ingresso (o token continua
  assinando o produto: link do One Day não desconta no VIP). `/vendas` mostra um card por link.
- **Bug pré-existente achado:** só `/dssbr-2026/inscricao` lia `?c=`/`?d=`. Cupom de One Day
  (que o admin oferecia) caía no preço cheio. Agora `PasseCheckout` (One Day, FullPass+Curso)
  e `CheckoutPorLotes` (VIP, Business) resolvem o cupom, mostram a tarja (`CupomAviso.tsx`,
  extraída da inscrição do FullPass) e mandam o cupom no POST. No VIP/Business o degrau
  "vendendo agora" da escada mostra o de-por.
- O servidor (`checkout-produto`) já aplicava desconto em todos os produtos; não mudou.

Backup: `backups/prod-2026-10-01-antes-cupom-multi/` (integridade, cupons, tipos).

## 3. Armadilhas desta sessão

- **`/admin/cupons` deu 500 no ar** depois do deploy `1meg3g75r`: `window.location.origin`
  dentro do render de um client component quebra o SSR (`ReferenceError: window is not
  defined`). O código antigo fazia o mesmo com um link só — provavelmente já quebrava. Fix:
  origem vem de `headers()` no server page e desce como prop. **No `next start` local o
  screenshot parecia ok** (o client re-renderiza); o que pega é o status HTTP — conferir com
  `curl -o /dev/null -w "%{http_code}"` logado.
- **`sed 's/,$//'` pra mexer numa linha apagou a vírgula final de TODAS as linhas** do arquivo.
  Use endereço de linha ou Edit.
- **`pkill -f "next start -p 3311"` matou o próprio shell** (exit 144) porque o padrão casa com
  a linha de comando do bash. Mate pelo PID da porta: `ss -ltnp | grep :3311`.
- HTML do React tem `<!-- -->` entre texto e expressão: `grep "Desconto de 15%"` falha. Faça
  `sed 's/<!-- -->//g'` antes.
- Cookie jar do curl marca httponly como `#HttpOnly_…`: tirar o prefixo antes de passar pro
  playwright. O cookie do admin é `azuris_admin`.
- Os 3 erros de lint em `InscricaoForm.tsx`/`page.tsx` já existiam (conferido com stash).

## Fica pendente

- **1 compra real** da camiseta (palestrante ou congressista): o fluxo pago nunca cobrou.
- **1 venda real com cupom** em One Day/VIP/Business: conferir o valor em `/admin/vendas`.
- Binhara confirmar: prazo 20/10 × 15/10; card da camiseta congressista na landing?
- Estender os cupons de parceiro existentes pros outros ingressos (é só "editar" e marcar).
- Herdado: desligar tipos 35/36 do GU 24/09; café 06/10 (tipos 50/51) depois do evento;
  dssbr.com.br com preços do Lote 3/Business R$984; 50 NFs a emitir.

Última revisão: **2026-10-01**.
