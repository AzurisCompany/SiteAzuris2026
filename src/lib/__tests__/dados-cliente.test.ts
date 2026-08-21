import { describe, it, expect } from 'vitest'

import { dadosClienteTexto, enderecoTexto, documentoTexto, type DadosCliente } from '@/lib/dados-cliente'
import { PREFIXO_MANUAL } from '@/lib/cobranca-manual'

const VAZIO: DadosCliente = {
  nome: '',
  email: '',
  cpf_cnpj: '',
  telefone: null,
  pessoa_tipo: null,
  razao_social: null,
  empresa: null,
  cargo: null,
  nf_endereco: null,
  como_conheceu: null,
}

const base = (over: Partial<DadosCliente> = {}): DadosCliente => ({ ...VAZIO, ...over })

describe('documentoTexto', () => {
  it('mascara CPF de 11 dígitos com o rótulo certo', () => {
    expect(documentoTexto('12345678909')).toEqual({ rotulo: 'CPF', valor: '123.456.789-09' })
  })

  it('mascara CNPJ de 14 dígitos com o rótulo certo', () => {
    expect(documentoTexto('12345678000195')).toEqual({ rotulo: 'CNPJ', valor: '12.345.678/0001-95' })
  })

  it('aceita documento já mascarado no banco', () => {
    expect(documentoTexto('123.456.789-09')).toEqual({ rotulo: 'CPF', valor: '123.456.789-09' })
  })

  it('devolve null quando não há documento (venda gratuita do GU)', () => {
    expect(documentoTexto('')).toBeNull()
    expect(documentoTexto(null)).toBeNull()
  })

  it('mostra cru em vez de mascarar errado quando o tamanho é estranho', () => {
    expect(documentoTexto('123456')).toEqual({ rotulo: 'Documento', valor: '123456' })
  })
})

describe('enderecoTexto', () => {
  it('monta o endereço completo no formato de nota', () => {
    expect(
      enderecoTexto({
        cep: '80730000',
        logradouro: 'Rua Padre Anchieta',
        numero: '2050',
        complemento: 'sala 12',
        bairro: 'Bigorrilho',
        cidade: 'Curitiba',
        uf: 'PR',
      })
    ).toBe('Rua Padre Anchieta, 2050, sala 12 — Bigorrilho, Curitiba/PR — CEP 80730-000')
  })

  it('pula o complemento vazio sem deixar vírgula solta', () => {
    expect(
      enderecoTexto({
        cep: '80730000',
        logradouro: 'Rua X',
        numero: '10',
        complemento: '',
        bairro: 'Centro',
        cidade: 'Curitiba',
        uf: 'PR',
      })
    ).toBe('Rua X, 10 — Centro, Curitiba/PR — CEP 80730-000')
  })

  it('não inventa separador quando só tem parte do endereço', () => {
    expect(enderecoTexto({ cidade: 'Curitiba', uf: 'PR' })).toBe('Curitiba/PR')
  })

  it('devolve null pra endereço ausente ou objeto vazio', () => {
    expect(enderecoTexto(null)).toBeNull()
    expect(enderecoTexto({})).toBeNull()
  })
})

describe('dadosClienteTexto', () => {
  it('monta o bloco completo de uma venda PJ', () => {
    const texto = dadosClienteTexto(
      base({
        nome: 'João da Silva',
        email: 'joao@acme.com.br',
        cpf_cnpj: '12345678000195',
        telefone: '41999998888',
        pessoa_tipo: 'PJ',
        razao_social: 'Acme Serviços Ltda',
        empresa: 'Acme',
        cargo: 'Head de Dados',
        nf_endereco: {
          cep: '80730000',
          logradouro: 'Rua Padre Anchieta',
          numero: '2050',
          bairro: 'Bigorrilho',
          cidade: 'Curitiba',
          uf: 'PR',
        },
        como_conheceu: 'LinkedIn',
      })
    )
    expect(texto).toBe(
      [
        'João da Silva',
        'E-mail: joao@acme.com.br',
        'Telefone: (41) 99999-8888',
        'CNPJ: 12.345.678/0001-95',
        'Tipo: Pessoa jurídica',
        'Razão social: Acme Serviços Ltda',
        'Empresa: Acme',
        'Cargo: Head de Dados',
        'Endereço: Rua Padre Anchieta, 2050 — Bigorrilho, Curitiba/PR — CEP 80730-000',
        'Como conheceu: LinkedIn',
      ].join('\n')
    )
  })

  it('não emite linha de campo vazio — nada de "Cargo: —"', () => {
    const texto = dadosClienteTexto(base({ nome: 'Maria', email: 'maria@x.com', cpf_cnpj: '12345678909' }))
    expect(texto).toBe('Maria\nE-mail: maria@x.com\nCPF: 123.456.789-09')
    expect(texto).not.toContain('Cargo')
    expect(texto).not.toContain('—')
  })

  it('ignora o como_conheceu quando ele guarda a descrição da cobrança avulsa', () => {
    const texto = dadosClienteTexto(
      base({ nome: 'Tiago', email: 't@x.com', como_conheceu: `${PREFIXO_MANUAL}Consultoria de arquitetura` })
    )
    expect(texto).not.toContain('Consultoria de arquitetura')
    expect(texto).not.toContain('Como conheceu')
  })

  it('usa os dígitos, não o pessoa_tipo, pra decidir CPF x CNPJ', () => {
    // Venda antiga: pessoa_tipo ficou NULL, mas o CNPJ está lá.
    const texto = dadosClienteTexto(base({ nome: 'Empresa X', cpf_cnpj: '12345678000195', pessoa_tipo: null }))
    expect(texto).toContain('CNPJ: 12.345.678/0001-95')
    expect(texto).not.toContain('Tipo:')
  })

  it('devolve string vazia quando não há nada preenchido (desabilita o botão)', () => {
    expect(dadosClienteTexto(VAZIO)).toBe('')
  })

  it('não deixa espaço em branco virar linha', () => {
    expect(dadosClienteTexto(base({ nome: 'Ana', empresa: '   ', cargo: '\t' }))).toBe('Ana')
  })
})
