# /admin/links — links de venda num lugar só

Pedido (07/10/2026): *"não tem no menu ou em algum lugar onde eu possa pegar os links do checkout
criados para os produtos… copiar o link de venda de camiseta para palestrante e não achei"*.

Antes disso, link de produto vendido só por link direto (camiseta de palestrante, ingresso
estudante) só existia na cabeça de quem criou ou num CONTEXTO-SESSAO. Agora: menu do admin →
**Links**.

## O que a página mostra

Um grupo por assunto (DSS ingressos, DSS camisetas, eventos presenciais, cursos e assinaturas,
equipe). Em cada linha:

| peça | de onde vem |
|---|---|
| nome + URL (abre em aba nova) + **Copiar link** | `GRUPOS_LINKS` em `src/lib/links-venda.ts`; domínio lido do request (em preview sai o do preview) |
| selo **no site** / **só link** / **oculto** | `visibilidade` do catálogo; "oculto" = tipo com `oculto=true` |
| preço | tipos **ativos e visíveis** do produto em `tipos_ingresso`; produto sem tipo nenhum (ETT adesão) usa `precoCentavos` do registry |
| preço de VIP/Business | lote **vigente** da escada (`escadaPorQuantidade`) + vagas restantes — não a faixa dos lotes ligados |
| aviso amarelo **sem tipo ativo** | produto que tem tipo cadastrado, mas nenhum ativo e visível: o link abre e não vende |
| aviso **esgotado** | escada por quantidade sem vaga em nenhum lote |

Tipo oculto (ex.: estudante R$ 400) ganha linha própria, com `?tipo=<tipo_id>` já montado — só nas
páginas que aplicam o `?tipo=` (`aceitaTipoNoLink`: inscrição do GU e do café; a do FullPass saiu em 08/10 com o encerramento).

Campo de busca filtra por grupo, nome ou URL.

## Manutenção

- **Checkout novo ou rota que saiu:** editar `src/lib/links-venda.ts` (exige deploy).
- **Canário** `src/lib/__tests__/links-venda.test.ts`: reprova link pra rota que não existe em
  `src/app/**/page.tsx` nem em `public/**/index.html`, slug fora do registry `PRODUTOS` e caminho
  repetido.
- Troca de edição do GU/café: o slug vem de `EVENTO_GU_SLUG` / `CAFE_SLUG`, segue sozinho.
- Link com desconto (`?c=` / `?d=`) **não** mora aqui — é `/admin/cupons` e `/vendas`.

## Arquivos

`src/lib/links-venda.ts` · `src/app/admin/(painel)/links/{page,LinksVenda}.tsx` ·
`src/lib/__tests__/links-venda.test.ts` · item "Links" em `src/app/admin/(painel)/layout.tsx`.
Botão de copiar reaproveita `copiarTexto` de `admin/(painel)/vendas/copiar.tsx`.

**08/10/2026:** FullPass e FullPass + Curso saíram do catálogo (vendas encerradas, `e2365be`); o One Day já tinha saído em 07/10. Ver [DSS-VENDAS-ENCERRADAS.md](./DSS-VENDAS-ENCERRADAS.md).
