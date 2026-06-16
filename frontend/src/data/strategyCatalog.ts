/**
 * strategyCatalog.ts — All 7 strategy types for the wizard catalog (D-09, D-10).
 *
 * Only `indicadores_tecnicos` is selectable (D-10).
 * The remaining 6 show "EM BREVE" badge with disabled "+" button (D-09).
 */

export interface StrategyEntry {
  id: string
  name: string
  author: string
  description: string
  selectable: boolean
}

export const strategyCatalog: StrategyEntry[] = [
  {
    id: 'indicadores_tecnicos',
    name: 'Indicadores Técnicos [Tangram 3.0]',
    author: 'TANGRAM',
    description:
      'Estratégia baseada em indicadores técnicos clássicos: médias móveis, osciladores e bandas de volatilidade. Totalmente parametrizável.',
    selectable: true,
  },
  {
    id: 'larry_williams',
    name: 'Larry Williams',
    author: 'TANGRAM',
    description:
      'Estratégia inspirada nas técnicas de Larry Williams, com foco em momentum e ciclos de mercado.',
    selectable: false,
  },
  {
    id: 'tangram',
    name: 'Tangram',
    author: 'TANGRAM',
    description:
      'Estratégia proprietária Tangram com múltiplos filtros de mercado e gestão de risco adaptativa.',
    selectable: false,
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci',
    author: 'TANGRAM',
    description:
      'Opera retrações e extensões de Fibonacci em tendências identificadas automaticamente pelo sistema.',
    selectable: false,
  },
  {
    id: 'toque_na_media',
    name: 'Toque na Média',
    author: 'TANGRAM',
    description:
      'Estratégia de reversão à média: identifica desvios significativos e opera o retorno ao equilíbrio.',
    selectable: false,
  },
  {
    id: 'price_action',
    name: 'Price Action',
    author: 'TANGRAM',
    description:
      'Análise pura de movimentação de preço sem indicadores. Identifica padrões de candles e estruturas de mercado.',
    selectable: false,
  },
  {
    id: 'renkobot_start',
    name: 'RenkoBot Start',
    author: 'TANGRAM',
    description:
      'Opera gráficos Renko para eliminar ruído de mercado e identificar tendências com maior clareza.',
    selectable: false,
  },
]
