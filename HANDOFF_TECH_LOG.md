# HANDOFF — Plataforma Vetor (robôs de trading)

> Sessão: implementação do PRD v2.0 + migração para o Blue Hour Design System.
> Data do snapshot: 2026-06-11.

## Objetivo atual

Protótipo navegável completo da plataforma web de robôs de trading, cobrindo o
PRD v2.0 (`uploads/PRD_Plataforma_Robos_Trading_v2.0.md`), com todos os chips,
filtros e fluxos funcionais, tematizado pelo **Blue Hour DS** (7 paletas × 2 modos).

## Arquivos (estado atual)

| Arquivo | Papel |
|---|---|
| `Plataforma Vetor.dc.html` | v1 — protótipo original (rollback antigo) |
| `Plataforma Vetor v2.dc.html` | v2 — PRD 2.0 completo, estilo antigo (**ponto de rollback**) |
| `Plataforma Vetor v3.dc.html` | **v3 — ATUAL**: v2 + Blue Hour DS multi-tema + fluxos extras |
| `PaletteSelector.jsx` (raiz) | Seletor de paleta (shim: `React` global + `module.exports`) |
| `blue-hour-design-system/` | DS: `design-system.md`, `README.md`, `styleguide.html`, `tailwind.config.js`, `palettes.js`, `build-tokens.py`, `PaletteSelector-7e95c912.jsx` |
| `blue-hour-design-system/tokens/` | `tokens.css` + `tokens.json` — **gerados** portando `build-tokens.py` p/ JS (run_script) |
| `blue-hour-design-system/icons/bot.svg` | Ícone |
| `uploads/` | PRD v2, requisitos v1 (PDF/txt), fontes do DS |

## Telas implementadas (v3)

Dashboard · Robôs (lista+filtros+CRIAR ROBÔ) · Sumário do robô (períodos, ordens
com filtros, modal Eventos da ordem) · Editor 10 seções (14 indicadores, suavização
só p/ Heikin-Ashi) · Aba Gráfico (timeframes) · Wizard 4 etapas (Estratégia→Modo→
Ativo→Configurar, busca) · Backtests (unitário+massa com chips cartesianos ≤1000,
filtros, datas com atalhos) · Ranking (filtros+períodos) · Portfólio · Loja
(carrossel, ranking, detalhe com 6 abas, seleção de nível, modal+fluxo de
assinatura→cria robô parado, Q&A com envio) · SmarttPlay (filtros) · Admin Vídeos
(CRUD categorias/vídeos, busca, publicar, modal exclusão, duração automática) ·
Minha Conta (5 abas) · Manager (5 abas, mês/ano funcionais) · Gráfico standalone ·
Configurações→Aparência (PaletteSelector ao vivo).

## Decisões-chave

1. **Versionamento por cópia**: v2 e v3 são arquivos separados; nunca editar v2.
2. **Tokens**: `tokens.css`/`tokens.json` são GERADOS (não editar à mão). O port
   do `build-tokens.py` está embutido no histórico; para regenerar, reproduzir o
   script JS equivalente (mesmas paletas/fórmulas mix/rgba).
3. **Bridge de aliases** no `<style>` do helmet: `--bg`, `--surface`, `--text`,
   `--muted`, `--acc`→`--color-primary` etc. mapeiam o vocabulário antigo para
   tokens semânticos — o grosso do template usa os aliases.
4. **Separação marca × P&L**: ações/CTAs/nav = `--color-primary`; lucros =
   `--color-profit`; perdas/destrutivo = `--color-loss` (+`--tint-loss` fundo);
   dados ao vivo/badges de plataforma = `--color-accent`; séries = `--chart-1..5`.
5. **Sem degradês**: todos os `--gradient-brand` foram trocados por
   `--color-primary` sólido (pedido do usuário; token continua no DS).
6. **Contrato multi-tema**: `<html data-palette="..." data-theme="...">`;
   PaletteSelector persiste em localStorage; componentDidMount aplica default.
