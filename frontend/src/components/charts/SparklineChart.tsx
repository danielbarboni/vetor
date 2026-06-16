/**
 * SparklineChart — ECharts 6.1.0 equity sparkline for robot cards.
 *
 * Props:
 *   sparkline_data: number[]   — raw equity values (empty = flat line)
 *   positive?: boolean          — true when last >= first; drives color
 *
 * Container: 220×56 SVG renderer (prototype viewBox 0 0 220 56).
 * Cleans up the echarts instance on unmount.
 */

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface SparklineChartProps {
  sparkline_data: number[]
  positive?: boolean
}

export default function SparklineChart({ sparkline_data, positive = true }: SparklineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Init (or reuse existing instance)
    const chart = echarts.init(containerRef.current, null, { renderer: 'svg' })
    chartRef.current = chart

    const data = sparkline_data.length > 0 ? sparkline_data : [0, 0]

    const lineColor = positive ? 'var(--color-profit)' : 'var(--color-loss)'
    const areaColor = positive ? 'var(--tint-primary)' : 'var(--tint-loss)'

    chart.setOption({
      animation: false,
      grid: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        show: false,
        data: data.map((_, i) => i),
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        show: false,
      },
      series: [
        {
          type: 'line',
          data,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: lineColor,
            width: 1.8,
          },
          areaStyle: {
            color: areaColor,
            opacity: 0.10,
          },
        },
      ],
    })

    return () => {
      chart.dispose()
      chartRef.current = null
    }
  }, [sparkline_data, positive])

  return (
    <div
      ref={containerRef}
      style={{ width: 220, height: 56, display: 'block' }}
      data-testid="sparkline-chart"
    />
  )
}
