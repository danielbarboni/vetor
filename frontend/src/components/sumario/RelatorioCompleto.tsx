/**
 * RelatorioCompleto — Expandable accordion with 8 sections (SUM-03).
 *
 * Prototype region: btRep/showBtReport modal RELATÓRIO COMPLETO accordion.
 * Sections: CONTA, RETORNO, RISCO, RESUMO DOS TRADES,
 *           TRADES COM LUCRO, TRADES COM PREJUÍZO, TRADES COMPRADOS, TRADES VENDIDOS.
 * PRD: §19.3
 */

import { useState } from 'react'
import type { RelatorioCompleto as RelatorioCompletoData } from '@/lib/api'

interface RelatorioCompletoProps {
  relatorio: RelatorioCompletoData
}

function fmtBrl(val: number | null | undefined): string {
  if (val == null) return '—'
  const sign = val < 0 ? '-' : val > 0 ? '+' : ''
  return `${sign}R$ ${Math.abs(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtPct(val: number | null | undefined): string {
  if (val == null) return '—'
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`
}

function fmtNum(val: number | null | undefined): string {
  if (val == null) return '—'
  return val.toLocaleString('pt-BR')
}

// A single row in the relatório table
function RelRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 400, color: valueColor ?? 'var(--text)' }}>{value}</span>
    </div>
  )
}

