# Copiar os dados do cliente pro clipboard

Botão ao lado de cada nome em `/admin/vendas` e `/admin/cobranca`. Um clique copia **tudo que a
pessoa digitou sobre si mesma**, num bloco pronto pra colar no formulário da nota fiscal, num
e-mail ou no WhatsApp — sem precisar abrir a venda.

Em produção desde **2026-08-21** (`96e4c50`). Sem migração de banco: é só leitura, e as colunas
já existiam desde [CHECKOUT-PF-PJ-NOTA-FISCAL.md](./CHECKOUT-PF-PJ-NOTA-FISCAL.md).

---

## 1. O que sai

```
Alessandra Müeller
E-mail: controladoria@exemplo.com.br
Telefone: (41) 8808-2276
CNPJ: 80.228.893/0001-66
Tipo: Pessoa jurídica
Razão social: Isogama Indústria Química
Endereço: Rodovia BR-376, 622 — São Marcos, São José dos Pinhais/PR — CEP 83090-360
```

Nome na primeira linha; o resto rotulado, um campo por linha, sempre nesta ordem: e-mail,
telefone, documento, tipo de pessoa, razão social, empresa, cargo, endereço, como conheceu.

**O que NÃO entra:** valor, status, parcelas, taxa, ids do Asaas, UTMs. Isso é dado da *venda*,
não do cliente — pra levar a venda inteira existe o
[CSV de contatos](./ADMIN-EXPORT-CSV-CONTATOS.md).

## 2. As três regras que o formatador segue

Todas em `src/lib/dados-cliente.ts`, puro e coberto por 15 testes.

### Campo vazio não vira linha

Nada de `Cargo: —` no meio da colagem. Um traço colado num formulário de nota é pior que a
ausência do campo: parece dado preenchido.

### O tipo do documento vem dos dígitos, não do `pessoa_tipo`

14 dígitos → CNPJ, 11 → CPF. Venda anterior a 2026-07-17 pode ter `pessoa_tipo` NULL com o CNPJ
preenchido (era o furo #2 do [checkout PF/PJ](./CHECKOUT-PF-PJ-NOTA-FISCAL.md)) — confiar na
coluna rotularia CNPJ como CPF. Tamanho estranho sai cru, sem máscara: melhor mostrar
`Documento: 123456` do que mascarar errado com cara de válido.

### `como_conheceu` some quando é cobrança avulsa

A coluna é **sequestrada** pela cobrança do admin pra guardar a descrição digitada (prefixo
`Cobrança manual: `, ver `descricaoManual` em `src/lib/cobranca-manual.ts`). Nesse caso o texto é
do admin, não do cliente, e não entra no bloco. É a mesma pegadinha que
[ADMIN-VENDAS-COBRANCA-INGRESSOS.md](./ADMIN-VENDAS-COBRANCA-INGRESSOS.md) documenta.

## 3. Por que o texto é montado no servidor

O botão recebe `texto` já pronto, não a linha inteira:

```tsx
<CopiarClienteButton nome={r.nome} texto={dadosClienteTexto(r)} />
```

Duas razões. A linha não serializa a `InscricaoRow` inteira pro client — 50 linhas × 40 campos de
PII atravessando a fronteira à toa. E as colunas DATE do Neon chegam como `Date`, o gotcha velho
do projeto (ver [BANCO-DE-DADOS.md](./BANCO-DE-DADOS.md)); mandando só a string, elas nem passam
perto do componente.

## 4. Arquivos

| arquivo | papel |
|---|---|
| `src/lib/dados-cliente.ts` | `dadosClienteTexto`, `enderecoTexto`, `documentoTexto` — puros |
| `src/lib/__tests__/dados-cliente.test.ts` | 15 testes |
| `src/app/admin/(painel)/vendas/CopiarClienteButton.tsx` | o botão |
| `src/app/admin/(painel)/vendas/copiar.tsx` | `copiarTexto` + ícones, compartilhados |
| `src/app/admin/(painel)/vendas/page.tsx` · `.../cobranca/ListaCobrancas.tsx` | fiação |

`copiar.tsx` nasceu pra evitar a terceira cópia byte-idêntica do fallback de clipboard e dos dois
SVGs, que viviam dentro do `CopiarEmailsButton`.

## 5. Gotchas

- **`preventDefault` não é decorativo.** A célula do nome é um `<Link>` pro detalhe da venda; sem
  ele, copiar navega.
- **O fallback de clipboard existe por um motivo.** `navigator.clipboard` só funciona em contexto
  seguro; em `http://<ip-da-wsl>:3000` a API não está lá, e o `<textarea>` + `execCommand` salva.
- **Não confie no `title` como verificação.** O tooltip mostra o bloco, mas o que prova que
  funciona é ler `navigator.clipboard.readText()` depois de um clique real — foi assim que a
  entrega foi conferida.
- **O rótulo `copiar dados` da coluna Ação virou `nova cobrança`** na mesma entrega. Ele sempre
  abriu `/admin/cobranca?de=<id>`; ver
  [ADMIN-CANCELAR-E-COPIAR-COBRANCA.md](./ADMIN-CANCELAR-E-COPIAR-COBRANCA.md).
