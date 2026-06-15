# Blue Hour Design System · v2.1 · Multi-tema

Design system completo para uma **plataforma de trading automatizado com robôs**, com
**customização de paleta pelo usuário**: 51 paletas × 2 modos (dark/light) = 102 temas — 7 curadas à mão e 44 derivadas algoritmicamente (seeds do artigo de combinações da Looka, com contraste AA forçado e invariantes de P&L preservadas).

**Arquitetura multi-tema.** Componentes referenciam apenas tokens semânticos
(`--color-primary`, `--color-surface`, `--color-profit`...). As paletas trocam os
*valores* desses tokens via atributos no `<html>`:

```html
<html data-palette="heritage-mode" data-theme="dark">
```

Paletas disponíveis: `blue-hour` (padrão) · `cosmos-candy` · `neon-circuit` ·
`heritage-mode` · `wisteria-soft` · `graphite-minimal` · `vermilion-studio`.
Troca em runtime e persistência: `palettes.js`. Tokens gerados por `build-tokens.py`
(fonte única de dados) — nunca edite `tokens/tokens.css` manualmente.

**Invariantes em TODAS as paletas** (o que faz a customização ser segura):
verde/vermelho exclusivos de P&L; dark mode nunca preto (sempre com croma);
light mode nunca branco puro no fundo; contraste AA; mesma tipografia, espaçamento,
iconografia e componentes — só a cor muda.

> Fonte de verdade dos valores: `tokens/tokens.css` e `tokens/tokens.json`.
> Referência visual interativa: `styleguide.html`.

---

## 1. Princípios

1. **Dark sem preto.** O fundo escuro é índigo profundo (`#14182B`) com croma perceptível. Profundidade vem de três camadas de superfície (+~6% de luminosidade por nível), não de sombras pesadas.
2. **Light sem branco chapado.** O fundo claro é lavanda suave (`#F5F6FB`); branco puro é reservado a cards.
3. **Verde é só lucro.** Verde e vermelho são exclusivos de P&L, candles, sinais de compra/venda. A marca vive no **Íris** (violeta) e no **Aqua** — o olho do trader nunca confunde identidade com sinal de mercado.
4. **Acentos recalibrados por modo.** Cada cor tem duas versões: vibrante e clara no dark, densa e profunda no light. Nunca o mesmo hex invertido.
5. **Dados em primeiro lugar.** Cor destaca, não decora. Máximo data-ink, mínimo chrome. Gradiente de marca jamais aparece em gráficos ou dados.
6. **Contraste AA mínimo.** Texto ≥ 4.5:1, componentes de UI ≥ 3:1, em ambos os temas.

## 2. Cor

### Fundação — Dark (Blue Hour)
| Token | Hex | Uso |
|---|---|---|
| `bg` | `#14182B` | Fundo base |
| `surface` | `#1C2138` | Cards, painéis |
| `surface-2` | `#262C4A` | Modais, hover, dropdowns |
| `border` | `#323A5E` | Divisores |
| `border-strong` | `#424B73` | Focus de inputs, tabelas |
| `text-hi` | `#EDEFFA` | Títulos, valores (12.9:1) |
| `text-mid` | `#A6ADCF` | Corpo (6.8:1) |
| `text-low` | `#6E7699` | Metadados, placeholders |

### Fundação — Light (Daybreak)
| Token | Hex | Uso |
|---|---|---|
| `bg` | `#F5F6FB` | Fundo base |
| `surface` | `#FFFFFF` | Cards |
| `surface-2` | `#ECEEF8` | Inputs, wells, hover |
| `border` | `#DCE0F0` | Divisores |
| `border-strong` | `#C3C9E4` | Focus, tabelas |
| `text-hi` | `#1B2040` | Títulos (13.6:1) |
| `text-mid` | `#515A80` | Corpo (6.9:1) |
| `text-low` | `#8189AC` | Metadados |

### Marca e acentos
| Token | Dark | Light | Papel |
|---|---|---|---|
| `primary` (Íris) | `#8F7BFF` | `#5B47E0` | Ações primárias, identidade, estados ativos |
| `primary-strong` | `#A593FF` | `#4936C4` | Hover/pressed |
| `on-primary` | `#14182B` | `#FFFFFF` | Texto sobre Íris |
| `aqua` (Aqua Pulse) | `#3EE6C8` | `#0E9E87` | Automação, dados ao vivo, links, série 1 de gráficos |
| `amber` (Âmbar Solar) | `#FFB454` | `#C97912` | Atenção/risco (não é erro) |

Gradiente de marca `Íris → Aqua` (92°): **apenas** logo e avatares de robô. **Nunca em botões** — ações primárias usam Íris sólido.

