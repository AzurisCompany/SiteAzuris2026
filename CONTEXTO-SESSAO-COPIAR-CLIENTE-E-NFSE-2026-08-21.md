# Sessão 2026-08-21 — copiar dados do cliente, e o mapa da NFS-e em Curitiba

**Tipo:** releitura do projeto → pesquisa sobre emissão de nota fiscal → feature pequena
entregue e no ar, mais um diagnóstico que ninguém tinha feito.

**Estado do repo ao fim:** working tree limpa. `96e4c50` (código) + o commit de docs desta
sessão.

**Deploy:** 1, verificado no ar com dado real de produção. **Migração de prod:** nenhuma (a
mudança é só leitura). **Testes:** 221 passando (21 arquivos), eram 206. Build 44/44 limpo.

Docs: [`docs/ADMIN-COPIAR-DADOS-CLIENTE.md`](./docs/ADMIN-COPIAR-DADOS-CLIENTE.md).

---

## 1. O pedido

Duas coisas, nesta ordem:

> "verifica se é simples e possível nós gerarmos nota fiscal a partir do pagamento ou geração
> da cobrança... em https://www.nfse.gov.br/ para município de Curitiba"

e, antes de mexer nisso:

> "primeiro que que vc adicione um botão do lado do nome do cliente na tela de pesquisa de
> cobranças e copie para mim todos os dados que o usuários digitou como dados dele"

## 2. O que foi entregue

Botão de copiar ao lado de cada nome em `/admin/vendas` **e** `/admin/cobranca`. Copia só o que
a pessoa digitou sobre si mesma — nome, e-mail, telefone, CPF/CNPJ, tipo, razão social,
endereço, empresa, cargo — num bloco pronto pra colar em formulário de nota.

Três regras que o formatador segue (detalhe no doc):

- **campo vazio não vira linha** — `Cargo: —` colado num formulário parece dado preenchido;
- **o tipo do documento vem dos dígitos**, não do `pessoa_tipo` — venda anterior a 17/07 pode
  ter a coluna NULL com CNPJ preenchido;
- **`como_conheceu` fica de fora quando guarda a descrição da cobrança avulsa** — ali o texto é
  do admin, não do cliente.

O texto é montado no **servidor**: a linha não serializa a `InscricaoRow` inteira pro client, e
as colunas DATE do Neon (que chegam como `Date`) não atravessam a fronteira.

**Junto veio um rename:** o `copiar dados` da coluna Ação virou **`nova cobrança`**. Ele sempre
abriu `/admin/cobranca?de=<id>` — dois "copiar dados" na mesma linha fazendo coisas diferentes
seria armadilha. Docs atualizados (`ADMIN-CANCELAR-E-COPIAR-COBRANCA.md`, `RUNBOOK.md`).

| arquivo | |
|---|---|
| `src/lib/dados-cliente.ts` | novo — monta o texto, puro |
| `src/lib/__tests__/dados-cliente.test.ts` | novo — 15 testes |
| `.../vendas/CopiarClienteButton.tsx` | novo — o botão |
| `.../vendas/copiar.tsx` | novo — `copiarTexto` + ícones, compartilhados |
| `.../vendas/page.tsx` · `.../cobranca/ListaCobrancas.tsx` | fiação + rótulo |
| `.../vendas/CopiarEmailsButton.tsx` | passou a usar o helper compartilhado |

**Verificado no ar:** 50 botões em `/admin/vendas`, 21 em `/admin/cobranca`, rótulo velho
zerado. Clipboard lido de verdade no navegador (`navigator.clipboard.readText()` depois de um
clique), com uma PJ real saindo completa, endereço e tudo. O `title` mostra o bloco, mas não é
prova — o que prova é ler o clipboard.

## 3. A pesquisa da NFS-e — o achado que muda o plano

**Curitiba desligou o emissor municipal.** A Nota Curitibana / ISS Curitiba foi descontinuada em
ondas (01/10/2025 autônomos ISS Fixo · 01/11/2025 Simples Nacional · **01/01/2026 todo o
resto**). Não sobrou webservice municipal nem RPS: emissão, consulta e validação acontecem só no
**Emissor Nacional**.

Isso mata a pergunta "meu município é homologado no gateway?" — o padrão virou um só.

