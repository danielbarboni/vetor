/**
 * RobotWizard.test.tsx — Hermetic unit tests for the 4-step wizard.
 *
 * All API calls are mocked — no live backend calls (environment_constraints).
 * Covers: WIZ-01..06, D-09, D-10, D-12, D-13, ephemeral state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ── Mock react-router-dom navigate ────────────────────────────────────────────
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// ── Mock api.createRobot ──────────────────────────────────────────────────────
const mockCreateRobot = vi.fn()
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    createRobot: (...args: unknown[]) => mockCreateRobot(...args),
  }
})

import RobotWizard from './RobotWizard'

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={['/robos/wizard']}>
      <RobotWizard />
    </MemoryRouter>,
  )
}

describe('RobotWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Step 1: Strategy catalog ──────────────────────────────────────────────

  it('renders Step 1 with title and subtitle', () => {
    renderWizard()
    expect(screen.getByText('Criando seu robô')).toBeDefined()
    expect(
      screen.getByText(
        'Quatro passos e seu robô estará pronto para configurar — sem escrever uma linha de código.',
      ),
    ).toBeDefined()
  })

  it('shows all 7 strategy cards (D-09)', () => {
    renderWizard()
    // Selectable
    expect(screen.getByText('Indicadores Técnicos [Tangram 3.0]')).toBeDefined()
    // Non-selectable
    expect(screen.getByText('Larry Williams')).toBeDefined()
    expect(screen.getByText('Tangram')).toBeDefined()
    expect(screen.getByText('Fibonacci')).toBeDefined()
    expect(screen.getByText('Toque na Média')).toBeDefined()
    expect(screen.getByText('Price Action')).toBeDefined()
    expect(screen.getByText('RenkoBot Start')).toBeDefined()
  })

  it('shows EM BREVE badges on all non-selectable strategies (WIZ-02)', () => {
    renderWizard()
    const badges = screen.getAllByText('EM BREVE')
    // 6 non-selectable strategies
    expect(badges.length).toBe(6)
  })

  it('AVANÇAR is disabled when no strategy is selected', () => {
    renderWizard()
    const btn = screen.getByRole('button', { name: /AVANÇAR/i })
    expect(btn).toHaveStyle('opacity: 0.45')
  })

  it('selecting IT strategy enables AVANÇAR (D-10)', () => {
    renderWizard()
    // Click the "+" button for IT (label has aria-label)
    const selectBtn = screen.getByRole('button', {
      name: /Selecionar Indicadores Técnicos/i,
    })
    fireEvent.click(selectBtn)
    const avancar = screen.getByRole('button', { name: /AVANÇAR/i })
    expect(avancar).toHaveStyle('opacity: 1')
  })

  it('search input filters strategy cards (WIZ-01)', () => {
    renderWizard()
    const searchInput = screen.getByPlaceholderText('Buscar estratégia…')
    fireEvent.change(searchInput, { target: { value: 'Fibonacci' } })
    expect(screen.getByText('Fibonacci')).toBeDefined()
    expect(screen.queryByText('Larry Williams')).toBeNull()
  })

  // ─── Step 2: Mode selection ────────────────────────────────────────────────

  it('advances to Step 2 and shows mode cards (WIZ-03)', () => {
    renderWizard()
    // Select IT
    fireEvent.click(screen.getByRole('button', { name: /Selecionar Indicadores Técnicos/i }))
    fireEvent.click(screen.getByRole('button', { name: /AVANÇAR/i }))

    expect(screen.getByText('Modo Simulado')).toBeDefined()
    expect(screen.getByText('Modo Real')).toBeDefined()
    expect(screen.getByText('RECOMENDADO')).toBeDefined()
  })

  it('shows correct Simulado description (WIZ-03)', () => {
    renderWizard()
    fireEvent.click(screen.getByRole('button', { name: /Selecionar Indicadores Técnicos/i }))
    fireEvent.click(screen.getByRole('button', { name: /AVANÇAR/i }))
    expect(
      screen.getByText(/Carteira virtual com cotações reais e simulador pessimista/i),
    ).toBeDefined()
  })

  // ─── Step 3: Asset selection ───────────────────────────────────────────────

  it('advances to Step 3 and shows asset chips (WIZ-04, D-12)', async () => {
    renderWizard()
    // Step 1
    fireEvent.click(screen.getByRole('button', { name: /Selecionar Indicadores Técnicos/i }))
    fireEvent.click(screen.getByRole('button', { name: /AVANÇAR/i }))
    // Step 2: select Simulado
    fireEvent.click(screen.getByText('Modo Simulado'))
    fireEvent.click(screen.getByRole('button', { name: /AVANÇAR/i }))

    expect(screen.getByText('WIN%')).toBeDefined()
    expect(screen.getByText('WDO%')).toBeDefined()
    expect(screen.getByText('BIT%')).toBeDefined()
  })

  it('AVANÇAR disabled until asset is chosen (D-12)', () => {
    renderWizard()
    fireEvent.click(screen.getByRole('button', { name: /Selecionar Indicadores Técnicos/i }))
    fireEvent.click(screen.getByRole('button', { name: /AVANÇAR/i }))
    fireEvent.click(screen.getByText('Modo Simulado'))
    fireEvent.click(screen.getByRole('button', { name: /AVANÇAR/i }))

    const avancar = screen.getByRole('button', { name: /AVANÇAR/i })
    expect(avancar).toHaveStyle('opacity: 0.45')
  })

  // ─── Step 4: Configure ────────────────────────────────────────────────────

  async function goToStep4() {
    renderWizard()
    // Step 1
    fireEvent.click(screen.getByRole('button', { name: /Selecionar Indicadores Técnicos/i }))
    fireEvent.click(screen.getByRole('button', { name: /AVANÇAR/i }))
    // Step 2
    fireEvent.click(screen.getByText('Modo Simulado'))
    fireEvent.click(screen.getByRole('button', { name: /AVANÇAR/i }))
    // Step 3
    fireEvent.click(screen.getByRole('button', { name: /WIN%/i }))
    fireEvent.click(screen.getByRole('button', { name: /AVANÇAR/i }))
  }

  it('Step 4 shows name input with hint (WIZ-05)', async () => {
    await goToStep4()
    expect(screen.getByLabelText !== undefined) // label exists
    expect(screen.getByPlaceholderText('Ex.: Estocástico WIN 5min')).toBeDefined()
    expect(screen.getByText(/Único por conta e ambiente/)).toBeDefined()
  })

  it('Step 4 shows simulation capital field for Simulado (WIZ-05)', async () => {
    await goToStep4()
    expect(screen.getByText('Capital para simulação')).toBeDefined()
    const capitalInput = screen.getByDisplayValue('R$ 5.000,00')
    expect(capitalInput).toBeDefined()
  })

  it('CRIAR ROBÔ is disabled when name is empty', async () => {
    await goToStep4()
    const createBtn = screen.getByRole('button', { name: /CRIAR ROBÔ/i })
    expect(createBtn).toHaveStyle('opacity: 0.45')
  })

  it('no API call before Step 4 submit (D-13 ephemeral)', async () => {
    await goToStep4()
    expect(mockCreateRobot).not.toHaveBeenCalled()
  })

  // ─── Submission (WIZ-06) ──────────────────────────────────────────────────

  it('calls createRobot and navigates to /robos/{id}/parametros on success (WIZ-06)', async () => {
    mockCreateRobot.mockResolvedValueOnce({
      id: 'robot-abc-123',
      name: 'Meu Robô',
      status: 'rascunho',
    })

    await goToStep4()

    fireEvent.change(screen.getByPlaceholderText('Ex.: Estocástico WIN 5min'), {
      target: { value: 'Meu Robô' },
    })

    fireEvent.click(screen.getByRole('button', { name: /CRIAR ROBÔ/i }))

    await waitFor(() => {
      expect(mockCreateRobot).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Meu Robô',
          strategy_type: 'indicadores_tecnicos',
          mode: 'simulado',
          asset: 'WIN%',
          fill_policy: 'pessimista',
          status: 'rascunho',
        }),
      )
      expect(mockNavigate).toHaveBeenCalledWith('/robos/robot-abc-123/parametros')
    })
  })

  it('shows inline name error on 409 duplicate name (WIZ-05)', async () => {
    const { ApiError } = await import('@/lib/api')
    mockCreateRobot.mockRejectedValueOnce(new ApiError(409, 'Conflict'))

    await goToStep4()
    fireEvent.change(screen.getByPlaceholderText('Ex.: Estocástico WIN 5min'), {
      target: { value: 'Robô Duplicado' },
    })
    fireEvent.click(screen.getByRole('button', { name: /CRIAR ROBÔ/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/Já existe um robô com este nome neste ambiente/i),
      ).toBeDefined()
    })

    // Does NOT navigate away
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  // ─── strategyCatalog integrity (D-09/D-10) ────────────────────────────────

  it('strategyCatalog has 7 entries, only indicadores_tecnicos is selectable', async () => {
    const { strategyCatalog } = await import('@/data/strategyCatalog')
    expect(strategyCatalog).toHaveLength(7)
    const selectable = strategyCatalog.filter((s) => s.selectable)
    expect(selectable).toHaveLength(1)
    expect(selectable[0].id).toBe('indicadores_tecnicos')
  })
})
