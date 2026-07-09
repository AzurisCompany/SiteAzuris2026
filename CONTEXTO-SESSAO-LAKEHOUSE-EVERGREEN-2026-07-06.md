# Sessão 2026-07-06 — Curso Lakehouse: reposicionamento EVERGREEN (em andamento / autoguiado)

Tudo em **PROD** (azuris.com.br, Vercel). 1 deploy nesta sessão (`readyState: READY`, aliased em azuris.com.br).
Deploy: `dpl_2XgEdJ9d32wNGp7DvCA9tQTUYzMs`. **NÃO commitado no git** — subiu do working tree; `main` no GitHub ainda não tem esses diffs.

## Motivação
O curso Lakehouse era vendido como **turma fechada com data fixa** (Início 22/06/2026, "5 semanas", "terças 19h-21h", "Turma 2 set/2026"). Como a data já passou e o modelo real é **sala invertida / evergreen**, o Binhara pediu pra deixar claro nas páginas do curso que:
1. o curso está **em andamento**;
2. **todas as aulas são gravadas**;
3. há **encontros temáticos ao vivo**;
4. há **mentorias 1:1 agendáveis** pra tirar dúvidas;
5. a pessoa **entra a qualquer momento** (metodologia ativa / sala invertida);
6. ela **começa recebendo os materiais na sequência de estudo** e acompanha **módulo a módulo, no seu ritmo**.

## Decisões (via AskUserQuestion)
- **Ritmo:** autoguiado por **módulos** (Semana 1–5 → Módulo 1–5; remove "4h ao vivo"; "~5 semanas" só como ritmo sugerido; mantém 20h).
- **Encontros:** **sem cadência fixa** ("agenda divulgada na comunidade"; não prometer dia/horário).
- **1:1:** "mentorias 1:1 agendáveis pra tirar dúvidas", **sem quantidade declarada**.

## Arquivos alterados (4 superfícies)
1. `public/lakehouse-comunidade/index.html` (landing canônica)
   - meta/og/twitter description reescritas (em andamento, gravadas, ao vivo, 1:1, entre quando quiser).
   - Hero: eyebrow "Turma em andamento · Entre quando quiser"; h1 "…módulo a módulo"; parágrafo com sala invertida.
   - Diagnóstico punchline, cenário stat ("5 Módulos"), roadmap h2 e metas ("Módulo 1–5", sem "4h ao vivo"), marcador final ("Dashboard publicado").
   - Diferencial 01: "Metodologia ativa — sala invertida" (gravadas + encontros + 1:1).
   - "Para quem NÃO é": trocada a linha "quer curso 100% gravado" (que passou a conflitar) por "quer só assistir passivamente".
   - Pré-requisitos: "~5h/semana (no ritmo que você definir)".
   - Bônus: +2 cards ("Encontros ao vivo", "Mentorias 1:1").
   - Seção "Próxima turma/Calendário" → repurposada em **"Formato & acesso"** (em andamento, entre quando quiser, gravadas, encontros, 1:1, sala invertida, bônus DSSBR).
   - FAQ visível: removida "E se eu perder aula ao vivo?"; +"O curso já começou — ainda dá pra entrar?" e "As aulas são ao vivo ou gravadas?"; "Como funciona a entrega?" atualizada.
   - CTA final meta: "Curso em andamento · entre quando quiser · Bônus DSSBR".
   - **JSON-LD Course:** description reescrita; **CourseInstance sem `startDate`/`endDate`** (eram 2026-06-22→07-27, coorte no passado); `courseMode` = "online".
   - **JSON-LD FAQPage:** espelhado com a FAQ visível (as 2 perguntas novas + entrega).
