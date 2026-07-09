// Validação de CPF/CNPJ com dígito verificador (não só contagem de dígitos).
// Usado nos checkouts e na cobrança avulsa pra barrar documento inválido antes
// de criar cliente/cobrança no Asaas (que rejeitaria — ou pior, aceitaria lixo).

function soDigitos(s: string): string {
  return (s ?? '').replace(/\D/g, '')
}

/** Valida CPF (11 dígitos) pelos 2 dígitos verificadores. */
export function cpfValido(entrada: string): boolean {
  const cpf = soDigitos(entrada)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false // todos iguais (000..., 111...)

  const dv = (base: string, pesoInicial: number): number => {
    let soma = 0
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  const d1 = dv(cpf.slice(0, 9), 10)
  if (d1 !== Number(cpf[9])) return false
  const d2 = dv(cpf.slice(0, 10), 11)
  return d2 === Number(cpf[10])
}

/** Valida CNPJ (14 dígitos) pelos 2 dígitos verificadores. */
export function cnpjValido(entrada: string): boolean {
  const cnpj = soDigitos(entrada)
  if (cnpj.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cnpj)) return false

  const dv = (base: string): number => {
    // Pesos vão de 2 a 9, ciclando da direita pra esquerda.
    let soma = 0
    let peso = 2
    for (let i = base.length - 1; i >= 0; i--) {
      soma += Number(base[i]) * peso
      peso = peso === 9 ? 2 : peso + 1
    }
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  const d1 = dv(cnpj.slice(0, 12))
  if (d1 !== Number(cnpj[12])) return false
  const d2 = dv(cnpj.slice(0, 13))
  return d2 === Number(cnpj[13])
}

/** Aceita CPF (11) OU CNPJ (14) válido. */
export function cpfCnpjValido(entrada: string): boolean {
  const doc = soDigitos(entrada)
  if (doc.length === 11) return cpfValido(doc)
  if (doc.length === 14) return cnpjValido(doc)
  return false
}
