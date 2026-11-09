# Sessão 09/11/2026 — ETT: ativação R$97 + trilhas Dedicação/Aceleração; e-mail em toda inscrição

## Estado no fim da sessão

| o quê | estado |
|---|---|
| ETT (ativação, Dedicação, Aceleração) | commit `3f36c61` — **NÃO DEPLOYADO** |
| e-mail em inscrição gratuita | commit `a953ae5` — **NÃO DEPLOYADO** |
| docs + este contexto | commit seguinte (docs) |
| tipo `ett-aceleracao/aceleracao` em prod | **NÃO CRIADO** (escrita via API negada ao Claude) |
| push | **pendente** |

Deploy: `vercel --prod` do Claude deu "Not authorized" e depois foi negado pelo modo auto.

## 1. Releitura

`main` = `origin/main` = `ddd9d58`. Nada pendente de deploy no começo.

## 2. ETT — copy nova da home

Pedido: "atualizar e criar os checkout para os produtos" (copy colada da home do ETT).

| Produto | URL | Preço | Implementação |
|---|---|---|---|
| Ativação acompanhada | `/ett/ativacao` | R$ 97 único | registry `ett-adesao` (slug mantido = mesmo histórico/aba), API `/api/ett/adesao/inscricao` |
| Trilha de Dedicação | `/ett/assinatura` | R$ 37/mês · R$ 370/ano | sem mudança de preço; itens e copy novos |
| Trilha de Aceleração | `/ett/aceleracao` | R$ 0 | produto novo `ett-aceleracao`, tipo gratuito `aceleracao`, `AceleracaoForm` (nome/e-mail/WhatsApp + checkbox da regra + LGPD), rota `/api/ett/aceleracao/inscricao` |

- Redirects 307 em `next.config.ts`: `/ett/adesao` → `/ett/ativacao`, `/ett/dedicacao` → `/ett/assinatura` (query preservada — verificado local).
- `EttShell`: props `isencao` (só ativação), `exigeAtivacao` ("Antes, a ativação" nas trilhas), `semCobranca` (rodapé sem Asaas).
- "Antes, a ativação" é **aviso, não trava**: isentos antigos não têm compra no banco.
- Aceleração sem o tipo no banco → "abrem em breve" + WhatsApp (tolerante, como o preparatório).
- Admin: rótulos/abas ("ETT Ativação", "ETT Aceleração"), `CHECKOUT_URL`, `/admin/links`, cobrança avulsa, e-mail de confirmação da ativação e da Dedicação.
- Seed do tipo em `sql/admin-migration.sql` + `POST /api/admin/migrate`.

## 3. E-mail em toda compra

Pedido: "todas as compra tem que gerar email de aviso da compra".
Pago já mandava (webhook). Faltava o gratuito → `notificarInscricaoGratuita` chamado em
`processarCheckout` + `conteudoInscricaoGratuita` (ETT Aceleração, GU, café, preparatório,
genérico). `vitest.config.ts` ganhou alias de `server-only` pra stub.

Verificação: vitest 335/335, eslint sem erro nos arquivos tocados, build ok, smoke local
(3 páginas 200, R$ 97, redirect com UTM). E-mail gratuito **não testado de verdade** (só após deploy).
`tsc` ainda acusa erro pré-existente em `checkout-produto.test.ts` (`oculto` faltando) — não é desta sessão.

## Para o Binhara fazer

1. `! cd web && npx vercel --prod --yes` (se "Not authorized": `! npx vercel login` antes)
2. Criar o tipo: `POST /api/admin/migrate` **ou** `/admin/ingressos` → produto `ett-aceleracao`, tipo `aceleracao`, R$ 0, 1x, ativo
3. `! cd web && git push`
4. Site do ETT: botões → `https://azuris.com.br/ett/ativacao`, `/ett/assinatura`, `/ett/aceleracao`

## Em aberto

- 1 inscrição real na Aceleração pra ver o e-mail chegar; 1 PIX real na ativação R$ 97.
- Baixa manual no admin e importação do Asaas não mandam e-mail.
- Depois de 19/11: desligar tipos 238/239 do GU (vem da sessão 06/11).