2. `public/lakehouse-comunidade/ementa.html`
   - meta description; hero (eyebrow "5 módulos · autoguiado", stats "Gravadas + ao vivo" / "1:1 mentorias").
   - Identificação: modalidade "em andamento (autoguiado + encontros ao vivo)", duração "Autoguiado · ~5 semanas no seu ritmo", formato das aulas (gravada + encontros + 1:1).
   - Módulos: "Semana N · 4 horas" → "Módulo N"; "Ao vivo · Demonstração…" → "Demonstração gravada…"; módulo 5 Parte 1/2 → gravada, Parte 3 → "Encontro ao vivo · Apresentação final (agendada)".
   - "Ao final desta semana"→"…deste módulo"; "Entregável da semana"→"…do módulo"; "nas próximas 5 semanas"→"nos próximos módulos"; "Última semana"/"semana final" → módulo.
   - Metodologia: cards reescritos (Onboarding entre quando quiser / Pré-aula / Demonstração gravada / Encontros temáticos ao vivo / Mentorias 1:1 / Desafio). "Suporte fora da live" → "Suporte contínuo" (Discord + 1:1 + encontros).
   - Avaliação "na semana 5" → "no Módulo 5".
   - Cronograma: h2 "…em 5 módulos" + nota de ritmo autoguiado; coluna "Ao vivo"→"Gravadas", "Semana"→"Ordem"; "Total ao vivo"→"Total de aulas gravadas".
   - CTA final: removida "Turma 1 começa 22 de junho".
3. `src/app/produtos/curso-pipelines/page.tsx` (teaser) — metadata (title/description/OG), eyebrow ("Comunidade DSSBR · Em andamento · Entre quando quiser") e parágrafo do hero reescritos (autoguiado, gravadas, encontros, 1:1, módulo a módulo).
4. `src/app/lakehouse-comunidade/inscricao/page.tsx` — bloco "O que está incluso" ampliado: 20h/5 módulos + acesso vitalício, entre quando quiser, encontros + 1:1, Discord/cheat/certificado, ingresso DSSBR.

## Validado
- ✅ `tsc --noEmit` limpo + `next build` OK (`/produtos/curso-pipelines` compila).
- ✅ Live em prod (URL correta é **`/lakehouse-comunidade`** SEM barra; com barra dá 308 → sem barra, 84KB, 200):
  - index: `Curso em andamento`, `Módulo 1–5`, `Encontros temáticos ao vivo`, `Mentorias 1:1`, `Entre quando quiser` presentes; **0** de `Semana N · 4h ao vivo`, `22 de junho`, `22/06/2026`.
  - ementa: `Autoguiado`, `Demonstração gravada` (8x), `Total de aulas gravadas` presentes; **0** de `22 de junho`, `Total ao vivo`.
  - teaser: `Em andamento`, `Entre quando quiser`, `mentorias` presentes; **0** de `22/jun`, `5 semanas`.

## NÃO mexido (fora de escopo hoje) — pendências
- **Preços intactos:** R$ 550 (membro) / R$ 750 (não-membro), lógica server-side em `determinarLotePorPerfil`.
- **"Restam 7 vagas"** segue hardcoded no index.html (não vem do banco).
- **Card "Mercado · Turma 2 · set/2026 · R$ 1.197"** mantido como âncora de preço futuro — contrasta levemente com "entre quando quiser"; revisitar se incomodar.
- **PIX real R$ 750 (não-membro) ponta-a-ponta** ainda não testado (herdado).
- Herdadas: GA4 Data API, PostHog key, GitHub auto-deploy, Bing Webmaster.

## Deploy
`cd web && npx vercel --prod --yes`. Projeto `site-azuris-2026`, alias `azuris.com.br`. Não é automático por push.

## Memória atualizada
`project_curso_lakehouse_pages.md` (+ linha no `MEMORY.md`) — regra nova: modelo **EVERGREEN**; NÃO reintroduzir turma com data fixa (22/06), "5 semanas ao vivo", "Total ao vivo 15h", "demonstração ao vivo síncrona", nem "coda junto/lockstep".