7. **Fonte**: Instrument Sans → Inter (corpo), Sora (display), JetBrains Mono (números).
8. **Tabelas**: grids com `minmax(0,*fr)` + larguras fixas + `gap` + truncamento
   ellipsis + wrapper `overflow-x:auto` com `min-width` (Ranking, Loja, Admin).
9. **Modais de confirmação** para ações destrutivas (excluir vídeo) e assinatura.

## Comandos/processos já executados

- `copy_files` dos uploads → `blue-hour-design-system/` (estrutura pedida: tudo na
  raiz da pasta exceto `PaletteSelector.jsx` que fica na raiz do projeto; subpastas
  `tokens/` e `icons/`; `build-tokens.py.txt` renomeado para `.py`).
- `run_script` portando build-tokens.py → gerou `tokens/tokens.css` (7×2) e `tokens.json`.
- `run_script` de migração em massa v3 (renames `--acc`→tokens, P&L, glows, fontes).
- Verificadores: todos os checks passaram ("No issues found") exceto o último (ver abaixo).

## Problemas conhecidos / pendências

1. ~~Q&A da Loja~~ — RESOLVIDO: verificado em 11/06; PERGUNTAR envia, card
   "AGUARDANDO RESPOSTA" aparece no topo, campo limpa.
2. Pulse dos dots usa tint de profit fixa no keyframe (limitação CSS; cosmético).
3. Editor de parâmetros sensível à estratégia: Indicadores Técnicos (referência,
   14 indicadores) e **Setups Larry Williams** (seção "Entrada por Setups" — PRD
   §11) implementados; os outros 5 editores (Tangram, Fibonacci, Price Action,
   Toque na Média, RenkoBot) caem no editor de referência (pendente).
4. Modais "Saiba Mais" do wizard (7 estratégias) não implementados.
5. Player do SmarttPlay (RF-SPL-02) não implementado.
6. Vídeos são placeholders (sem arquivos reais).

## Atualizações pós-handoff (11/06)

- Wizard reestruturado: **1 Estratégia → 2 Modo → 3 Dados (nome/capital/alterar
  estratégia) → 4 Configurar (= editor)**; CRIAR ROBÔ no passo 3 abre o editor
  na aba Parâmetros. O card Mercado/Ativo (segmentado BM&F|BOVESPA; chips
  WIN%/WDO%/BIT% ou input de código uppercase) foi movido para a seção
  "01 Papel Negociado" do editor, com subtítulo dinâmico; abrir robô existente
  pré-seleciona mercado/ativo (`openRobot` sincroniza `wizMercado`/`wizAtivo`/
  `wizAtivoBov`). Verificado ✔ (incl. Q&A da Loja).
- Renomear robô (lápis no editor) funcional; ALTERAR estratégia volta ao passo 1.
- **Fix sistêmico de UI**: holes de estilo (`style="{{ x }}"`) do runtime são
  mount-only — nunca re-aplicam em re-render. TODOS os estados visuais
  interativos (~190 pontos) migraram para classes CSS no helmet: `nv-on` (nav),
  `sg/sg-on` (segmentados), `kb/kb-on` (knobs), `rt/rt-on` (chevrons),
  `et-on`/`pl-on` (abas), `pr-on`/`tf-on`/`bc-on` (chips), `stc/stl` (steps),
  `wc-on` (cards wizard), `dis`/`dim` (botões desabilitados), `c-pf`/`c-ls`/
  `c-md` (cores P&L dinâmicas), `inp-dis` (inputs Manager). Mapas de classe
  exportados em `clsX` no renderVals. REGRA: nunca usar hole de estilo para
  estado que muda pós-mount — sempre classe. ATENÇÃO ao depurar: o iframe de
  preview dos agentes congela transições — injetar `*{transition:none
  !important}` antes de medir getComputedStyle.
