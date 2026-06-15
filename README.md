# Handoff: Plataforma Vetor — Robôs de Trading

## Overview
Plataforma web (SaaS) para **criação, execução e acompanhamento de robôs de
day trade** na B3, além de um **marketplace de estratégias** (assinatura de sinais
de terceiros), backtests, ranking, portfólio, loja, gestão de planos e área de
parceiro (Manager). O protótipo cobre o PRD v2.0 de ponta a ponta como um app de
página única navegável.

## About the Design Files
Os arquivos deste pacote são **referências de design feitas em HTML** — protótipos
de alta fidelidade que demonstram aparência, conteúdo e comportamento pretendidos.
**Não são código de produção para copiar diretamente.** A tarefa é **recriar estes
designs no ambiente do codebase de destino** (React, Vue, Svelte, etc.), usando os
padrões, componentes e bibliotecas já estabelecidos nele. Se ainda não houver um
ambiente, escolha o framework mais adequado (recomendado: **React + Vite**, dado que
o protótipo já é orientado a componentes/estado) e implemente lá.

O protótipo foi construído como um "Design Component" (`.dc.html`) — um runtime
interno de template + classe de lógica. **Esse runtime não deve ser portado**; use-o
apenas como especificação de markup, estado e comportamento.

## Fidelity
**Alta fidelidade (hifi).** Cores, tipografia, espaçamentos, estados e interações
são finais e devem ser recriados fielmente, usando o **Blue Hour Design System**
(tokens incluídos). Toda a UI é tematizável por **51 paletas × 2 modos** (claro/
escuro) através de CSS custom properties — preserve esse contrato de tokens.

## Stack do protótipo (para leitura)
- **Template + lógica**: arquivo único `Plataforma Vetor v3.dc.html`. O markup usa
  `{{ }}` para holes e `<sc-for>`/`<sc-if>` para repetição/condicional; a classe
  `Component extends DCLogic` expõe estado e handlers via `renderVals()`. Traduza
  isso para componentes + estado do seu framework.
- **Estilo**: **inline styles** + CSS custom properties do Blue Hour DS. Não há
  classes utilitárias significativas além de alguns helpers.
- **Gráficos**: **Apache ECharts 5.5.1** (candlestick + volume na tela Gráfico).
  Sparklines e curvas de patrimônio são SVG inline simples.
- **Fontes**: Sora (títulos), Inter (texto), JetBrains Mono (números/monoespaçado).

## Design System (Blue Hour)
Pasta `blue-hour-design-system/` (incluída):
- `tokens/tokens.css` — **fonte da verdade dos tokens**: define todas as variáveis
  CSS por `[data-palette][data-theme]`. Importe isto e troque paleta/modo nos
  atributos de `<html>`.
- `tokens/tokens.json` — mesmos tokens em JSON (para consumo programático/TS).
- `palettes.js` — runtime de troca de tema (`setTheme`, `getTheme`, `initTheme`,
  `PALETTES`).
- `PaletteSelector.jsx` — seletor de paleta (referência de UI; React).
- `design-system.md`, `styleguide.html`, `tailwind.config.js` — documentação e
  mapeamento opcional para Tailwind.

### Tokens-chave (nomes de variáveis CSS)
Cores (valores variam por paleta — leia `tokens.css`): `--bg`, `--surface`,
`--surface2`, `--surface3`, `--border`, `--border2`, `--text`, `--muted`,
`--muted2`, `--color-primary`, `--color-on-primary`, `--color-accent`,
`--color-profit`, `--color-loss`, `--color-amber`, `--tint-primary`,
`--tint-accent`/`--acc-bg`, `--shadow`, `--glow1`, `--glow2`.
Segmentos/knobs: `--seg-on`, `--seg-on-tx`, `--knob-off`.
Convenções: lucro = `--color-profit` (verde), prejuízo = `--color-loss` (vermelho),
preço/alertas = `--color-amber`, marca/assinatura = `--color-primary` (violeta).

## Telas / Views
Listadas por área do menu lateral. Cada uma é uma "screen" trocada por estado
(`screen`), não por rota — no codebase real, mapeie para **rotas**.

### Plataforma
- **Análise Geral (Dashboard)** — visão consolidada (cards de resumo, gráficos).
- **SmarttPlay** — biblioteca de vídeos/tutoriais com filtro por categoria; cards
  com thumbnail (placeholder), progresso, duração e status.
