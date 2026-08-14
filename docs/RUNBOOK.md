# Runbook — operação do dia a dia

Receitas curtas pro que se faz com frequência, e pro que dá errado. Contexto de infraestrutura em
[AMBIENTE-E-INFRA.md](./AMBIENTE-E-INFRA.md); de preço, em
[CATALOGO-PRECOS-E-VENDAS.md](./CATALOGO-PRECOS-E-VENDAS.md).

---

## 1. Subir uma mudança

```bash
cd web
npx vitest run && npm run build      # os dois, sempre — nesta ordem
npx vercel --prod --yes
```

Se a mudança mexeu em schema, **em seguida**:

```bash
# integridade ANTES
curl -s -b cookies.txt https://azuris.com.br/api/admin/migrate
# migra (aditivo, idempotente)
curl -s -b cookies.txt -X POST https://azuris.com.br/api/admin/migrate
# integridade DEPOIS — os números têm que bater
```

Entre o deploy e a migração, o checkout do produto afetado usa o preço-fallback do código. Por
isso o fallback tem que acompanhar o lote vigente.

**Sempre confira no HTML público** antes de dar por resolvido: o admin pode ter salvo e a página
ainda mostrar outra coisa.

## 2. Falar com a produção sem a senha do banco

A `DATABASE_URL` de produção não sai pela CLI (`[SENSITIVE]`). O caminho que funciona é a **API do
admin** — a `ADMIN_PASSWORD` do `.env.local` é a mesma de produção.

```bash
PW=$(grep '^ADMIN_PASSWORD=' web/.env.local | cut -d= -f2- | tr -d '"')
curl -s -c cookies.txt -X POST https://azuris.com.br/api/admin/login \
  -H 'Content-Type: application/json' -d "{\"senha\":\"$PW\"}"

curl -s -b cookies.txt "https://azuris.com.br/api/admin/ingressos?produto=dss-2026"
```

> ⚠️ `POST /api/admin/ingressos` é **upsert do registro inteiro**: campo omitido é campo zerado.
> Faça o GET antes, mande todos os campos, confira o objeto devolvido depois.

Apague o `cookies.txt` no fim.

## 3. Receitas de venda

### Virar o lote do DSS
`/admin/ingressos` → cadastre o tipo novo (deixe **Vendas até** vazio) → desligue o velho. Vale na
hora, sem deploy. No próximo deploy, atualize o fallback em `produtos.ts` **e** a constante do
teste `precos-dss.test.ts`, que quebra de propósito se os dois desencontrarem.

### Criar um ingresso reservado (só por link)
`/admin/ingressos` → marque **oculto** → copie o link que o painel mostra
(`/dssbr-2026/inscricao?tipo=<id>`). Ele não é secreto: quem adivinhar o id compra pelo mesmo
preço. A barreira real é a conferência na entrada do evento.

### Dar um link de desconto pra alguém vender
`/admin/cupons` → **vendedora** (a pessoa gera o link dela em `/vendas`, com prazo) ou **parceiro**
(link fixo, sem prazo, que você mesmo distribui). Nunca troque o **código** de um cupom que já
vendeu: o histórico fica preso ao código velho.

### Revogar um link que já está circulando
Desligue o cupom (ou o tipo, se for ingresso oculto). Morre na hora, inclusive na mão de quem já
recebeu.

### Cobrar um valor negociado
`/admin/cobranca` → escolha **produto ou tipo de ingresso** → valor livre → meios de pagamento →
gera o link. Escolher o tipo é o que faz a venda contar no relatório por tipo e ocupar vaga.
Cobrança manual **não** checa prazo nem lotação, de propósito.

### Cobrar de novo o mesmo cliente
No detalhe da venda, **copiar dados do cliente** → `/admin/cobranca?de=<id>`. Copia só o cadastro;
produto, valor e descrição ficam em branco de propósito. A venda antiga não é tocada — se tiver que
morrer, é o botão cancelar, decisão separada.

## 4. Diagnóstico

| sintoma | onde olhar |
|---|---|
| "pagou e não consta" | `/admin/vendas` → detalhe → **sincronizar** (`POST /api/admin/sync` com `{id}`); o webhook pode ter falhado |
| status/taxas desatualizados em massa | `POST /api/admin/sync` com `{all: true}` (backfill) |
| caixa não bate | `/admin/conciliacao` — e `/admin/importar` pra trazer cobrança criada direto no Asaas |
| "vendas encerradas" indevido | `/api/cron/vigia-vendas?seco=1` logado, ou `/admin/ingressos`: prazo vencido ou lotação cheia |
| preço estranho na página | tipo ativo no admin × fallback no código — os dois lugares |
| e-mail não chegou | `POST /api/admin/email-teste`; confira `RESEND_API_KEY` e o domínio verificado |
| aba Tráfego em 403 | não é código: projeto do Google Cloud ≠ projeto da credencial |

## 5. Testar em produção sem sujar os números

1. Faça a compra real pelo fluxo normal (é o único jeito de exercitar Asaas + webhook + e-mail).
2. Em `/admin/vendas`, marque a linha como **teste** — ela some de listas e KPIs **sem ser apagada**.
3. Se precisar, cancele a cobrança pelo painel (recusa se já estiver paga).

## 6. Exportar contatos

`/admin/vendas` → **baixar CSV**, que respeita **todos** os filtros da tela (produto, aba de
origem, período, status). São 21 colunas, uma linha por pessoa/produto, separador `;` com BOM —
abre direto no Excel pt-BR.

## 7. Quando algo der muito errado

- **Rollback:** `npx vercel ls --prod` → promova a produção anterior.
- **Migração não desfaz.** É aditiva; não existe rollback de schema. Se uma coluna nova incomodar,
  o caminho é parar de usá-la, não removê-la às pressas.
- **Nunca reintroduza a coluna `regerada_de_id`** — foi revertida uma vez, de propósito.
- **Nada pode expirar sozinho:** ao cadastrar tipo, `vendas_ate` vazio. Um prazo esquecido já
  fechou o checkout do GU na cara do público no dia do evento.

Última revisão: **2026-08-14**.
