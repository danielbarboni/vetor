import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Button from './Button'

describe('Button', () => {
  it('renders primary variant with --color-primary background', () => {
    render(<Button variant="primary">Criar Robô</Button>)
    const btn = screen.getByRole('button', { name: 'Criar Robô' })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveStyle({ background: 'var(--color-primary)' })
    expect(btn).toHaveStyle({ color: 'var(--color-on-primary)' })
  })

  it('renders destructive variant with --color-loss background and #FFFFFF text', () => {
    render(<Button variant="destructive">Excluir</Button>)
    const btn = screen.getByRole('button', { name: 'Excluir' })
    expect(btn).toHaveStyle({ background: 'var(--color-loss)' })
    expect(btn).toHaveStyle({ color: '#FFFFFF' })
  })

  it('renders secondary variant with transparent background and border', () => {
    render(<Button variant="secondary">Cancelar</Button>)
    const btn = screen.getByRole('button', { name: 'Cancelar' })
    expect(btn).toHaveStyle({ background: 'transparent' })
    expect(btn).toHaveStyle({ color: 'var(--muted)' })
  })

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Salvar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders children correctly', () => {
    render(<Button>Avançar →</Button>)
    expect(screen.getByText('Avançar →')).toBeInTheDocument()
  })
})
