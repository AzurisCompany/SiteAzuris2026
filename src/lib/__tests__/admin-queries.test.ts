import { describe, it, expect } from 'vitest'
import { brl, whatsappUrl, labelTipo } from '@/lib/admin-queries'

describe('brl', () => {
  it('formata centavos em BRL', () => {
    expect(brl(55000)).toContain('550')
    expect(brl(0)).toContain('0')
    expect(brl(null)).toContain('0')
    expect(brl(undefined)).toContain('0')
  })
})

describe('whatsappUrl', () => {
  it('prefixa 55 para 10-11 dígitos', () => {
    expect(whatsappUrl('11988887777')).toBe('https://wa.me/5511988887777')
    expect(whatsappUrl('1133334444')).toBe('https://wa.me/551133334444')
  })
  it('null para menos de 10 dígitos ou telefone nulo', () => {
    expect(whatsappUrl('123')).toBeNull()
    expect(whatsappUrl(null)).toBeNull()
  })
  it('mantém DDI quando já vem com 12+ dígitos', () => {
    expect(whatsappUrl('5511988887777')).toBe('https://wa.me/5511988887777')
  })
})

describe('labelTipo', () => {
  it('null vira "— sem tipo"', () => {
    expect(labelTipo(null)).toBe('— sem tipo')
  })
  it('tipo conhecido usa rótulo amigável', () => {
    expect(labelTipo('membro')).toBe('Membro (GU/DSSBR)')
  })
  it('tipo desconhecido capitaliza', () => {
    expect(labelTipo('estudante')).toBe('Estudante')
  })
})
