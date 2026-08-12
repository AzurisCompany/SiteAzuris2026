// Container do Google Tag Manager da Azuris. Fonte única do ID: o layout monta o
// snippet a partir daqui e o teste-canário (src/lib/__tests__/gtm.test.ts) usa este
// mesmo valor pra varrer as páginas estáticas do public/.
//
// Regra: TODA página do site carrega este container — as rotas do App Router pelo
// root layout (automático) e os HTMLs estáticos do public/ com o snippet colado à mão.
export const GTM_ID = "GTM-T7647L5K";
