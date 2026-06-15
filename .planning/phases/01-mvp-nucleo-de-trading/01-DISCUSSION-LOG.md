# Phase 1: MVP — Núcleo de Trading - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 01-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-15
**Phase:** 1 — MVP: Núcleo de Trading
**Areas discussed:** Fluxo de dados real-time, Modo Simulado — motor, Wizard — estratégias não-IT, Estrutura do repositório

---

## Fluxo de Dados Real-Time

### Q1: Como os ticks do MetaAPI chegam até o frontend React?

| Option | Description | Selected |
|--------|-------------|----------|
| Tudo via Supabase Realtime | MetaAPI WS → FastAPI → Supabase → React. Canal único, latência ~200-400ms adicional. | |
| FastAPI WebSocket direto ao frontend | MetaAPI WS → FastAPI → FastAPI WS → React. Menor latência para ticks. | ✓ |
| Você decide | Deixa para o planejador escolher. | |

**User's choice:** FastAPI WebSocket direto ao frontend
**Notes:** —

### Q2: O que ainda vai pelo Supabase Realtime?

| Option | Description | Selected |
|--------|-------------|----------|
| Só estado do robô | Supabase Realtime para mudanças de estado e ordens persistidas; ticks via FastAPI WS. | ✓ |
| Tudo persistido via Supabase | FastAPI WS só para ticks brutos; equity e ordens pelo Supabase. | |
| Você decide | Deixa a divisão para o planejador. | |

**User's choice:** Só estado do robô (Recomendado)
**Notes:** —

### Q3: O equity chart no Sumário atualiza tick-a-tick ou por evento?

| Option | Description | Selected |
|--------|-------------|----------|
| A cada ordem executada | Equity atualiza apenas quando uma ordem é fechada. | ✓ |
| Tick-a-tick ao vivo | Equity flutua a cada tick com P&L flutuante. | |
| Periódico (ex: 5s) | FastAPI calcula equity a cada N segundos. | |

**User's choice:** A cada ordem executada (Recomendado)
**Notes:** —

### Q4: Modelo de conexão WebSocket com múltiplos robôs?

| Option | Description | Selected |
|--------|-------------|----------|
| 1 WS compartilhado com canais por robô | Uma conexão WS por usuário, mensagens por robot_id. | ✓ |
| 1 WS por robô ativo | Cada robô em Executando abre uma conexão WS separada. | |
| Você decide | Deixa para o planejador. | |

**User's choice:** 1 WS compartilhado com canais por robô (Recomendado)
**Notes:** —

---

## Modo Simulado — Motor

### Q1: Simulado usa ticks ao vivo ou dados históricos?

| Option | Description | Selected |
|--------|-------------|----------|
| Ticks ao vivo do MetaAPI | Paper trading realista; mesmo feed do Real com fills simulados localmente. | ✓ |
| Engine offline (dados históricos) | Engine separado contra snapshots de ticks gravados; sem MetaAPI. | |
| Você decide | Deixa para o planejador. | |

**User's choice:** Ticks ao vivo do MetaAPI (Recomendado)
**Notes:** —

### Q2: Simulado exige conta corretora vinculada para ticks?

| Option | Description | Selected |
|--------|-------------|----------|
| Não — sistema usa feed compartilhado | FastAPI mantém conta MetaAPI de sistema (Vetor); usuário não precisa vincular corretora para Simulado. | ✓ |
| Sim — usa a conta do usuário | Simulado conecta via conta MetaAPI do próprio usuário. | |
| Você decide | Deixa para o planejador. | |

**User's choice:** Não — sistema usa feed compartilhado (Recomendado)
**Notes:** —

### Q3: Fill policies do Simulado estão no PRD ou detalhar aqui?

| Option | Description | Selected |
|--------|-------------|----------|
| PRD já cobre — planejador lê a seção 18 | PRD v2.0 é authoritative. | ✓ |
| Detalhar aqui | Explicar agora como Pessimista/Moderado/Otimista se traduzem em slippage/delay. | |

**User's choice:** PRD já cobre — planejador lê a seção 18
**Notes:** —

### Q4: Robô criado como Simulado pode ser promovido para Real?

| Option | Description | Selected |
|--------|-------------|----------|
| Modo fixo na criação | Para Modo Real, usuário duplica o robô e refaz o wizard com Modo Real. | ✓ |
| Modo pode ser alterado | Robô parado pode ter modo trocado com validações. | |

**User's choice:** Modo fixo na criação (Recomendado)
**Notes:** —

---

## Wizard — Estratégias Não-IT

### Q1: Estratégias não-IT ficam visíveis ou ocultas?