### Semântica de trading
| Token | Dark | Light | Uso |
|---|---|---|---|
| `profit` | `#34D399` | `#0E9F6E` | P&L positivo, compra, candle de alta |
| `loss` | `#FB7185` | `#E11D48` | P&L negativo, venda, erro, stop |
| `info` | `#6FB7FF` | `#2563EB` | Notificações neutras |
| `warning` | `#FFB454` | `#C97912` | Drawdown perto do limite, latência, margem |

Tints (fundos de badges/alerts): cor correspondente a 8–16% de opacidade sobre a superfície.

### Séries de gráficos (ordem fixa)
1. Aqua · 2. Íris · 3. Âmbar · 4. Azul info · 5. Rosa (`#F47BD2` dark / `#C2419F` light).
Gridlines: `text-mid` a 10–12% de opacidade. Área sob curvas: gradiente da cor da série, 28% → 0% (dark) ou 18% → 0% (light).


## 2b. As 7 paletas curadas (resumo · dark / light)

| Paleta | Fundo dark | Primária | Acento | Personalidade |
|---|---|---|---|---|
| **Blue Hour** (padrão) | `#14182B` índigo | Íris `#8F7BFF`/`#5B47E0` | Aqua | Equilibrada, tech-premium |
| **Cosmos Candy** | `#1E1F4B` azul-espacial | Rosa `#F06CA8`/`#C73E84` | Menta | Vibrante, maximalista |
| **Neon Circuit** | `#16204A` navy | Royal `#5C82F2`/`#2249AE` | Canário | Energia de terminal |
| **Heritage Mode** | `#15221F` petróleo | Ouro `#EAB63E`/`#A8761B` | Teal | Sofisticada, old money |
| **Wisteria Soft** | `#241F3D` ameixa | Glicínia `#A48BE8`/`#735DA5` | Menta-melão | Calma, acolhedora |
| **Graphite Minimal** | `#242128` carvão quente | Aço `#8CA3CC`/`#4A5C82` | Cinza-azul | Brutalista, dados em foco |
| **Vermilion Studio** | `#232548` periwinkle | Periwinkle `#8C8EDE`/`#4D51A0` | Ocre | Editorial, assertiva |

Valores completos (15 tokens de cor + 5 séries de gráfico por paleta/modo) em `tokens/tokens.json`.

## 3. Tipografia

| Papel | Fonte | Pesos | Uso |
|---|---|---|---|
| Display | **Sora** | 600, 700 | Títulos, marca, KPIs gigantes |
| Corpo | **Inter** | 400, 500, 600 | Texto, UI, labels |
| Dados | **JetBrains Mono** | 400, 600 | Preços, P&L, quantidades, hashes, código |

- Escala: `12 / 14 / 16 / 20 / 24 / 32 / 48` px.
- Line-height: 1.1–1.25 em headings, 1.5–1.55 no corpo.
- Letter-spacing: `-0.02em` em headings grandes; `+0.06em` em labels uppercase.
- **Todo valor numérico financeiro usa JetBrains Mono** (alinhamento tabular garante colunas estáveis em tabelas de ordens).
- Máximo 3 pesos por fonte. Bold (700) só em display.

Carregamento (Google Fonts):
`https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap`

## 4. Iconografia

