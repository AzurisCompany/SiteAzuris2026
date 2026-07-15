'use client'

// Seletor Pessoa física / Pessoa jurídica + campo do documento, compartilhado
// pelos 3 checkouts pagos (Lakehouse, DSSBR, GU).
//
// A escolha é EXPLÍCITA na interface em vez de adivinhada pela contagem de
// dígitos: quem compra como empresa precisa ver que existe esse caminho — é o
// que dispara a razão social e o endereço da nota logo abaixo. O servidor não
// confia nesse radio; ele deriva o tipo do próprio documento ([[checkout-extras]]).

import { maskDocumento } from '@/lib/format'
import { CLASSES, type TemaCheckout } from './tema'

export type PessoaTipo = 'PF' | 'PJ'

const OPCOES: { tipo: PessoaTipo; label: string; doc: string; placeholder: string; digitos: number }[] = [
  { tipo: 'PF', label: 'Pessoa física', doc: 'CPF', placeholder: '000.000.000-00', digitos: 11 },
  { tipo: 'PJ', label: 'Pessoa jurídica', doc: 'CNPJ', placeholder: '00.000.000/0000-00', digitos: 14 },
]

export default function CampoDocumento({
  tema = 'dark',
  pessoaTipo,
  onPessoaTipoChange,
  valor,
  onChange,
  ajuda,
}: {
  tema?: TemaCheckout
  pessoaTipo: PessoaTipo
  onPessoaTipoChange: (t: PessoaTipo) => void
  valor: string
  onChange: (v: string) => void
  ajuda?: string
}) {
  const c = CLASSES[tema]
  const opcao = OPCOES.find((o) => o.tipo === pessoaTipo) ?? OPCOES[0]

  return (
    <div className="space-y-3">
      <div>
        <span className={c.rotulo}>Você está comprando como</span>
        <div className="flex gap-4 text-sm">
          {OPCOES.map((o) => (
            <label key={o.tipo} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="pessoaTipo"
                checked={pessoaTipo === o.tipo}
                // Trocar de tipo zera o documento: a máscara e o tamanho mudam, e
                // reaproveitar dígitos do outro formato só gera doc inválido.
                onChange={() => {
                  onPessoaTipoChange(o.tipo)
                  onChange('')
                }}
                className={c.acento}
              />
              {o.label} <span className="opacity-60">({o.doc})</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={c.rotulo}>{opcao.doc}</label>
        <input
          type="text"
          required
          inputMode="numeric"
          value={valor}
          onChange={(e) => onChange(maskDocumento(e.target.value, pessoaTipo))}
          placeholder={opcao.placeholder}
          className={c.campo}
        />
        {ajuda && <p className={c.ajuda}>{ajuda}</p>}
      </div>
    </div>
  )
}
