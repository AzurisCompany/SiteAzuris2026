// GET /api/admin/exportar (protegido) — CSV de contatos da lista de vendas.
//
// Lê exatamente os mesmos query params da tela /admin/vendas, então o arquivo é
// sempre o que está na tela: filtrou por produto, status, período ou busca, o CSV
// sai filtrado igual. Sem `curso` sai a base inteira.
import { estaLogado } from '@/lib/admin-auth'
import { vendasParaExport } from '@/lib/admin-queries'
import { montarCsvContatos, nomeArquivoCsv } from '@/lib/export-contatos'
import { hojeBRT } from '@/lib/format'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!(await estaLogado())) {
    return new Response(JSON.stringify({ error: 'não autorizado' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }

  const sp = new URL(request.url).searchParams
  const curso = sp.get('curso') || ''
  const rows = await vendasParaExport({
    curso,
    status: sp.get('status') || '',
    billing: sp.get('billing') || '',
    tipo: sp.get('tipo') || '',
    pessoa: sp.get('pessoa') || '',
    origem: sp.get('origem') || '',
    de: sp.get('de') || '',
    ate: sp.get('ate') || '',
    busca: sp.get('busca') || '',
    mostrarTeste: sp.get('teste') === '1',
  })

  return new Response(montarCsvContatos(rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${nomeArquivoCsv(curso, hojeBRT())}"`,
      // Lista de contatos: nunca cachear em CDN nem no browser.
      'cache-control': 'no-store',
    },
  })
}
