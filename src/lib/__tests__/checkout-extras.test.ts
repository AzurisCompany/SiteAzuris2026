import { describe, it, expect } from 'vitest'
import {
  validarExtras,
  normalizarExtras,
  enderecoParaAsaas,
  pessoaTipoDoDocumento,
} from '@/lib/checkout-extras'

// Vetores canônicos: CPF 111.444.777-35 e CNPJ 11.222.333/0001-81.
const CPF = '11144477735'
const CNPJ = '11222333000181'

const ENDERECO_OK = {
  cep: '80010-010',
  logradouro: 'Rua XV de Novembro',
  numero: '100',
  complemento: 'Sala 2',
  bairro: 'Centro',
  cidade: 'Curitiba',
  uf: 'PR',
}

describe('pessoaTipoDoDocumento', () => {
  it('deriva PJ de 14 dígitos e PF de 11', () => {
    expect(pessoaTipoDoDocumento(CNPJ)).toBe('PJ')
    expect(pessoaTipoDoDocumento('11.222.333/0001-81')).toBe('PJ')
    expect(pessoaTipoDoDocumento(CPF)).toBe('PF')
    expect(pessoaTipoDoDocumento('111.444.777-35')).toBe('PF')
  })
  it('devolve null quando não dá pra decidir', () => {
    expect(pessoaTipoDoDocumento('')).toBeNull()
    expect(pessoaTipoDoDocumento(null)).toBeNull()
    expect(pessoaTipoDoDocumento('123')).toBeNull()
  })
})

describe('validarExtras', () => {
  it('deixa passar PF sem nada de nota', () => {
    expect(validarExtras({ empresa: 'Azuris' }, { cpfCnpj: CPF, enderecoObrigatorioPJ: true })).toBeNull()
  })

  it('exige razão social de PJ', () => {
    const r = validarExtras({ nf_endereco: ENDERECO_OK }, { cpfCnpj: CNPJ, enderecoObrigatorioPJ: true })
    expect(r).toMatch(/razão social/i)
  })

  it('exige endereço de PJ quando o produto obriga', () => {
    const r = validarExtras({ razao_social: 'Azuris LTDA' }, { cpfCnpj: CNPJ, enderecoObrigatorioPJ: true })
    expect(r).toMatch(/endereço incompleto/i)
  })

  it('aceita PJ completo', () => {
    const r = validarExtras(
      { razao_social: 'Azuris LTDA', nf_endereco: ENDERECO_OK },
      { cpfCnpj: CNPJ, enderecoObrigatorioPJ: true }
    )
    expect(r).toBeNull()
  })

  it('não exige endereço de PJ onde o produto não obriga (GU)', () => {
    const r = validarExtras({ razao_social: 'Azuris LTDA' }, { cpfCnpj: CNPJ, enderecoObrigatorioPJ: false })
    expect(r).toBeNull()
  })

  // O furo antigo: dava pra pedir nota e mandar endereço pela metade.
  it('rejeita endereço começado e não terminado', () => {
    const r = validarExtras(
      { nf_endereco: { cep: '80010-010', logradouro: 'Rua XV' } },
      { cpfCnpj: CPF, enderecoObrigatorioPJ: false }
    )
    expect(r).toMatch(/falta.*número/i)
  })

  it('rejeita CEP e UF inválidos', () => {
    expect(
      validarExtras({ nf_endereco: { ...ENDERECO_OK, cep: '123' } }, { cpfCnpj: CPF })
    ).toMatch(/CEP inválido/i)
    expect(
      validarExtras({ nf_endereco: { ...ENDERECO_OK, uf: 'XX' } }, { cpfCnpj: CPF })
    ).toMatch(/UF inválida/i)
  })

  it('complemento continua dispensável', () => {
    const { complemento: _, ...semComplemento } = ENDERECO_OK
    expect(validarExtras({ nf_endereco: semComplemento }, { cpfCnpj: CPF })).toBeNull()
  })
})

describe('normalizarExtras', () => {
  it('deriva pessoa_tipo do documento, ignorando o que o client afirma', () => {
    // Client mente dizendo PF, mas o documento é CNPJ: vale o documento.
    const r = normalizarExtras({ pessoa_tipo: 'PF', razao_social: 'Azuris LTDA' }, CNPJ)
    expect(r.pessoa_tipo).toBe('PJ')
    expect(r.razao_social).toBe('Azuris LTDA')
  })

  it('grava pessoa_tipo mesmo sem nota (o furo antigo deixava NULL)', () => {
    const r = normalizarExtras({}, CNPJ)
    expect(r.pessoa_tipo).toBe('PJ')
  })

  it('descarta razão social de PF', () => {
    const r = normalizarExtras({ razao_social: 'Azuris LTDA' }, CPF)
    expect(r.pessoa_tipo).toBe('PF')
    expect(r.razao_social).toBeNull()
  })

  it('normaliza UF pra maiúscula e ignora campos vazios', () => {
    const r = normalizarExtras({ nf_endereco: { ...ENDERECO_OK, uf: 'pr', bairro: '  ' } }, CPF)
    expect(r.nf_endereco?.uf).toBe('PR')
    expect(r.nf_endereco?.bairro).toBeUndefined()
  })

  it('sem endereço nenhum, nf_endereco fica null', () => {
    expect(normalizarExtras({ empresa: 'Azuris' }, CPF).nf_endereco).toBeNull()
  })

  it('sem documento, cai no que o client informou', () => {
    expect(normalizarExtras({ pessoa_tipo: 'PJ', razao_social: 'X' }).pessoa_tipo).toBe('PJ')
    expect(normalizarExtras({}).pessoa_tipo).toBeNull()
  })
})

describe('enderecoParaAsaas', () => {
  it('mapeia pros nomes do Asaas e deixa cidade/UF de fora (derivadas do CEP)', () => {
    const r = enderecoParaAsaas(normalizarExtras({ nf_endereco: ENDERECO_OK }, CNPJ).nf_endereco)
    expect(r).toEqual({
      postalCode: '80010010',
      address: 'Rua XV de Novembro',
      addressNumber: '100',
      complement: 'Sala 2',
      province: 'Centro',
    })
  })

  it('usa S/N quando não há número', () => {
    const { numero: _, ...semNumero } = ENDERECO_OK
    expect(enderecoParaAsaas(semNumero)?.addressNumber).toBe('S/N')
  })

  it('devolve null sem endereço aproveitável', () => {
    expect(enderecoParaAsaas(null)).toBeNull()
    expect(enderecoParaAsaas({ cep: '123', logradouro: 'Rua X' })).toBeNull()
    expect(enderecoParaAsaas({ cep: '80010-010' })).toBeNull()
  })
})
