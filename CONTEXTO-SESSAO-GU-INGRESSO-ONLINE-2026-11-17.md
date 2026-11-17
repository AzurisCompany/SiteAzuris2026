# Sessão 17/11/2026 — GU 19/11: ingresso online (transmissão + gravação, R$ 15)

## Estado no fim da sessão

| o quê | estado |
|---|---|
| tipo `online` R$ 15, 1x, em `gubigdata-2026-11` | **EM PROD**, à venda em `/gubigdata` e `/gubigdata/inscricao?tipo=online` |
| e-mail próprio do online (link + sala + Google Agenda) | **EM PROD**, mas ainda sem compra real que o confirme |
| commits | `b16de73` (ingresso + e-mail), `856d98d` (link da transmissão) |
| deploys | `7bj32d17b` → `a4ihvb6rs` (Ready, Production, azuris.com.br) |
| banco | `POST /api/admin/migrate` em prod: 57/57 ok; tipos ativos: geral 3000, associado 0, online 1500 |
| push | feito até `856d98d` (e o commit deste contexto, logo depois) |

## 1. Releitura

Pedido: *"releia o projeto para agente continuar"*. Estado encontrado: `main` = `origin` = `9efd405`
(upgrade de vídeos, 12/11, em prod `ksr7oyg5h`). As rotas principais respondiam 200. `/ett/aceleracao` seguia
com "abrem em breve", porque o tipo `aceleracao` ainda não existe em prod.

## 2. Ingresso online do GU

Pedido: *"adicionar em /gubigdata/inscricao a compra de acesso online para assistir a transmissão e
receber acesso à gravação, R$ 15. Vai receber por e-mail e na agenda do Google o link de acesso"*.
Depois veio o link: *"https://live.dssbr.com.br/palco → clicar estou fora do evento → sala auditório"*.

O que mudou:
- **Tipo novo no catálogo**, não produto novo. Fica no mesmo `curso_slug` do encontro (receita e aba juntas) e entra
  como seed na migração (`sql/admin-migration.sql` + `api/admin/migrate/route.ts`), com `ordem` 2 e sem `vendas_ate`.
  Página e checkout não mudaram: já listam o que vem do banco.
- **`EVENTO_GU.transmissao`** (`src/app/gubigdata/evento.ts`) tem `inicioUTC`, `fimUTC`, `url` e `instrucoes`.
  O contrato `EventoPresencial` ganhou `transmissao?: Transmissao`, que é opcional (o café não usa).
- **E-mail**: `conteudoGuOnline` em `src/lib/email/conteudo.ts`. Ele entra quando o `tipo_ingresso` da venda é
  `online`, e o webhook já repassa esse campo. Não tem "apresente na entrada". Leva o link, a instrução da sala
  e o aviso da gravação, com o CTA "Adicionar à Google Agenda".
- **`src/lib/eventos/agenda.ts`**: `linkGoogleAgenda()` monta o link de modelo de evento da Google Agenda
  (`calendar.google.com/calendar/render?action=TEMPLATE…`), sem API nem OAuth. Põe o link da transmissão no
  campo local e o passo a passo na descrição.
- **Canário** `eventos-presenciais.test.ts`: exigia exatamente 2 tipos por encontro. Agora aceita 2 ou mais,
  mas ainda só um `geral`.
- Testes novos em `email-conteudo.test.ts`: o online não fala de entrada, o horário UTC está certo, o presencial
  não mudou, e o link e a sala aparecem no e-mail e na agenda.

Verificação: vitest 340/340 antes do link, e os testes de e-mail e evento passaram depois dele (39/39). eslint
ficou limpo nos arquivos mexidos. O `tsc` acusa só um erro antigo, que não é desta sessão, em
`checkout-produto.test.ts` (falta `oculto` no fixture). No ar, as três rotas do GU respondem 200 com
"Online — transmissão ao vivo + gravação" e R$ 15,00.

Decisões tomadas pelo Claude (não confirmadas pelo Binhara):
1. O online é **1x** (R$ 15 parcelado não faz sentido) e não tem limite de vagas.
2. O convite com o link na Google Agenda é o **botão do e-mail**: a própria pessoa adiciona. Ninguém manda
   convite de Google Calendar automático.
3. A gravação é entregue **à mão, por e-mail**, depois do encontro.

Ocorrências:
- O 1º `vercel --prod` voltou "Not authorized". A 2ª tentativa passou sem mudar nada.
- O modo auto negou o `migrate` em prod na 1ª vez. Rodou depois do OK do Binhara ("pode publicar").
  Script usado: login no admin + `POST /api/admin/migrate` + GET dos tipos (ver
  `docs/RUNBOOK.md` e a memória "operar prod via admin API").

## 3. Em aberto

1. 1 PIX real de R$ 15 no online, pra conferir o e-mail e o botão da agenda.
2. Depois de 19/11: desligar `geral` e `associado` (238/239). O `online` pode ficar uns dias pra vender a
   gravação, mas a decisão é do Binhara. Ele também é desligado pela API do admin (`ativo:false`).
3. Mandar a gravação pra quem comprou o online.
4. Na próxima troca de encontro: atualizar ou remover `EVENTO_GU.transmissao` e semear `online` se ele continuar.
5. Herdado: tipo `aceleracao` do ETT em prod; 1 PIX real em slides, vídeos, ativação ETT e Pre-Load 2027.
6. Fixture antigo de `checkout-produto.test.ts` quebra o `tsc` (não o vitest).