// Accordion section
function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.09em',
          color: open ? 'var(--color-primary)' : 'var(--muted2)',
          textTransform: 'uppercase',
        }}>
          {title}
        </span>
        <span style={{ color: open ? 'var(--color-primary)' : 'var(--muted2)', fontSize: 12 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '4px 12px', marginBottom: 8 }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function RelatorioCompleto({ relatorio }: RelatorioCompletoProps) {
  const { conta, retorno, risco, resumo_trades, trades_lucro, trades_prejuizo, trades_comprados, trades_vendidos } = relatorio

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '4px 18px 12px' }}>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text)', padding: '14px 0 2px', letterSpacing: '0.05em' }}>
        RELATÓRIO COMPLETO
      </div>

      {/* 1. CONTA */}
      <Section title="Conta" defaultOpen>
        <RelRow label="Capital inicial" value={fmtBrl(conta.capital_inicial)} />
        <RelRow label="Patrimônio final" value={fmtBrl(conta.patrimonio_final)} />
        <RelRow label="Retorno líquido" value={fmtBrl(conta.retorno_liquido)} valueColor={conta.retorno_liquido >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'} />
        <RelRow label="Saldo diário" value={fmtBrl(conta.saldo_diario)} valueColor={conta.saldo_diario >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'} />
      </Section>

      {/* 2. RETORNO */}
      <Section title="Retorno">
        <RelRow label="Retorno líquido (R$)" value={fmtBrl(retorno.retorno_liquido_r)} valueColor={retorno.retorno_liquido_r >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'} />
        <RelRow label="Retorno (%)" value={fmtPct(retorno.retorno_pct)} valueColor={retorno.retorno_pct >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'} />
        <RelRow label="Lucro bruto" value={fmtBrl(retorno.lucro_bruto)} valueColor="var(--color-profit)" />
        <RelRow label="Prejuízo bruto" value={fmtBrl(-retorno.prejuizo_bruto)} valueColor="var(--color-loss)" />
        <RelRow label="Fator de lucro" value={retorno.fator_de_lucro != null ? retorno.fator_de_lucro.toFixed(2) : '∞'} />
        <RelRow label="Saldo diário" value={fmtBrl(retorno.saldo_diario)} />
      </Section>

      {/* 3. RISCO */}
      <Section title="Risco">
        <RelRow label="Drawdown máximo (R$)" value={fmtBrl(risco.drawdown_maximo_r)} valueColor="var(--color-loss)" />
        <RelRow label="Drawdown máximo (%)" value={fmtPct(risco.drawdown_maximo_pct)} valueColor="var(--color-loss)" />
        <RelRow label="Maior ganho" value={fmtBrl(risco.maior_ganho)} valueColor="var(--color-profit)" />
        <RelRow label="Maior perda" value={fmtBrl(-risco.maior_perda)} valueColor="var(--color-loss)" />
      </Section>

      {/* 4. RESUMO DOS TRADES */}
      <Section title="Resumo dos Trades">
        <RelRow label="Total de trades" value={fmtNum(resumo_trades.total_trades)} />
        <RelRow label="Trades com lucro" value={fmtNum(resumo_trades.trades_com_lucro)} valueColor="var(--color-profit)" />
        <RelRow label="Trades com prejuízo" value={fmtNum(resumo_trades.trades_com_prejuizo)} valueColor="var(--color-loss)" />
        <RelRow label="% com lucro" value={fmtPct(resumo_trades.pct_com_lucro)} />
        <RelRow label="Média de ganho" value={fmtBrl(resumo_trades.media_ganho)} valueColor="var(--color-profit)" />
        <RelRow label="Média de perda" value={fmtBrl(-resumo_trades.media_perda)} valueColor="var(--color-loss)" />
      </Section>

      {/* 5. TRADES COM LUCRO */}
      <Section title="Trades com Lucro">
        <RelRow label="Quantidade" value={fmtNum(trades_lucro.quantidade)} />
        <RelRow label="Lucro total" value={fmtBrl(trades_lucro.lucro_total)} valueColor="var(--color-profit)" />
        <RelRow label="Média" value={fmtBrl(trades_lucro.media)} valueColor="var(--color-profit)" />
        <RelRow label="Maior ganho" value={fmtBrl(trades_lucro.maior_ganho)} valueColor="var(--color-profit)" />
      </Section>

      {/* 6. TRADES COM PREJUÍZO */}
      <Section title="Trades com Prejuízo">
        <RelRow label="Quantidade" value={fmtNum(trades_prejuizo.quantidade)} />
        <RelRow label="Prejuízo total" value={fmtBrl(trades_prejuizo.prejuizo_total != null ? -trades_prejuizo.prejuizo_total : null)} valueColor="var(--color-loss)" />
        <RelRow label="Média" value={fmtBrl(trades_prejuizo.media != null ? -trades_prejuizo.media : null)} valueColor="var(--color-loss)" />
        <RelRow label="Maior perda" value={fmtBrl(trades_prejuizo.maior_perda != null ? -trades_prejuizo.maior_perda : null)} valueColor="var(--color-loss)" />
      </Section>

      {/* 7. TRADES COMPRADOS */}
      <Section title="Trades Comprados">
        <RelRow label="Quantidade" value={fmtNum(trades_comprados.quantidade)} />
        <RelRow label="Resultado líquido" value={fmtBrl(trades_comprados.resultado_liquido)} valueColor={(trades_comprados.resultado_liquido ?? 0) >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'} />
        <RelRow label="% lucrativos" value={fmtPct(trades_comprados.pct_lucrativos)} />
        <RelRow label="Vencedores" value={fmtNum(trades_comprados.vencedores)} valueColor="var(--color-profit)" />
        <RelRow label="Perdedores" value={fmtNum(trades_comprados.perdedores)} valueColor="var(--color-loss)" />
      </Section>

      {/* 8. TRADES VENDIDOS */}
      <Section title="Trades Vendidos">
        <RelRow label="Quantidade" value={fmtNum(trades_vendidos.quantidade)} />
        <RelRow label="Resultado líquido" value={fmtBrl(trades_vendidos.resultado_liquido)} valueColor={(trades_vendidos.resultado_liquido ?? 0) >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'} />
        <RelRow label="% lucrativos" value={fmtPct(trades_vendidos.pct_lucrativos)} />
        <RelRow label="Vencedores" value={fmtNum(trades_vendidos.vencedores)} valueColor="var(--color-profit)" />
        <RelRow label="Perdedores" value={fmtNum(trades_vendidos.perdedores)} valueColor="var(--color-loss)" />
      </Section>
    </div>
  )
}
