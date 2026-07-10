import { describe, it, expect } from 'vitest'
import { cpfValido, cnpjValido, cpfCnpjValido } from '@/lib/validacao-doc'

// Vetores canônicos de teste (válidos): CPF 111.444.777-35 e CNPJ 11.222.333/0001-81.
describe('cpfValido', () => {
  it('aceita CPF válido (com e sem máscara)', () => {
    expect(cpfValido('11144477735')).toBe(true)
    expect(cpfValido('111.444.777-35')).toBe(true)
  })
  it('rejeita DV errado', () => {
    expect(cpfValido('11144477700')).toBe(false)
  })
  it('rejeita todos os dígitos iguais', () => {
    expect(cpfValido('11111111111')).toBe(false)
    expect(cpfValido('00000000000')).toBe(false)
  })
  it('rejeita comprimento errado', () => {
    expect(cpfValido('1114447773')).toBe(false)
    expect(cpfValido('111444777356')).toBe(false)
  })
})

describe('cnpjValido', () => {
  it('aceita CNPJ válido (com e sem máscara)', () => {
    expect(cnpjValido('11222333000181')).toBe(true)
    expect(cnpjValido('11.222.333/0001-81')).toBe(true)
  })
  it('rejeita DV errado', () => {
    expect(cnpjValido('11222333000100')).toBe(false)
  })
  it('rejeita repetidos e comprimento errado', () => {
    expect(cnpjValido('11111111111111')).toBe(false)
    expect(cnpjValido('112223330001')).toBe(false)
  })
})

describe('cpfCnpjValido', () => {
  it('roteia por comprimento (11=CPF, 14=CNPJ)', () => {
    expect(cpfCnpjValido('11144477735')).toBe(true)
    expect(cpfCnpjValido('11222333000181')).toBe(true)
  })
  it('rejeita comprimentos intermediários (12/13 dígitos)', () => {
    expect(cpfCnpjValido('111444777350')).toBe(false)
    expect(cpfCnpjValido('1122233300018')).toBe(false)
  })
})
