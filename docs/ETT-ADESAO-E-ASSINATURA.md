# ETT no gateway — adesão (R$70) e assinatura (R$39/mês)

Dois produtos do English Talk Time passando pelo checkout da Azuris. Preços e copy
vêm da home do englishtalktime.com.br.

| Produto | URL | Preço | Natureza |
|---|---|---|---|
| Adesão | `/ett/adesao` | R$ 70 | cobrança **única** (PIX ou cartão 1–3x) |
| Trilha de Dedicação | `/ett/assinatura` | R$ 39/mês ou R$ 390/ano | **recorrente** (subscription no Asaas) |

Ambas `noindex` — a página indexável é o site do ETT; estas são só checkout.

## Adesão: caminho já existente

Nada novo de infraestrutura. Entrou como mais um registro em
`src/lib/produtos.ts` (`ett-adesao`) e usa o `processarCheckout()` compartilhado
([`CHECKOUT-ASAAS-REPRODUCAO.md`](./CHECKOUT-ASAAS-REPRODUCAO.md)):

- `POST /api/ett/adesao/inscricao` → 19 linhas chamando `processarCheckout('ett-adesao', body)`.
- Página usa o `InscricaoForm` do DSS, agora com prop `enderecoObrigatorioPJ`
  (default `true`, como era). O ETT passa `false`: é produto de pessoa física, e
  travar por endereço custaria conversão numa compra de R$70.
- Cai na aba **ETT Adesão** de `/admin/vendas` e no CSV de contatos, como qualquer
  outro produto. Também dá pra faturar à mão em `/admin/cobranca` (opção "ETT Adesão").

## Assinatura: o primeiro recorrente público

Este é o único checkout **público** que cria uma `subscription` no Asaas em vez de
uma cobrança. O que muda:

1. `POST /api/ett/assinatura` (rota nova, pública) valida → grava em `assinaturas`
   com `produto_slug='ett-assinatura'` → cria o customer + a subscription → devolve
   o link da **primeira cobrança**.
2. Criar subscription **não devolve `invoiceUrl`**. Por isso existe
   `getSubscriptionPayments()` em `lib/asaas.ts`: sem essa busca, o cliente assinaria
   e sairia da tela sem nada pra pagar.
3. `billingType = UNDEFINED` de propósito — o cliente escolhe PIX, boleto ou cartão
   na fatura do Asaas. **No cartão a renovação é automática; no PIX ele paga ciclo a
   ciclo.** Fixar `CREDIT_CARD` exigiria tokenizar cartão no nosso domínio, o que a
   gente não faz.
4. Cada ciclo cobrado vira uma venda pelo webhook (`materializarCicloAssinatura`),
   agora com `curso_slug = COALESCE(a.produto_slug, 'assinatura')` — é isso que dá
   aba própria **ETT Assinatura**, separada das recorrências avulsas criadas no admin.

### Trava de duplicidade

`assinaturaAtivaDoProduto(produto, email)` barra a segunda assinatura do mesmo
e-mail: quem clica duas vezes recebe o link da cobrança em aberto, não uma segunda
recorrência cobrando todo mês. Comparação de e-mail é case-insensitive.

### Rollback

A linha em `assinaturas` nasce **antes** do Asaas. Se o Asaas falhar, a linha é
apagada — senão a trava de duplicidade barraria o cliente por uma assinatura que
não existe em lugar nenhum. Verificado localmente (sem chave Asaas: 502 e zero
linhas órfãs).

### Preço no servidor

`src/lib/ett.ts` é a fonte da verdade: o client manda `plano: 'mensal' | 'anual'`,
o valor e o `cycle` saem daqui. Plano fora da lista → 400.

## Migração

```sql
ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS produto_slug TEXT;
CREATE INDEX IF NOT EXISTS idx_assinaturas_produto_email ON assinaturas(produto_slug, email);
```

Aditiva e idempotente, em `sql/admin-migration.sql` e no `STATEMENTS` de
`POST /api/admin/migrate`. **Ordem: deploy primeiro, migração depois** — o statement
novo só existe no código deployado. Entre uma coisa e outra, criar assinatura pelo
admin quebra (coluna inexistente); é questão de minutos, mas é bom saber.

## O que ainda não existe

- **Nenhum PIX real de ponta a ponta** em nenhum dos dois — mesma pendência dos
  outros produtos.
- **Cancelamento self-service:** o cliente cancela falando com a gente; o botão de
  cancelar vive no `/admin/assinaturas`.
- **Fulfillment manual:** pagar não libera nada automaticamente. Quem coloca a
  pessoa no ETT Player / nos encontros é operação, como no combo do One Day.
- **Nota fiscal:** o form da assinatura não coleta endereço. PJ que precisar de nota
  entra pelo WhatsApp.
