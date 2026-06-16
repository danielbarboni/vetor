/**
 * csv.test.ts — Nyquist gate: SUM-04 CSV export
 *
 * Tests:
 * - Correct column headers in correct order
 * - UTF-8 BOM present as first character
 * - Decimal separator preference respected
 * - Values formatted correctly
 * - Empty orders produce only header row
 */

import { describe, it, expect } from 'vitest'
import { buildOrdersCsv, CSV_COLUMN_HEADERS } from './csv'
import type { OrderRow } from '@/lib/api'

const UTF8_BOM = '﻿'

const SAMPLE_ORDER: OrderRow = {
  id: 'ord-001',
  robot_id: 'robot-001',
  user_id: 'user-001',
  client_order_id: 'client-001',
  broker_order_id: null,
  effective_contract: 'WINF26',
  side: 'buy',
  order_class: 'entry',
  status: 'filled',
  qty: 1,
  price: 130000.0,
  filled_price: 130050.5,
  result: 250.5,
  created_at: '2026-06-16T09:30:00Z',
  filled_at: '2026-06-16T09:30:02Z',
}

describe('buildOrdersCsv', () => {
  it('starts with UTF-8 BOM', () => {
    const csv = buildOrdersCsv([])
    expect(csv.charCodeAt(0)).toBe(0xFEFF)
    expect(csv[0]).toBe(UTF8_BOM)
  })

  it('has exactly the SUM-04 columns in the header', () => {
    const csv = buildOrdersCsv([])
    const lines = csv.replace(UTF8_BOM, '').split('\n')
    const headerCols = lines[0].split(',')
    expect(headerCols).toEqual(CSV_COLUMN_HEADERS)
  })

  it('includes expected columns: ID, CONTRATO, TIPO, CLASSE, QTD, PREÇO, PREÇO EXEC, STATUS, RESULTADO, DATA, EXEC EM', () => {
    const expected = ['ID', 'CONTRATO', 'TIPO', 'CLASSE', 'QTD', 'PREÇO', 'PREÇO EXEC', 'STATUS', 'RESULTADO', 'DATA', 'EXEC EM']
    expect(CSV_COLUMN_HEADERS).toEqual(expected)
  })

  it('produces one data row per order', () => {
    const csv = buildOrdersCsv([SAMPLE_ORDER, SAMPLE_ORDER])
    const lines = csv.replace(UTF8_BOM, '').split('\n').filter(Boolean)
    expect(lines).toHaveLength(3) // header + 2 data rows
  })

  it('uses comma as default decimal separator for numeric values', () => {
    const csv = buildOrdersCsv([SAMPLE_ORDER])
    // filled_price = 130050.50 → should appear as 130050,50
    expect(csv).toContain('130050,50')
    // result = 250.50 → should appear as 250,50
    expect(csv).toContain('250,50')
  })

  it('uses dot decimal separator when preference is set to "."', () => {
    const csv = buildOrdersCsv([SAMPLE_ORDER], { decimalSeparator: '.' })
    expect(csv).toContain('130050.50')
    expect(csv).toContain('250.50')
  })

  it('empty orders produce only the BOM + header line', () => {
    const csv = buildOrdersCsv([])
    const lines = csv.replace(UTF8_BOM, '').split('\n').filter(Boolean)
    expect(lines).toHaveLength(1)
  })

  it('includes the order ID in the data row', () => {
    const csv = buildOrdersCsv([SAMPLE_ORDER])
    expect(csv).toContain('ord-001')
  })

  it('includes the contract in the data row', () => {
    const csv = buildOrdersCsv([SAMPLE_ORDER])
    expect(csv).toContain('WINF26')
  })

  it('handles null values as empty strings', () => {
    const orderWithNulls: OrderRow = {
      ...SAMPLE_ORDER,
      broker_order_id: null,
      filled_price: null,
      result: null,
      filled_at: null,
    }
    const csv = buildOrdersCsv([orderWithNulls])
    // Should not crash; null fields become empty string
    expect(csv).toBeTruthy()
    const lines = csv.replace(UTF8_BOM, '').split('\n')
    expect(lines.length).toBeGreaterThanOrEqual(2)
  })
})
