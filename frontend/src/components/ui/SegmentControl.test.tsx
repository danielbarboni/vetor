import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SegmentControl from './SegmentControl'

const OPTIONS = [
  { value: 'pessimista', label: 'Pessimista' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'otimista', label: 'Otimista' },
]

describe('SegmentControl', () => {
  it('renders all options', () => {
    render(<SegmentControl options={OPTIONS} value="pessimista" onChange={() => {}} />)
    expect(screen.getByText('Pessimista')).toBeInTheDocument()
    expect(screen.getByText('Moderado')).toBeInTheDocument()
    expect(screen.getByText('Otimista')).toBeInTheDocument()
  })

  it('marks selected option with sg-on class', () => {
    render(<SegmentControl options={OPTIONS} value="moderado" onChange={() => {}} />)
    const activeBtn = screen.getByText('Moderado')
    expect(activeBtn).toHaveClass('sg-on')
  })

  it('unselected options have sg class', () => {
    render(<SegmentControl options={OPTIONS} value="moderado" onChange={() => {}} />)
    const inactiveBtn = screen.getByText('Pessimista')
    expect(inactiveBtn).toHaveClass('sg')
    expect(inactiveBtn).not.toHaveClass('sg-on')
  })

  it('calls onChange with clicked option value', () => {
    const onChange = vi.fn()
    render(<SegmentControl options={OPTIONS} value="pessimista" onChange={onChange} />)
    fireEvent.click(screen.getByText('Otimista'))
    expect(onChange).toHaveBeenCalledWith('otimista')
  })

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn()
    render(<SegmentControl options={OPTIONS} value="pessimista" onChange={onChange} disabled />)
    fireEvent.click(screen.getByText('Moderado'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
