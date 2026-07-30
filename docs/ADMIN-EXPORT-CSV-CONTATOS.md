# CSV de contatos por produto

Botão de download em cada aba de produto de `/admin/vendas`, entregue em
2026-07-30 (commit `de92b13`, `dpl_7A1UUdPSWSjXYSG46p1sfEiVrXe3`).

Nasceu do pedido: *"quero um botão pra além de exportar a lista de email — um CSV
completo com nome, email e telefone de cada tipo de produto"*, e depois
*"quero um botão por produto"*.

É o irmão do "Copiar emails" que já existia
([ADMIN-VENDAS-COBRANCA-INGRESSOS.md](./ADMIN-VENDAS-COBRANCA-INGRESSOS.md)):
aquele devolve só os endereços pra colar no campo BCC; este devolve a linha
inteira pra trabalhar a lista numa planilha.

---

## Onde fica

`/admin/vendas`, duas formas do mesmo componente (`BaixarCsvLink.tsx`):

- **`icon`** — ícone de download em **cada aba de produto**, ao lado do ícone de
  copiar emails. Baixa aquele produto sem precisar entrar na aba.
- **`full`** — botão "Baixar CSV" no cabeçalho, que baixa a **aba ativa**.

Aba sem nenhum registro no filtro vira um `<span>` apagado, sem link — não
adianta baixar um arquivo só com cabeçalho.

Não é client component: é um `<a download>` apontando pra rota. Quem monta o
arquivo é o servidor, o browser faz o resto.

## A rota

`GET /api/admin/exportar` — protegida por `estaLogado()`, 401 sem cookie.

Lê **os mesmos query params da tela**, então o arquivo é sempre o que está na
tela: `curso`, `status`, `billing`, `tipo`, `pessoa`, `origem`, `de`, `ate`,
`busca`, `teste`. Filtrou por período e status na página, o CSV sai filtrado
igual. Sem `curso`, sai a base inteira.

Isso é possível porque `vendasParaExport()` reusa o **mesmo `construirWhere(f)`**
da `listarVendas` — só tira a paginação e exige email não-vazio (contato sem
email não serve pra lista). Teto de `EXPORT_MAX_LINHAS = 5000`, que não é regra
de negócio: é pra uma query solta não virar um arquivo de 50 MB sem ninguém
perceber.

```
GET /api/admin/exportar?curso=dss-2026&status=paid&de=2026-07-01
→ 200 text/csv; charset=utf-8
  content-disposition: attachment; filename="contatos-dss-2026-2026-07-30.csv"
  cache-control: no-store
```

`no-store` é deliberado: é lista de contato de cliente, não cacheia em CDN nem
no browser.

## As 21 colunas

| # | Coluna | Observação |
|---|---|---|
| 1 | `nome` | |
| 2 | `email` | trimado |
| 3 | `telefone` | como foi gravado, só dígitos |
| 4 | `whatsapp` | `https://wa.me/55…` via `whatsappUrl()` — clicável na planilha |
| 5 | `produto` | rótulo humano (`labelProduto`), não o slug |
| 6 | `tipo_ingresso` | rótulo humano (`labelTipo`), vazio quando NULL |
| 7 | `pagou` | `sim`/`nao` — **ver regra abaixo** |
| 8 | `status` | rótulo humano do registro mais recente |
| 9 | `valor` | reais com vírgula decimal (`570,00`) |
| 10 | `meio_pagamento` | `labelBilling` |
| 11 | `parcelas` | |
| 12 | `documento` | CPF/CNPJ |
| 13 | `pessoa` | `PF`/`PJ` |
| 14 | `empresa` | |
| 15 | `cargo` | |
| 16 | `origem` | `utm_source` — `admin` marca cobrança manual |
| 17 | `campanha` | `utm_campaign` |
| 18 | `como_conheceu` | em cobrança manual, guarda a descrição |
| 19 | `inscricao_em` | `DD/MM/AAAA` em BRT |
| 20 | `pago_em` | `DD/MM/AAAA` em BRT, `pago_em ?? paid_at` |
| 21 | `registros` | quantas linhas colapsaram nesta — ver abaixo |

## Uma linha por pessoa POR produto

Chave de dedupe: `email.toLowerCase() + '|' + curso_slug`.

- Quem comprou o mesmo produto duas vezes (cobrança regerada, PIX que virou
  cartão) vira **uma linha**, com `registros = 2`. Sem isso a lista de contatos
  nasce com duplicata — que é justamente o que o botão de emails já evitava.
