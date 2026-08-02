# E-mail transacional (Resend)

Implementado seguindo o guia portável do Mailia
(`D:\2026\Mailia\docs\setup-resend-portavel.md`): **motor `server-only` +
templates react-email + borda best-effort**.

Antes disso o app não mandava e-mail nenhum — quem falava com o cliente era o
Asaas (fatura, recibo, aviso de vencimento). Agora o **pagamento confirmado**
dispara um e-mail nosso, com texto próprio por produto.

## Peças

| Arquivo | Papel |
|---|---|
| `src/lib/email/conteudo.ts` | **puro** — o que cada produto diz. Sem Resend, sem env, sem DB. É o que os testes cobrem. |
| `src/emails/_componentes.tsx` | moldura (cabeçalho, rodapé, paleta) |
| `src/emails/CompraConfirmada.tsx` | diagramação do e-mail de pagamento confirmado |
| `src/lib/email/enviar.ts` | **motor** `server-only` — lê a key, chama o Resend |
| `src/lib/email/notificar.ts` | **borda** — decide, trava duplicidade, engole erro |
| `src/app/api/admin/email-teste/route.ts` | GET config + POST envio de teste (protegido) |

Estilo dos templates é **CSS inline**, não Tailwind: cliente de e-mail é um
navegador de 2003. Fundo claro de propósito — o site é escuro, e-mail escuro
quebra em metade dos clientes.

## Variáveis

```bash
RESEND_API_KEY=re_...                                  # key SEND-ONLY deste app
EMAIL_REMETENTE="Azuris <no-reply@send.azuris.com.br>" # domínio verificado
EMAIL_RESPONDER_PARA=binhara@azuris.com.br             # replyTo (o from é no-reply)
EMAIL_BASE_URL=https://azuris.com.br
EMAIL_TESTE_DESTINO_PADRAO=binhara@azuris.com.br
```

Já configuradas em produção na Vercel. `send.azuris.com.br` está **verificado**
(SPF/DKIM/DMARC, região sa-east-1) na conta Resend da Azuris — o mesmo domínio
que o ETT Meet usa; não precisou verificar nada de novo.

**Sem `RESEND_API_KEY` o app funciona igual, só não envia** (`{ ok:false }` em vez
de exceção). Preview, CI e dev de terceiros continuam rodando.

A key é **send-only**: ela consegue mandar e-mail e mais nada. Consultar status de
entrega pela API devolve `401 restricted_api_key` — pra isso, o painel do Resend.

## Onde o e-mail nasce

Webhook do Asaas → status vira `paid` → `notificarPagamentoConfirmado(row)`.

Duas garantias que valem lembrar:

1. **Uma vez só.** O Asaas manda `PAYMENT_CONFIRMED` **e** `PAYMENT_RECEIVED` pro
   mesmo pagamento, e reenvia quando a gente demora. A trava é um UPDATE
   condicional (`reservarEnvioConfirmacao`): a reserva é ganha antes do envio, e
   devolvida se o envio falhar. Verificado: 3 eventos → 1 e-mail.
2. **Nunca derruba o webhook.** A borda engole o próprio erro e loga. Se o Resend
   estiver fora, o pagamento continua sendo registrado normalmente.

## Texto por produto

`conteudoCompraConfirmada()` troca o texto por `curso_slug`. Não é firula: onde o
acesso é liberado **na mão** (ETT adesão, One Day + curso, Lakehouse), o e-mail
promete "em até 1 dia útil" em vez de mandar a pessoa procurar um login que ainda
não existe. Produto sem texto próprio cai num genérico curto — melhor dizer pouco
e certo do que prometer fulfillment que não existe.

## Testar

```bash
# config (sem expor a key)
curl -b jar.txt https://azuris.com.br/api/admin/email-teste

# envio de exemplo (assunto ganha prefixo [TESTE]); não toca no banco
curl -b jar.txt -X POST https://azuris.com.br/api/admin/email-teste \
  -H 'Content-Type: application/json' -d '{"produto":"ett-assinatura"}'
```

## Migração

```sql
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS email_confirmacao_em TIMESTAMPTZ;
```

⚠️ **Sem essa coluna em produção, nenhum e-mail sai** — a reserva falha, o erro é
engolido (webhook segue de pé) e o cliente não recebe nada. Roda junto com a do
`assinaturas.produto_slug`, no mesmo `POST /api/admin/migrate`.

## Vigia de vendas (cron diário)

`GET /api/cron/vigia-vendas` — roda 12:00 UTC (9h BRT) pelo Vercel Cron e manda
e-mail **só quando há alerta**. Regras puras em `src/lib/vigilancia.ts`:

| Situação | Severidade |
|---|---|
| Produto sem NENHUM tipo disponível | 🔴 crítico |
| Prazo vencendo em ≤ 3 dias | 🟡 aviso (🔴 se for a última opção viva) |
| Lotação ≥ 80% | 🟡 aviso (🔴 se for a última opção viva) |
| Produto fechado há mais de 7 dias | nada — evento passado não é incidente |

Autenticação: `Bearer CRON_SECRET` **ou** sessão de admin — dá pra abrir logado no
navegador. `?seco=1` diagnostica sem enviar e-mail.

Destino do alerta: `EMAIL_ALERTAS`, com fallback pra `EMAIL_RESPONDER_PARA`.

## O que NÃO foi feito

- **Só o e-mail de pagamento confirmado.** Inscrição gratuita (associado do GU,
  reserva do preparatório) continua sem aviso nenhum.
- **Sem retentativa própria:** se o Resend falhar, a reserva é devolvida e o
  reenvio depende do Asaas mandar o webhook de novo.
- **Sem preview local** (`react-email` CLI não foi instalado — dev dependency
  pesada). Pra ver o resultado, use o `email-teste`.
- **`@react-email/components@1.0.12` está marcado como deprecated no npm** mesmo
  sendo a última versão. Funciona (é render de HTML em build/runtime), mas é
  candidato a troca se o pacote parar de sair.