- **Robôs** — grade de cards (mín. 380px). Cada card: cabeçalho (#id, ativo, selo,
  ponto pulsante se em execução), nome (Sora 15.5px), estratégia, sparkline,
  posição, **Retorno Líq. + Saldo Diário + botão de ação** (PARAR/INICIAR/
  RESTAURAR), toggle **MAIS INFO/MENOS INFO** (revela 7 métricas: Retorno %,
  Saldo Diário, Fator de Lucro, Drawdown Máx., Trades no Dia, Nº de Trades, Trades
  com Lucro), e rodapé de ações **CONFIGURAR · DUPLICAR · ARQUIVAR · CRIAR
  BACKTEST**. Abas: Em execução / Parados / Arquivados. Botão flutuante CRIAR ROBÔ.
  - **Robô assinado** (marketplace): borda accent + badge "ASSINADA"; o rodapé troca
    DUPLICAR/ARQUIVAR por **GERENCIAR ASSINATURA** (modal com estrategista, nível,
    desde, cobrança mensal e **CANCELAR ASSINATURA** com confirmação).
  - **Clique no card** (fora dos botões) abre o **Relatório do robô** (ver Relatório).
- **Backtests** — abas Unitário / Em massa / Processando / Arquivados. Card de
  backtest abre o **Relatório** ao clicar. Criação em massa: chips de valores por
  parâmetro, produto cartesiano com teto de 1000, filtros e datas com atalhos.
- **Gráfico (standalone)** — **Apache ECharts**: candlestick + volume + dataZoom +
  linha de último preço (âmbar) + tooltip cruzado; barra de timeframes (1m…1M),
  seletor de tipo de série, período (5y…1d) e coluna de ferramentas de desenho.

### Descobrir
- **Ranking** — tabela de robôs (posição, nome, estratégia, retorno, drawdown,
  trades, acerto, fator, ativo, simulador) com filtros (estratégia/ativo/categoria)
  e períodos (1S…Início). Linha expande mostrando sparkline + métricas + **VER
  SUMÁRIO** (abre Relatório) e **ASSINAR ESTRATÉGIA** (abre modal de assinatura).
- **Portfólio** — performance consolidada (cards, evolução, exposição por ativo,
  retorno por estratégia, tabela de robôs).
- **Loja** — vitrine de estratégias (carrossel de destaques, atalhos, ranking de
  estratégias) e **detalhe** com 6 abas (Indicadores, Descrição, Níveis de
  exposição, Pergunte ao estrategista, Dúvidas, Disclaimer); seleção de nível e
  fluxo de assinatura que cria um robô assinado (parado).

### Planos (marketing)
- **Planos** — página de marketing: hero, alternador **Mensal/Anual (−20%)**, 3
  cards (Iniciante/Entusiasta/Estrategista) com selos "Mais Popular" e "Melhor
  custo × benefício", lista de recursos, **tabela comparativa** (10 linhas), faixa
  de métricas e FAQ. Botão ASSINAR abre **modal do plano** (não confundir com
  assinatura de robô). O ciclo (mensal/anual) só é persistido ao **confirmar**.

### Parceiro
- **Manager** — área do estrategista, 5 abas (Dashboard, Financeiro, Carteira,
  Perfil, Perguntas e Respostas).

### Administração
- **Vídeos · SmarttPlay** — CRUD de categorias e vídeos (busca, publicar, modal de
  exclusão, duração automática).

### Conta
- **Planos** (atalho lateral → abre a página de Planos acima).
- **Minha Conta** — 5 abas (Perfil, Assinaturas, Corretoras, Preferências, Últimos
  acessos). Em **Assinaturas**: card "PLANO ATUAL" **dinâmico** (nome/preço/ciclo/
  renovação seguem o plano contratado) + ALTERAR PLANO (abre Planos com o plano
  atual destacado). Em **Preferências**: card "Formatação de valores" — **moeda**
  (R$/US$/€/£) e **separador decimal independente para tela e para exportação CSV**.
- **Aparência** — PaletteSelector ao vivo: 51 paletas em 2 grupos (Curadas/Galeria)
  × 2 modos; troca aplica os tokens em toda a plataforma.

