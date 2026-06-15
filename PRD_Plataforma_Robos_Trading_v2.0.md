# Documento de Requisitos e Especificações
**Plataforma Web de Criação e Execução de Robôs de Trading**
**Especificação funcional consolidada — derivada da análise de gravação de tela (SmarttBot 2.0, 17m50s) e do mapeamento sistemático ao vivo de 100% da interface da plataforma (Junho/2026)**
**Versão 2.0 — 11/06/2026**

## Controle do Documento
| Versão | Data | Autor | Descrição |
| --- | --- | --- | --- |
| 1.0 | 10/06/2026 | Equipe de Produto | Versão inicial — análise de vídeo de referência (17m50s) |
| 2.0 | 11/06/2026 | Equipe de Produto | Versão consolidada — fusão com mapeamento sistemático ao vivo de 100% da interface (módulos: Análise Geral, SmarttPlay, Robôs, 7 editores de estratégia completos, Backtests, Ranking, Portfólio, SmartStore, Gráfico standalone, Minha Conta, Manager completo, detalhe de ordens) |

Nota sobre a referência: este documento descreve funcionalidades observadas em uma plataforma de mercado (SmarttBot 2.0) com finalidade de levantamento de requisitos e paridade funcional. A implementação deverá utilizar identidade visual, marca, textos e código próprios e originais. Recomenda-se avaliação jurídica quanto a propriedade intelectual e quanto a requisitos regulatórios (CVM/B3) antes do lançamento.


## Sumário

Introdução
Visão Geral do Produto
Arquitetura de Referência Proposta
Arquitetura de Informação e Navegação
Requisitos Funcionais — Autenticação e Contas
Requisitos Funcionais — Dashboard (Análise Geral)
Requisitos Funcionais — SmarttPlay
Requisitos Funcionais — Listagem de Robôs
Requisitos Funcionais — Wizard de Criação de Robôs
Editor do Robô — Estrutura Geral
Editor — Setups Larry Williams (especificação completa)
Editor — Indicadores Técnicos [Tangram 3.0] (especificação completa)
Editor — Tangram (especificação completa)
Editor — Fibonacci (especificação completa)
Editor — Toque na Média (especificação completa)
Editor — Price Action (especificação completa)
Editor — RenkoBot Start (especificação completa)
Execução de Robôs
Relatório do Robô — Aba Sumário
Aba Gráfico do Robô
Backtests
Ranking
Portfólio
SmartStore (Loja)
Gráfico Standalone
Minha Conta
Manager
Regras de Negócio Transversais
Comportamentos Condicionais e Estados de UI
Requisitos Não-Funcionais
Modelo de Dados
Especificação de API
Plano de Fases e Critérios de Aceitação
Riscos e Dependências
## Anexo A — Inventário de Telas Observadas


## 1. Introdução
### 1.1 Propósito
Este documento especifica os requisitos funcionais e não-funcionais para o desenvolvimento de uma aplicação web que permita a usuários criar, configurar, simular, executar e avaliar robôs de negociação automatizada (trading bots) para o mercado financeiro brasileiro (B3 — segmentos BM&F e Bovespa), sem necessidade de programação, por meio de um construtor visual de estratégias baseado em parâmetros. O documento também abrange módulos de marketplace de estratégias (SmartStore), ferramentas de análise consolidada (Portfólio, Ranking) e um painel de gestão para estrategistas parceiros (Manager).
### 1.2 Fonte dos requisitos
Os requisitos foram levantados a partir de duas fontes complementares:
Fonte A: Análise frame a frame de gravação de tela (output.mp4, 17m50s, 2290×1388, 30 fps) demonstrando o fluxo completo da plataforma de referência: login, criação de robô, editor de parâmetros com dez seções, execução simulada, relatório de desempenho, gráfico de mercado integrado e backtests.
Fonte B: Mapeamento sistemático ao vivo de 100% da interface da plataforma (app.smarttbot.com), sessão autenticada em 11/06/2026, cobrindo todos os módulos, subpáginas, dropdowns, tooltips, comportamentos condicionais de toggles e modais.
### 1.3 Escopo do produto
O produto é uma plataforma SaaS multiusuário em que cada cliente pode:

Criar robôs a partir de 7 estratégias-modelo parametrizáveis (sem código);
Executar robôs em modo simulado (paper trading com cotações reais) ou em modo real (roteamento de ordens via corretora integrada);
Acompanhar desempenho com métricas financeiras, curva de patrimônio e histórico de ordens;
Validar estratégias com backtests históricos, unitários ou em massa (varredura de parâmetros);
Descobrir e assinar estratégias de parceiros certificados via SmartStore;
Gerenciar plano de assinatura, créditos de backtest e contas de corretora;
Publicar e comercializar estratégias (perfil Manager/Estrategista).

### 1.4 Definições e siglas
| Termo | Definição |
| --- | --- |
| Robô | Instância de estratégia parametrizada pelo usuário, com ciclo de vida próprio (rascunho, executando, parado, arquivado) e vínculo a um ambiente (simulado ou real). |
| Estratégia-modelo | Template de estratégia oferecido pela plataforma (7 tipos: Indicadores Técnicos, Setups Larry Williams, Tangram, Fibonacci, Price Action, Toque na Média, RenkoBot Start), que define o conjunto de parâmetros disponíveis no editor. |
| Modo Simulado | Execução com dados de mercado reais e carteira virtual; nenhuma ordem é enviada à corretora. |
| Modo Real | Execução com envio de ordens reais à corretora do usuário. |
| Simulador pessimista | Política de preenchimento conservadora do simulador (pior preço plausível do candle/book). |
| Simulador moderado | Política de preenchimento intermediária. |
| Simulador otimista | Política de preenchimento favorável (melhor preço plausível). |
| Backtest | Simulação da estratégia sobre dados históricos em intervalo de datas, com capital e custos parametrizados. |
| Backtest em massa | Conjunto de backtests gerado pela combinação cartesiana de múltiplos valores (varredura/otimização). |
| Contrato contínuo (wildcard) | Notação com sufixo % (ex.: WIN%, WDO%, BIT%) que resolve automaticamente para o contrato futuro vigente, com rolagem automática de vencimento. |
| SmartStore | Marketplace de estratégias parametrizadas publicadas por estrategistas parceiros, disponíveis para assinatura mensal por nível de exposição. |
| Manager | Módulo de gestão do estrategista parceiro (dashboard de vendas, financeiro, saque, perfil, FAQ). |
| B3 / BM&F | Bolsa brasileira; segmento de derivativos (futuros: WIN, WDO, BIT). |
| Day trade | Operação aberta e encerrada no mesmo pregão. |
| Chip (UI) | Elemento de tag removível usado no editor de backtest em massa para representar múltiplos valores de um parâmetro. |

## 2. Visão Geral do Produto
### 2.1 Personas
Trader iniciante/intermediário: deseja automatizar setups conhecidos sem programar; usa estratégias-modelo e modo simulado antes de ir ao real.
Trader avançado/quant: explora varreduras de parâmetros via backtest em massa e compara dezenas de variações; analisa relatórios detalhados de risco.
Assinante de estratégias: não cria robôs próprios; descobre e assina estratégias de parceiros via SmartStore; monitora performance no Sumário e no Portfólio.
Estrategista parceiro (Manager): publica e comercializa estratégias na SmartStore; gerencia clientes, receitas e saques via módulo Manager; responde perguntas de potenciais assinantes.
Administrador da plataforma: gerencia catálogo de estratégias, planos, créditos e monitoramento operacional.
### 2.2 Fluxo principal do usuário

Login na aplicação e seleção de conta (quando múltiplas);
Acesso à área Robôs → botão Criar;
Wizard (4 etapas): Estratégia → Modo (Simulado/Real) → Ativo → Configurar (nome);
Edição de parâmetros no editor acordeão (seções específicas por estratégia);
Salvamento e início da execução (simulada); acompanhamento via Sumário e Gráfico;
Criação de backtests (unitário ou em massa) para validar variações;
Opcionalmente: promoção para Modo Real, assinatura via SmartStore, publicação como Manager.

### 2.3 Modos de Operação
O sistema opera em dois modos distintos, selecionáveis por toggle global no editor:
| Modo | Descrição | Restrições |
| --- | --- | --- |
| MODO SIMULADO | Ordens em ambiente virtual com cotações reais | Disponível a todos os planos |
| MODO REAL | Ordens reais roteadas à corretora | Exige corretora vinculada, plano elegível e confirmação explícita |

Regra crítica: A transição Simulado → Real requer confirmação explícita ("Executar em modo real") e é irreversível no contexto de execução ativa.

### 2.4 Fases de entrega
Fase 1 (MVP): Autenticação, listagem de robôs, wizard, editor completo para Indicadores Técnicos, execução simulada, sumário com métricas e ordens + CSV, backtest unitário.
Fase 2: Backtest em massa, gráfico TradingView integrado, demais estratégias-modelo, compra de créditos, Dashboard, Modo Real com primeira corretora.
Fase 3: SmartStore/Marketplace, Ranking, Portfólio consolidado, SmarttPlay, Manager, novas corretoras, mobile.

## 3. Arquitetura de Referência Proposta
### 3.1 Componentes
| Componente | Responsabilidade | Tecnologia sugerida |
| --- | --- | --- |
| Front-end SPA | Interface: wizard, editor de parâmetros, relatórios, gráficos, backtests, SmartStore, Manager | React + Vite + Tailwind; gráficos via TradingView Charting Library (licenciada) ou Lightweight Charts (open source) |
| API / BFF | Autenticação, CRUD de robôs e parâmetros, orquestração de execução e backtests, relatórios, SmartStore, Manager | Supabase (Postgres + Auth + RLS + Realtime) + serviço Node.js para regras de negócio; alternativa: NestJS + Postgres |
| Motor de execução | Avalia estratégias em tempo real candle a candle/tick a tick; gera ordens; mantém estado de posição por robô | Serviço stateful em Node.js ou Python, particionado por ativo; Kubernetes com autoscaling; fila (Redis Streams/NATS) entre feed e workers |
| Motor de backtest | Reproduz a lógica do motor de execução sobre dados históricos; processa filas de backtests em massa | Workers idempotentes consumindo fila; resultados persistidos por execução; reuso obrigatório do mesmo core do motor real |
| Feed de mercado | Cotações em tempo real e histórico (candles 1m+ e negócios) da B3 | Provedor licenciado (ex.: Cedro, UP2DATA/B3); cache de candles em série temporal (Timescale/ClickHouse) |
| Gateway de ordens | Roteamento de ordens reais para corretoras integradas (XP, BTG); reconciliação de execuções | Integração FIX/DMA ou APIs das corretoras; isolado por requisitos de segurança |
| Observabilidade | Logs, métricas e traces; auditoria | Loki + Prometheus + Grafana + Tempo; trilha de auditoria imutável (retenção ≥ 5 anos para ordens) |
### 3.2 Decisões e princípios

Paridade simulado/real/backtest: único núcleo de avaliação compartilhado pelos três contextos, variando apenas o adaptador de execução.
Parâmetros versionados como JSON: documento JSONB validado por JSON Schema; evolução do editor sem migrações destrutivas.
Robô em execução é imutável: alterações de parâmetros exigem parada prévia.
Multi-tenant com isolamento por conta (RLS no Postgres) e limites por plano.
Catálogo de indicadores orientado a metadados: registro de indicador + schema de campos, permitindo adicionar novos sem alterações estruturais no front-end.


