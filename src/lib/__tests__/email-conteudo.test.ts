import { describe, it, expect } from 'vitest'
import { conteudoCompraConfirmada, primeiroNome, valorBRL } from '@/lib/email/conteudo'
import { PRODUTO_TAB } from '@/lib/admin-queries'

describe('primeiroNome', () => {
  it('pega só o primeiro nome, sem sobrar espaço', () => {
    expect(primeiroNome('  Alessandro   Binhara  ')).toBe('Alessandro')
    expect(primeiroNome('Ana')).toBe('Ana')
  })
  it('não trata vazio como nome vazio na saudação', () => {
    expect(primeiroNome('')).toBe('Olá')
    expect(primeiroNome('   ')).toBe('Olá')
  })
})

describe('valorBRL', () => {
  it('formata centavos com separador de milhar e vírgula decimal', () => {
    expect(valorBRL(6700)).toBe('R$ 67,00')
    expect(valorBRL(3700)).toBe('R$ 37,00')
    expect(valorBRL(123456)).toBe('R$ 1.234,56')
    expect(valorBRL(5)).toBe('R$ 0,05')
    expect(valorBRL(0)).toBe('R$ 0,00')
  })
})

describe('conteudoCompraConfirmada', () => {
  const base = { nome: 'Alessandro Binhara', valorCentavos: 6700 }

  it('todo produto vendável tem texto próprio — nada cai no genérico por acidente', () => {
    const vendaveis = [
      'ett-adesao',
      'ett-assinatura',
      'dss-2026',
      'dss-one-day-2026',
      'dss-one-day-curso-2026',
      'gubigdata-2026-07',
      'lakehouse-comunidade',
    ]
    for (const slug of vendaveis) {
      const c = conteudoCompraConfirmada({ ...base, produtoSlug: slug })
      expect(c.assunto, slug).not.toBe('Pagamento confirmado — Azuris')
      expect(PRODUTO_TAB[slug], `${slug} sem aba no painel`).toBeTruthy()
    }
  })

  it('produto desconhecido cai num texto genérico curto em vez de quebrar', () => {
    const c = conteudoCompraConfirmada({ ...base, produtoSlug: 'produto-que-nao-existe' })
    expect(c.assunto).toBe('Pagamento confirmado — Azuris')
    expect(c.paragrafos.length).toBe(1)
  })

  it('sempre diz o valor pago e chama a pessoa pelo primeiro nome', () => {
    for (const slug of ['ett-adesao', 'dss-2026', 'proposta']) {
      const c = conteudoCompraConfirmada({ ...base, produtoSlug: slug })
      expect(c.destaque, slug).toContain('R$ 67,00')
      expect(c.titulo, slug).toContain('Alessandro')
      expect(c.titulo, slug).not.toContain('Binhara')
    }
  })

  it('onde o acesso é liberado na mão, o texto NÃO promete acesso imediato', () => {
    // ETT, combo One Day + curso e Lakehouse têm fulfillment manual ([[ett]]).
    for (const slug of ['ett-adesao', 'dss-one-day-curso-2026', 'lakehouse-comunidade']) {
      const texto = conteudoCompraConfirmada({ ...base, produtoSlug: slug }).paragrafos.join(' ')
      expect(texto, slug).toContain('1 dia útil')
    }
  })

  it('assinatura explica a renovação — é a dúvida nº 1 de quem assina', () => {
    const texto = conteudoCompraConfirmada({ ...base, produtoSlug: 'ett-assinatura' }).paragrafos.join(' ')
    expect(texto).toContain('renovação')
    expect(texto).toContain('cancelar')
  })
})
