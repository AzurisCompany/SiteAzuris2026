import { describe, it, expect, beforeAll } from 'vitest'
import {
  assinarCupom,
  lerCupom,
  criarCupom,
  aplicarDesconto,
  formatarValidade,
  normalizarCodigo,
  CUPOM_PCT_MAX,
  CUPOM_PCT_PADRAO,
  VALIDADE_HORAS_PADRAO,
} from '@/lib/cupom'

// O segredo é lido a cada chamada, então basta existir antes dos testes.
beforeAll(() => {
  process.env.CUPOM_SECRET = 'segredo-de-teste-nao-usar-em-prod'
})

const AGORA = Date.parse('2026-08-13T14:00:00-03:00')
const DAQUI_2_DIAS = AGORA + 48 * 60 * 60 * 1000

describe('cupom — assinatura e validade', () => {
  it('vai e volta: o que foi assinado é o que se lê', () => {
    const token = assinarCupom({ codigo: 'ana-paula', produto: 'dss-2026', pct: 10, exp: DAQUI_2_DIAS })

    expect(lerCupom(token, 'dss-2026', AGORA)).toEqual({
      codigo: 'ana-paula',
      produto: 'dss-2026',
      pct: 10,
      exp: DAQUI_2_DIAS,
    })
  })

  it('token vencido não vale — nem por 1 milissegundo', () => {
    const token = assinarCupom({ codigo: 'ana', produto: 'dss-2026', pct: 10, exp: AGORA })

    expect(lerCupom(token, 'dss-2026', AGORA)).toBeNull()
    expect(lerCupom(token, 'dss-2026', AGORA - 1)).not.toBeNull() // 1ms antes ainda valia
  })

  it('assinatura mexida é rejeitada', () => {
    const token = assinarCupom({ codigo: 'ana', produto: 'dss-2026', pct: 10, exp: DAQUI_2_DIAS })
    const [payload, sig] = token.split('.')

    expect(lerCupom(`${payload}.${sig.replace(/.$/, sig.endsWith('a') ? 'b' : 'a')}`, 'dss-2026', AGORA)).toBeNull()
    expect(lerCupom(payload, 'dss-2026', AGORA)).toBeNull() // sem assinatura nenhuma
  })

  it('payload reescrito (mais desconto, mais prazo) não passa sem a assinatura certa', () => {
    const forjado = Buffer.from(['ana', 'dss-2026', '90', String(AGORA + 10 ** 10)].join('|')).toString('base64url')
    const token = assinarCupom({ codigo: 'ana', produto: 'dss-2026', pct: 10, exp: DAQUI_2_DIAS })
    const sigDoOriginal = token.split('.')[1]

    expect(lerCupom(`${forjado}.${sigDoOriginal}`, 'dss-2026', AGORA)).toBeNull()
  })

  it('cupom de um produto não vale em outro', () => {
    const token = assinarCupom({ codigo: 'ana', produto: 'dss-2026', pct: 10, exp: DAQUI_2_DIAS })

    expect(lerCupom(token, 'dss-one-day-2026', AGORA)).toBeNull()
  })

  it('sem token, lixo ou vazio → null (nunca explode)', () => {
    expect(lerCupom(null, 'dss-2026', AGORA)).toBeNull()
    expect(lerCupom('', 'dss-2026', AGORA)).toBeNull()
    expect(lerCupom('qualquer.coisa', 'dss-2026', AGORA)).toBeNull()
    expect(lerCupom('.'.repeat(50), 'dss-2026', AGORA)).toBeNull()
  })

  it('recusa assinar acima do teto — o teto não é negociável nem por quem chama', () => {
    expect(() => assinarCupom({ codigo: 'ana', produto: 'dss-2026', pct: 90, exp: DAQUI_2_DIAS })).toThrow()
    expect(() =>
      assinarCupom({ codigo: 'ana', produto: 'dss-2026', pct: CUPOM_PCT_MAX + 1, exp: DAQUI_2_DIAS })
    ).toThrow()
    expect(() => assinarCupom({ codigo: 'Ana Paula', produto: 'dss-2026', pct: 10, exp: DAQUI_2_DIAS })).toThrow()
  })

  it('sem segredo no ambiente, ninguém assina e nada é aceito', () => {
    const antes = process.env.CUPOM_SECRET
    const token = assinarCupom({ codigo: 'ana', produto: 'dss-2026', pct: 10, exp: DAQUI_2_DIAS })
    process.env.CUPOM_SECRET = ''
    const admin = process.env.ADMIN_SESSION_SECRET
    const senha = process.env.ADMIN_PASSWORD
    process.env.ADMIN_SESSION_SECRET = ''
    process.env.ADMIN_PASSWORD = ''
    try {
      expect(lerCupom(token, 'dss-2026', AGORA)).toBeNull()
      expect(() => assinarCupom({ codigo: 'ana', produto: 'dss-2026', pct: 10, exp: DAQUI_2_DIAS })).toThrow()
    } finally {
      process.env.CUPOM_SECRET = antes
      if (admin === undefined) delete process.env.ADMIN_SESSION_SECRET
      else process.env.ADMIN_SESSION_SECRET = admin
      if (senha === undefined) delete process.env.ADMIN_PASSWORD
      else process.env.ADMIN_PASSWORD = senha
    }
  })

  it('criarCupom usa o padrão da casa: 10% por 48h', () => {
    const { token, cupom } = criarCupom({ codigo: 'carla', produto: 'dss-2026' }, AGORA)

    expect(cupom.pct).toBe(CUPOM_PCT_PADRAO)
    expect(cupom.exp).toBe(AGORA + VALIDADE_HORAS_PADRAO * 60 * 60 * 1000)
    expect(lerCupom(token, 'dss-2026', AGORA)).toEqual(cupom)
    // e no minuto seguinte ao prazo, morreu.
    expect(lerCupom(token, 'dss-2026', cupom.exp + 1)).toBeNull()
  })
})