- Quem comprou **produtos diferentes** aparece **uma vez em cada**. Na aba de um
  produto isso é invisível (o produto é fixo); na aba "Todos" é o que dá sentido
  ao arquivo.

A linha que sobrevive é a **mais recente** — as rows chegam ordenadas por
`created_at DESC` e o `Map` guarda a primeira ocorrência.

### Por que `pagou` não é só o status da linha que sobreviveu

`pagou` é `sim` se **qualquer uma** das linhas colapsadas está paga.

Cenário real: a pessoa pagou em junho, você regerou a cobrança em julho e a nova
está pendente. A linha mais recente é a pendente — se `pagou` copiasse o status
dela, a pessoa sairia da lista **como se nunca tivesse comprado**. A coluna
`status` continua mostrando o estado da linha mais recente; `pagou` responde a
pergunta diferente ("essa pessoa já me pagou alguma vez neste produto?").

## Formato do arquivo

**`;` + BOM + vírgula decimal + CRLF.**

- **Separador `;`**, não `,`: o Excel em pt-BR usa ponto-e-vírgula como separador
  de lista. Com vírgula ele joga a linha inteira numa coluna só. O Sheets detecta
  os dois. **No pandas: `pd.read_csv(f, sep=';')`.**
- **BOM de UTF-8** (`EF BB BF`): sem ele o Excel lê "João" como "JoÃ£o".
- **Valor com vírgula decimal** (`570,00`): o Excel pt-BR reconhece como número.
- **Data `DD/MM/AAAA`** no fuso `America/Sao_Paulo`, que o Excel pt-BR parseia
  como data — e não como texto.

`escaparCampo()` **não** cita por causa de vírgula, de propósito: o separador é
`;`, e citar por vírgula faria todo valor em reais sair entre aspas à toa. Cita
quando o campo contém `;`, aspas ou quebra de linha (RFC 4180, aspas dobradas).

### Injeção de fórmula

Campo começando com `=`, `+`, `-`, `@`, tab ou CR ganha prefixo `'`.

Nome, empresa e cargo vêm digitados por qualquer um no checkout público. Um
campo começando com `=` vira **fórmula executável** quando o arquivo abre no
Excel. O prefixo `'` faz o Excel tratar como texto.

Custo: um nome que legitimamente comece com `-` sai com apóstrofo na frente.
Aceitável.

## Arquivos

| Arquivo | Papel |
|---|---|
| `src/lib/export-contatos.ts` | monta o CSV — **puro**, sem banco nem Request |
| `src/lib/__tests__/export-contatos.test.ts` | 15 testes (escape, dedupe, `pagou`, formato) |
| `src/lib/admin-queries.ts` | `vendasParaExport()` + `EXPORT_MAX_LINHAS` |
| `src/app/api/admin/exportar/route.ts` | auth + params + headers |
| `src/app/admin/(painel)/vendas/BaixarCsvLink.tsx` | o botão (`full`/`icon`) |
| `src/app/admin/(painel)/vendas/page.tsx` | `exportHref(slug)` + os botões |

A separação existe pra que a parte que importa (dedupe, escape, formato) seja
testável sem subir banco nem servidor.

## Verificação feita em prod (2026-07-30)

Contra o banco real, após o deploy:

| Aba | Contatos |
|---|---:|
| Todos | 72 |
| GU BigData | 38 |
| Curso (Lakehouse) | 12 |
| Ingressos DSS | 11 |
| Propostas | 9 |
| One Day / One Day + Curso | 0 |

No arquivo do GU (o maior): BOM presente, 21 colunas no cabeçalho, **zero linhas
com número de campos diferente de 21** (nenhum `;` de dado vazou sem escape), 38
emails únicos em 38 linhas, 38 com telefone. Sem cookie → 401.

> **Leitura dos números:** os 38 do GU aparecem todos como `pagou=sim` porque o
> tipo `associado` é **gratuito** (R$ 0,00) e o fluxo fecha como pago. Pra medir
> receita do evento, filtrar por valor, não por status.

## O que ficou de fora

- **Sem export do detalhe da venda** — o CSV é da lista, não da linha.
- **Sem endereço de NF** nas colunas. Mora em `nf_endereco` (JSONB) e viraria 6
  colunas quase sempre vazias. Se precisar, é a hora de um segundo formato.
- **Sem seleção de colunas** na tela: são as 21, sempre.
- **A aba `preparatorio-dados` mostra o slug cru** — falta entrada em
  `PRODUTO_TAB` (`admin-queries.ts`). Pré-existente, não corrigido aqui.