**O caminho viável é o Asaas, não a API nacional direta.** Integrar direto custa 3–5 dias (mTLS
com certificado ICP-Brasil A1, XML DPS assinado em XMLDSig, GZip+Base64, validação sensível a
drift de NTP). O Asaas tem fluxo de Portal Nacional e a única condição que ele impõe — "a cidade
precisa ter integrado" — Curitiba cumpre.

Requisitos, na ordem: credenciamento no Portal de Gestão NFS-e Nacional (fora do Asaas) →
autenticar no Asaas com **CNPJ + senha de integração** ou **certificado e-CNPJ A1** (⚠️ login por
CPF ou e-mail **não** funciona na integração) → grupo de serviço com CNAE + LC 116 idênticos ao
cadastro da empresa.

Achado bom: o Asaas tem agendamento nativo **"quando o seu cliente realizar o pagamento"**.

## 4. O diagnóstico que ninguém tinha feito

Perguntado se a emissão já funciona, fui olhar a produção em vez de responder de memória:

| checagem | resultado |
|---|---|
| `nf_servico_descricao` em `/admin/financeiro` | **vazio** |
| `nf_municipal_service_code` / `_name` | **vazios** |
| Vendas pagas com nota emitida | **0** |
| Vendas pagas recentes mostrando "Emitir NF" | 11 de 16 |

**A plumbing está pronta e deployada desde julho; a configuração não existe; o caminho nunca foi
exercitado nem uma vez.** Clicar em "Emitir NF" hoje para na trava **nossa**, antes de chegar no
Asaas: `Configure a descrição do serviço da NF em Financeiro antes de emitir.`
(`src/app/api/admin/nf/route.ts:56`).

O gatilho, aliás, já está certo: `/api/admin/nf` recusa venda não paga com 409. Emitir na criação
da cobrança seria nota de serviço que ninguém pagou.

## 5. Armadilhas desta sessão

- **A chave Asaas de sandbox está expirada** (`401 invalid_access_token`, `.env.development.local`).
  Não dá pra ensaiar nada de NF em homologação; o teste terá que ser em produção.
- **O `next start` velho segura a porta e serve o `.next` apagado.** Verifiquei o rename contra um
  servidor morto e li "14 rótulos velhos" — falso negativo. `EADDRINUSE` estava no log o tempo
  todo. Matar o pid **antes** de acreditar em qualquer verificação local.
- **A central de ajuda do Asaas está atrás de Cloudflare** (403 no fetch e no curl). A API pública
  do Zendesk (`/api/v2/help_center/articles/search.json`) devolve os artigos inteiros, com `body`.

## Fica pendente

**Desta sessão:**

- **Preencher a descrição do serviço** em `/admin/financeiro` — 30 segundos, tira a trava nossa.
- **Configurar o Portal Nacional na conta Asaas** (credenciamento + CNPJ/senha ou A1 + CNAE/LC116).
- **Emitir 1 NF real** numa venda paga e ver o `nf_status` chegar em `AUTHORIZED`. Dois riscos a
  observar: IBS/CBS viraram obrigatórios em 2026 e nota sem eles é **rejeitada** (nosso
  `createInvoice` manda só ISS/COFINS/CSLL/INSS/IR/PIS); e há **taxa por NFS-e**, que pode não
  fechar num ingresso de R$ 30 do GU.
- Só depois disso vale ligar a emissão automática no webhook (~20 linhas, no ponto onde o Resend
  já dispara).

**De antes, inalterado:** divulgar o link do checkout do GU · checkout do GU sem tarja quando o
`?tipo=` não existe · fluxo pago do GU sem 1 PIX real · e-mail do Resend nunca conferido numa
venda real · `CUPOM_SECRET` ausente na Vercel e `BIN01`/`CEL01` fracos · 3 passos manuais do
`/admin/trafego` · 6 erros da sync Asaas de 01/08 · escada do One Day duplicada · bug do bloco
"Regerar" · PostHog sem chave e sem `purchase` no GA4.

**Resolvido de antes:** "commits não pushados pro GitHub" — `origin/main` está em dia (verificado
hoje). O que continua pendente ali é o **auto-deploy**: subir ainda é `vercel --prod` na mão.

Última revisão: **2026-08-21**.
