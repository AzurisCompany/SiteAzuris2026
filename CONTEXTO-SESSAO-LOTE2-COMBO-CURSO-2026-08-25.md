# Sessão 2026-08-25 — vira o lote, troca o combo, encerra a promoção do curso

**Tipo:** releitura do projeto → três mudanças de preço em produção, encadeadas: Lote 2 do DSS,
combo com curso trocado de produto, e o fim do preço de comunidade + bônus do ingresso no curso
Lakehouse. Mais uma peça de UI que nasceu do efeito colateral da primeira (a escada de lotes).

**Estado do repo ao fim:** working tree limpa. Um commit de código + este contexto.

**Deploy:** 1, verificado no ar rota por rota. **Migração de prod:** nenhuma (schema intacto —
o que mudou no banco foram *linhas* de `tipos_ingresso`, via API do admin).
**Testes:** 237 passando (24 arquivos), eram 221 (21). Build 45/45 limpo (era 44).

Docs: [`docs/CATALOGO-PRECOS-E-VENDAS.md`](./docs/CATALOGO-PRECOS-E-VENDAS.md) (snapshot novo +
seção 7.1 da escada) · [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md) ·
[`docs/EMAIL-TRANSACIONAL-RESEND.md`](./docs/EMAIL-TRANSACIONAL-RESEND.md) · README.

---

## 1. O pedido, em três ondas

1. *"encerrar as vendas do lote 1 de fullpasse e one passe e ajustar o valor do checkout —
   fullpasse vai para 670 e oneday vai para 290"*
2. *"ajustar o preço do combo para 750 — e encerra a promoção que temos hoje do dss+curso"*
3. *"no checkout você tirou o box com o valor do lote 1... poderia colocar ele apagado ou
   riscado, e o lote dois de forma a pessoa ver que está com desconto"*

A onda 2 precisou de três perguntas antes de virar código: **"combo" só existia um**
(One Day + curso, R$360) e **não existia produto "FullPass + curso"**. A resposta foi: o combo
com curso passa a existir **só no FullPass**, a R$750 — e "a promoção do dss+curso" era o
**bônus do ingresso do DSSBR incluso no curso Lakehouse**, que sai junto com o preço de
comunidade (R$550 → R$750 pra todo mundo).

## 2. O que mudou no banco de produção (sem deploy, na hora)

Via `POST /api/admin/ingressos` ([[reference_operar_prod_via_admin_api]] — upsert do registro
INTEIRO, sempre com GET antes):

| tipo | antes | agora |
|---|---|---|
| `lote-1` | R$570, ativo | **desativado** (`ativo=false`, ordem 3) — fica cadastrado de propósito |
| `lote-2` | não existia | **R$670**, âncora R$820, 3x, 100 vagas, sem prazo, ordem 1 |
| `estudante` | R$400, âncora R$570 | R$400, **âncora R$670** — a âncora acompanha o lote vigente |

`vendas_ate` vazio nos dois, como manda a política desde 01/08.

## 3. O que mudou no código

### Preço

- `produtos.ts`: fallback do FullPass 57000 → **67000**; One Day 24700 → **29000**.
  `precos-dss.test.ts` atualizado (a constante do lote vigente é o canário).
- **A escada duplicada do One Day morreu.** Ela existia em dois arquivos (landing e checkout),
  sem teste — o bug estava aberto desde julho. Agora tem um dono só,
  [`src/app/dssbr-2026/one-day/lotes.ts`](./src/app/dssbr-2026/one-day/lotes.ts)
  (247 encerrado · **290 atual** · 357 final), lido pelos dois, com canário
  `precos-one-day.test.ts` amarrando o `atual` ao `precoCentavos` do registry.
- Prefill da cobrança avulsa dizia "Lote 1" nas dicas dos dois produtos: virou Lote 2.

### Combo: trocado, não editado

| | |
|---|---|
| **novo** `dss-fullpass-curso-2026` | R$750 · FullPass 3 dias + portal do curso · `/dssbr-2026/fullpass-curso` + `/api/dss-fullpass-curso/inscricao` · card na vitrine, rótulo e aba no admin, prefill da cobrança e e-mail de confirmação próprio |
| **encerrado** `dss-one-day-curso-2026` | R$360 · entrou em `PRODUTOS_ENCERRADOS`, **a rota de API foi apagada** e `/dssbr-2026/one-day-curso` virou `permanentRedirect` pro sucessor (o link circulou em WhatsApp; 404 seria pior). Continua no registry: o histórico precisa do nome e do preço |

Combo **sem âncora riscada de propósito**: somar 670 + 750 e anunciar "de R$1.420" seria
superpromessa — o combo dá o PORTAL, não o pacote com ao-vivo e 1:1. Quem comunica o valor é a
nota da página ("o FullPass sozinho sai por R$670").

### Curso Lakehouse: R$750 único, sem bônus

- `PRECO_POR_PERFIL` com os dois perfis em 75000. O perfil membro/não-membro **sobreviveu** —
  ele grava `tipo_ingresso` e escolhe o balde de vagas —, mas não decide mais preço; o texto do
  checkout que prometia R$550 pra membro foi reescrito, e o selo "Preço de comunidade" saiu.
- 12 pontos da landing estática reescritos: card de R$550 removido, o que sobrou virou
  "Turma 1 · preço único", saíram o bloco de bônus, a régua de elegibilidade, 2 FAQs, o rodapé
  do CTA e os dois preços do JSON-LD. Mesma limpeza no `ementa.html`, no teaser
  `/produtos/curso-pipelines` e na home.
