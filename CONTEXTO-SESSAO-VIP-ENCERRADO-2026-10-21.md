# Sessão 21/10/2026 — VIP encerrado e "copiar msg" na lista de cobranças

## Estado no fim da sessão

| o quê | estado |
|---|---|
| **VIP encerrado** (Lote 3, R$ 1.657, o último ingresso) | **EM PROD**: `6cce6a5`, deploy `dpl_GDnzUD9eLb7hEaCuqMy5YZgfN3no`, verificado no ar |
| botão **"copiar msg"** + **wpp com mensagem** em `/admin/cobranca` | **EM PROD**: `4c01845`, mesmo deploy, verificado |
| push | feito até `4c01845`; o commit deste arquivo, ver abaixo |
| backup / rollback | `backups/prod-2026-10-21-antes-vip-encerrado/` (tipos VIP, cupons, integridade antes/depois, deploy anterior) |
| banco | não tocado (sem migração): 321 inscrições, 29 tipos, antes = depois |

`main` = produção. **No site, o DSS 2026 vende agora só a camiseta de palestrante (R$ 55).**
A de congressista fechou sozinha em 20/10 (`vendas_ate` dos tipos). Ingresso daqui pra frente =
WhatsApp + cobrança avulsa.

## 1. Releitura

Pedido: *"releia"*. Estado de 16/10 (Business encerrado, VIP Lote 3 com 14 vagas). Conferido no
ar: a camiseta congressista já mostrava "encerrada" (prazo 20/10 passou).

## 2. VIP encerrado

Pedido: *"encerrar as vendas do vip"*. Receita §5 de `docs/DSS-VENDAS-ENCERRADAS.md`; o doc ganhou
o §9 com a tabela de mudanças. Em resumo:

- `/dssbr-2026/vip` → aviso `VendasEncerradas`; `POST /api/dss-vip/inscricao` apagado (404).
- `VendasEncerradas` sem botões de ingresso: só WhatsApp. Landing: "Inscrições pelo site
  encerradas", CTA do hero "Ainda quer ir?".
- `dss-vip-2026` em `PRODUTOS_ENCERRADOS`, fora do `CHECKOUT_URL` e de `/admin/links`.
- `PRODUTOS_COM_CUPOM` **vazio**: `/admin/cupons` recusa cupom novo; `/vendas` responde 410
  ("As vendas desse ingresso pelo site encerraram") em vez de 500.
- `CheckoutPorLotes.tsx` sem uso — fica pro `git revert` voltar sem reescrever.
- Ficou: registro em `produtos.ts`, e-mail de confirmação, cobrança avulsa, os 3 tipos VIP no
  banco (Lote 3 ativo). PIX já gerado segue pagável.

Desfazer: `git revert 6cce6a5` + deploy (o VIP volta no Lote 3 com as vagas que sobraram).

## 3. "copiar msg" em /admin/cobranca

Problema: o Binhara gerou a cobrança da Liane (Tramontina, "DSSBR - 3 Ingressos Vip",
R$ 3.825, cliente escolhe) e fechou o navegador antes de copiar a mensagem com o link.

- O link sempre esteve lá: o botão **fatura** abre o `invoiceUrl` (botão direito → copiar link).
- Novo (`4c01845`): `mensagemCobranca()` em `lib/cobranca-manual.ts`, a mesma pro form e pra
  lista (2 testes novos). Na lista, botão **copiar msg** em cobrança pendente/vencida, e o
  **wpp** abre o WhatsApp já com a mensagem.
- Limite: na lista, cartão parcelado sai só "Parcelado em Nx." — o banco não guarda valor da
  parcela nem com/sem juros.

## 4. Deploy

- Modo seguro: build + vitest (318/318) → backup em `backups/` → deploy → verificação → push.
- `vercel --prod` negado pelo modo auto (de novo); rodado pelo Binhara via `!`. O `cd web` falhou
  porque o cwd do `!` já era `web/` — **dar o comando com caminho absoluto**.
- Verificado no ar: `/vip`, landing e `/business` com "encerrad", landing sem link pro `/vip`,
  POST 404, camiseta R$ 55,00, "copiar msg" e `wa.me/...?text=` no HTML de `/admin/cobranca`.

## Pendências

- Cards VIP/Business do **dssbr.com.br** → "vendas encerradas" (os links caem no aviso, não quebram).
- Mandar a mensagem com o link pra Liane (R$ 3.825, pendente).
- Herdadas: banco × Asaas (#18, GoCloud, Tiago Nelson — aguardam OK), bug do sync com `deleted`,
  vencidas 55/114/182/264, PIX na chave CNPJ, 1 compra real de camiseta.
- Lint: 3 erros antigos de `<a href="/">` na landing do DSS (não são desta sessão).