### Relatório (modal reutilizável — backtest, robô e ranking)
Cabeçalho (nome, cenário, estratégia, período, id) · **gráfico de evolução do
patrimônio** · **Resumo** (cards de métricas) · **Relatório Completo** expansível
(8 seções: Conta, Retorno, Risco, Resumo dos trades, Trades com lucro/prejuízo/
comprados/vendidos) · **Lista de Ordens** completa com **filtro de status**
(Todas/Executada/Cancelada/Rejeitada/Expirada), **date-range picker** (calendário),
**paginação** (30/página), **exportar CSV** e **EXPORTAR RELATÓRIO** (PDF da 1ª
página via print dedicado).

## Interactions & Behavior
- **Navegação**: troca de "screen" por estado → no app real, use rotas.
- **Toggles segmentados** (`.sg`/`.sg-on`): mensal/anual, modo simulado/real,
  timeframes, etc.
- **Modais**: criar backtest, comprar créditos, Google Pay sheet, termos de uso,
  relatório, assinar plano, assinar estratégia, gerenciar assinatura, eventos da
  ordem. Todos com overlay `rgba(4,7,12,.62)` + `backdrop-filter: blur(6px)`.
- **Toasts**: confirmação efêmera (~2,6s) centralizada no rodapé.
- **stopPropagation**: botões de ação dentro de cards clicáveis (PARAR/INICIAR,
  CONFIGURAR, DUPLICAR, etc.) não devem disparar o clique do card.
- **Animações**: `fadeUp .25s ease` na entrada de telas; ponto pulsante em robô
  ativo; transições `all .15s/.18s` em hovers.
- **Exportações**: CSV (Blob, separador `;`, números puros sem símbolo de moeda,
  sinal ASCII, decimal configurável, nulos vazios, BOM UTF-8); PDF via `window.print()`
  com folha de impressão dedicada (A4, `@media print`, padding próprio).
- **Validações**: nome do robô ≤ 40 caracteres (10 reservados p/ "(cópia NN)");
  campos numéricos só aceitam dígitos/separadores; backtest em massa teto 1000.

## State Management
Centralizado numa classe (equivalente a um store/contexto). Variáveis-chave:
- Navegação: `screen`, abas (`robotTab`, `backTab`, `contaTab`, `mgrTab`, `lojaTab`).
- Robôs: `robots[]` (id, nome, estrategia, ativo, estado exec/parado/arq, ret, dia,
  fator, dd, trades, acerto, seed; assinada + assinAutor/Nivel/Preco/Desde),
  `selected`, `infoOpen{}`.
- Planos: `planoAtual`, `planoAtualAnual` (ciclo contratado — só muda no confirm),
  `planoAnual` (preview na tela), `planoAssinId`.
- Relatório: `showBtReport`, `btReportId` (resolve p/ backtest, robô `id` ou
  `rank-<pos>`), `btRepFull`, `btOrdPage`, `ordFStatus`, `ordDtStart/End`.
- Preferências: `prefCurrency`, `prefDecView`, `prefDecExport`, `theme`, paleta.
- Créditos de backtest: `credits`; cartões: `buyCards[]`, `buyDefaultCard`.
- Dados sintéticos (robôs, ranking, loja, vídeos, ordens, planos) são seeds
  determinísticas — no app real, virão de API. Mapeie cada lista para um endpoint.

## Design Tokens
Ver `blue-hour-design-system/tokens/tokens.css` (definitivo) e `tokens.json`.
Tipografia: Sora (600/700), Inter (400/500/600), JetBrains Mono (500/600/700).
Raios: 8–18px (cards 16px, modais 18px, botões 10–12px, pills 99px).
Espaçamento base: 8px; padding de tela 22–28px; gaps 8–16px.

## Assets
- `blue-hour-design-system/icons/bot.svg` — ícone de robô.
- Ícones de UI: SVGs inline (stroke `currentColor`) — recrie com sua icon library.
- Imagens (thumbnails de vídeo, avatares) são placeholders — substituir por reais.
- Apache ECharts via CDN (`echarts@5.5.1`) — instalar como dependência no app real.

## Files
- `Plataforma Vetor v3.dc.html` — **design de referência ATUAL** (todas as telas).
- `blue-hour-design-system/` — tokens, paletas, styleguide, seletor de paleta.
- `PaletteSelector.jsx` — seletor de paleta (referência React).
- `PRD_Plataforma_Robos_Trading_v2.0.md` — requisitos funcionais (fonte da verdade).
- `HANDOFF_TECH_LOG.md` — log técnico detalhado das decisões de implementação do
  protótipo (útil para entender por que cada fluxo foi feito assim).
