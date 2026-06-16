'use client'

// Campos extras do checkout, compartilhados pelos 2 produtos (curso + DSS):
// empresa, cargo, como conheceu, dados de NF (opcional) e consentimento LGPD.
// Componente controlado: o pai guarda o estado e monta o payload com extrasParaPayload().

export interface ExtrasValue {
  empresa: string
  cargo: string
  comoConheceu: string
  querNf: boolean
  pessoaTipo: 'PF' | 'PJ'
  razaoSocial: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  consentimento: boolean
}

export const extrasInicial: ExtrasValue = {
  empresa: '',
  cargo: '',
  comoConheceu: '',
  querNf: false,
  pessoaTipo: 'PF',
  razaoSocial: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  consentimento: false,
}

/** Converte o estado do form no subconjunto que vai no corpo do POST. */
export function extrasParaPayload(e: ExtrasValue) {
  const base: Record<string, unknown> = {
    empresa: e.empresa.trim() || undefined,
    cargo: e.cargo.trim() || undefined,
    como_conheceu: e.comoConheceu.trim() || undefined,
    consentimento: e.consentimento,
  }
  if (e.querNf) {
    base.pessoa_tipo = e.pessoaTipo
    if (e.pessoaTipo === 'PJ') base.razao_social = e.razaoSocial.trim() || undefined
    base.nf_endereco = {
      cep: e.cep,
      logradouro: e.logradouro,
      numero: e.numero,
      complemento: e.complemento,
      bairro: e.bairro,
      cidade: e.cidade,
      uf: e.uf,
    }
  }
  return base
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

const campo =
  'w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2.5 text-sm placeholder:text-[var(--text-muted)] focus:border-[var(--azuris-cyan)] focus:outline-none'
const rotulo = 'block text-sm font-medium text-[var(--text-secondary)] mb-1'

export default function CamposExtras({
  value,
  onChange,
}: {
  value: ExtrasValue
  onChange: (v: ExtrasValue) => void
}) {
  const set = (patch: Partial<ExtrasValue>) => onChange({ ...value, ...patch })

  return (
    <div className="space-y-4 pt-2">
      <h2 className="text-lg font-bold">Dados complementares</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={rotulo}>Empresa <span className="text-[var(--text-muted)]">(opcional)</span></label>
          <input type="text" value={value.empresa} onChange={(e) => set({ empresa: e.target.value })} placeholder="Onde você trabalha" className={campo} />
        </div>
        <div>
          <label className={rotulo}>Cargo <span className="text-[var(--text-muted)]">(opcional)</span></label>
          <input type="text" value={value.cargo} onChange={(e) => set({ cargo: e.target.value })} placeholder="Seu cargo" className={campo} />
        </div>
      </div>

      <div>
        <label className={rotulo}>Como conheceu? <span className="text-[var(--text-muted)]">(opcional)</span></label>
        <select value={value.comoConheceu} onChange={(e) => set({ comoConheceu: e.target.value })} className={campo}>
          <option value="">Selecione…</option>
          {COMO_CONHECEU.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Nota fiscal (opcional, atrás de toggle) */}
      <div className="rounded-lg border border-[var(--azuris-surface)] p-3">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" checked={value.querNf} onChange={(e) => set({ querNf: e.target.checked })} className="size-4 accent-[var(--azuris-cyan)]" />
          <span className="font-medium">Preciso de nota fiscal</span>
        </label>

        {value.querNf && (
          <div className="mt-4 space-y-4">
            <div className="flex gap-4 text-sm">
              {(['PF', 'PJ'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pessoaTipo" checked={value.pessoaTipo === t} onChange={() => set({ pessoaTipo: t })} className="accent-[var(--azuris-cyan)]" />
                  {t === 'PF' ? 'Pessoa física' : 'Pessoa jurídica'}
                </label>
              ))}
            </div>

            {value.pessoaTipo === 'PJ' && (
              <div>
                <label className={rotulo}>Razão social</label>
                <input type="text" value={value.razaoSocial} onChange={(e) => set({ razaoSocial: e.target.value })} placeholder="Razão social da empresa" className={campo} />
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-3">
              <input value={value.cep} onChange={(e) => set({ cep: e.target.value })} placeholder="CEP" className={campo} />
              <input value={value.logradouro} onChange={(e) => set({ logradouro: e.target.value })} placeholder="Logradouro" className={`${campo} sm:col-span-2`} />
              <input value={value.numero} onChange={(e) => set({ numero: e.target.value })} placeholder="Número" className={campo} />
              <input value={value.complemento} onChange={(e) => set({ complemento: e.target.value })} placeholder="Complemento" className={campo} />
              <input value={value.bairro} onChange={(e) => set({ bairro: e.target.value })} placeholder="Bairro" className={campo} />
              <input value={value.cidade} onChange={(e) => set({ cidade: e.target.value })} placeholder="Cidade" className={`${campo} sm:col-span-2`} />
              <input value={value.uf} onChange={(e) => set({ uf: e.target.value.toUpperCase().slice(0, 2) })} placeholder="UF" className={campo} />
            </div>
          </div>
        )}
      </div>

      {/* Consentimento LGPD (obrigatório) */}
      <label className="flex items-start gap-2 cursor-pointer text-sm">
        <input
          type="checkbox"
          required
          checked={value.consentimento}
          onChange={(e) => set({ consentimento: e.target.checked })}
          className="mt-0.5 size-4 accent-[var(--azuris-cyan)]"
        />
        <span className="text-[var(--text-secondary)]">
          Autorizo a Azuris a usar meus dados para emissão da cobrança e contato sobre esta inscrição, conforme a LGPD.
        </span>
      </label>
    </div>
  )
}