| Option | Description | Selected |
|--------|-------------|----------|
| Visíveis mas não selecionáveis | 7 estratégias no catálogo; 6 com badge "Em breve" e "+" desabilitado. | ✓ |
| Apenas IT mostrada | Catálogo na Fase 1 só exibe IT [Tangram 3.0]. | |
| Todas selecionáveis, editor placeholder | Todas selecionáveis mas editores não-IT mostram tela "em desenvolvimento". | |

**User's choice:** Visíveis mas não selecionáveis (Recomendado)
**Notes:** —

### Q2: Modais "Saiba Mais" implementados na Fase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Sim — implementar para todas as 7 | Modal com descrição, autor e overview de cada estratégia. | |
| Apenas para IT [Tangram 3.0] | Só a estratégia selecionável precisa do modal. | |
| Você decide | Se PRD cobre o conteúdo, implementar conforme. | ✓ |

**User's choice:** Você decide
**Notes:** Deixado para o planejador — se PRD §9 especificar conteúdo dos modais, implementar per PRD; caso contrário, IT recebe modal real e as outras ficam com placeholder ou são omitidas.

### Q3: Seleção de ativo — um ou múltiplos por robô?

| Option | Description | Selected |
|--------|-------------|----------|
| Um ativo por robô | Cada robô opera em um único instrumento (WIN%, WDO%, ou BIT%). | ✓ |
| Múltiplos ativos | Robô pode operar em múltiplos instrumentos simultaneamente. | |

**User's choice:** Um ativo por robô (Recomendado)
**Notes:** —

### Q4: Progresso do wizard é salvo no banco entre etapas?

| Option | Description | Selected |
|--------|-------------|----------|
| Começa do zero | Wizard é sessão efêmera no frontend; robô só criado no banco ao concluir Step 4. | ✓ |
| Salva rascunho no banco | Cada step persiste progresso; permite retomar onde parou. | |

**User's choice:** Começa do zero (Recomendado)
**Notes:** —

---

## Estrutura do Repositório

### Q1: Monorepo ou repos separados?

| Option | Description | Selected |
|--------|-------------|----------|
| Monorepo — neste repo | /frontend (React + Vite) e /backend (FastAPI) neste repo; design system permanece. | ✓ |
| Repos separados | Este repo vira apenas "design"; novos repos vetor-frontend e vetor-backend. | |
| Monorepo — repo novo | Novo repo de produção; este fica como design reference. | |

**User's choice:** Monorepo — neste repo (Recomendado)
**Notes:** —

### Q2: Setup de desenvolvimento local?

| Option | Description | Selected |
|--------|-------------|----------|
| Separados sem Docker | `npm run dev` (5173) + `uvicorn --reload` (8000); Supabase hospedado. | ✓ |
| Docker Compose unificado | `docker-compose up` sobe tudo. | |
| Você decide | Deixa o setup de dev para o planejador. | |

**User's choice:** Separados sem Docker (Recomendado)
**Notes:** —

### Q3: Deploy do backend FastAPI no Vultr?

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Actions → SSH no VPS | Push na main → SSH → git pull → restart systemd. | ✓ |
| Docker → Vultr | CI/CD builda imagem Docker e faz push/pull no VPS. | |
| Manual SSH | Deploys manuais via SSH. | |

**User's choice:** GitHub Actions → SSH no VPS (Recomendado)
**Notes:** Frontend via Cloudflare Pages (git push automático).

### Q4: Robôs em execução rodam como o quê no backend?

| Option | Description | Selected |
|--------|-------------|----------|
| asyncio Tasks no FastAPI | Cada robô ativo é uma asyncio.create_task() no processo FastAPI. Sem Celery/Redis. | ✓ |
| Celery + Redis | Workers Celery separados do FastAPI. | |
| Processos separados | FastAPI spawna processos Python por robô. | |

**User's choice:** asyncio Tasks no FastAPI (Recomendado)
**Notes:** Para Fase 1 (solo owner, poucos robôs), asyncio é suficiente. Migração para task queue adiada para fase SaaS.

---

## Claude's Discretion

- **"Saiba Mais" modals para estratégias não-IT**: implementar per PRD §9 se conteúdo especificado; caso contrário, placeholder ou omitir.
- **Estrutura interna de diretórios** de `/frontend` e `/backend` (organização de componentes, router, módulos) — seguir convenções padrão React/FastAPI.
- **Configuração CORS, naming de env vars, prefixo de versão de API** — planejador define.

## Deferred Ideas

Nenhuma — a discussão ficou dentro do escopo da Fase 1.
