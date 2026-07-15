'use client'

// Campos extras do checkout, compartilhados por Lakehouse e DSSBR: empresa,
// cargo, como conheceu, dados de NF (via <DadosNota>) e consentimento LGPD.
// Componente controlado: o pai guarda o estado e monta o payload com extrasParaPayload().
//
// O tipo de pessoa NÃO mora aqui — vem do <CampoDocumento>, junto do CPF/CNPJ,
// porque é o documento que define o tipo. Aqui ele só decide o que aparece.

import DadosNota, { notaInicial, notaParaPayload, type NotaValue } from './DadosNota'
import { CLASSES, type TemaCheckout } from './tema'
import type { PessoaTipo } from './CampoDocumento'

export interface ExtrasValue extends NotaValue {
  empresa: string
  cargo: string
  comoConheceu: string
  consentimento: boolean
}

export const extrasInicial: ExtrasValue = {
  ...notaInicial,
  empresa: '',
  cargo: '',
  comoConheceu: '',
  consentimento: false,
}

/** Converte o estado do form no subconjunto que vai no corpo do POST. */
export function extrasParaPayload(
  e: ExtrasValue,
  pessoaTipo: PessoaTipo,
  enderecoObrigatorioPJ = false
): Record<string, unknown> {
  return {
    empresa: e.empresa.trim() || undefined,
    cargo: e.cargo.trim() || undefined,
    como_conheceu: e.comoConheceu.trim() || undefined,
    consentimento: e.consentimento,
    ...notaParaPayload(e, pessoaTipo, enderecoObrigatorioPJ),
  }
}

const COMO_CONHECEU = [
  'Indicação',
  'LinkedIn',
  'Instagram',
  'Google / busca',
  'Newsletter / e-mail',
  'Evento / palestra',
  'Já sou cliente Azuris',
  'Outro',
]

export default function CamposExtras({
  value,
  onChange,
  pessoaTipo,
  enderecoObrigatorioPJ = false,
  tema = 'dark',
}: {
  value: ExtrasValue
  onChange: (v: ExtrasValue) => void
  pessoaTipo: PessoaTipo
  enderecoObrigatorioPJ?: boolean
  tema?: TemaCheckout
}) {
  const c = CLASSES[tema]
  const set = (patch: Partial<ExtrasValue>) => onChange({ ...value, ...patch })

  return (
    <div className="space-y-4 pt-2">
      <h2 className="text-lg font-bold">Dados complementares</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={c.rotulo}>
            Empresa <span className="opacity-60">(opcional)</span>
          </label>
          <input
            type="text"
            value={value.empresa}
            onChange={(e) => set({ empresa: e.target.value })}
            placeholder="Onde você trabalha"
            className={c.campo}
          />
        </div>
        <div>
          <label className={c.rotulo}>
            Cargo <span className="opacity-60">(opcional)</span>
          </label>
          <input
            type="text"
            value={value.cargo}
            onChange={(e) => set({ cargo: e.target.value })}
            placeholder="Seu cargo"
            className={c.campo}
          />
        </div>
      </div>

      <div>
        <label className={c.rotulo}>
          Como conheceu? <span className="opacity-60">(opcional)</span>
        </label>
        <select value={value.comoConheceu} onChange={(e) => set({ comoConheceu: e.target.value })} className={c.campo}>
          <option value="">Selecione…</option>
          {COMO_CONHECEU.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>

      <DadosNota
        value={value}
        onChange={(nota) => onChange({ ...value, ...nota })}
        pessoaTipo={pessoaTipo}
        enderecoObrigatorioPJ={enderecoObrigatorioPJ}
        tema={tema}
      />

      {/* Consentimento LGPD (obrigatório) */}
      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          required
          checked={value.consentimento}
          onChange={(e) => set({ consentimento: e.target.checked })}
          className={`mt-0.5 size-4 ${c.acento}`}
        />
        <span className={tema === 'dark' ? 'text-[var(--text-secondary)]' : 'text-slate-600'}>
          Autorizo a Azuris a usar meus dados para emissão da cobrança e contato sobre esta inscrição, conforme a LGPD.
        </span>
      </label>
    </div>
  )
}