## 4. Arquitetura de Informação e Navegação
### 4.1 Estrutura de Rotas
```text
/private/
├── home                          → Análise Geral (Dashboard)
├── smarttplay                    → SmarttPlay
├── robos                         → Lista de Robôs
│   ├── [id]/sumario              → Sumário do Robô
│   ├── [id]/grafico              → Gráfico do Robô
│   └── [id]/parametros           → Editor de Parâmetros
├── criar-robos                   → Wizard de Criação (4 etapas)
├── backtests                     → Lista de Backtests
│   └── [id]/sumario              → Relatório de Backtest
├── criar/backtest/[robotId]      → Editor de Backtest em Massa
├── ranking                       → Ranking de Robôs
├── portfolio                     → Portfólio Consolidado
├── grafico                       → Gráfico Standalone (TradingView)
├── conta/
│   ├── perfil                    → Minha Conta — Perfil
│   ├── assinatura                → Minha Conta — Assinaturas
│   ├── corretoras                → Minha Conta — Corretoras
│   ├── preferencias              → Minha Conta — Preferências
│   └── acessos                   → Minha Conta — Últimos Acessos
└── manager/
    ├── home/dashboard            → Manager — Dashboard
    ├── home/financial            → Manager — Financeiro
    ├── home/wallet               → Manager — Minha Carteira
    ├── home/profile              → Manager — Perfil
    └── home/faq                  → Manager — Perguntas e Respostas

/smarttstore/
├── (root)                        → Loja — Página Principal
└── detalhes/[id]                 → Loja — Detalhe da Estratégia
```
### 4.2 Sidebar (Navegação Principal)
A sidebar é vertical, colapsada por padrão (somente ícones), e fixa em todas as telas privadas. Itens de Fase 3 podem ficar ocultos via feature flag.
| Posição | Ícone | Rota | Label | Fase |
| --- | --- | --- | --- | --- |
| 1 | 📊 | `/private/home` | Análise Geral | 2 |
| 2 | ▶ | `/private/smarttplay` | SmarttPlay | 3 |
| 3 | 🤖 | `/private/robos` | Robôs | 1 |
| 4 | 🧪 | `/private/backtests` | Backtests | 1 |
| 5 | 🏆 | `/private/ranking` | Ranking | 3 |
| 6 | 📈 | `/private/portfolio` | Portfólio | 3 |
| 7 | 🛒 | `/smarttstore` | Loja | 3 |
| 8 | 📉 | `/private/grafico` | Gráfico | 2 |
| 9 | 💳 | `https://[dominio]/planos` | Planos (externo) | 1 |
| 10 | 👤 | `/private/conta` | Minha Conta | 1 |
| 11 | ❓ | `https://ajuda.[dominio]/hc/pt-br` | Ajuda (externo) | 1 |
| 12 | 💬 | `(widget Intercom/chat)` | Suporte | 1 |
| 13 | 👥 | `/private/manager` | Manager | 3 |
### 4.3 Toggle Global de Ambiente
Presente em todas as telas de robôs: MODO SIMULADO / MODO REAL (switch binário). A seleção filtra todo o conteúdo exibido (listas, relatórios, contadores).
### 4.4 Header do Editor de Robô
Quando dentro de /private/robos/[id]/*:

Nome do robô editável inline (ícone ✏)
Toggle MODO SIMULADO / MODO REAL
Abas: SUMÁRIO | GRÁFICO | PARÂMETROS
Barra de ações flutuante: Custos ($) | Salvar (💾) | Backtest (🧪) | Iniciar/Parar (▶/⏹) | Menu ⋮ (duplicar, arquivar, excluir)
Metadado: #[id] • [Tipo de Simulador] • [Estratégia] • [Status]
ÚLTIMO SALVAR: DD/MM/AAAA HH:MM


## 5. Requisitos Funcionais — Autenticação e Contas (AUT)
| ID | Requisito | Prior. |
| --- | --- | --- |
| RF-AUT-01 | Permitir cadastro e login com e-mail/senha, com recuperação de senha e verificação de e-mail. | E |
| RF-AUT-02 | Página institucional pública com chamada para teste grátis e login (gateway para aplicação autenticada em subdomínio app.*). | I |
| RF-AUT-03 | Após login, apresentar etapa de seleção de conta quando o usuário possuir mais de uma conta/perfil, com indicador de carregamento (skeleton). | I |
| RF-AUT-04 | Sessões persistentes com expiração configurável e logout em todos os dispositivos. | E |
| RF-AUT-05 | Suporte futuro a MFA (TOTP) — obrigatório antes de habilitar Modo Real. | I |

## 6. Requisitos Funcionais — Dashboard (Análise Geral)
**Rota:** `/private/home`
| ID | Requisito | Prior. |
| --- | --- | --- |
| RF-DSH-01 | Exibir visão consolidada da conta: resultado do dia, robôs executando, posição aberta total (R$), estratégias em destaque, métricas da plataforma e ranking de clientes (cards). | I |
| RF-DSH-02 | Gráfico de evolução de patrimônio consolidado com filtros de período: Semana / Mês / 3 meses / 6 meses / 1 ano / Início. | I |
| RF-DSH-03 | Lista de robôs ativos com mini-cards de performance (resultado do dia por robô). | I |
| RF-DSH-04 | Cada card do dashboard deve linkar para o módulo correspondente. | D |

## 7. Requisitos Funcionais — SmarttPlay
**Rota:** `/private/smarttplay`
| ID | Requisito | Prior. |
| --- | --- | --- |
| RF-SPL-01 | Hub de vídeos educativos e tutoriais sobre uso da plataforma e estratégias de trading. | D |
| RF-SPL-02 | Player de vídeo embedded com catálogo de conteúdos organizados por categoria. | D |
| RF-SPL-03 | Sistema de progresso de visualização por usuário. | D |

## 8. Requisitos Funcionais — Listagem de Robôs (ROB)
**Rota:** `/private/robos`
| ID | Requisito | Prior. |
| --- | --- | --- |
| RF-ROB-01 | Organizar robôs em três abas por estado: EXECUTANDO, PARADOS e ARQUIVADOS. | E |
| RF-ROB-02 | Exibir robôs como cards em grade contendo: #id, código do ativo, selo do tipo de simulador (Pessimista/Moderado/Otimista), nome do robô, estratégia-modelo, minigráfico (sparkline) da curva de resultado com eixo de datas, status de posição, Retorno Líquido (verde/vermelho) e Saldo Diário. | E |
| RF-ROB-03 | Cada card deve oferecer: expansor "MAIS INFO" (accordion com métricas adicionais), menu ⋮ com ações contextuais e botão primário de controle (Parar/Iniciar/Restaurar). | E |
| RF-ROB-04 | "MAIS INFO" expande para exibir: Número de trades, Trades com lucro (%), Fator de lucro, Drawdown máximo (%). | E |
| RF-ROB-05 | Menu ⋮ de ações por aba: | E |
Ações disponíveis por estado do robô:
| Ação | Executando | Parado | Arquivado |
| --- | --- | --- | --- |
| Ver Sumário | ✓ | ✓ | ✓ |
| Editar parâmetros | — | ✓ | — |
| Iniciar | — | ✓ | — |
| Pausar/Parar | ✓ | — | — |
| Arquivar | — | ✓ | — |
| Desarquivar | — | — | ✓ |
| Excluir | — | ✓ | ✓ |
| Criar backtest | ✓ | ✓ | ✓ |
| Duplicar | ✓ | ✓ | ✓ |
| ID | Requisito | Prior. |
| --- | --- | --- |
| RF-ROB-06 | Filtros: por estratégia (dropdown multi-seleção), por "Robôs Posicionados"; alternância grade/lista; busca por nome. | I |
| RF-ROB-07 | Botão "CRIAR ROBÔ" para iniciar o wizard. | E |
| RF-ROB-08 | Atualização em tempo real (websocket) de retorno, saldo diário e posição dos robôs em execução. | I |
| RF-ROB-09 | Visualização lista (tabela) com colunas: Nome, Estratégia, Ativo, Modo, Status, Patrimônio, Retorno (%), Resultado do dia (R$), Ações. | I |
| RF-ROB-10 | Skeleton loaders durante carregamento de listas e relatórios. | I |

## 9. Requisitos Funcionais — Wizard de Criação de Robôs (WIZ)
**Rota:** `/private/criar-robos`
**Breadcrumb:** Robôs → Estratégia → Modo → Ativo → Configurar
| ID | Requisito | Prior. |
| --- | --- | --- |
| RF-WIZ-01 | Etapa 1 — Estratégia: catálogo de estratégias-modelo com busca textual. Cada item exibe nome, autor e ações "Saiba Mais" (modal de descrição detalhada) e "+" para selecionar. | E |
| RF-WIZ-02 | Catálogo inicial de 7 estratégias-modelo: Indicadores Técnicos [Tangram 3.0], Setups Larry Williams, Tangram, Fibonacci, Price Action, Toque na Média, RenkoBot Start. | E |
| RF-WIZ-03 | Etapa 2 — Modo: seleção entre Modo Simulado e Modo Real. Modo Real exige conta de corretora vinculada e plano elegível. | E |
| RF-WIZ-04 | Etapa 3 — Ativo: seleção de Mercado (BM&F) e Código do ativo via chips (WIN% / WDO% / BIT% — variam por estratégia). | E |
| RF-WIZ-05 | Etapa 4 — Configurar: campo Nome do Robô (obrigatório, único por conta), exibição da estratégia selecionada, Capital para Simulação (padrão R$5.000,00; apenas em Simulado). Botão "Avançar" habilitado somente com campos válidos. | E |
| RF-WIZ-06 | Ao concluir, criar o robô em estado "parado/rascunho" e redirecionar para /robos/{id}/parametros. | E |

## 10. Editor do Robô — Estrutura Geral (EDT)
### 10.1 Layout da tela

Cabeçalho com: nome do robô editável inline, toggle MODO SIMULADO/MODO REAL, botão "Executar em modo real".
Três abas: SUMÁRIO | GRÁFICO | PARÂMETROS.
Barra de ações flutuante: Custos ($), Salvar (💾), Backtest (🧪), Iniciar/Parar (▶/⏹), menu ⋮.
Aba Parâmetros: seções em acordeão (expandir/recolher), na ordem definida por cada estratégia.

### 10.2 Comportamentos globais do editor

Tooltips (?/ℹ): todos os parâmetros exibem ícone de ajuda com texto explicativo completo (conteúdo gerenciável via CMS/i18n).
Validação inline: campos obrigatórios não preenchidos exibem rótulo e linha em vermelho com mensagem "Preencha este campo"; mensagens de regra cruzada (ex.: "O número de saídas deve ser menor ou igual à quantidade inicial por ordem").
Guard de navegação: ao sair com alterações não salvas, exibir modal "Sair sem salvar?" com ações Cancelar/Confirmar.
Robô em execução: exibir banner "Robô em execução: não é possível fazer alterações nos parâmetros enquanto ele estiver executando. Pare o robô para fazer as alterações desejadas." e desabilitar todos os campos (somente leitura).

### 10.3 Seções comuns a múltiplas estratégias
As seções a seguir aparecem, com pequenas variações, na maioria dos editores. As especificações completas por estratégia estão nas seções 11 a 17.
Seção Mercado (comum a todos)
```text
CampoTipoOpçõesTooltipMercadoBotõesBM&F"Selecione o mercado em que o robô irá operar"CódigoChips multisseleçãoWIN% ·
WDO% · BIT% (varia por estratégia)"Selecione o ativo que o robô irá operar"
```
Seção Gráfico (maioria dos editores)
```text
CampoTipoOpçõesTipoBotõesCANDLESTICK · HEIKIN-ASHITempo gráficoDropdown ou Botões1 MIN · 5 MIN · 10 MIN · 15 MIN · 30
MIN · 60 MIN (Price Action adiciona 45 MIN)Habilitar suavização (Fonte A)ToggleRevela: Média Tipo (Simples/Exponencial)
+ Número de períodos
```
Seção Gerenciamento de Ordens / Parâmetros Gerais de Entrada
```text
CampoTipoOpçõesQuantidade por ordemNumérico—Sentido das operaçõesDropdownApenas comprado · Apenas vendido · Comprado e
vendidoModo de operaçãoToggleCANDLE ABERTO · CANDLE FECHADOTipo do envio de ordem de entradaToggleA MERCADO ·
LIMITESentido do Spread (condicional — LIMITE)ToggleA FAVOR · CONTRASpread para executar ordem limite
(condicional)Decimalex.: 0,15Tempo para execução limite (condicional)Numérico (s)ex.: 60Operação na expiração do limite
(condicional)ToggleEXECUTAR A MERCADO · CANCELAREntrada por indicadoresDropdownEntrar se todos sinalizarem · Entrar se
pelo menos um sinalizarBloqueio de nova entrada no mesmo dia após saídaToggleOff
```
Seção Filtros de Entrada (comum a maioria)
```text
FiltroCamposFiltro por média móvel de volumeToggle · Tipo (Simples/Exponencial) · Número de períodosFiltro por variação
percentualToggle · Nível (%) · Preço de referência (Fechamento dia anterior / Abertura dia atual) · Tipo (Maior que /
Menor que)Filtro por dia da semana5 Toggles individuais: SEG · TER · QUA · QUI · SEX
```
Seção Critérios de Saída (comum a todos, com variações)
```text
CampoTipoOpções / NotasSaída por indicadoresDropdownSair se pelo menos um sinalizar · Sair se todos sinalizaremHabilitar
reversõesToggleEncerra e abre posição no sentido oposto ao receber sinal contrárioDobrar posição
(Martingale)ToggleExibir alerta de risco; revela: fator de multiplicação, limite de dobradasStop fixo de perdaToggle +
Tipo + ValorTipo: Absoluto · Percentual · Financeiro; Valor numéricoStop fixo de ganhoToggle + Tipo + Valor + Tipo de
ordemTipo de ordem: MERCADO · LIMITESaídas de ganho (parciais)Toggle + Lista dinâmicaTipo de ordem; Qtd de saídas (1–5);
Ativar break-even; Tipo stop (ABSOLUTO/PERCENTUAL); Nível e Quantidade por saída. Validação: soma quantidades ≤ qtd por
ordemStop móvel de ganho (trailing)Toggle + Tipo + Ativação + RecuoAbsoluto · PercentualRealização parcialToggle
desabilitado (⚠ Descontinuada)Manter para compatibilidade legada
```
Seção Critérios de Saída Diário (comum a todos)
```text
CampoTipoOpçõesStop diário de perdaToggle + Valor R$—Stop diário de ganhoToggle + Valor R$—Parar após X trades no
diaToggle + Numérico + condiçãoParar se saldo Positivo · Negativo · Positivo ou NegativoUtilizar Break Even Financeiro
DiárioToggle + camposNível de ativação + nível de proteçãoUtilizar break even financeiro diário (Price Action)Toggle—
```
Seção Gerenciamento de Capital
```text
CampoTipoQuantidade de contratosNuméricoDobrar posição (Martingale)Toggle
```
Seção Horário de Operação / Restrições de Horário
```text
CampoTipoPadrãoHorário inicial para abrir posiçõesToggle + HH:MM09:05Horário final para abrir posiçõesToggle +
HH:MM17:00Janela de bloqueio 1Toggle + HH:MM início/fimOffJanela de bloqueio 2Toggle + HH:MM início/fimOff
```
Seção Módulo Day Trade
```text
CampoTipoPadrãoEncerrar posições no fim do diaToggle + HH:MMOn (17:55/18:00)
```
Seção Aumento de Posição (Piramidação)
```text
CampoTipoNotasAtivar aumento de posiçãoToggleQuando ativo, expõe qtd máxima de aumentos, critérios e qtd por
aumentoAviso permanenteTexto fixo"O robô sempre irá realizar os aumentos de posição após o Horário final de entrada e
durante janelas de bloqueio de horário, independentemente do tipo de ordem parametrizada."
```
Seção Informações (somente leitura)

Nome do robô, Estratégia, Data de criação, Modo de operação.


## 11. Editor — Setups Larry Williams
### 11.1 Seções e campos específicos
Seção Entrada por Setups
```text
CampoTipoOpçõesEntrada por indicadoresDropdownEntrada por indicadores (única opção nesta estratégia)Sentido das
operaçõesDropdownApenas comprado · Apenas vendido · Comprado e vendido
```
Setups disponíveis (cada um com toggle ON/OFF individual, ao ativar expande configurações):
Setup 9.1:
```text
CampoTipoAtivoCheckbox/ToggleNúmero de candlesNuméricoSentidoComprado / Vendido (Toggle)
```
Setup 9.2: estrutura idêntica ao 9.1
Setup 9.3: estrutura idêntica ao 9.1
Setup Williams Qualifica Ativo:
```text
CampoTipoPeríodoNuméricoSentidoComprado / Vendido (Toggle)
```
### 11.2 Ordem das seções no editor

Mercado
Gráfico (com suavização opcional)
Entrada por Setups
Filtros de Entrada
Aumento de Posição
Critérios de Saída
Critérios de Saída Diário
Gerenciamento de Capital
Horário de Operação
Módulo Day Trade
Informações


## 12. Editor — Indicadores Técnicos [Tangram 3.0]
### 12.1 Diferenças estruturais

Usa toggles (não checkboxes) para ativar cada indicador;
Cada indicador possui campo "Modo de Operação" próprio;
Campo "Sentido das operações" fica na seção Gráfico (não em Gerenciamento de Ordens);
Possui campo "Entrada por indicadores" (operador lógico E/OU).

### 12.2 Seção Gráfico
```text
CampoTipoOpçõesTipoBotõesCANDLESTICK · HEIKIN-ASHITempo gráficoDropdown1 MIN · 5 MIN · 10 MIN · 15 MIN · 30 MIN · 60
MINSentido das operaçõesDropdownApenas comprado · Apenas vendido · Comprado e vendido
```
### 12.3 Parâmetros gerais de entrada (Seção Indicadores Técnicos — topo)

## 12. Editor — Indicadores Técnicos [Tangram 3.0] (continuação)
### 12.3 Parâmetros gerais de entrada (topo da seção Indicadores Técnicos)
```text
CampoTipoOpçõesModo de operação globalToggleCANDLE ABERTO · CANDLE FECHADOTipo do envio de ordem de entradaToggleA
MERCADO · LIMITESentido do Spread (condicional — LIMITE)ToggleA FAVOR · CONTRASpread para executar a ordem limite
(condicional)Decimalex.: 0,15Tempo para execução limite (condicional)Numérico (s)ex.: 60Operação na expiração do limite
(condicional)ToggleEXECUTAR A MERCADO · CANCELAREntrada por indicadoresDropdownEntrar se todos os indicadores
selecionados para entradas sinalizarem · Entrar se pelo menos um indicador sinalizar
```
### 12.4 Catálogo completo de indicadores
Cada indicador possui toggle ON/OFF. Ao ativar, revelam-se os campos comuns e específicos.
Campos comuns a todos os indicadores:
```text
CampoTipoOpçõesHabilitar InversãoToggleInverte compra ↔ vendaModo de OperaçãoDropdownApenas entradas · Apenas saídas ·
Entradas e saídasForma de usoDropdown(opções específicas por indicador — listadas abaixo)
```

Indicador 1 — Médias Móveis
```text
CampoTipoOpçõesForma de usoDropdownCruzamento das médias · Posição das médias (preço acima/abaixo)Média Curta —
TipoDropdownSimples (Aritmética) · ExponencialMédia Curta — Valor usadoDropdownFechamento · Abertura · Máxima ·
MínimaMédia Curta — Número de períodosNuméricoex.: 9Média Curta — DeslocamentoNuméricoex.: 0Média Longa —
TipoDropdownSimples (Aritmética) · ExponencialMédia Longa — Valor usadoDropdownFechamento · Abertura · Máxima ·
MínimaMédia Longa — Número de períodosNuméricoex.: 40Média Longa — DeslocamentoNuméricoex.: 0
```

Indicador 2 — Cruzamento de 3 Médias Móveis
```text
CampoTipoOpçõesForma de usoDropdownCruzamento das médias · Posição das médiasAlinhamento TotalToggleQuando ativo: exige
que as 3 médias estejam alinhadas (curta > intermediária > longa para compra)Média Curta (MC) — TipoDropdownSimples ·
ExponencialMédia Curta (MC) — Valor usadoDropdownFechamento · Abertura · Máxima · MínimaMédia Curta (MC) — Número de
períodosNumérico—Média Intermediária (MI) — TipoDropdownSimples · ExponencialMédia Intermediária (MI) — Valor
usadoDropdownFechamento · Abertura · Máxima · MínimaMédia Intermediária (MI) — Número de períodosNumérico—Média Longa
(ML) — TipoDropdownSimples · ExponencialMédia Longa (ML) — Valor usadoDropdownFechamento · Abertura · Máxima ·
MínimaMédia Longa (ML) — Número de períodosNumérico—
```

Indicador 3 — HiLo Activator
```text
CampoTipoOpçõesForma de usoDropdownMudança no sentido · Sentido da escada do HiLoNúmero de períodosNumérico—
```

Indicador 4 — MACD
```text
CampoTipoOpçõesForma de usoDropdownCruzamento da linha MACD com a linha de sinal · Linha MACD acima/abaixo de zeroValor
usadoDropdownFechamento · Abertura · Máxima · MínimaTipo de médiaDropdownSimples (Aritmética) · ExponencialMédia curta —
Número de períodosNuméricoex.: 12Média longa — Número de períodosNuméricoex.: 26Linha de sinal — Número de
períodosNuméricoex.: 9Filtro de valorToggleRevela: "Comprar/vender apenas com MACD abaixo/acima do valor do filtro" +
campo Valor do filtro (decimal, ex.: 0)
```

Indicador 5 — ADX — DI+/DI−
```text
CampoTipoOpçõesForma de usoDropdownCruzamento do DI+ com DI− · DI+ acima/abaixo do DI−DI — Número de
períodosNuméricoex.: 14ADX — Suavizador (número de períodos)Numéricoex.: 14Filtro de valor mínimo do ADXToggle +
Valor—Filtro de valor máximo do ADXToggle + Valor—Filtro de Aumento/DiminuiçãoToggleRevela: "Permitir operações com
tendência" → Dropdown: Ficando mais forte · Ficando mais fraca
```

Indicador 6 — Estocástico (Pleno)
```text
CampoTipoOpçõesForma de usoDropdownCruzamento do %K com %D · Níveis de sobrecompra/sobrevendaPeríodos %KNuméricoex.:
5Períodos %DNuméricoex.: 3SuavizaçãoNuméricoex.: 3Nível sobrevendidoNuméricoex.: 20Nível sobrecompradoNuméricoex.: 80
```

Indicador 7 — VWAP
```text
CampoTipoOpçõesForma de usoDropdownRompimento · Compra acima / Vende abaixo · Vende acima / Compra abaixo
```
(Âncora diária — sem parâmetros adicionais de período)

Indicador 8 — IFR (RSI)
```text
CampoTipoOpçõesForma de usoDropdownCruzamento do IFR · IFR acima/abaixo de nívelValor usadoDropdownFechamento · Abertura
· Máxima · MínimaNúmero de períodosNuméricoex.: 14Nível sobrevendidoNuméricoex.: 30Nível sobrecompradoNuméricoex.: 70
```

Indicador 9 — Bandas de Bollinger
```text
CampoTipoOpçõesForma de usoDropdownCruzamento · Preço acima/abaixo da bandaValor usadoDropdownFechamento · Abertura ·
Máxima · MínimaNúmero de períodosNuméricoex.: 14Multiplicador de desvioDecimalex.: 2,00
```

Indicador 10 — Stop ATR
```text
CampoTipoOpçõesForma de usoDropdownMudança no sentido · Sentido do Stop ATRMédia — TipoDropdownSimples/Aritmética ·
Wilder/ExponencialMédia — Número de períodosNumérico—Desvio — MultiplicadorDecimalex.: 10,00
```

Indicador 11 — SAR Parabólico
```text
CampoTipoOpçõesForma de usoDropdownMudança no sentido · Sentido dos pontos do SARFator de aceleração inicialDecimalex.:
0,02Incremento do fator de aceleraçãoDecimalex.: 0,02Fator de aceleração máximoDecimalex.: 0,20
```

Indicador 12 — OBV (On-Balance Volume)
```text
CampoTipoOpçõesForma de usoDropdownMudança no sentido · Continuação do OBVMédia do OBV — TipoDropdownSimples ·
Wilder/ExponencialMédia do OBV — Número de períodosNuméricoex.: 15Desvio — MultiplicadorDecimalex.: 10,00Candles no
Mesmo SentidoNuméricoValidação: "Informe um número positivo"
```

Indicador 13 — Detector de Topos e Fundos
```text
CampoTipoOpçõesForma de usoDropdownMudança no sinal · Sentido do Topos e FundosNúmero de períodosBotões de seleção1 · 2
· 3 · 4
```

Indicador 14 — Pontos Pivot
```text
CampoTipoOpçõesDX — Distância para entradaDecimalex.: 100,00Utilizar Suporte 1Toggle—Utilizar Suporte 2Toggle—Utilizar
Resistência 1Toggle—Utilizar Resistência 2Toggle—Habilitar Contra TendênciaToggle—
```
### 12.5 Ordem das seções no editor

Mercado
Gráfico (inclui Sentido das operações)
Indicadores Técnicos (inclui parâmetros gerais de entrada + 14 indicadores)
Filtros de Entrada
Aumento de Posição
Critérios de Saída
Critérios de Saída Diário
Gerenciamento de Capital
Horário de Operação
Módulo Day Trade
Informações


## 13. Editor — Tangram
### 13.1 Diferenças em relação ao Indicadores Técnicos [Tangram 3.0]

NÃO possui campo "Modo de Operação" global (CANDLE ABERTO/FECHADO);
Stop fixo de perda possui campo adicional: "Stop fixo de perda em relação" → opção "À primeira entrada";
Stop móvel de ganho possui campo adicional: "Stop móvel de ganho em relação";
Todos os demais indicadores, seções e campos são estruturalmente idênticos ao Indicadores Técnicos [Tangram 3.0].

### 13.2 Campos adicionais em Critérios de Saída
```text
CampoTipoOpçõesStop fixo de perda em relaçãoDropdownÀ primeira entrada · À posição atualStop móvel de ganho em
relaçãoDropdownÀ primeira entrada · À posição atual
```
### 13.3 Ordem das seções
Idêntica ao Indicadores Técnicos [Tangram 3.0] (seção 12.5).

## 14. Editor — Fibonacci
### 14.1 Diferenças estruturais

NÃO possui seção "Gráfico" (sem seleção de timeframe);
NÃO possui seção "Indicadores Técnicos";
Possui seção exclusiva "Critérios de Entrada" com lógica Fibonacci;
Critérios de Saída usam níveis de retração em vez de pontos absolutos/percentuais.

### 14.2 Seção Critérios de Entrada (exclusiva)
```text
CampoTipoPadrãoComportamentoRetração de Fibonacci (%)Numérico—Nível de retração para entradaHorário inicialHH:MM—Início
da janela de busca de setupAmplitude diária mínimaNumérico—Variação mínima do dia para ativar a estratégiaUsar horário
final para abrir posiçõesToggleOFFCondicional: ao ativar, revela o campo abaixo→ Horário final para abrir
posiçõesHH:MM16:30Visível apenas quando toggle ativo
```
### 14.3 Seção Critérios de Saída (específica)
```text
CampoTipoOpçõesStop Loss por Retração de Fibonacci (%)Numérico—Stop Gain por Retração de Fibonacci (%)Numérico—
```
(Os stops de saída diária, horário de operação e demais seções comuns estão presentes normalmente)
### 14.4 Ordem das seções

Mercado
Critérios de Entrada (Fibonacci — exclusiva)
Filtros de Entrada
Aumento de Posição
Critérios de Saída (com stops em retração Fibonacci)
Critérios de Saída Diário
Gerenciamento de Capital
Horário de Operação
Módulo Day Trade
Informações


## 15. Editor — Toque na Média
### 15.1 Diferenças estruturais

Seção de filtros é chamada "Filtros" (não "Filtros de Entrada");
Possui seção exclusiva "Saída por toque na média";
Possui subseção "Realização parcial" funcional (não descontinuada);
Tempo gráfico é selecionado por botões (não dropdown).

### 15.2 Seção Gráfico
```text
CampoTipoOpçõesTempo gráficoBotões1 MIN · 5 MIN · 10 MIN · 15 MIN · 30 MIN · 60 MIN
```
### 15.3 Seção Critérios de Entrada (exclusiva)
```text
CampoTipoOpçõesMédia móvel — Número de períodosNumérico—Média móvel — Valor usadoDropdownFechamento · Abertura · Máxima
· MínimaMédia móvel — TipoDropdownSimples · ExponencialSentido das operaçõesDropdownApenas comprado · Apenas vendido ·
Comprado e vendido
```
### 15.4 Seção Critérios de Saída (campos específicos)
```text
CampoTipoOpçõesStop fixo de perdaToggle + Valor—Stop fixo de ganhoToggle + Valor—Saída por toque na médiaToggleExclusivo
desta estratégia: encerra a posição quando o preço toca a média configuradaRealização parcialToggle + Percentual de
saída + Valor alvoFuncional (não descontinuada neste editor)
```
### 15.5 Ordem das seções

Mercado
Gráfico
Critérios de Entrada (Toque na Média — exclusiva)
Filtros
Aumento de Posição
Critérios de Saída
Critérios de Saída Diário
Gerenciamento de Capital
Horário de Operação
Módulo Day Trade
Informações


## 16. Editor — Price Action
### 16.1 Diferenças estruturais

Timeframe de 45 MIN disponível (único editor com esse intervalo);
Campo "Modo de operação" (CANDLES ABERTOS / CANDLES FECHADOS) na seção Gráfico;
Campo "Tipo de operação" exclusivo (rompimento do candle anterior ou de referência);
Stop fixo usa botões ABSOLUTO | PERCENTUAL (não dropdown);
Campo "Utilizar break even financeiro diário" em Critérios de Saída Diário.

### 16.2 Seção Gráfico
```text
CampoTipoOpçõesTipo de gráficoBotõesCANDLESTICK · HEIKIN-ASHITempo gráficoBotões1 MIN · 5 MIN · 10 MIN · 15 MIN · 30 MIN
· 45 MIN · 60 MINModo de operaçãoBotõesCANDLES ABERTOS · CANDLES FECHADOS
```
### 16.3 Seção Critérios de Entrada (exclusiva)
```text
CampoTipoOpçõesTipo de operaçãoBotõesROMPIMENTO DO CANDLE ANTERIOR · ROMPIMENTO DO CANDLE DE REFERÊNCIASentido da
operaçãoDropdownA FAVOR DA TENDÊNCIA · CONTRA A TENDÊNCIASentido do rompimentoDropdownPara cima · Para baixo · Qualquer
sentidoDistanciamento DXNumérico—
```
### 16.4 Seção Critérios de Saída (campos específicos)
```text
CampoTipoOpçõesStop fixo de perda — TipoBotõesABSOLUTO · PERCENTUAL (%)Stop fixo de perda — ValorNumérico—Stop fixo de
ganho — TipoBotõesABSOLUTO · PERCENTUAL (%)Stop fixo de ganho — ValorNumérico—Tipo de ordem do stop gainDropdownMERCADO
· LIMITE
```
### 16.5 Seção Critérios de Saída Diário (campo adicional)
```text
CampoTipoUtilizar break even financeiro diárioToggle
```
### 16.6 Ordem das seções

Mercado
Gráfico (com Modo de operação e 45 MIN)
Critérios de Entrada (Price Action — exclusiva)
Filtros de Entrada
Aumento de Posição
Critérios de Saída
Critérios de Saída Diário
Gerenciamento de Capital
Horário de Operação
Módulo Day Trade
Informações


## 17. Editor — RenkoBot Start
### 17.1 Diferenças estruturais — Editor 100% Renko

Mercado disponível: apenas BM&F;
Tipo do Gráfico: somente RENKO NEGÓCIO A NEGÓCIO;
Gráfico configurado por Ticks (botões) + Tamanho do bloco em pontos;
Indicadores específicos para Renko (diferentes dos outros editores);
Stops configurados com base em blocos Renko (número de blocos), não em pontos/percentual.

### 17.2 Seção Mercado
```text
CampoTipoOpçõesMercadoBotõesBM&F (único)CódigoChipsWDO% · WIN%
```
### 17.3 Seção Gráfico (exclusiva)
```text
CampoTipoOpçõesTipo do GráficoBotõesRENKO NEGÓCIO A NEGÓCIO (único)TicksBotões5R · 6R · 7R · 8R · 9R · 10R · 11RTamanho
do bloco em pontosNumérico—
```
### 17.4 Seção Indicadores (específicos para Renko)
Os indicadores disponíveis neste editor são diferentes dos demais:
```text
IndicadorCampos específicosMudança no sentido do bloco RenkoForma de uso (Mudança no sentido · Confirmação de N blocos);
Número de blocos de confirmaçãoDetector de topos e fundosNúmero de períodos (botões 1–4)HiLo ActivatorNúmero de
períodosCruzamento de 2 Médias MóveisTipo MA1/MA2 (Simples/Exponencial); Valor usado; PeríodosIFRForma de uso; Valor
usado; Períodos; Nível sobrevendido/sobrecompradoVWAPForma de usoBandas de BollingerValor usado; Períodos; Multiplicador
de desvio
```
### 17.5 Seção Critérios de Saída (específica)
Os stops são definidos em número de blocos Renko, não em pontos:
```text
CampoTipoOpçõesStop fixo de perda (blocos)Toggle + NuméricoQuantidade de blocos RenkoStop fixo de ganho (blocos)Toggle +
NuméricoQuantidade de blocos RenkoStop móvel (blocos)Toggle + Numérico—
```
### 17.6 Ordem das seções

Mercado
Gráfico (Renko — exclusiva)
Indicadores (set específico Renko)
Filtros de Entrada
Critérios de Saída (stops em blocos)
Critérios de Saída Diário
Gerenciamento de Capital
Horário de Operação
Módulo Day Trade
Informações


## 18. Execução de Robôs (EXE)
| ID | Requisito | Prior. |
| --- | --- | --- |
| RF-EXE-01 | Salvar parâmetros com validação completa (JSON Schema + regras cruzadas). Registrar "Último salvar" com data/hora, exibido no Sumário. | E |
| RF-EXE-02 | Iniciar execução somente com parâmetros válidos e salvos; transição para estado Executando com badge verde. | E |
| RF-EXE-03 | Parar execução: cancela ordens pendentes; pergunta se deve encerrar posição aberta. | E |
| RF-EXE-04 | Bloquear edição de parâmetros durante execução (banner + campos somente leitura). | E |
| RF-EXE-05 | Modo Simulado: preencher ordens com política configurável por robô (Pessimista por padrão; Moderado e Otimista disponíveis), exibindo o selo correspondente no card e no relatório. | E |
| RF-EXE-06 | Modo Real: exigir confirmação explícita, corretora vinculada, termo de risco aceito e plano elegível; registrar trilha de auditoria de toda ordem enviada. | E |
| RF-EXE-07 | Resolver contrato contínuo (sufixo %) para o vencimento corrente; efetuar rolagem automática; registrar o contrato efetivo de cada ordem (ex.: WDOF26, WDOG26). | E |
| RF-EXE-08 | Persistir todas as decisões/ordens com carimbo de tempo, preço, quantidade, tipo (mercado/limite), status (executada/cancelada/rejeitada/expirada) e classificação entrada/saída. | E |
| RF-EXE-09 | Recuperação após falha: motor deve reidratar estado de posição dos robôs em execução sem duplicar ordens (idempotência). | E |

## 19. Relatório do Robô — Aba Sumário (SUM)
**Rota:** `/private/robos/[id]/sumario`
### 19.1 Cabeçalho e metadados

Linha: #id · [Tipo de Simulador] · [Estratégia] · ● [Status]
ÚLTIMO SALVAR: DD/MM/AAAA HH:MM
Filtro Período ▾ (Hoje / 7 dias / 30 dias / Intervalo customizado com calendário)
Botão EXPORTAR CSV

### 19.2 Cards de métricas principais
```text
CardConteúdoRetorno líquidoR$ acumulado (verde/vermelho)Evolução do patrimônioGráfico de linha do equity com eixo
temporal e tooltip de data/valorCotação do ativoCódigo do contrato corrente, preço e variação % em tempo
realPatrimônioCapital inicial + resultadoPosição atual"Não posicionado" ou direção/quantidade/preço médioDrawdown
máximoPercentualNúmero de tradesTotal de trades fechadosTrades com lucroPercentual de acertoFator de lucroLucro bruto ÷
prejuízo brutoSaldo diárioResultado do dia + link de ajuda "Por que o meu robô ainda não operou?"
```
### 19.3 Relatório Completo (acordeão expansível)
Ao expandir "RELATÓRIO COMPLETO", aparecem 8 cards detalhados:
```text
CardMétricasContaSaldo inicial · Patrimônio · Taxas/Custos OperacionaisRetornoBruto % · Bruto dia % · Bruto ano % ·
Líquido % · Líquido dia % · Líquido ano %RiscoFator lucro · Resultado esperado (R)⋅Drawdowninicial(R) · Drawdown inicial
(R
```
)⋅Drawdowninicial(R e %) · Drawdown máximo (R$ e %)Resumo dos tradesNº total · Lucro bruto · Prejuízo bruto · Balanço bruto · Lucro líquido · Prejuízo líquido · Balanço líquidoTrades com lucroQuantidade · % · Lucro médio · Lucro máximo · Lucro máximo % · Nº máximo consecutivos · Lucro total consecutivoTrades com prejuízoQuantidade · % · Prejuízo médio · Prejuízo máximo · Prejuízo máximo % · Nº máximo consecutivos · Prejuízo total consecutivoTrades compradosNº total · % · Trades com lucro · % de acerto · Trades com prejuízo · % prejuízoTrades vendidos(mesma estrutura de Trades comprados)
### 19.4 Lista de Ordens
Filtros:
FiltroOpçõesStatus da Ordem ▾cancelada · executada · rejeitada · expiradaPeríodo ▾Atalhos: 30 dias · 7 dias · Hoje; Calendário com campos Início e Fim (navegação mensal)

Botão EXPORTAR ORDENS (CSV)

Colunas da tabela:
```text
ColunaDescrição(i)Ícone azul de detalhe — abre modal "Eventos da ordem"#Número da ordem (ID)Data /
HoraTimestampAtivoContrato efetivo (ex.: WDON26, BITM26)C/VCompra (C) ou Venda (V)QuantidadeQtd. solicitadaPreço
limiteTipo de ordem (mercado ou valor limite)Statusexecutada · cancelada · rejeitada · expiradaTipoentrada (teal) ·
saída (laranja)Quantidade executada—Preço médioPreço médio de execuçãoResultado (Abs.)Variação em pontosResultado
%Variação percentualResultado (R$)P&L em reais (verde = lucro, vermelho = prejuízo)
```
Paginação: "Ordens por página: 30 ▾" + controles « ‹ X-Y de Z › »
### 19.5 Modal "Eventos da ordem #[ID]"
Aberto ao clicar no ícone (i) de uma linha. Exibe tabela com colunas:
```text
ColunaDescriçãoData/HoraTimestamp do eventoEventoEnviada · Confirmada · Executada · Rejeitada · CanceladaDescriçãoCódigo
de status (ex.: `OKMotivoTexto explicativo (ex.: "Stop Movel na compra. Ganho=500.00")
```

Botão FECHAR (canto inferior direito)


## 20. Aba Gráfico do Robô (GRA)
**Rota:** `/private/robos/[id]/grafico`
| ID | Requisito | Prior. |
| --- | --- | --- |
| RF-GRA-01 | Incorporar componente de gráfico financeiro profissional (TradingView Charting Library ou equivalente) com candles do ativo do robô. | I |
| RF-GRA-02 | Timeframes disponíveis: 1 min, 5 min, 10 min, 15 min, 30 min, 45 min, 1 hora, 1 dia, 1 semana, 2 semanas, 1 mês. | I |
| RF-GRA-03 | Tipos de gráfico disponíveis: Barras, Velas, Candles vazios, Colunas, Linha, Linha com marcadores, Step line, Área, HLC area, Linha Base, Máxima-Mínima, Heiken Ashi. | I |
| RF-GRA-04 | Atalhos de período: 5y · 1y · 6m · 3m · 1m · 5d · 1d. | I |
| RF-GRA-05 | Sobrepor automaticamente os indicadores configurados no robô e marcar entradas/saídas executadas no gráfico. | I |
| RF-GRA-06 | Biblioteca de indicadores disponíveis para adição manual (~80 indicadores): Accelerator Oscillator, Acumulação/Distribuição, ADX DI+/DI−, Aroon, Avanço/Declínio, Bandas de Bollinger, %B, Bandas de Erro Padrão, Canais de Keltner, Canais Donchian, Canal de Média Móvel, Canal de Preço, Coeficiente de Correlação, entre outros. | I |
| RF-GRA-07 | Ferramentas de desenho: linhas de tendência, retângulos, anotações, níveis de Fibonacci, etc. | I |
| RF-GRA-08 | Exibir aviso fixo: "Certifique-se de que o ativo selecionado no gráfico é o mesmo contrato exibido no sumário do robô." | D |
| RF-GRA-09 | Persistir layout do gráfico por usuário (salvar/desfazer/refazer). | D |

## 21. Backtests (BCK)
**Rota:** `/private/backtests`
### 21.1 Página de listagem
```text
ElementoDescriçãoContador de créditosBadge "Disponíveis: N" (ícone ℹ com tooltip de explicação)AbasBACKTEST UNITÁRIO ·
BACKTEST EM MASSA · PROCESSANDO · ARQUIVADOSBotãoCRIAR BACKTEST EM MASSABotões (bloqueados — não clicar)COMPRAR 10
BACKTESTS · COMPRAR 100 BACKTESTSFiltrosEstratégias ▾ (dropdown multi-seleção) · Resultado ▾BuscaCampo "Buscar
backtests" + ícone lupa
```
Card de resultado:

#id + Nome + Estratégia + Selo de cenário (Moderado/Conservador/Otimista)
Mini-gráfico de equity (linha azul)
Retorno líquido (R$, verde/vermelho) + Fator de lucro
Acordeão "MAIS INFO ∧/∨" com métricas adicionais
Menu ⋮ (opções de ação)
Link direto para relatório completo via #id

### 21.2 Criação Unitária
Acionada pelo ícone 🧪 no editor. Modal "Criar backtest":
```text
CampoTipoPadrãoRegrasBacktests disponíveisIndicador somente leituraex.: 33.857Decrementa 1 crédito por execuçãoNome do
backtestTextoNome do robô—Capital para SimulaçãoMoedaR$ 1.000,00—Custos operacionaisDropdownCusto Padrão · perfis
customizados—Tipo do backtestDropdownCenário moderado · conservador · otimista—Data inicialDate picker——Data finalDate
picker——Atalhos de períodoBotões1 MÊS · 3 MESES · 6 MESES · 1 ANO · 2 ANOSPreenchem automaticamente as
datasAçõesBotõesCRIAR EM MASSA · CRIAR UNITÁRIOUnitário: enfileira 1 execução. Em Massa: abre editor de variações
```
### 21.3 Criação em Massa (varredura de parâmetros)
**Rota:** `/private/criar/backtest/[robotId]`
| ID | Requisito | Prior. |
| --- | --- | --- |
| RF-BCK-01 | Página dedicada replicando todas as seções do editor de parâmetros, permitindo atribuir múltiplos valores por campo: cada valor adicional vira um chip removível (ex.: "Wilder/Exponencial ✕", "15 ✕", "10,00 ✕"). | I |
| RF-BCK-02 | Rodapé fixo exibindo: "Número de backtests: N" (combinação cartesiana) com limite máximo de 1.000 backtests por lote e validação do saldo de créditos. | I |
| RF-BCK-03 | Ações no rodapé: botão Resetar (limpa todas as variações) + botão Iniciar backtest (enfileira o lote). | I |
| RF-BCK-04 | Processamento assíncrono em fila com paralelismo controlado; aba PROCESSANDO exibe progresso "N/Total backtests executados"; notificação ao concluir. | I |
### 21.4 Relatório de Backtest Concluído
**Rota:** `/private/backtests/[id]/sumario`
Estrutura idêntica ao Sumário do Robô (seção 19), com as seguintes especificidades:

Metadado: #id · [Cenário] · [Estratégia] · 🔵 Finalizado
Abas: SUMÁRIO | PARÂMETROS
Botão EXPORTAR CSV no topo do relatório
Sem cotação em tempo real (dados históricos)
Lista de ordens com as mesmas colunas e filtros do Sumário do Robô

### 21.5 Comparativo de Lote em Massa

### 21.5 Comparativo de Lote em Massa
| ID | Requisito | Prior. |
| --- | --- | --- |
| RF-BCK-05 | Visão comparativa tabular dos resultados do lote, ordenável por qualquer métrica (retorno, fator de lucro, drawdown, nº de trades, trades com lucro). | D |
| RF-BCK-06 | Ação "Aplicar parâmetros ao robô" a partir do melhor resultado identificado no comparativo. | D |
| RF-BCK-07 | Garantir paridade de lógica entre backtest e execução ao vivo (mesmo core de estratégia), incluindo custos e calendário de pregão da B3 (feriados). | E |

## 22. Ranking (RNK)
**Rota:** `/private/ranking`
### 22.1 Descrição
Página de ranking público dos robôs da plataforma em modo simulado, permitindo descoberta de estratégias de alto desempenho entre todos os usuários.
### 22.2 Filtros disponíveis
```text
FiltroTipoOpçõesPeríodo de referênciaDropdown/Botões1 semana · 1 mês · 3 meses · 6 meses · 1 ano · Desde o
inícioEstratégiaDropdown multi-seleçãoTodos os tipos de estratégiaMercado/AtivoDropdownBM&F · WIN · WDO ·
BITCategoriaDropdownTodas · Com lucro · Sem lucro
```
### 22.3 Tabela de ranking
Colunas (todas ordenáveis ↑↓):
```text
ColunaDescriçãoPosiçãoRanking numéricoRobôNome do robô + íconeEstratégiaTipo de estratégia-modeloRetorno no Período%
(destaque em verde/vermelho)Drawdown% máximo no períodoTradesNúmero total de tradesAcerto% de trades com lucroFator de
LucroLucro bruto / Prejuízo brutoAtivoCódigo do contratoSimuladorPessimista · Moderado · Otimista
```
### 22.4 Interações

Clique em uma linha expande card com mini-gráfico de equity e métricas resumidas;
Clique no nome do robô navega para o Sumário (se pertencente ao usuário logado) ou abre visualização somente leitura;
Paginação com controles de página e seletor de itens por página.


## 23. Portfólio (PRT)
**Rota:** `/private/portfolio`
### 23.1 Descrição
Visão consolidada de todos os robôs e estratégias assinadas do usuário, agregando performance total da carteira automatizada.
### 23.2 Componentes
```text
ComponenteDescriçãoHeader de métricasResultado total do dia (R$) · Patrimônio consolidado · Retorno total (%) · Número
de robôs ativosGráfico de evolução consolidadaCurva de patrimônio somada de todos os robôs, com filtros de período
(Semana / Mês / 3m / 6m / 1a / Início)Distribuição por ativoGráfico de pizza ou barras com exposição por ativo (WIN,
WDO, BIT)Distribuição por estratégiaBreakdown de retorno por tipo de estratégia-modeloLista de robôs no portfólioTabela
com: Nome, Estratégia, Ativo, Patrimônio, Retorno (%), Resultado do dia, Status
```

## 24. SmartStore — Loja (STR)
**Rota:** `/smarttstore`
### 24.1 Header da SmartStore

Logo "SmarttStore" (identidade própria da loja)
Botão Meus robôs (canto superior direito) — navega para /private/robos
Avatar do usuário

### 24.2 Seção "Destaques" (Carrossel)

Carrossel horizontal com setas de navegação < e >
Indicador de páginas (dots) — ex.: 2 páginas
Estrutura de cada card de estratégia em destaque:

```text
ElementoDescriçãoAvatar circularImagem da estratégia (600×600px)Nome da estratégiaTexto em negritoNome do autorLink para
perfil do estrategistaMini-gráficoLinha de evolução do patrimônio simuladoAviso*Relatório gerado através de
simulaçãoRetorno no período (%)Verde ou vermelhoMercadoBadge (ex.: BMF)Preçoa partir de R$ X,XX/mêsSubtexto"Estratégia
sem associação de plano" (quando aplicável)Botão primárioAssinar (verde/teal)Link secundárioMais detalhes
```
### 24.3 Barra de atalhos (abaixo do carrossel)
5 botões de navegação rápida com ícone + texto:
BotãoDestinoRanking de ClientesRanking SmartStorePlanosPágina de planosBenefícios ExclusivosPágina de benefíciosSmarttPlay/private/smarttplayBacktest/private/backtests
### 24.4 Seção "Ranking de Estratégias"

Subtítulo: "Aproveite as ofertas exclusivas e turbine suas operações com estratégias de alta performance."
Período de referência: 3 meses (exibido como texto; não alterável nesta view)
Ícone de filtro (funil) no canto superior direito da tabela

Colunas da tabela (todas ordenáveis ↑↓):
```text
ColunaDescriçãoEstratégiaNome + avatar miniaturaAutorNome do estrategista parceiroRetorno no Período% (ordenação padrão:
decrescente)DrawdownR$ absolutoDias OperandoNúmero de dias com tradesCapital SugeridoR$ mínimo recomendadoLucro médio
mensalR$ médio por mêsAssinaturasNúmero de assinantes ativos(Ações)Botão Assinar + ícone + (expandir) + ícone ∨
(colapsar)
```
Expansão de linha: ao clicar em +, a linha expande exibindo mini-gráfico e métricas adicionais da estratégia.
### 24.5 Página de Detalhes da Estratégia
**Rota:** `/smarttstore/detalhes/[id]`
Header
```text
ElementoDescriçãoBreadcrumbEstratégias >> [Nome da estratégia]Avatar circularImagem da estratégiaNomeTexto em
negritoAutorLink teal para perfilBadge de mercadoEx.: BMF (pill azul escuro)Preço (área direita)"Assine esta estratégia
/ a partir de R$ X,XX/mensal"Botão fixoAssinar (teal, fixo no scroll)
```
Abas de navegação
AbaConteúdoIndicadoresGráfico + métricas de performance + tabela de preços por nívelDescriçãoTexto descritivo da estratégia fornecido pelo estrategistaNíveis de exposiçãoExplicação sobre contratos por nívelPergunte ao EstrategistaCampo de pergunta + histórico público de Q&ADúvidasFAQ padrão da plataforma (13 perguntas)DisclaimerTexto legal obrigatório
Aba "Indicadores" — Filtros de período
Botões de seleção: Semana · Mês · 3 meses · 6 meses · 1 ano · 2 anos · Início
Aba "Indicadores" — Cards de métricas
MétricaTipoRetorno no período% (verde/vermelho)Fator de lucroDecimalPerda máxima%Nº de tradesInteiroTrades com lucro%

Botão Mais Informações (verde)
Mini-gráfico de linha (evolução do patrimônio)
Aviso: *Relatório gerado através de simulação

Aba "Indicadores" — Tabela de Planos por Nível
Seção "Escolha qual nível se adequa ao seu perfil ⓘ":
CampoNível 1Nível 2Nível NContratos*Até XAté YAté ZCapital sugerido*R$ X.000,00R$ Y.000,00R$ Z.000,00ValorR$ A,00/mensalR$ B,00/mensalR$ C,00/mensalAçãoQuero AssinarQuero AssinarQuero Assinar

O número de níveis varia por estratégia. Cada estratégia define seus próprios limiares de contratos, capital sugerido e preço.

Aba "Pergunte ao Estrategista"
```text
ElementoDescriçãoCampo de textoInput para nova perguntaBotãoPerguntarHistórico "Últimas feitas"Lista de perguntas
públicas com resposta do estrategistaEstado vazio"Não há mais perguntas"
```
Aba "Dúvidas" — FAQ padrão (13 perguntas)

Preciso assinar algum plano na plataforma para assinar uma estratégia?
O estrategista vai operar por mim?
Tenho que fazer o download de algum programa, como o Profit, para utilizar?
Qual a diferença entre a plataforma e as plataformas de Copy Trade?
Quais ativos os robôs negociam?
Quais corretoras estão integradas com a plataforma?
Qual o capital mínimo para negociar com robôs?
Em qual janela de tempo os robôs negociam?
Preciso manter a plataforma ligada para os robôs funcionarem?
É seguro? Preciso depositar alguma coisa? Tenho medo de arriscar.
Posso executar as estratégias assinadas no Simulador?
Como posso obter ajuda para usar as estratégias?
Como faço para cancelar minha assinatura?

Rodapé: "Ainda ficou com dúvidas? Converse com o nosso time de atendimento." + link Canais de atendimento
Aba "Disclaimer"
Texto legal completo incluindo:

Aviso de risco de mercado (rentabilidade passada não garante resultado futuro)
Declaração dos analistas responsáveis (conforme regulamentação CVM)
Identificação do analista: nome, certificação (CNPI-P), número de registro
Ativos negociados pela estratégia
Declaração de independência de remuneração


## 25. Gráfico Standalone (GRS)
**Rota:** `/private/grafico`
### 25.1 Descrição
Gráfico de mercado independente (não vinculado a nenhum robô específico), baseado em TradingView embedded, para análise manual de ativos.
### 25.2 Componentes
```text
ComponenteOpções disponíveisTimeframes1 min · 5 min · 10 min · 15 min · 30 min · 45 min · 1 hora · 1 dia · 1 semana · 2
semanas · 1 mêsAtalhos de período5y · 1y · 6m · 3m · 1m · 5d · 1dTipos de gráficoBarras · Velas · Candles vazios ·
Colunas · Linha · Linha com marcadores · Step line · Área · HLC area · Linha Base · Máxima-Mínima · Heiken
AshiFerramentas de desenhoToolbar lateral completa (linhas, formas, Fibonacci, anotações, medições, etc.)Biblioteca de
indicadores~80+ indicadores técnicos adicionáveis manualmente
```
### 25.3 Diferenças em relação ao Gráfico do Robô

Não há sobreposição automática de indicadores de robô
Não há marcação de entradas/saídas executadas
Permite qualquer ativo (não limitado ao ativo do robô)
Navegação independente da sidebar de robôs


## 26. Minha Conta (CTR)
**Rota base:** `/private/conta`
### 26.1 Aba Perfil
**Rota:** `/private/conta/perfil`
```text
SeçãoCampoTipoDados pessoaisNome completoInput textoDados pessoaisE-mailInput texto (readonly após confirmação)Dados
pessoaisTelefoneInput textoDados pessoaisCPF/CNPJInput textoFoto do perfilAvatarUpload de imagemSegurançaAlterar
senhaLink/BotãoSegurançaAtivar MFAToggle
```
### 26.2 Aba Assinaturas
**Rota:** `/private/conta/assinatura`
```text
ElementoDescriçãoPlano atualNome do plano + data de renovação + valorProdutos/Estratégias assinadasLista de estratégias
SmartStore ativas com: nome, autor, nível, valor/mês, data de início, botão CancelarCartões de pagamento
cadastradosLista de cartões (últimos 4 dígitos, bandeira, validade) + botão Adicionar cartão
```
### 26.3 Aba Corretoras
**Rota:** `/private/conta/corretoras`
```text
ElementoDescriçãoCorretoras integradas disponíveisXP Investimentos · BTG Pactual (listadas como opções)Corretoras
vinculadasLista das contas já conectadas com status (ativa/inativa)BotãoADICIONAR (abre fluxo de vinculação OAuth/API da
corretora)
```
### 26.4 Aba Preferências
**Rota:** `/private/conta/preferencias`
```text
CampoTipoDescriçãoNotificações por e-mail — Robô iniciadoCheckbox—Notificações por e-mail — Robô
paradoCheckbox—Notificações por e-mail — Ordem executadaCheckbox—Notificações por e-mail — Stop diário
atingidoCheckbox—Notificações por e-mail — Backtest concluídoCheckbox—Notificações por e-mail — NewsletterCheckbox—Tipo
de simulador padrãoDropdownPessimista · Moderado · Otimista
```
### 26.5 Aba Últimos Acessos
**Rota:** `/private/conta/acessos`
Tabela com colunas:
```text
ColunaDescriçãoIPEndereço IP do acessoData/HoraTimestamp do loginDispositivo/NavegadorUser agent
simplificadoLocalizaçãoPaís/Cidade (quando disponível)
```

## 27. Manager (MGR)
**Rota base:** `/private/manager`
O módulo Manager é destinado a estrategistas parceiros que comercializam estratégias via SmartStore.
### 27.1 Header global do Manager
Presente em todas as abas:
```text
ElementoDescriçãoÍcone + título👥 ManagerMétricas do períodoResultados de [Mês/Ano] · Qtd. de clientes · Total de Vendas
(R)⋅Descontos(R) · Descontos (R
```
)⋅Descontos(R) · Estornos (R)⋅ReceitaBruta(R) · Receita Bruta (R
)⋅ReceitaBruta(R)
### 27.2 Navegação por abas
```text
AbaRotaDashboard/private/manager/home/dashboardFinanceiro/private/manager/home/financialMinha
Carteira/private/manager/home/walletPerfil/private/manager/home/profilePerguntas e Respostas/private/manager/home/faq
```
### 27.3 Aba Dashboard
**Rota:** `/private/manager/home/dashboard`
```text
ElementoDescriçãoCards de resumoQtd. de clientes · Total de Vendas (R)⋅Descontos(R) · Descontos (R
```
)⋅Descontos(R) · Estornos (R)⋅ReceitaBruta(R) · Receita Bruta (R
)⋅ReceitaBruta(R) (com destaque do período: "Resultados de Mês/Ano")Gráfico de vendasEvolução de receita no períodoFiltro de períodoDropdown de mês/anoTabela de produtosLista de estratégias publicadas com métricas de vendaEstado vazio"Você ainda não comercializa produtos financeiros" + Botão Criar produto
### 27.4 Aba Financeiro
**Rota:** `/private/manager/home/financial`
```text
ElementoDescriçãoFiltro de anoDropdown (ex.: 2026, 2025…)BotãoVer extrato financeiroTabela de transaçõesDATA · DESCRIÇÃO
· VALOR · TIPOEstado vazioMensagem de ausência de movimentações
```
### 27.5 Aba Minha Carteira
**Rota:** `/private/manager/home/wallet`
ElementoTipoDescriçãoSaldo disponívelExibiçãoR$ disponível para saqueLançamentos futurosExibiçãoR$ a receber (ainda não liquidados)Toggle "Lançamentos futuros"ToggleExibe/oculta lançamentos futuros na tabelaValor para retirarInput numéricoR$ (mínimo R$ 300,00; máximo R$ 3.000,00 por saque)BotãoPrimárioSacarBotãoSecundárioCréditos na plataforma (converter saldo em créditos de backtest)Tabela de transações—Colunas: DATA · TRANSAÇÃO · VALOR
### 27.6 Aba Perfil
**Rota:** `/private/manager/home/profile`
Seção "Dados do perfil"
```text
CampoTipoPlaceholder / PadrãoNome do autor (SmartStore)Input texto"Estrategista SmarttManage"Imagem padrão para
estratégiasUpload de imagem600×600pxBotão—Editar (habilita os campos; todos ficam readonly por padrão)
```
Seção "Dados bancários"
```text
CampoTipoPadrão / OpçõesCPF ou CNPJInput texto—Nome completo ou razão socialInput texto—BancoDropdown"321 SCD S.A."
(padrão); lista completa de bancosAgênciaInput texto—ContaInput texto—Dígito de verificaçãoInput texto—Tipo de chave
PIXDropdownCPF/CNPJ · E-mail · Telefone · Chave aleatóriaChave PIXInput textoDesabilitado até selecionar
tipoBotão—Editar
```

Link Termos de Uso (abre PDF em nova aba)
Regra: todos os campos ficam desabilitados (somente leitura) enquanto o botão Editar não for acionado.

### 27.7 Aba Perguntas e Respostas
**Rota:** `/private/manager/home/faq`
SeçãoDescriçãoPerguntas RecebidasLista de perguntas enviadas por usuários sobre as estratégias do Manager; estado vazio: "Você não tem perguntas para responder."Últimas perguntas respondidasHistórico das respostas dadas pelo Manager; estado vazio: "Você ainda não respondeu nenhuma pergunta."

Esta aba é o ponto de gestão do Manager para responder as perguntas exibidas na aba "Pergunte ao Estrategista" das páginas de detalhes das estratégias na SmartStore.


## 28. Regras de Negócio Transversais (RN)
| ID | Requisito | Prior. |
| --- | --- | --- |
| RN-01 | Ambientes estanques: robôs, relatórios e contadores são sempre filtrados pelo ambiente selecionado (Simulado/Real); um robô pertence a exatamente um ambiente. | E |
| RN-02 | Unidades de stop por segmento: valores "Absolutos" representam pontos no BM&F e centavos na Bovespa; o rótulo do campo deve refletir isso dinamicamente. | E |
| RN-03 | Validação de saídas parciais: soma das quantidades das saídas de ganho ≤ quantidade por ordem; número de saídas ∈ {1, 2, 3, 4, 5}; exibir mensagem de validação em vermelho quando violado. | E |
| RN-04 | Aumentos de posição ignoram restrições de horário de entrada (comportamento documentado) — manter aviso explícito ao usuário na interface. | I |
| RN-05 | Créditos de backtest: cada execução unitária consome 1 crédito; lote em massa consome 1 crédito por combinação; créditos adquiríveis em pacotes (10/100) e/ou concedidos por plano; saldo exibido em tempo real. | I |
| RN-06 | Parada diária por trades: a condição "Parar após X trades" é avaliada a partir do X-ésimo trade e a cada trade subsequente, verificando o saldo diário conforme configuração (positivo / negativo / ambos). | I |
| RN-07 | Robô arquivado não executa, não consome limites do plano e pode ser restaurado. | I |
| RN-08 | Nome de robô único por conta e ambiente. | D |
| RN-09 | Rolagem automática de contratos: ao usar sufixo % (WIN%, WDO%, BIT%), o sistema resolve para o vencimento corrente e efetua rolagem sem intervenção do usuário; o contrato efetivo é registrado em cada ordem. | E |
| RN-10 | Simulador pessimista como padrão: novas contas e novos robôs em Modo Simulado usam o simulador pessimista, evitando resultados irrealistas. | E |
| RN-11 | Limite de lote de backtest em massa: máximo 1.000 combinações por lote; validar antes de enfileirar. | I |
| RN-12 | Assinatura de estratégia SmartStore: ao assinar, um robô é criado automaticamente na conta do assinante com os parâmetros pré-configurados pelo estrategista, no nível de contratos selecionado. | I |
| RN-13 | Estrategista parceiro (Manager): saque mínimo R$ 300,00, máximo R$ 3.000,00 por operação; saldo disponível ≠ lançamentos futuros (ainda não liquidados). | I |
| RN-14 | Robô em execução é imutável: qualquer alteração de parâmetros requer parada prévia; o sistema rejeita (HTTP 409) tentativas de atualização de parâmetros com robô no estado "executando". | E |
| RN-15 | Break even financeiro diário: após atingir determinado lucro no dia, o sistema protege o resultado no nível parametrizado, encerrando novas posições que ameacem esse patamar. | I |

## 29. Comportamentos Condicionais e Estados de UI
### 29.1 Campos condicionais por toggle
```text
ToggleCampo reveladoEditorSuavização ONTipo de média + Número de períodosGráfico (todos os editores que têm
suavização)Tipo de ordem = LIMITESentido do Spread + Spread + Tempo + Ação na expiraçãoParâmetros gerais de
entradaFiltro por variação percentual ONNível + Preço de referência + TipoFiltros de EntradaFiltro por média móvel
ONTipo + PeríodosFiltros de EntradaSaídas de ganho ONTipo de ordem + Qtd saídas + Break-even + Lista de saídasCritérios
de SaídaStop móvel de ganho ONTipo + Ativação + RecuoCritérios de SaídaDobrar posição (Martingale) ONFator de
multiplicação + Limite de dobradasCritérios de SaídaHabilitar reversões ON(sem campos adicionais — altera
comportamento)Critérios de SaídaParar após X trades ONNúmero de trades + Condição de saldoCritérios de Saída DiárioBreak
Even Financeiro Diário ONNível de ativação + Nível de proteçãoCritérios de Saída DiárioUsar horário final (Fibonacci)
ONCampo "Horário final para abrir posições"Editor FibonacciAlinhamento Total (3 MMs) ONAltera validação: exige
alinhamento completo das 3 médiasIndicadoresFiltro de valor (MACD) ONValor do filtro (campo numérico)IndicadoresFiltro
ADX — Aumento/Diminuição ONDropdown "Ficando mais forte / Ficando mais fraca"IndicadoresAumento de Posição ONQtd máx de
aumentos + Critérios de preço/indicador + Qtd por aumentoAumento de Posição
```
### 29.2 Estados dos robôs
```text
EstadoDescriçãoAções disponíveisRascunhoRecém-criado, parâmetros incompletosEditar, ExcluirParadoParâmetros salvos, não
em execuçãoEditar, Iniciar, Criar backtest, Duplicar, Arquivar, ExcluirExecutandoEm execução ativaVer Sumário, Ver
Gráfico, Parar, Criar backtest, DuplicarArquivadoInativo, fora das listas principaisRestaurar, Excluir
```
### 29.3 Estados de backtest
```text
EstadoBadgeDescriçãoNa filaCinzaAguardando processamentoProcessandoAmarelo/laranjaEm execução no
motorFinalizadoAzulConcluído com sucessoErroVermelhoFalha na execuçãoArquivadoCinza escuroMovido para aba Arquivados
```
### 29.4 Comportamentos de formulário

Guard de navegação: ao tentar sair do editor com alterações não salvas → modal "Sair sem salvar?" com ações Cancelar/Confirmar.
Validação inline: campos inválidos ficam com borda vermelha + mensagem abaixo.
Campos disabled em execução: todos os campos do editor ficam readonly com banner informativo quando o robô está executando.
Skeleton loaders: exibidos durante carregamento de listas de robôs, relatórios e backtests.
Toast/Snackbar: feedback de sucesso (salvo, iniciado, parado) e erro (validação, falha de rede).

### 29.5 Diferenças de campos por tipo de stop
```text
EditorStop fixo de perda — controle do tipoSetups Larry WilliamsBotões ABSOLUTO · PERCENTUALIndicadores Técnicos
[Tangram 3.0]Dropdown Absoluto · Percentual · FinanceiroTangramDropdown + campo adicional "em relação"FibonacciNumérico
de retração (%) — não usa stop em pontosToque na MédiaToggle + Valor (sem seleção de tipo explícita)Price ActionBotões
ABSOLUTO · PERCENTUALRenkoBot StartNumérico de blocos Renko
```

## 30. Requisitos Não-Funcionais (RNF)
```text
CategoriaRequisitoDesempenhoLatência sinal→ordem ≤ 500ms no modo real (p95); atualização de cards/relatórios em tempo
real ≤ 2s; editor de parâmetros responsivo (TTI ≤ 3s); carga inicial da SPA ≤ 5s em conexão 4G.EscalabilidadeSuportar ≥
5.000 robôs simultâneos em simulação por nó de execução, com particionamento por ativo e autoscaling horizontal
(Kubernetes).DisponibilidadeSLO 99,5% para a aplicação web; 99,9% para o motor de execução durante pregão B3; janela de
manutenção fora do horário de pregão.ConfiabilidadeExactly-once para envio de ordens reais (chaves de idempotência);
reconciliação de execuções com a corretora; replay seguro do estado após restart (reidratação de
posição).SegurançaCriptografia em trânsito (TLS 1.2+) e em repouso; segregação multi-tenant via RLS (Postgres Row Level
Security); segredos de corretora em cofre (Vault/KMS); OWASP ASVS nível 2; DAST/SAST no pipeline CI/CD; credenciais de
corretora nunca trafegam no front-end.PrivacidadeConformidade com LGPD: base legal, consentimento, direito de exclusão e
portabilidade, minimização de dados, DPA com provedores terceiros.ConformidadeExibir avisos de risco de mercado e que a
plataforma não constitui recomendação de investimento; avaliação jurídica de requisitos CVM/B3 para roteamento de
ordens; trilha de auditoria imutável de ordens por ≥ 5 anos; analista responsável nas estratégias SmartStore conforme
ICVM 598/2018.ObservabilidadeLogs estruturados, métricas e tracing distribuído (Loki/Prometheus/Grafana/Tempo); retenção
≥ 30 dias; alertas de robô travado, fila represada e divergência de posição; dashboard de saúde em tempo
real.UsabilidadeInterface em pt-BR (i18n preparado para expansão); tooltips de ajuda em todos os parâmetros do editor;
validação inline com mensagens claras; responsividade desktop-first com suporte a tablets; WCAG 2.1
AA.CompatibilidadeÚltimas 2 versões de Chrome, Edge, Firefox e Safari; resolução mínima
1280×720px.InternacionalizaçãoArquitetura i18n desde o início (strings externalizadas); suporte a múltiplos idiomas em
Fase futura.
```

## 31. Modelo de Dados (Visão Lógica)
```text
EntidadeAtributos principaisRelacionamentosusersid, nome, e-mail, hash_senha, mfa_ativo, criado_em1:N
accountsaccountsid, user_id, corretora, ambiente_habilitado, plano_id, criado_em1:N robots, backtests,
credit_ledgerstrategiesid, nome, autor, versão (ex.: Tangram 3.0), descricao, param_schema (JSON Schema),
ativos_suportados, ativoCatálogo imutável; 1:N robotsrobotsid, account_id, strategy_id, nome, ambiente (sim|real),
simulador (pessimista|moderado|otimista), estado (rascunho|executando|parado|arquivado), capital_inicial, params
(JSONB), params_versao, ultimo_salvar1:N orders, equity_points, robot_runsrobot_runsid, robot_id, inicio, fim,
motivo_parada1:N ordersordersid, robot_id, run_id, numero_externo, datahora, instrumento_efetivo, lado (C|V),
quantidade, tipo (mercado|limite), status (executada|cancelada|rejeitada|expirada), classe (entrada|saida),
qtd_executada, preco_medio, resultado_pontos, resultado_pct, resultado_financeiroN:1 robots; 1:N
order_eventsorder_eventsid, order_id, datahora, evento (Enviada|Confirmada|Executada|Rejeitada|Cancelada), descricao,
motivoN:1 orderspositionsrobot_id, instrumento, lado, quantidade, preco_medio, atualizado_em1:1 robots (posição
corrente)equity_pointsrobot_id, data, patrimonio, saldo_diario, drawdownSérie temporal por robôbacktestsid, account_id,
robot_id_origem, nome, lote_id (null se unitário), cenario, custos_perfil, capital, data_ini, data_fim, params (JSONB),
status (fila|processando|concluido|erro|arquivado), metricas (JSONB)N:1 backtest_batchesbacktest_batchesid, account_id,
total_combinacoes, concluidos, criado_em1:N backtestscredit_ledgerid, account_id, delta, motivo (compra|consumo|bonus),
saldo_apos, ref, criado_emHistórico de créditosmarket_candlesinstrumento, timeframe, ts, open, high, low, close,
volumeFonte para gráfico, simulação e backtestplansid, nome, limite_robos_simulados, limite_robos_reais,
creditos_mensais, preco—subscriptionsid, account_id, plan_id, status, inicio, renovacao, cancelado_emN:1
plansstore_strategiesid, strategy_id, manager_account_id, nome_publico, descricao, disclaimer, foto_url,
ativoEstratégias publicadas na SmartStorestore_subscriptionsid, account_id, store_strategy_id, nivel, preco_mensal,
status, robot_id_gerado, inicio, cancelado_emAssinaturas de usuários na SmartStorestore_questionsid, store_strategy_id,
perguntante_account_id, pergunta, resposta, respondido_emQ&A público da SmartStoremanager_transactionsid,
manager_account_id, tipo (venda|desconto|estorno|saque), valor, status, criado_emFinanceiro do Manageraudit_logid,
ator_id, acao, entidade, entidade_id, payload (JSONB), ip, ts (append-only)Audit
```

## 32. Especificação de API (Rascunho REST + WebSocket)
### 32.1 Convenções

Base URL: https://api.[dominio].com/v1
Autenticação: Bearer Token (JWT) em todas as rotas autenticadas
Formato: JSON (Content-Type: application/json)
Erros: RFC 7807 (Problem Details); campos type, title, status, detail, instance
Paginação: query params page e per_page; resposta inclui total, page, per_page, total_pages

### 32.2 Autenticação e Sessão
| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/auth/signup` | Cadastro com e-mail/senha; envia e-mail de verificação |
| POST | `/auth/login` | Login; retorna access_token + refresh_token |
| POST | `/auth/refresh` | Renovação de token |
| POST | `/auth/logout` | Invalidação da sessão |
| POST | `/auth/forgot-password` | Envia e-mail de recuperação de senha |
| POST | `/auth/reset-password` | Redefine senha via token |
| GET | `/auth/accounts` | Lista contas/perfis vinculados ao usuário |
| POST | `/auth/select-account` | Seleciona conta ativa na sessão |
### 32.3 Estratégias-modelo (Catálogo)
| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/strategies` | Lista todas as estratégias-modelo disponíveis com nome, descrição e param_schema (JSON Schema dos campos do editor) |
| GET | `/strategies/{id}` | Detalhe de uma estratégia, incluindo schema completo e descrição "Saiba Mais" |
### 32.4 Robôs
| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/robots?env=sim\|real&state=executando\|parado\|arquivado` | Listagem com métricas resumidas para os cards; suporta filtros e busca por nome |
| POST | `/robots` | Criação via wizard (body: strategy_id, nome, ambiente, simulador, codigo, capital_inicial) |
| GET | `/robots/{id}` | Detalhe completo com parâmetros atuais |
| PUT | `/robots/{id}/params` | Salva parâmetros (retorna 409 Conflict se robô estiver executando) |
| PATCH | `/robots/{id}` | Atualiza nome ou outras propriedades não estruturais |
| DELETE | `/robots/{id}` | Exclui robô (somente em estado parado ou arquivado) |
| POST | `/robots/{id}/start` | Inicia execução (validação completa de parâmetros antes) |
| POST | `/robots/{id}/stop` | Para execução; body opcional: { "encerrar_posicao": true\|false } |
| POST | `/robots/{id}/archive` | Arquiva robô |
| POST | `/robots/{id}/restore` | Restaura robô arquivado para estado parado |
| POST | `/robots/{id}/duplicate` | Duplica robô (cria cópia em estado parado) |
### 32.5 Relatório e Dados do Robô
| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/robots/{id}/summary?period=` | Métricas consolidadas (cards principais + relatório completo) |
| GET | `/robots/{id}/equity?period=` | Série temporal da curva de patrimônio (array de { data, patrimonio, saldo_diario, drawdown }) |
| GET | `/robots/{id}/orders?status=&period=&page=&per_page=` | Lista paginada de ordens com filtros |
| GET | `/robots/{id}/orders?format=csv` | Exportação da lista de ordens em CSV |
| GET | `/robots/{id}/orders/{order_id}/events` | Eventos da ordem (modal "Eventos da ordem #ID") |
| GET | `/robots/{id}/position` | Posição atual do robô (aberta ou "não posicionado") |
### 32.6 Backtests
| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/backtests?tab=unit\|batch\|processing\|archived&strategy=&result=` | Listagem com filtros e busca textual |
| POST | `/robots/{id}/backtests` | Cria backtest unitário (body: nome, capital, custos_perfil, cenario, data_ini, data_fim) — consome 1 crédito |
| POST | `/robots/{id}/backtests/batch` | Cria lote em massa (body: params com arrays de valores por campo); valida limite de 1.000 combinações e saldo de créditos; retorna batch_id |
| GET | `/backtests/{id}` | Relatório completo de backtest individual |
| GET | `/backtests/{id}/summary` | Métricas consolidadas (idêntico ao summary do robô) |
| GET | `/backtests/{id}/equity` | Série temporal do equity do backtest |
| GET | `/backtests/{id}/orders?status=&period=&page=` | Lista de ordens do backtest |
| GET | `/backtests/{id}/orders?format=csv` | Exportação CSV das ordens do backtest |
| GET | `/backtests/{id}/orders/{order_id}/events` | Eventos de uma ordem do backtest |
| GET | `/backtests/batch/{batch_id}` | Status e progresso do lote em massa |
| GET | `/backtests/batch/{batch_id}/compare` | Tabela comparativa de todos os resultados do lote, ordenável por métrica |
| POST | `/backtests/{id}/archive` | Arquiva backtest |
| POST | `/backtests/{id}/apply` | Aplica os parâmetros do backtest ao robô de origem |
### 32.7 Créditos de Backtest
| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/credits` | Saldo atual de créditos da conta |
| GET | `/credits/ledger` | Histórico de movimentações (compras, consumos, bônus) |
| POST | `/credits/purchase` | Inicia compra de pacote (body: package: 10 ou 100); retorna URL de checkout |
### 32.8 Ranking
| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/ranking?period=&strategy=&asset=&category=&page=` | Lista de robôs ranqueados com filtros e paginação |
### 32.9 Portfólio
| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/portfolio/summary?period=` | Métricas consolidadas da carteira do usuário |
| GET | `/portfolio/equity?period=` | Série temporal do patrimônio consolidado |
### 32.10 SmartStore
| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/store/strategies?period=&page=` | Lista de estratégias disponíveis na loja (ranking + destaques) |
| GET | `/store/strategies/{id}` | Detalhe de uma estratégia (indicadores, descrição, planos, disclaimer) |
| GET | `/store/strategies/{id}/questions` | Lista de perguntas e respostas públicas da estratégia |
| POST | `/store/strategies/{id}/questions` | Envia nova pergunta ao estrategista |
| POST | `/store/strategies/{id}/subscribe` | Assina estratégia (body: nivel, payment_method_id); cria robô automaticamente |
| GET | `/store/subscriptions` | Lista assinaturas ativas do usuário |
| DELETE | `/store/subscriptions/{id}` | Cancela assinatura |
### 32.11 Minha Conta
| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/account/profile` | Dados do perfil do usuário |
| PUT | `/account/profile` | Atualiza nome, telefone, foto |
| GET | `/account/brokers` | Lista corretoras vinculadas |
| POST | `/account/brokers` | Inicia fluxo de vinculação de corretora (retorna URL OAuth ou instruções de API) |
| DELETE | `/account/brokers/{id}` | Desvincula corretora |
| GET | `/account/preferences` | Preferências de notificação e configurações |
| PUT | `/account/preferences` | Atualiza preferências |
| GET | `/account/accesses` | Histórico de acessos (IP, timestamp, dispositivo) |
| GET | `/account/subscriptions` | Assinaturas de plano + cartões cadastrados |
| POST | `/account/payment-methods` | Adiciona cartão de pagamento |
| DELETE | `/account/payment-methods/{id}` | Remove cartão |
### 32.12 Manager
| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/manager/dashboard?month=&year=` | Métricas do dashboard (vendas, clientes, receita, descontos, estornos) |
| GET | `/manager/financial?year=` | Extrato financeiro anual |
| GET | `/manager/wallet` | Saldo disponível e lançamentos futuros |
| POST | `/manager/wallet/withdraw` | Solicita saque (body: valor; validação: min R$300, max R$3.000) |
| POST | `/manager/wallet/convert-credits` | Converte saldo em créditos de backtest |
| GET | `/manager/profile` | Perfil do estrategista (nome, imagem padrão, dados bancários) |
| PUT | `/manager/profile` | Atualiza dados do perfil e bancários |
| GET | `/manager/faq` | Lista perguntas recebidas e respondidas |
| POST | `/manager/faq/{question_id}/answer` | Responde uma pergunta recebida |
| POST | `/manager/products` | Cria nova estratégia para publicação na SmartStore |
| PUT | `/manager/products/{id}` | Atualiza estratégia publicada |
### 32.13 WebSocket — Tempo Real
**Endpoint:** `wss://realtime.[dominio].com/v1`
| Canal | Payload | Descrição |
| --- | --- | --- |
| robots:{account_id} | `{ robot_id, retorno_liquido, saldo_diario, posicao, patrimonio }` | Atualização em tempo real dos cards de robôs |
| robot:{robot_id}:orders | `{ order_id, status, preco_medio, resultado }` | Nova ordem ou atualização de status |
| robot:{robot_id}:position | `{ lado, quantidade, preco_medio }` | Mudança de posição |
| quote:{instrumento} | `{ preco, variacao_pct, timestamp }` | Cotação em tempo real do ativo |
| backtests:{account_id} | `{ backtest_id, status, progresso }` | Progresso de backtests em processamento |
| batch:{batch_id} | `{ concluidos, total, ultimo_resultado }` | Progresso de lote de backtest em massa |

## 33. Plano de Fases e Critérios de Aceitação
### 33.1 Fase 1 — MVP (Núcleo de Trading)
Escopo:

Autenticação (cadastro, login, recuperação de senha, seleção de conta)
Listagem de robôs (3 abas + alternância grade/lista + MAIS INFO + menu ⋮)
Wizard de criação (4 etapas)
Editor completo para a estratégia Indicadores Técnicos [Tangram 3.0] com todos os 14 indicadores, filtros, saídas e seções de horário
Execução em Modo Simulado com simulador pessimista
Sumário: métricas, relatório completo expandível, lista de ordens + CSV, modal de eventos da ordem (i)
Backtest unitário (criação, processamento, relatório)
Minha Conta: Perfil, Corretoras, Preferências, Últimos Acessos

### 33.2 Fase 2 — Completude do Produto Core
Escopo:

Demais 6 estratégias-modelo: Setups Larry Williams, Tangram, Fibonacci, Toque na Média, Price Action, RenkoBot Start
Backtest em massa (chips multi-valor, lote, comparativo)
Gráfico do Robô (TradingView integrado com indicadores e marcação de ordens)
Gráfico Standalone (/private/grafico)
Dashboard Análise Geral
Modo Real com primeira corretora integrada (XP Investimentos ou BTG Pactual)
Compra de créditos de backtest (pacotes 10/100)
Minha Conta: Assinaturas

### 33.3 Fase 3 — Ecossistema e Marketplace
Escopo:

SmartStore completa (listagem, detalhe, assinatura, Q&A, FAQ, Disclaimer)
Ranking de robôs
Portfólio consolidado
SmarttPlay (hub de vídeos educativos)
Manager completo (Dashboard, Financeiro, Carteira, Perfil, FAQ)
Segunda corretora integrada
Notificações por e-mail (configuradas em Preferências)
Aplicativo mobile (responsividade avançada)

### 33.4 Critérios de Aceitação Macro
| ID | Requisito | Prior. |
| --- | --- | --- |
| CA-01 | — Editor e execução básica: |  |
Dado um robô novo da estratégia Indicadores Técnicos, quando o usuário habilita Médias Móveis (9/40, cruzamento, candle fechado) e stop loss absoluto 100 pontos, salva e inicia em modo simulado, então: o robô abre/encerra posições conforme cruzamentos no fechamento do candle; nenhuma edição de campo é possível até a parada; o badge exibe "Executando" em verde.
| ID | Requisito | Prior. |
| --- | --- | --- |
| CA-02 | — Validação de saídas parciais: |  |
Dado o formulário de saídas de ganho com quantidade por ordem = 1 e 2 saídas configuradas, quando as quantidades somarem 2, então o sistema bloqueia o salvamento e exibe a mensagem "O número de saídas deve ser menor ou igual à quantidade inicial por ordem" em vermelho.
| ID | Requisito | Prior. |
| --- | --- | --- |
| CA-03 | — Backtest em massa: |  |
Dado um editor de backtest em massa com 3 valores para "períodos da média curta" (9, 14, 21) e 2 cenários (Moderado, Conservador), então o rodapé exibe "Número de backtests: 6", o lote consome 6 créditos ao ser iniciado e a aba PROCESSANDO mostra progresso até 6/6.
| ID | Requisito | Prior. |
| --- | --- | --- |
| CA-04 | — Rolagem de contratos: |  |
Dado um robô com código WDO%, então cada ordem registrada exibe o contrato efetivo do vencimento corrente (ex.: WDON26) e a rolagem de vencimento ocorre automaticamente sem intervenção do usuário.
| ID | Requisito | Prior. |
| --- | --- | --- |
| CA-05 | — Simulador pessimista: |  |
Dado um robô em modo simulado com política pessimista, quando uma ordem de compra é gerada, então o preço de execução simulado corresponde ao pior preço plausível do candle (máxima da barra, no caso de compra), e o badge "Pessimista" é exibido no card e no relatório.
| ID | Requisito | Prior. |
| --- | --- | --- |
| CA-06 | — Guard de navegação: |  |
Dado que o usuário alterou parâmetros no editor sem salvar, quando clica em outro item do menu, então um modal "Sair sem salvar?" é exibido com os botões Cancelar e Confirmar; ao cancelar, permanece na página; ao confirmar, navega descartando as alterações.
| ID | Requisito | Prior. |
| --- | --- | --- |
| CA-07 | — Editor Fibonacci — campo condicional: |  |
Dado o editor Fibonacci com toggle "Usar horário final para abrir posições" desativado, quando o usuário ativa o toggle, então o campo "Horário final para abrir posições" aparece com valor padrão 16:30; ao desativar o toggle, o campo desaparece.
| ID | Requisito | Prior. |
| --- | --- | --- |
| CA-08 | — Robô em execução bloqueado: |  |
Dado um robô no estado "Executando", quando o usuário acessa a aba Parâmetros, então todos os campos estão desabilitados (readonly) e o banner "Robô em execução: não é possível fazer alterações..." é exibido; a requisição PUT /robots/{id}/params retorna HTTP 409.
| ID | Requisito | Prior. |
| --- | --- | --- |
| CA-09 | — Modal de eventos da ordem: |  |
Dado a lista de ordens de um robô com trades executados, quando o usuário clica no ícone (i) de uma linha, então o modal "Eventos da ordem #ID" é exibido com a tabela de eventos (Data/Hora, Evento, Descrição, Motivo) e o botão FECHAR o fecha sem alterar nenhum dado.
| ID | Requisito | Prior. |
| --- | --- | --- |
| CA-10 | — SmartStore — assinatura por nível: |  |
Dado a página de detalhe de uma estratégia SmartStore com 3 níveis de contrato, quando o usuário clica em "Quero Assinar" no Nível 1, então o fluxo de pagamento é iniciado, e ao concluir, um robô é criado automaticamente na conta do assinante com os parâmetros pré-configurados pelo estrategista para o Nível 1.
| ID | Requisito | Prior. |
| --- | --- | --- |
| CA-11 | — Manager — validação de saque: |  |
Dado o formulário de saque no Manager com saldo disponível de R$500,00, quando o usuário tenta sacar R$150,00 (abaixo do mínimo), então o botão Sacar é desabilitado ou uma mensagem de validação é exibida informando o valor mínimo de R$300,00.
| ID | Requisito | Prior. |
| --- | --- | --- |
| CA-12 | — RenkoBot — estrutura exclusiva: |  |
Dado o editor RenkoBot Start, quando o usuário seleciona o ativo e acessa a seção Gráfico, então apenas o tipo "RENKO NEGÓCIO A NEGÓCIO" está disponível, os botões de Ticks (5R a 11R) estão presentes, e os campos de stop de saída exibem "blocos Renko" como unidade, não pontos ou percentual.

## 34. Riscos e Dependências
```text
Risco / DependênciaImpactoProbabilidadeMitigaçãoLicenciamento de dados de mercado B3 em tempo real e históricoAlto —
bloqueador do MVPAltaContratar provedor homologado (Cedro, UP2DATA/B3) antes do início do desenvolvimento do motor;
iniciar com dados com atraso de 15 min se necessário para testes.Licença da TradingView Charting LibraryMédio — afeta
Fase 2MédiaAlternativa open source (Lightweight Charts) na Fase 1; negociar licença para Fase 2; abstrair componente de
gráfico desde o início.Integração com corretoras para Modo Real (homologação XP/BTG)Alto — bloqueador da Fase
2MédiaIniciar processo de parceria e certificação técnica em paralelo ao desenvolvimento do MVP; abstrair gateway de
ordens desde o início.Exigências regulatórias (CVM/B3) para plataforma de automaçãoAlto — pode impedir o
lançamentoMédiaParecer jurídico prévio ao lançamento; termos de uso, avisos de risco e declaração de analistas nas
estratégias SmartStore (ICVM 598/2018 e 20/2021).Divergência simulado × real (slippage)Médio — afeta confiança do
usuárioAltaSimulador pessimista por padrão; telemetria comparativa entre resultados simulados e reais; documentar a
diferença metodológica para o usuário.Custo computacional de backtests em massaMédio — afeta escalabilidadeMédiaFila com
limites por plano; cache de candles históricos em série temporal; workers spot/preemptíveis para redução de
custo.Paridade de lógica entre backtest e execução ao vivoAlto — afeta credibilidade da plataformaMédiaCore único de
estratégia compartilhado; suite de testes de regressão comparando resultados de backtest com simulação ao vivo no mesmo
período.Disponibilidade do feed de mercado de terceirosAlto — afeta todos os robôs em execuçãoBaixaMúltiplos provedores
de feed com failover automático; monitoramento de latência e alertas de indisponibilidade.LGPD e proteção de dados
financeirosAlto — risco jurídicoMédiaDPA com todos os provedores; minimização de dados; trilha de auditoria; plano de
resposta a incidentes; canal de exercício de direitos.Escala do Manager (estrategistas com muitos assinantes)Médio —
afeta Fase 3BaixaIndexação adequada em store_subscriptions; queries otimizadas por manager_account_id; cache de métricas
do dashboard.Complexidade de rolagem de contratos futurosMédio — afeta integridade das posiçõesMédiaCalendário de
vencimentos B3 mantido pela equipe; testes de rolagem automatizados; log explícito de cada rolagem com contrato anterior
e novo.
```

## 35. Anexo A — Inventário Completo de Telas
### A.1 Telas observadas no vídeo de referência (Fonte A)
| # | Momento (≈) | Tela / Evento |
| --- | --- | --- |
| 1 | 00:00–00:15 | Página institucional (alta performance em day trade automatizado; integrações com corretoras) e formulário de login |
| 2 | 00:15–00:30 | Carregamento pós-login (select-account) e listagem de Robôs vazia/skeleton |
| 3 | 00:35–00:55 | Wizard "Criando seu robô": catálogo de estratégias com busca; etapa Configurar (Modo Simulado, Nome do Robô, Estratégia, Capital para Simulação R$5.000,00) |
| 4 | 01:05–01:50 | Editor /robos/{id}/parametros: Papel Negociado (BM&F/BOVESPA, código WIN%→WDO%), seção Gráfico (candlestick/heikin-ashi, 15 min, suavização com média simples/exponencial) |
| 5 | 01:50–06:00 | Gerenciamento de Ordens e Indicadores Técnicos: candle aberto/fechado, ordem a mercado/limite com spread (a favor/contra) e expiração; entrada por todos/um indicador; Médias Móveis, MACD, ADX DI+/DI−; tooltips extensos |
| 6 | 06:00–10:00 | Demais indicadores: Estocástico, VWAP, IFR, Bandas de Bollinger (14, 2,00), Stop ATR, SAR Parabólico, OBV, Detector de Topos e Fundos, Pontos Pivot (S1/S2/R1/R2, DX 100) |
| 7 | 10:00–11:30 | Filtros de Entrada (volume, variação %, dia da semana); Aumento de Posição (aviso de horários) |
| 8 | 11:30–13:20 | Critérios de Saída: saída por indicadores, reversões, Martingale, stop loss absoluto 100, saídas de ganho parciais (1–5, validações em vermelho), break-even, trailing stop |
| 9 | 13:20–14:40 | Critérios de Saída Diários (parar após X trades com saldo positivo/negativo) e Restrições de Horário (janelas de bloqueio 1 e 2); Módulo Day Trade |
| 10 | 14:40–14:55 | Modal "Sair sem salvar?" ao navegar com alterações pendentes |
| 11 | 14:55–15:25 | Listagem de Robôs populada (abas Executando/Parados/Arquivados; cards com sparkline, retorno líquido, saldo diário; filtros e alternância grade/lista) |
| 12 | 15:25–16:20 | Sumário do robô "Estocastico 2 7": cards de métricas, relatório completo expandido (Conta/Retorno/Risco/Resumo de trades, Trades comprados × vendidos), cotação em tempo real, lista de ordens com exportação |
| 13 | 16:20–16:40 | Aba Gráfico: chart TradingView (WDOM26, 10 min) com biblioteca de indicadores e aviso sobre contrato |
| 14 | 16:45–17:10 | Modal "Criar backtest" (créditos disponíveis 33.857; capital R$1.000,00; custos; cenário moderado; datas com atalhos 1M–2A; criar unitário/em massa); banner de robô em execução bloqueando edição |
| 15 | 17:10–17:50 | Editor de backtest em massa com chips multi-valor e rodapé "Número de backtests / Iniciar backtest" (limite 1.000); página Backtests com abas, créditos, compra de 10/100 e cards de resultados |
### A.2 Telas mapeadas ao vivo (Fonte B — mapeamento sistemático 11/06/2026)
```text
#MóduloRotaStatus1Análise Geral/private/home✅ Documentado2SmarttPlay/private/smarttplay✅ Documentado3Robôs — Aba
Executando/private/robos✅ Documentado4Robôs — Aba Parados/private/robos✅ Documentado5Robôs — Aba
Arquivados/private/robos✅ Documentado6Wizard Criação — Etapa Estratégia/private/criar-robos✅ Documentado7Wizard Criação
— Etapa Modo/private/criar-robos✅ Documentado8Wizard Criação — Etapa Ativo/private/criar-robos✅ Documentado9Wizard
Criação — Etapa Configurar/private/criar-robos✅ Documentado10Editor — Setups Larry
Williams/private/robos/4301971/parametros✅ Documentado11Editor — Indicadores Técnicos [Tangram
3.0]/private/robos/4301759/parametros✅ Documentado12Editor — Tangram/private/robos/4168803/parametros✅
Documentado13Editor — Fibonacci/private/robos/4301982/parametros✅ Documentado14Editor — Toque na
Média/private/robos/4301983/parametros✅ Documentado15Editor — Price Action/private/robos/4301985/parametros✅
Documentado16Editor — RenkoBot Start/private/robos/4301986/parametros✅ Documentado17Sumário do Robô (com trades
reais)/private/robos/4278128/sumario✅ Documentado18Modal "Eventos da ordem (i)"/private/robos/4278128/sumario✅
Documentado19Dropdown "Status da Ordem" (4 opções)/private/robos/4278128/sumario✅ Documentado20Dropdown "Período"
(calendário)/private/robos/4278128/sumario✅ Documentado21Gráfico do Robô/private/robos/4301971/grafico✅
Documentado22Backtests — Aba Backtest Unitário/private/backtests✅ Documentado23Backtests — Aba Backtest em
Massa/private/backtests✅ Documentado24Backtests — Aba Processando/private/backtests✅ Documentado25Backtests — Aba
Arquivados/private/backtests✅ Documentado26Editor Backtest em Massa (chips)/private/criar/backtest/[id]✅
Documentado27Relatório Backtest Concluído — Sumário/private/backtests/8676582/sumario✅ Documentado28Relatório Backtest —
RELATÓRIO COMPLETO expandido/private/backtests/8676582/sumario✅ Documentado29Ranking/private/ranking✅
Documentado30Portfólio/private/portfolio✅ Documentado31SmartStore — Página Principal/smarttstore✅
Documentado32SmartStore — Detalhe da Estratégia (Drummond 10)/smarttstore/detalhes/2510✅ Documentado33SmartStore — Aba
Indicadores/smarttstore/detalhes/2510✅ Documentado34SmartStore — Aba Pergunte ao Estrategista/smarttstore/detalhes/2510✅
Documentado35SmartStore — Aba Dúvidas (FAQ — 13 perguntas)/smarttstore/detalhes/2510✅ Documentado36SmartStore — Aba
Disclaimer/smarttstore/detalhes/2510✅ Documentado37Gráfico Standalone (TradingView)/private/grafico✅ Documentado38Minha
Conta — Perfil/private/conta/perfil✅ Documentado39Minha Conta — Assinaturas/private/conta/assinatura✅ Documentado40Minha
Conta — Corretoras/private/conta/corretoras✅ Documentado41Minha Conta — Preferências/private/conta/preferencias✅
Documentado42Minha Conta — Últimos Acessos/private/conta/acessos✅ Documentado43Manager —
Dashboard/private/manager/home/dashboard✅ Documentado44Manager — Financeiro/private/manager/home/financial✅
Documentado45Manager — Minha Carteira/private/manager/home/wallet✅ Documentado46Manager — Perfil (Dados do perfil +
Dados bancários)/private/manager/home/profile✅ Documentado47Manager — Perguntas e Respostas/private/manager/home/faq✅
Documentado48Planoshttps://[dominio]/planos⚠️ Domínio externo — não mapeável49Ajudahttps://ajuda.[dominio]/hc/pt-br⚠️
Domínio externo — não mapeável50Suporte (widget Intercom/chat)Widget flutuante⚠️ Widget de terceiro — não mapeável
```
Total de telas mapeadas: 47 de 50 (94%). As 3 não mapeadas são domínios/widgets externos sem acesso via automação.

## Anexo B — Matriz de Cobertura por Estratégia × Seção do Editor
```text
SeçãoSetups LWIndicadores TécnicosTangramFibonacciToque na MédiaPrice ActionRenkoBotMercado✅✅✅✅✅✅✅Gráfico
(timeframe)✅✅✅❌✅✅ (+ 45MIN)✅ (Renko)Setups (LW)✅❌❌❌❌❌❌Indicadores técnicos❌✅ (14 ind.)✅ (14 ind.)❌❌❌✅ (7 ind.
Renko)Critérios de Entrada exclusivos❌❌❌✅ Fibonacci✅ Toque Média✅ Price Action❌Filtros de Entrada✅✅✅✅✅ (=
"Filtros")✅✅Aumento de Posição✅✅✅✅✅✅✅Critérios de Saída✅✅✅ (+relação)✅ (Fib %)✅ (+toque)✅ (botões ABS/%)✅
(blocos)Critérios de Saída Diário✅✅✅✅✅✅ (+BEF diário)✅Gerenciamento de Capital✅✅✅✅✅✅✅Horário de Operação✅✅✅✅✅✅✅Módulo
Day Trade✅✅✅✅✅✅✅Informações (read-only)✅✅✅✅✅✅✅
```

Fim do documento. Versão 2.0 — 11/06/2026
Total de seções: 35 + 2 Anexos
Total de telas especificadas: 47 (+ 3 externas não mapeáveis)
Total de indicadores documentados: 14 (Indicadores Técnicos / Tangram) + 7 (RenkoBot) = 21 indicadores
Total de estratégias-modelo: 7