describe('cupom — a conta do desconto', () => {
  it('10% no FullPass de R$570 dá R$513', () => {
    expect(aplicarDesconto(57000, 10)).toBe(51300)
  })

  it('arredonda pro centavo, sem sobra de float', () => {
    expect(aplicarDesconto(24700, 10)).toBe(22230) // One Day R$247 → R$222,30
    expect(aplicarDesconto(33333, 10)).toBe(30000) // 299,997 → 300,00
    expect(Number.isInteger(aplicarDesconto(57000, 10))).toBe(true)
  })

  it('nunca desconta mais que o teto, mesmo se pedirem', () => {
    expect(aplicarDesconto(57000, 90)).toBe(aplicarDesconto(57000, CUPOM_PCT_MAX))
  })

  it('percentual inválido não mexe no preço', () => {
    expect(aplicarDesconto(57000, 0)).toBe(57000)
    expect(aplicarDesconto(57000, -10)).toBe(57000)
    expect(aplicarDesconto(57000, 10.5)).toBe(57000)
  })
})

describe('cupom — validade escrita pra humano', () => {
  it('mostra dia e hora de Curitiba, não de UTC', () => {
    // 23h de 13/08 em BRT = 02h de 14/08 em UTC. Se sair "14/08", errou o fuso.
    expect(formatarValidade(Date.parse('2026-08-13T23:30:00-03:00'))).toBe('13/08 às 23h30')
  })
})

describe('cupom — código digitado por gente', () => {
  it('normaliza caixa, acento e espaço pro mesmo código', () => {
    expect(normalizarCodigo('CEL01')).toBe('cel01')
    expect(normalizarCodigo(' cel 01 ')).toBe('cel-01')
    expect(normalizarCodigo('Márcia-2026')).toBe('marcia-2026')
    expect(normalizarCodigo('GHCM-FQYN')).toBe('ghcm-fqyn')
  })

  it('lixo vira string vazia em vez de explodir', () => {
    expect(normalizarCodigo(null)).toBe('')
    expect(normalizarCodigo('!!!')).toBe('')
  })
})