- Hook `window.__errs` no helmet captura erros pré-bootstrap ("Illegal
  invocation" reportado 1× pelo verificador não reproduziu em 3+ cargas; sweep
  final passou limpo).

## Telas de configuração por estratégia (11/06, tarde)

- **Setups Larry Williams** (`prd-ajustes-setups-larry-williams.md` + spec UI):
  tela de 2 colunas no PARÂMETROS (form + resumo lateral sticky com pendências,
  disclaimer com checkbox que gateia o CTA, RODAR BACKTEST abre o modal).
  4 cards de setup com diagramas SVG (9.1–9.4); **9.4 BETA** (badge, microtexto
  "Extensão VETOR", parâmetro N só com 9.4, V-6 bloqueia EXECUTAR EM MODO REAL
  via classe `dis`); drawer "Como funciona" (compra/venda/invalidação); aumento
  de posição × Martingale mutuamente bloqueados com motivo visível; day trade
  travado. Estados: prefixo `lw*`, flags em `st.flags`, seções em `st.secs`.
- **Price Action** (`prd-ajustes-price-action.md` + spec UI): mesma arquitetura;
  **compositor de setup com preview SVG vivo** (modo/tipo/sentidos/DX refletem
  no diagrama + frase aria-live, espelhada no resumo); **V-2 combinações mortas**
  detectadas ao vivo (banner específico + preview vazio + pendência + CTA
  bloqueado); **DX×DY como radio de 3 cards** (V-1 estrutural, valores
  preservados); timeframes com 10 min (E-1); parciais 1–5 dinâmicas (V-4) com
  aviso de distribuição por extenso (V-5) e break-even gateado por ≥2 saídas
  (V-8); janelas de bloqueio 1–2 com "Permitir reversões" (redação A-1) e V-6;
  **Break Even Financeiro Diário** (PA-406); SEM seções de aumento/Martingale.
  Estados: prefixo `pa*`. Detecção: `isStratPA` (regex em sel.estrategia);
  `isStratIT` agora exclui LW e PA. Verificado ✔ (fluxos A/B/C).
- **Toque na Média** (`prd-ajustes-toque-na-media.md` + spec UI): mesma
  arquitetura; configurador de média reutilizável com badge de papel (Entrada/
  Aumento/Saída — até 3 médias, TM-005) e preview vivo; timeframes
  {1,5,10,15,30,60} SEM 45min e SEM modo candles (por design); sentido filtra
  (esmaece lado suprimido no preview — sem combinações mortas, TM-002);
  aumento como radio estrutural de 4 opções (V-1) com editor de níveis
  pareados (V-4, handlers tmAdd/Rm/SetNivel + tmVols), exposição máxima em
  tempo real (V-5, >10 = loss + pendência), Martingale×aumentos bidirecional
  (V-2), banner TM-205 permanente + nota nas janelas; filtros volume/dias da
  semana (V-11)/variação; realização parcial única (V-6) + break-even aninhado
  (V-7); SEM Break Even Financeiro Diário; Day Trade OPCIONAL (D-4): desligar
  exige modal de confirmação overnight (tmDTToggle/Confirm/Cancel), religar
  direto; "Sentido do Spread" não renderizado (A-2). Estados: prefixo `tm*`;
  `isStratTM`; `isStratIT` exclui LW+PA+TM. Verificado ✔ (roteiro completo).
- LIÇÃO: nunca usar `\\'` em d_replace de dc_js (quebra o eval da classe —
  usar aspas duplas dentro de strings single-quoted).

## Pós-entrega (12/06)

- Inputs numéricos: 29 campos de valor (LW/PA/TM) sanitizados via `setKVNum`
  (só dígitos/vírgula/ponto); listas de níveis/toques idem (inteiros p/ qtd).
- Chips `.sg`: `flex:1 1 auto` + `white-space:nowrap` (não clipam mais);
  hint visível "% disponível apenas na Bovespa" nos 9 seletores ABS/% em BM&F.
