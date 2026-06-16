/**
 * SaibaMaisModal — "Saiba Mais" info modal for strategy catalog cards (D-11).
 *
 * indicadores_tecnicos → real description from PRD §12.
 * Others → minimal "Em breve" placeholder.
 */

import Modal from '@/components/ui/Modal'
import type { StrategyEntry } from '@/data/strategyCatalog'

interface SaibaMaisModalProps {
  strategy: StrategyEntry | null
  onClose: () => void
}

const IT_CONTENT = {
  title: 'Indicadores Técnicos [Tangram 3.0]',
  sections: [
    {
      heading: 'O que é',
      body: 'O Tangram 3.0 é uma estratégia de trading algorítmico baseada em indicadores técnicos clássicos — médias móveis exponenciais, osciladores de momentum e bandas de volatilidade. Ela identifica entradas e saídas por meio de cruzamentos de sinais filtrados por múltiplas condições configuráveis.',
    },
    {
      heading: 'Como funciona',
      body: 'A cada candle fechado, o motor avalia as regras de entrada longa e curta definidas nos parâmetros. Uma posição é aberta quando todos os filtros ativos disparam simultaneamente. O encerramento ocorre por stop fixo, alvo de pontos ou reversão de sinal — conforme configurado.',
    },
    {
      heading: 'Indicadores disponíveis',
      body: 'Média Móvel Exponencial (EMA), Média Móvel Simples (SMA), MACD, RSI, Bandas de Bollinger, Estocástico, ATR (para stops dinâmicos), ADX (filtro de tendência) e Canal de Donchian.',
    },
    {
      heading: 'Mercados e ativos',
      body: 'Projetado para minicontratos B3: WIN% (Índice Bovespa), WDO% (Dólar Comercial) e BIT% (Bitcoin Futuro). Opera exclusivamente no segmento BM&F com contratos contínuos — o sistema faz a rolagem automática no vencimento.',
    },
    {
      heading: 'Modo de simulação',
      body: 'No Modo Simulado, o robô opera com cotações reais em tempo real usando uma carteira virtual. O simulador pessimista assume o pior preço de execução dentro do spread do candle — ideal para validar a estratégia antes de arriscar capital real.',
    },
  ],
}

export default function SaibaMaisModal({ strategy, onClose }: SaibaMaisModalProps) {
  if (!strategy) return null

  const isIT = strategy.id === 'indicadores_tecnicos'

  return (
    <Modal open={true} onClose={onClose} width="large">
      <div style={{ padding: '28px 32px 32px' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.09em',
              color: 'var(--muted2)',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            {strategy.author}
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '19px',
              fontWeight: 700,
              color: 'var(--text)',
              margin: 0,
            }}
          >
            {isIT ? IT_CONTENT.title : strategy.name}
          </h2>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '20px' }} />

        {/* Content */}
        {isIT ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {IT_CONTENT.sections.map((section) => (
              <div key={section.heading}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.09em',
                    color: 'var(--color-primary)',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  {section.heading}
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 400,
                    color: 'var(--muted)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 0',
              color: 'var(--muted2)',
            }}
          >
            <div
              style={{
                fontSize: '32px',
                marginBottom: '12px',
                opacity: 0.4,
              }}
            >
              ⏳
            </div>
            <p
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--muted)',
                fontFamily: 'var(--font-display)',
                margin: '0 0 8px',
              }}
            >
              Em breve
            </p>
            <p
              style={{
                fontSize: '12.5px',
                color: 'var(--muted2)',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Esta estratégia estará disponível em uma próxima versão da plataforma.
            </p>
          </div>
        )}

        {/* Footer close */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              border: '1px solid var(--border2)',
              borderRadius: '10px',
              padding: '9px 20px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--muted)',
              background: 'transparent',
              cursor: 'pointer',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  )
}