- Biblioteca: **Lucide** (https://lucide.dev) — open source, traço consistente.
- Grid 24px · stroke `1.75` · cantos arredondados (`stroke-linecap: round`).
- Tamanhos: 16px (inline com texto), 20px (botões, navegação), 24px (destaques).
- Cor padrão: `text-mid`; ativo/interativo: `primary` ou `aqua`; nunca colorir ícones com profit/loss exceto setas de variação (▲▼).
- Ícones-chave do domínio: `bot` (robôs), `activity` (operando), `trending-up`/`trending-down` (P&L), `shield` (gestão de risco), `pause`/`play` (controle do robô), `settings-2` (parâmetros), `zap` (execução), `wallet` (saldo), `bell` (alertas), `history` (histórico).

## 5. Espaçamento, raio e elevação

- Grid base **4px**. Escala: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`.
- Padding de cards: 16–24px. Gap entre cards: 12–16px. Seções: 48–64px.
- Raio: `8` inputs/chips · `12` botões/KPIs · `16` cards · `20` painéis/modais · `999` badges/avatares.
- Elevação no dark = **camada mais clara** (surface → surface-2), sombras discretas (`0 8px 28px rgba(6,8,20,.45)`).
- Elevação no light = sombra suave (`0 10px 30px rgba(27,32,64,.08)`).

## 6. Movimento

- Feedback de UI: 150ms · transições: 250ms · entradas/modais: 400ms.
- Easing: `cubic-bezier(0.16,1,0.3,1)` (ease-out) para entradas; ease-in para saídas.
- Listas: stagger de 60ms por item.
- Indicador "robô operando": ponto com pulse de 2s (opacidade 1 → 0.35).
- **Sempre respeitar `prefers-reduced-motion`** (desligar pulse e translações).

## 7. Componentes

### Botões (alturas 32 / 40 / 48px, raio 12px, peso 600)
- **Primário**: fundo `primary` **sólido** (nunca gradiente), texto `on-primary`. Hover: `primary-strong` + translateY(-1px).
- **Secundário/ghost**: borda `border`, texto `text-hi`, fundo transparente.
- **Destrutivo** (pausar robô, fechar posição): fundo `tint-loss`, texto `loss`; ação irreversível exige confirmação.
- Estados obrigatórios: default, hover, active, disabled (50% opacidade), loading (spinner 16px).
- Focus visível: anel 2px `aqua`, offset 2px.

### Cards
Fundo `surface`, borda 1px `border`, raio 16px, padding 16–24px, sombra `shadow-card`. Hover em cards clicáveis: elevar para `surface-2` (dark) ou intensificar sombra (light).

### KPI / métricas
Label uppercase 12px `text-low` (tracking +0.06em) → valor JetBrains Mono 600 → delta colorido com seta (`profit`/`loss`). Nunca transmitir variação só por cor: sempre acompanhar ▲/▼ ou sinal +/−.

### Badges de status
Raio full, 12px peso 600, fundo tint + texto na cor plena.
`Operando` = profit + dot pulsante · `Pausado` = neutro (`text-low`) · `Atenção` = amber · `Erro/Stop` = loss · `Backtest` = info.

### Formulários
Labels acima do input (nunca flutuantes). Inputs 40–48px, fundo `surface-2`, borda `border`, raio 8px; focus: borda `primary` + anel tint. Erro inline: texto `loss` + ícone. Campos numéricos de ordem em JetBrains Mono.

### Navegação
Sidebar 240–280px em `surface`; item ativo: fundo `tint-primary` + filete esquerdo 3px `primary`. Topbar 56–64px. Ícones 20px.

### Tabelas de ordens/trades
Linhas 44–48px, zebra sutil com `surface-2` a 40%, números à direita em mono, cabeçalho uppercase 12px `text-low`. Lado da ordem: texto `profit` (compra) / `loss` (venda), nunca fundo de linha inteiro colorido.

## 8. Voz e escrita

- Tom: preciso, calmo, direto — dinheiro real está em jogo; nada de hype.
- Verbos no botão dizem o que acontece: "Pausar robô", "Ajustar parâmetros", "Fechar posição" (nunca "Enviar", "OK").
- Erros explicam o que houve e como resolver, sem pedir desculpas e sem vagueza.
- Estados vazios convidam à ação: "Nenhum robô ativo. Crie o primeiro a partir de uma estratégia pronta."
- Números sempre com sinal explícito em P&L: `+R$ 4.218` / `−6,8%`.

## 9. Acessibilidade (checklist)

- [ ] Contraste: texto ≥ 4.5:1, UI ≥ 3:1, nos dois temas
- [ ] Nenhuma informação só por cor (P&L sempre com sinal/seta)
- [ ] Focus visível em todos os interativos (anel aqua 2px)
- [ ] Alvos de toque ≥ 44px
- [ ] `prefers-reduced-motion` respeitado
- [ ] `color-scheme` declarado por tema (scrollbars/inputs nativos corretos)

## Anexo (v2.1) · Paletas derivadas da Looka

Além das 7 curadas, o `build-tokens.py` deriva **44 paletas** a partir dos hex publicados em https://looka.com/blog/color-combinations/ (seeds registrados no script e no `tokens.json` com `origin: looka-N`). O motor escolhe primária e acento fora das zonas verde/vermelha (P&L protegido), constrói fundos escuros com croma e claros nunca-brancos, e itera a luminosidade até o contraste WCAG (texto ≥4.5, UI ≥3.5). As combinações **16–25** do artigo não publicam hex (apenas imagens) e ficam pendentes; a nº 49 tinha typo na fonte (`#CED8DO`→`#CED8D0`). Paletas derivadas são candidatas: promova a "curada" copiando os valores gerados para o dicionário `HAND` e refinando à mão.

**Nota v2.1.1:** o `PaletteSelector.jsx` também passou a ser sincronizado pelo `build-tokens.py` (dicionário `META` com tag/desc por paleta) e expõe as 51 paletas. Não há mais nenhuma lista manual no pacote.