- Catálogo de indicadores (editor IT): TODOS os 14 indicadores agora têm
  selects "Modo de operação" (Apenas entradas/saídas/Entradas e saídas) e
  "Forma de uso" com opções específicas; VWAP ganhou painel expansível.
  Verificado ✔.

## DS v2.1 (12/06)

- Blue Hour DS atualizado para v2.1: 51 paletas × 2 modos (7 curadas + 44
  galeria), mesmo contrato de tokens. Arquivos copiados de uploads/ para
  blue-hour-design-system/ (tokens.css/json, palettes.js, README,
  design-system.md, styleguide, tailwind.config, build-tokens.py, icons/bot.svg).
- PaletteSelector.jsx (raiz) re-adaptado da v2.1: shim React global +
  module.exports; grid agrupado em "Curadas" (com tag/badge) e "Galeria"
  (44, sem badge), cabeçalhos com contador; badge condicional. Subtítulo da
  tela Aparência atualizado; hint-size 880×1200. Verificado ✔ (51 cards,
  rolagem, aplicação de tokens, teclado, regressão).

## Card de robô — métricas expandidas (14/06)

- "MAIS INFO" agora mostra 7 métricas (antes 4), alinhadas ao SmarttBot:
  Retorno %, Patrimônio, Fator de Lucro, Drawdown Máx., Trades no Dia,
  Nº de Trades, Trades com Lucro (= acerto). Layout flex-wrap com chips
  `flex:1 1 96px` (preenchem a linha, sem buracos), rótulo com quebra em 2
  linhas (sem reticências) e valor mono. Derivações em visibleRobots:
  cap base 5000 (consistente c/ Portfólio/detalhe), patr=5000+ret,
  retPct=ret/5000, trDia=exec?(1+seed%6):0. Verificado ✔ (7 chips, 0 clip).

## Tela de compra de créditos (14/06)

- Cliques em "Comprar 10/100" → consolidados em UM botão "COMPRAR CRÉDITOS"
  (recomendação de UX: os 2 atalhos eram redundantes com o seletor da tela).
- Modal `showBuy` em 3 colunas: (1) Quantidade como CARDS de pacote 10/100/500
  com preço unitário + economia por volume e tags MAIS VENDIDO/MELHOR VALOR
  (substitui o dropdown que escondia a comparação); cupom; saldo antes→depois.
  (2) Pagamento Cartão/PIX (parcelas só no cartão; PIX mostra QR + 10% off).
  (3) Resumo recalculado AO VIVO (subtotal, cupom, desconto PIX, total,
  investimento) + termos obrigatório gateando o CTA + opt-in opcional.
- Desconto em cascata: cupom 10% sobre base, PIX 10% sobre o restante.
  confirmBuy soma créditos ao saldo (estado `credits`, dinâmico em 4 lugares,
  antes era literal 33.857) + toast. Verificado ✔ (recalc, gate, cupom, confirm).
- NOTA p/ verificador: há 2 botões "APLICAR" no DOM (modal + tela atrás);
  clicar o do modal (irmão do input data-k="buyCoupon").
- "+ CADASTRAR NOVO CARTÃO" agora abre form inline (número/nome/MM-AA/CVV);
  SALVAR valida e registra o cartão (estado buyCards), seleciona-o e fecha o
  form + toast; lista de cartões agora é dinâmica (sc-for). Verificado ✔.
- Excluir cartão: ícone de lixeira por cartão (delCard, stopPropagation p/ não
  selecionar ao clicar); se excluir o selecionado, a seleção migra p/ o 1º
  restante. 3º meio de pagamento Google Pay (tab + painel próprio, à vista sem
  parcelas/sem desconto PIX); resumo mostra linha "Pagamento". Verificado ✔.
- Regra SaaS (assinatura ativa): NÃO se exclui o último cartão — com 1 cartão a
  lixeira vira cadeado (not-allowed) + guarda no delCard; badge PRINCIPAL no
  cartão default (índice 0). PIX/Google Pay = transacionais, fora da regra.
  Verificado ✔.