- Canário novo `precos-lakehouse.test.ts`: varre os HTMLs de `public/lakehouse-comunidade/` e
  reprova resquício de "R$ 550" ou de promessa de ingresso do DSSBR. É página que ninguém lê em
  runtime — envelhece calada.

### A escada de lotes (onda 3)

Desligar o Lote 1 fez o card dele sumir da vitrine, e o checkout passou a mostrar um preço
solto, sem régua. O pedido foi o Lote 1 riscado; entregue foi a escada inteira, porque
**570 riscado ao lado de 670 lê como "você perdeu o preço bom"**:

```
   Lote 1            Lote 2             No dia
   R̶$̶ ̶5̶7̶0̶            R$ 670             R$ 820
   encerrado      vendendo agora
```

[`src/lib/escada-lotes.ts`](./src/lib/escada-lotes.ts) — pura, 7 testes. Ela é **derivada do
catálogo**, nunca de texto fixo: o degrau riscado é o próprio tipo inativo, e o último é a
âncora do vigente. Regras que ficaram embutidas:

- inativo **mais barato** que o vigente = `encerrado`; **mais caro** = `proximo`. Sem depender
  de data nenhuma;
- **ingresso oculto não é degrau** — o Estudante apareceria na vitrine, que é exatamente o que
  o link discreto evita;
- um lote sozinho e sem âncora **não vira escada** (um degrau só é ruído);
- com link de vendedora, o degrau vigente mostra a tabela riscada e o preço do cupom embaixo;
  os outros seguem em tabela — degrau é momento da venda, não oferta.

## 4. Verificado no ar (não no build)

| rota | o que se viu |
|---|---|
| `/dssbr-2026/inscricao` | escada completa; Lote 2 R$670 com -18% vs R$820 |
| `?tipo=estudante` | R$400 sobre âncora de R$670, e **sem** virar degrau |
| `/dssbr-2026/one-day` | R$290, rotulado Lote 2 |
| `/dssbr-2026/fullpass-curso` | R$750 + a nota do FullPass a R$670 |
| `/dssbr-2026/one-day-curso` | **308** → `/dssbr-2026/fullpass-curso` |
| `POST /api/dss-one-day-curso/inscricao` | **404** — o preço velho não é mais comprável |
| `/dssbr-2026` | vitrine 670 · 290 · 750, "One Day + Curso" zerado |
| `/lakehouse-comunidade/` | R$750, zero "R$ 550", zero bônus |

## 5. Armadilhas desta sessão

- **`grep "R\$ 750"` entre aspas duplas no bash mente.** O `\$` vira `$`, que o grep lê como
  fim de linha: zero ocorrências num HTML que tem o texto. Quase virou "o deploy não pegou".
- **`curl` sem `-L` em `/lakehouse-comunidade/`** devolve corpo vazio (redirect de barra final)
   — e o relatório sai dizendo que a página não tem nada do que você acabou de escrever.
- **Número no HTML do checkout pode ser payload RSC, não preço na tela.** Depois de virar o
  lote no banco, sobraram dois "570" na página: era o *fallback do registry* serializado pro
  client, não venda a 570. Ler o contexto antes de concluir.
- **Lote encerrado não pode ser deletado do catálogo.** Além do histórico (motivo velho), agora
  ele é o degrau riscado da escada: apagar o tipo apaga a régua da página.
- O `vercel --prod` foi **bloqueado pelo classificador** duas vezes antes da autorização
  explícita ("pode publicar"). Trabalho de código rende sem isso; deploy, não.

## Fica pendente

**Desta sessão:**

- **Curso R$750 e combo FullPass+curso R$750 são o mesmo número** — quem comparar leva o
  congresso de R$670 junto de graça. Foi decisão consciente do Binhara; fica registrado porque
  é o tipo de coisa que a gente esquece ter escolhido.
- **Perfil do curso sem diferença de preço, mas com baldes de vaga diferentes** (membro→lote1,
  15; não-membro→lote2, 20). Um "membro" pode ver *esgotado* enquanto o outro balde tem vaga.
- **Copy velha do curso, sem preço, não corrigida:** `Ecosystem.tsx` ainda anuncia
  *"5 semanas hands-on · Turma 1 começa 22/jun/2026"* com badge "Turma 1 aberta" **na home**;
  `CourseCallout.tsx` diz *"em 5 semanas, ao vivo"*; `lakehouse-og/route.tsx` repete na imagem
  de compartilhamento. Tudo anterior ao modelo evergreen de 06/07.
- Nenhum dos três produtos novos/reprecificados teve **1 pagamento real** ainda.

**De antes, inalterado:** encontro do GU é **amanhã (26/08)** e o link do checkout nunca foi
divulgado · fluxo pago do GU sem 1 PIX real · NFS-e (descrição do serviço em `/admin/financeiro`,
credenciamento no Portal Nacional, 1 nota real; IBS/CBS obrigatórios em 2026) · e-mail do Resend
nunca conferido numa venda real · `CUPOM_SECRET` ausente na Vercel e `BIN01`/`CEL01` fracos ·
3 passos manuais do `/admin/trafego` · 6 erros da sync Asaas de 01/08 · bug do bloco "Regerar" ·
PostHog sem chave e sem `purchase` no GA4 · deploy ainda é `vercel --prod` na mão.

Última revisão: **2026-08-25**.
