import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Toggle from './Toggle'

describe('Toggle', () => {
  it('renders in off state with kb class on knob', () => {
    render(<Toggle value={false} onChange={() => {}} />)
    const knob = document.querySelector('.kb')
    expect(knob).toBeInTheDocument()
    expect(knob).not.toHaveClass('kb-on')
  })

  it('renders in on state with kb-on class on knob', () => {
    render(<Toggle value={true} onChange={() => {}} />)
    const knob = document.querySelector('.kb-on')
    expect(knob).toBeInTheDocument()
  })

  it('calls onChange(true) when clicked from off state', () => {
    const onChange = vi.fn()
    render(<Toggle value={false} onChange={onChange} />)
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('calls onChange(false) when clicked from on state', () => {
    const onChange = vi.fn()
    render(<Toggle value={true} onChange={onChange} />)
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn()
    render(<Toggle value={false} onChange={onChange} disabled />)
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders with label', () => {
    render(<Toggle value={false} onChange={() => {}} label="Notificações" />)
    expect(screen.getByText('Notificações')).toBeInTheDocument()
  })

  it('has correct aria-checked attribute', () => {
    const { rerender } = render(<Toggle value={false} onChange={() => {}} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    rerender(<Toggle value={true} onChange={() => {}} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })
})
