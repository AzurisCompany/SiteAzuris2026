// Parcelamento no cartão com juros repassados ao cliente.
// O checkout hospedado do Asaas NÃO mostra seletor de parcelas numa cobrança
// avulsa, então o seletor fica na nossa tela e nós pré-fixamos o valor de cada
// parcela (com juros embutido) ao criar a cobrança no Asaas.
//
// 1x = à vista, sem juros. 2x–5x = tabela Price com TAXA_JUROS_AM ao mês.
// Ajuste TAXA_JUROS_AM se a taxa de parcelamento do Asaas mudar.

export const MAX_PARCELAS = 5
export const TAXA_JUROS_AM = 0.0299 // 2,99% a.m.

/** Valor de cada parcela (R$) para um total e nº de parcelas (tabela Price). */
export function valorParcela(totalReais: number, n: number): number {
  if (n <= 1) return Number(totalReais.toFixed(2))
  const i = TAXA_JUROS_AM
  const pmt = (totalReais * i) / (1 - Math.pow(1 + i, -n))
  return Number(pmt.toFixed(2))
}

/** Total efetivamente cobrado (parcela × n). Para n=1, é o próprio total. */
export function totalComJuros(totalReais: number, n: number): number {
  return Number((valorParcela(totalReais, n) * n).toFixed(2))
}
