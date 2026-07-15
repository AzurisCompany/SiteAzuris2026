'use client'

// Bloco de dados da nota fiscal: razão social (PJ) + endereço do tomador.
// Vive separado do <CamposExtras> porque o checkout do GU precisa DESTE bloco
// mas não dos outros extras (empresa/cargo/como conheceu) — lá o "como conheceu"
// já carrega a associação do participante. Uma implementação de endereço só.
//
// Quem decide se ele aparece: PJ num produto que exige nota, ou o toggle manual.

import { useState } from 'react'
import { maskCep } from '@/lib/format'
import { UFS } from '@/lib/checkout-extras'
import { CLASSES, type TemaCheckout } from './tema'
import type { PessoaTipo } from './CampoDocumento'

export interface NotaValue {
  querNf: boolean
  razaoSocial: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

export const notaInicial: NotaValue = {
  querNf: false,
  razaoSocial: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
}

/** O endereço aparece quando é PJ num produto que exige, ou quando pediram nota. */
export function mostrarEndereco(v: NotaValue, pessoaTipo: PessoaTipo, enderecoObrigatorioPJ: boolean): boolean {
  return (pessoaTipo === 'PJ' && enderecoObrigatorioPJ) || v.querNf
}

/** Parte do payload referente à nota. O servidor revalida tudo isso. */
export function notaParaPayload(
  v: NotaValue,
  pessoaTipo: PessoaTipo,
  enderecoObrigatorioPJ = false
): Record<string, unknown> {
  const out: Record<string, unknown> = { pessoa_tipo: pessoaTipo }
  if (pessoaTipo === 'PJ') out.razao_social = v.razaoSocial.trim() || undefined
  if (mostrarEndereco(v, pessoaTipo, enderecoObrigatorioPJ)) {
    out.nf_endereco = {
      cep: v.cep,
      logradouro: v.logradouro,
      numero: v.numero,
      complemento: v.complemento,
      bairro: v.bairro,
      cidade: v.cidade,
      uf: v.uf,
    }
  }
  return out
}

export default function DadosNota({
  value,
  onChange,
  pessoaTipo,
  enderecoObrigatorioPJ = false,
  tema = 'dark',
}: {
  value: NotaValue
  onChange: (v: NotaValue) => void
  pessoaTipo: PessoaTipo
  enderecoObrigatorioPJ?: boolean
  tema?: TemaCheckout
}) {
  const c = CLASSES[tema]
  const [buscandoCep, setBuscandoCep] = useState(false)
  const set = (patch: Partial<NotaValue>) => onChange({ ...value, ...patch })

  const pj = pessoaTipo === 'PJ'
  const travado = pj && enderecoObrigatorioPJ
  const visivel = mostrarEndereco(value, pessoaTipo, enderecoObrigatorioPJ)

  // Autofill por CEP: 7 campos à mão é atrito demais. Falha em silêncio — ViaCEP
  // fora do ar não pode derrubar uma venda, só deixa de adiantar o preenchimento.
  //
  // `base` é o estado JÁ com o CEP digitado, passado explicitamente pelo onChange.
  // Sem isso, o `value` capturado no closure é o de ANTES da digitação e o merge
  // do resultado devolvia o CEP pra string vazia — o campo se limpava sozinho
  // enquanto cidade/UF apareciam preenchidas.
  async function buscarCep(cepMascarado: string, base: NotaValue) {
    const cep = cepMascarado.replace(/\D/g, '')
    if (cep.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const d = (await res.json()) as {
        erro?: boolean | string
        logradouro?: string
        bairro?: string
        localidade?: string
        uf?: string
      }
      if (d.erro) return
      onChange({
        ...base,
        logradouro: d.logradouro || base.logradouro,
        bairro: d.bairro || base.bairro,
        cidade: d.localidade || base.cidade,
        uf: d.uf || base.uf,
      })
    } catch {
      // sem rede / ViaCEP fora: preenche à mão
    } finally {
      setBuscandoCep(false)
    }
  }

  return (
    <div className={`${c.caixa} space-y-4`}>
      {/* Razão social acompanha o CNPJ, não a nota: quem compra como empresa
          informa a empresa sempre. Escondê-la atrás do toggle criava um beco sem
          saída — o servidor exige o campo e a interface não o mostrava. */}
      {pj && (
        <div>
          <label className={c.rotulo}>Razão social</label>
          <input
            type="text"
            required
            value={value.razaoSocial}
            onChange={(e) => set({ razaoSocial: e.target.value })}
            placeholder="Razão social da empresa"
            className={c.campo}
          />
        </div>
      )}

      {travado ? (
        <div>
          <p className="text-sm font-medium">Endereço da nota fiscal</p>
          <p className={c.ajuda}>Compra no CNPJ: precisamos do endereço da empresa pra emitir a nota.</p>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.querNf}
            onChange={(e) => set({ querNf: e.target.checked })}
            className={`size-4 ${c.acento}`}
          />
          <span className="font-medium">Preciso de nota fiscal</span>
        </label>
      )}

      {visivel && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={c.rotulo}>CEP</label>
              <input
                required
                inputMode="numeric"
                value={value.cep}
                onChange={(e) => {
                  const cep = maskCep(e.target.value)
                  const proximo = { ...value, cep }
                  onChange(proximo)
                  if (cep.replace(/\D/g, '').length === 8) void buscarCep(cep, proximo)
                }}
                placeholder="00000-000"
                className={c.campo}
              />
              {buscandoCep && <p className={c.ajuda}>buscando endereço…</p>}
            </div>
            <div className="sm:col-span-2">
              <label className={c.rotulo}>Logradouro</label>
              <input
                required
                value={value.logradouro}
                onChange={(e) => set({ logradouro: e.target.value })}
                placeholder="Rua, avenida…"
                className={c.campo}
              />
            </div>
            <div>
              <label className={c.rotulo}>Número</label>
              <input
                required
                value={value.numero}
                onChange={(e) => set({ numero: e.target.value })}
                placeholder="123"
                className={c.campo}
              />
            </div>
            <div>
              <label className={c.rotulo}>
                Complemento <span className="opacity-60">(opcional)</span>
              </label>
              <input
                value={value.complemento}
                onChange={(e) => set({ complemento: e.target.value })}
                placeholder="Sala, andar…"
                className={c.campo}
              />
            </div>
            <div>
              <label className={c.rotulo}>Bairro</label>
              <input
                required
                value={value.bairro}
                onChange={(e) => set({ bairro: e.target.value })}
                placeholder="Bairro"
                className={c.campo}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={c.rotulo}>Cidade</label>
              <input
                required
                value={value.cidade}
                onChange={(e) => set({ cidade: e.target.value })}
                placeholder="Cidade"
                className={c.campo}
              />
            </div>
            <div>
              <label className={c.rotulo}>UF</label>
              <select required value={value.uf} onChange={(e) => set({ uf: e.target.value })} className={c.campo}>
                <option value="">—</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