- Trocar principal: estado buyDefaultCard; link "Tornar principal" nos cartões
  não-default (setDefaultCard, stopPropagation); excluir o principal com outro
  disponível reatribui o default ao 1º restante. Verificado ✔.
- Google Pay agora é acionável: botão "G Pay" dispara payGoogle → exige aceite
  dos Termos, mostra "Redirecionando ao Google Pay…" e ~1,1s depois aprova
  (soma créditos, fecha modal, toast). Verificado ✔.
- UX consentimento (14/06): removido o checkbox obrigatório de Termos (gate
  anti-padrão p/ carteira express). Agora consentimento IMPLÍCITO via microcopy
  sob o CTA ("Ao concluir, você concorda com os Termos…") + nota no painel
  Google Pay; CTA sempre habilitado; opt-in de marketing segue como checkbox
  opcional. confirmBuy/payGoogle não exigem mais buyTerms. Verificado ✔.
- Google Pay payment sheet (14/06): tocar no botão G Pay abre a folha do Google
  Pay (overlay branco z-60) com cabeçalho GPay + conta google + total + LISTA de
  métodos da conta Google (Visa 4291, Mastercard 8830, Itaú conta) selecionáveis
  + botão "Pagar R$ X". gpayConfirm aprova com o método escolhido (toast nomeia).
  Estados showGpaySheet/gpayMethod; dados this._gpayMethods. Verificado ✔.
- Review Daniel (14/06): (1) removido o opt-in "Aceito receber ofertas" da tela
  de compra — consentimento de marketing pertence ao cadastro, não ao checkout
  (buyOptin/buyOptinBox seguem no state mas sem uso no modal). (2) Métricas do
  card expandido (7 itens) já estavam implementadas — comentário já atendido.
- "Termos de Uso" agora é link clicável (microcopy do checkout) → abre modal de
  Termos (showTerms, z-65) com conteúdo real em 7 seções (objeto, pagamento,
  validade, reembolso/art.49 CDC, risco, LGPD, alterações); ENTENDI/X fecham
  voltando ao modal de compra sem perder estado. Verificado ✔.
- Cards de backtest (Unitário) agora têm "Mais Info/Menos Info" (mesma dinâmica
  dos cards de robô): toggle btInfoOpen por id; chips expandidos Retorno %,
  Drawdown Máx., Trades com Lucro, Saldo Diário (R$0 — histórico), Trades no Dia
  (0). Retorno % = ret/1000; acerto derivado do seed/resultado. Verificado ✔.
- Botão RELATÓRIO do card de backtest agora abre modal de relatório (showBtReport
  /btReportId → btRep): cabeçalho (nome, cenário, estratégia, período, id), curva
  de patrimônio ampliada com gridlines e grid de 8 métricas (reportStats) +
  EXPORTAR PDF (placeholder) e FECHAR. openBtReport stopPropagation. Verificado ✔.
- Removidos Saldo Diário e Trades no Dia dos cards/relatório de backtest (sempre
  zero numa simulação histórica). Card: 3 chips (Retorno %, Drawdown Máx., Trades
  com Lucro); relatório: 6 métricas. Verificado ✔.
- Relatório de backtest: adicionada métrica PATRIMÔNIO = capital simulação
  (R$ 1.000) + retorno líquido; relatório agora com 7 métricas. Verificado ✔.

  (R$ 1.000) + retorno líquido; relatório agora com 7 métricas. Verificado ✔.
- Lista de ordens do relatório de backtest: paginação (30/pág, ‹ ›, "Página X/Y",
  faixa "1–30 de N"). Cada ordem tem STATUS (coluna + badge): Executada (maioria)
  + ~16% Cancelada/Rejeitada/Expirada (result "—"). Filtro de Status e filtro de
  Período (Todo/7/30/90 dias, relativo ao ts da ordem mais recente) via
  setOrdFilter (reseta página); estado vazio quando sem resultado. Verificado ✔
  (Cancelada→15, 30d→116, Rejeitada+7d→3).
