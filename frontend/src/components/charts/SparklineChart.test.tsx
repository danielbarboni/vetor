/**
 * SparklineChart.test.tsx — Nyquist tests for ECharts sparkline (ROB-02).
 *
 * Mocks echarts to avoid JSDOM canvas/SVG limitations while still verifying
 * the component calls echarts.init + setOption correctly.
 * Uses vi.hoisted so mock references are available when the factory runs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ─── Hoisted mocks (must be before any import that pulls echarts) ─────────────

const { mockSetOption, mockDispose, mockInit } = vi.hoisted(() => {
  const mockSetOption = vi.fn()
  const mockDispose = vi.fn()
  const mockChartInstance = { setOption: mockSetOption, dispose: mockDispose }
  const mockInit = vi.fn(() => mockChartInstance)
  return { mockSetOption, mockDispose, mockInit }
})

vi.mock('echarts', () => ({
  init: mockInit,
  getInstanceByDom: vi.fn(),
}))

// Import component after mocks are hoisted
import SparklineChart from './SparklineChart'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SparklineChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mounts without error on non-empty sparkline_data', () => {
    render(<SparklineChart sparkline_data={[100, 102, 99, 105, 108]} positive={true} />)
    expect(screen.getByTestId('sparkline-chart')).toBeInTheDocument()
  })

  it('calls echarts.init with svg renderer on mount', () => {
    render(<SparklineChart sparkline_data={[100, 105, 103]} positive={true} />)
    expect(mockInit).toHaveBeenCalledTimes(1)
    expect(mockInit).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      null,
      { renderer: 'svg' },
    )
  })

  it('calls setOption with line series after init', () => {
    render(<SparklineChart sparkline_data={[100, 105, 103]} positive={true} />)
    expect(mockSetOption).toHaveBeenCalledTimes(1)
    const option = mockSetOption.mock.calls[0][0]
    expect(option.series[0].type).toBe('line')
    expect(option.series[0].smooth).toBe(true)
    expect(option.series[0].symbol).toBe('none')
  })

  it('uses profit color for positive sparkline', () => {
    render(<SparklineChart sparkline_data={[100, 105]} positive={true} />)
    const option = mockSetOption.mock.calls[0][0]
    expect(option.series[0].lineStyle.color).toBe('var(--color-profit)')
  })

  it('uses loss color for negative sparkline', () => {
    render(<SparklineChart sparkline_data={[105, 100]} positive={false} />)
    const option = mockSetOption.mock.calls[0][0]
    expect(option.series[0].lineStyle.color).toBe('var(--color-loss)')
  })

  it('does not crash on empty data — renders flat [0,0]', () => {
    expect(() => render(<SparklineChart sparkline_data={[]} />)).not.toThrow()
    expect(screen.getByTestId('sparkline-chart')).toBeInTheDocument()
    const option = mockSetOption.mock.calls[0][0]
    expect(option.series[0].data).toEqual([0, 0])
  })

  it('container div has correct dimensions (220×56)', () => {
    render(<SparklineChart sparkline_data={[1, 2, 3]} />)
    const container = screen.getByTestId('sparkline-chart')
    expect(container).toHaveStyle({ width: '220px', height: '56px' })
  })

  it('lineStyle width is 1.8', () => {
    render(<SparklineChart sparkline_data={[1, 2, 3]} />)
    const option = mockSetOption.mock.calls[0][0]
    expect(option.series[0].lineStyle.width).toBe(1.8)
  })

  it('areaStyle opacity is 0.10', () => {
    render(<SparklineChart sparkline_data={[1, 2, 3]} />)
    const option = mockSetOption.mock.calls[0][0]
    expect(option.series[0].areaStyle.opacity).toBe(0.10)
  })

  it('disposes chart on unmount', () => {
    const { unmount } = render(<SparklineChart sparkline_data={[1, 2, 3]} />)
    unmount()
    expect(mockDispose).toHaveBeenCalledTimes(1)
  })
})
