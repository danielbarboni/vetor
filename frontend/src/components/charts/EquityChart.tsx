/**
 * EquityChart — ECharts 6.1.0 equity evolution line chart for the Sumário screen.
 *
 * Props:
 *   data:      Array<[timestamp_ms: number, value: number]>  — equity series (D-03)
 *   baseline?: number  — initial capital; renders a dashed baseline markLine
 *
 * Container: width='100%', height=230 (UI-SPEC: viewBox 0 0 860 230).
 * Uses SVG renderer (matching SparklineChart pattern from plan 01-06).
 * Cleans up echarts instance on unmount.
 *
 * ECharts version: 6.1.0 (pinned per Assumption A1 for prototype fidelity).
 */

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface EquityChartProps {
  data: Array<[number, number]>
  baseline?: number
}

export default function EquityChart({ data, baseline }: EquityChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = echarts.init(containerRef.current, null, { renderer: 'svg' })
    chartRef.current = chart

    const markLine =
      baseline !== undefined
        ? {
            silent: true,
            symbol: ['none', 'none'],
            lineStyle: {
              color: 'var(--border2)',
              type: 'dashed' as const,
              width: 1,
            },
            data: [{ yAxis: baseline }],
          }
        : undefined

    chart.setOption({
      animation: false,
      grid: {
        top: 12,
        right: 16,
        bottom: 28,
        left: 52,
        containLabel: false,
      },
      xAxis: {
        type: 'time',
        show: true,
        splitLine: { show: false },
        axisLine: { lineStyle: { color: 'var(--border)' } },
        axisTick: { show: false },
        axisLabel: {
          color: 'var(--muted2)',
          fontFamily: 'JetBrains Mono',
          fontSize: 9.5,
          formatter: (val: number) => {
            const d = new Date(val)
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
          },
        },
      },
      yAxis: {
        type: 'value',
        show: true,
        splitLine: { lineStyle: { color: 'var(--chart-grid)', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: 'var(--muted2)',
          fontFamily: 'JetBrains Mono',
          fontSize: 9.5,
          formatter: (val: number) =>
            val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(val),
        },
      },
      series: [
        {
          type: 'line',
          data: data.length > 0 ? data : [],
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: 'var(--chart-1)',
            width: 2,
          },
          areaStyle: {
            color: 'var(--chart-1)',
            opacity: 0.10,
          },
          ...(markLine ? { markLine } : {}),
        },
      ],
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
        borderWidth: 1,
        textStyle: {
          color: 'var(--text)',
          fontFamily: 'JetBrains Mono',
          fontSize: 11,
        },
        formatter: (params: unknown) => {
          const arr = params as Array<{ value: [number, number] }>
          if (!arr || !arr[0]) return ''
          const [ts, val] = arr[0].value
          const d = new Date(ts)
          const date = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
          return `<span style="color:var(--muted2);font-size:10px">${date}</span><br/>R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        },
      },
    })

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
      chartRef.current = null
    }
  }, [data, baseline])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 230, display: 'block' }}
      data-testid="equity-chart"
    />
  )
}
