import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from './Badge'

describe('Badge', () => {
  it('renders EXECUTANDO badge with profit colors', () => {
    render(<Badge status="executando" />)
    const badge = screen.getByText('EXECUTANDO')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveStyle({ background: 'var(--tint-profit)' })
    expect(badge).toHaveStyle({ color: 'var(--color-profit)' })
  })

  it('renders PARADO badge with surface3/muted colors', () => {
    render(<Badge status="parado" />)
    const badge = screen.getByText('PARADO')
    expect(badge).toHaveStyle({ background: 'var(--surface3)' })
    expect(badge).toHaveStyle({ color: 'var(--muted)' })
  })

  it('renders ARQUIVADO badge with surface2/muted2 colors', () => {
    render(<Badge status="arquivado" />)
    const badge = screen.getByText('ARQUIVADO')
    expect(badge).toHaveStyle({ background: 'var(--surface2)' })
    expect(badge).toHaveStyle({ color: 'var(--muted2)' })
  })

  it('renders Pessimista simulator badge', () => {
    render(<Badge status="pessimista" />)
    expect(screen.getByText('PESSIMISTA')).toBeInTheDocument()
  })

  it('renders Moderado simulator badge with info colors', () => {
    render(<Badge status="moderado" />)
    const badge = screen.getByText('MODERADO')
    expect(badge).toHaveStyle({ background: 'var(--tint-info)' })
    expect(badge).toHaveStyle({ color: 'var(--color-info)' })
  })

  it('renders Otimista simulator badge with amber colors', () => {
    render(<Badge status="otimista" />)
    const badge = screen.getByText('OTIMISTA')
    expect(badge).toHaveStyle({ background: 'var(--tint-amber)' })
    expect(badge).toHaveStyle({ color: 'var(--color-amber)' })
  })

  it('renders ASSINADA badge with primary tint', () => {
    render(<Badge status="assinada" />)
    const badge = screen.getByText('ASSINADA')
    expect(badge).toHaveStyle({ background: 'var(--tint-primary)' })
    expect(badge).toHaveStyle({ color: 'var(--color-primary)' })
  })

  it('renders EM BREVE badge with border', () => {
    render(<Badge status="em_breve" />)
    const badge = screen.getByText('EM BREVE')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveStyle({ background: 'var(--surface3)' })
  })

  it('renders ATIVA badge with accent colors', () => {
    render(<Badge status="ativa" />)
    const badge = screen.getByText('ATIVA')
    expect(badge).toHaveStyle({ background: 'var(--tint-accent)' })
    expect(badge).toHaveStyle({ color: 'var(--color-accent)' })
  })

  it('accepts custom label override', () => {
    render(<Badge status="executando" label="RUNNING" />)
    expect(screen.getByText('RUNNING')).toBeInTheDocument()
  })
})