- Filtro de período virou DATE-RANGE PICKER (calendário): trigger mostra
  "dd/mm/aa – dd/mm/aa"; popover com navegação de mês, seleção início→fim na
  mesma grade (realça intervalo), LIMPAR/APLICAR. Estados ordDtStart/ordDtEnd/
  ordCalOpen/ordCalYM; filtra por ts entre 00:00 do início e 23:59 do fim.
  Relatório Completo: + "Lucro máximo %" (Trades com Lucro) e "Prejuízo máximo %"
  (Trades com Prejuízo), relativos ao capital. Verificado ✔ (05–20/03 → 45 ordens).
- Exportações funcionais (14/06): relatório "EXPORTAR ORDENS (CSV)" → Blob das
  ordens FILTRADAS (this._ordExport), ordens_<id>.csv; ordens do robô "EXPORTAR
  ORDENS" → ordens_robo.csv (this._roboOrdExport); "EXPORTAR PDF" → window.print().
  Helpers _csvCell (escapa ;"/quebras + BOM) e _download (Blob+anchor); toast em
  cada. Verificado ✔ (CSV 456 linhas). NOTA: probes sobrescrevem
  URL.createObjectURL/anchor.click — reload após inspecionar p/ restaurar.
- Review Daniel (15/06): Preferências → card "FORMATAÇÃO DE VALORES" com Moeda
  (R$/US$/€/£), Separador decimal · tela e Separador decimal · exportação CSV
  (segmentados vírgula/ponto, desacoplados) + prévia ao vivo de cada. Estados
  prefCurrency/prefDecView/prefDecExport. Helper _fmtMoney(str,decSep,cur,withCur):
  troca símbolo e, se decSep='.', remove milhar e vírgula→ponto. Aplicado à tabela
  de ordens do relatório (exibição, prefDecView) e a ambos os CSV (prefDecExport,
  cabeçalho "Resultado (<cur>)"). Verificado ✔ (tela US$ vírgula vs CSV US$ ponto).
- Review Daniel (15/06): CSV agora exporta NÚMEROS PUROS (sem símbolo de moeda,
  sinal ASCII '-', sem milhar, decimal = prefDecExport) p/ Excel reconhecer como
  número; campos nulos (entradas/cancel.) saem VAZIOS (não "—"/"-"). Ordens do
  relatório carregam valores crus (precoR/ptsR/resR/qtdR); robô usa _brToNum p/
  parsear strings. Helpers _csvNum (toFixed(2)+sep) e _brToNum. Moeda fica só no
  cabeçalho. Verificado ✔ (Saída 5716.00;-0.48;-121.00 / Entrada ;; · vírgula idem).
- EXPORTAR PDF (15/06): agora gera documento de impressão dedicado (#__pdfRoot +
  @media print que oculta o app) com cabeçalho (nome/cenário/estratégia/período/id),
  gráfico de patrimônio (SVG), Resumo (7 cards), Relatório Completo (8 seções) e a
  TABELA DE ORDENS COMPLETA respeitando os filtros (status + date picker) — não
  paginada. Tema claro p/ impressão, page-break antes das ordens, @page A4. Usa
  this._curUnit/_curReport/_ordExport + prefs de moeda/decimal de tela. Verificado ✔
  (456 ordens full; com 10–19/03 → 30; cabeçalho registra o filtro).
- PDF formatação melhorada (15/06): cabeçalho de tabela repetido por página
  (thead table-header-group), zebra striping, colunas mono, números coloridos
  por sinal (verde/vermelho via valores crus resR/ptsR; drawdown forçado vermelho),
  resumo com cores, page-break antes das ordens. colOf trata moeda entre sinal e
  dígito. Verificado ✔ (neg vermelho, pos verde, drawdown vermelho).
- PDF ajustes (15/06): margens laterais @page 14mm 16mm (antes 12mm, ocupava toda
  a largura); REMOVIDA a quebra de página forçada antes da lista de ordens (gerava
  página em branco) — ordens fluem logo após o Relatório Completo. Verificado ✔.
- PDF margem (15/06): conteúdo tocava a borda quando navegador usa "Margens:
  Nenhuma". Solução: padding próprio na .pdf-doc (6mm 10mm, box-sizing border-box)
  + @page 10mm — respiro garantido independente da config do navegador. Verificado ✔.
- PDF agora exporta SÓ a 1ª página (15/06): removida a tabela de ordens do documento
  (cabeçalho+gráfico+Resumo+Relatório Completo apenas); rodapé indica que a lista
  completa sai em CSV. Verificado ✔ (sem table.ord, 8 seções, menção ao CSV).
- PDF cards iguais (15/06): grid .secs de align-items:start → stretch + .sec
  height:100% → cada linha do grid equaliza a altura pela maior caixa. Botão
  renomeado "EXPORTAR PDF" → "EXPORTAR RELATÓRIO". (Estilos do PDF vivem em
  @media print — medição em tela não reflete; stretch equaliza por padrão.)
- Cards de backtest (15/06): removidos MAIS/MENOS INFO e botão RELATÓRIO; os 3
  sub-cards de métricas (Retorno %/Drawdown Máx./Trades com Lucro) agora aparecem
  SEMPRE; o card inteiro é clicável (onClick openBtReport) e abre o relatório.
  Verificado ✔ (sem toggle/botão, stats visíveis, clique abre modal).
- Cards de robô (15/06): mesma simplificação — removidos MAIS/MENOS INFO; 7
  métricas sempre visíveis; links CONFIGURAR (abre editor)/DUPLICAR/ARQUIVAR/CRIAR
  BACKTEST sempre visíveis (todos com stopPropagation). Card inteiro clicável →
  openRoboReport reusa o MODAL de relatório do backtest via _roboUnitFor(id)
  (adapter robô→unit: sparkline + 7 reportStats; _report() gera seções+ordens).
  Botões PARAR/INICIAR/RESTAURAR e os links param a propagação. Verificado ✔
  (sem toggle, stats visíveis, clique abre relatório c/ gráfico+métricas+completo+
  ordens; controle não abre relatório).
- Ranking "VER SUMÁRIO" (15/06): abre o mesmo modal de relatório via _rankUnitFor(pos)
  (adapter rank→unit; ret derivado de capital×%); openRankReport (stopPropagation
  p/ não recolher a linha). Lookup unificado em _resolveReportUnit(id) cobrindo
  unit/robô/rank. Verificado ✔ (gráfico + Lista de Ordens + Relatório Completo).
- Revertido card de robô (15/06, pedido Daniel): métricas voltam a ser expansíveis
  (MAIS/MENOS INFO, colapsado por padrão); sempre visíveis: Retorno Líq. + Saldo
  Diário + botão de ação + rodapé (CONFIGURAR/DUPLICAR/ARQUIVAR/CRIAR BACKTEST).
  Layout: Retorno Líq. flex:1 1 auto + nowrap; rodapé flex-wrap com nowrap por item
  (CRIAR BACKTEST não quebra). toggleInfo com stopPropagation; card segue clicável
  p/ relatório. Verificado ✔.
- Ranking (15/06): linha expandida ganhou botão "ASSINAR ESTRATÉGIA" (marketplace)
  ao lado de VER SUMÁRIO; openAssinarRank(pos) abre o modal de assinatura existente
  com nome/estratégia da linha (assinNome/assinEstrat dinâmicos; confirmAssinar cria
  o robô assinado com esse nome). Verificado ✔ ("Assinar Falcão WIN 5m").
- Estratégia assinada × própria (15/06): robô assinado tem flag assinada + dados
  (assinAutor/assinNivel/assinPreco/assinDesde). Card: badge "ASSINADA" (estrela,
  violeta) + borda accent (cardBorder var(--color-primary)); footer sem DUPLICAR/
  ARQUIVAR — em vez disso "GERENCIAR ASSINATURA". Modal showGerenciar: detalhes
  (estrategista/nível/desde/status/cobrança mensal), VER PARÂMETROS, FATURAS, e
  CANCELAR ASSINATURA com confirmação (remove o robô + toast "sem cobranças").
  Verificado ✔ (badge, sem duplicar no assinado, cancelar remove o card).
- Link "Planos" (Loja, quick-links) (15/06): estava sem ação → openPlanos abre
  Minha Conta → aba Assinaturas (Plano Atual/ALTERAR PLANO). Verificado ✔.
- Tela Planos dedicada (15/06): sidebar "Planos" → screen 'planos' (marketing,
  estilo SmarttBot): hero, toggle Mensal/Anual (−20%, planoAnual), 3 cards de plano
  (Iniciante/Entusiasta/Estrategista, badges Mais Popular / Melhor custo×benefício),
  features com check, tabela comparativa (10 linhas), faixa de stats e FAQ próprio
  (planoFaqOpen). Dados em this._planos/_planCompare. ASSINAR → modal de assinatura.
  Minha Conta → Assinaturas segue mostrando plano atual. Verificado ✔ (toggle aplica
  −20%: 199→159, 399→319; 3 cards; comparação).
- ALTERAR PLANO (Minha Conta → Assinaturas) (15/06): agora abre a tela Planos
  (openPlanos) com o plano atual destacado — state planoAtual:'entusiasta';
  card ganha badge "SEU PLANO ATUAL", borda accent e CTA não-acionável. Plano atual
  em Minha Conta e no avatar atualizado p/ "Entusiasta · R$ 399" (consistência).
  Verificado ✔.
- Planos CTAs + modal (15/06): botões ASSINAR PLANO dos não-atuais todos roxos
  (primário). Clique abre modal PRÓPRIO do plano (showPlanoAssin/planoAssinId →
  planoAssin: nome, tagline, features, preço/ciclo), não mais o modal de robô.
  confirmAssinarPlano troca planoAtual + toast. Verificado ✔.
- Persistência do plano (15/06): card "PLANO ATUAL" em Minha Conta → Assinaturas era
  texto fixo; agora dinâmico de planoAtual (contaPlanoNome/Preco/Desc), reflete a
  troca feita em Planos. Verificado ✔ (trocar p/ Estrategista atualiza o card).
- Plano anual em Minha Conta (15/06): preço agora "R$ X/mês · R$ Y/ano" e observação
  "Renova em 15/06/2027 · cobrança anual (12× sem juros)" quando anual; mensal mantém
  "/mês · Renova 05/07/2026". Verificado ✔.
- Fix ciclo persistido (15/06): Minha Conta usava o toggle de preview (planoAnual)
  da tela Planos, então só pré-visualizar o anual já alterava o card. Agora há
  planoAtualAnual (gravado SÓ no confirmAssinarPlano); contaPlanoPreco/Desc usam
  ele. Verificado ✔ (toggle sem confirmar não muda; confirmar anual persiste).

- Gráfico (standalone) com Apache ECharts (15/06): ECharts 5.5.1 via CDN no helmet.
  SVG hand-drawn substituído por <div id="echart-graf"> (380px). Logic: _grafData
  (78 candles seeded), _renderGraf (candlestick + volume + dataZoom + markLine de
  último preço, cores do tema via getComputedStyle), init/dispose em
  componentDidUpdate quando screen==='grafico'. Verificado ✔ (canvas renderiza).

## Próximos passos recomendados

1. Rodar um verificador de regressão geral nas 14 combinações paleta×modo.
2. Decidir sobre editores específicos das estratégias restantes (Tangram,
   Fibonacci, RenkoBot), player SmarttPlay e modais Saiba Mais.
3. Possíveis entregas: export PDF/PPTX, handoff para Claude Code, ou bundle
   standalone.
