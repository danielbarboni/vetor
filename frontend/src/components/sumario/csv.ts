/**
 * csv.ts — Client-side CSV export for the order list (SUM-04).
 *
 * Produces a UTF-8 BOM CSV with the standard SUM-04 columns.
 * Triggers a Blob download in the browser — no server file needed.
 *
 * Decimal separator respects user preference (default: comma = Brazilian standard).
 */

import type { OrderRow } from '@/lib/api'

export interface CsvPreferences {
  /** ',' for Brazilian Portuguese; '.' for US/international. Default: ',' */
  decimalSeparator?: string
}

// SUM-04 columns (in order as per PRD §19.4 and prototype)
const COLUMNS = [
  { header: 'ID',          key: 'id' },
  { header: 'CONTRATO',    key: 'effective_contract' },
  { header: 'TIPO',        key: 'side' },
  { header: 'CLASSE',      key: 'order_class' },
  { header: 'QTD',         key: 'qty' },
  { header: 'PREÇO',       key: 'price' },
  { header: 'PREÇO EXEC',  key: 'filled_price' },
  { header: 'STATUS',      key: 'status' },
  { header: 'RESULTADO',   key: 'result' },
  { header: 'DATA',        key: 'created_at' },
  { header: 'EXEC EM',     key: 'filled_at' },
]

export const CSV_COLUMN_HEADERS = COLUMNS.map((c) => c.header)

function _formatValue(val: unknown, decSep: string): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'number') {
    // Use locale-appropriate decimal separator
    const str = val.toFixed(2)
    return decSep === ',' ? str.replace('.', ',') : str
  }
  if (typeof val === 'string') {
    // Escape double-quotes and wrap values containing commas/newlines
    const escaped = val.replace(/"/g, '""')
    if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
      return `"${escaped}"`
    }
    return escaped
  }
  return String(val)
}

/**
 * Build a CSV string with UTF-8 BOM for the given orders.
 * Returns the raw string (including BOM) — does NOT trigger download.
 */
export function buildOrdersCsv(orders: OrderRow[], prefs: CsvPreferences = {}): string {
  const decSep = prefs.decimalSeparator ?? ','
  const UTF8_BOM = '﻿'

  const header = COLUMNS.map((c) => c.header).join(',')

  const rows = orders.map((order) =>
    COLUMNS.map((col) => {
      const val = order[col.key as keyof OrderRow]
      return _formatValue(val, decSep)
    }).join(','),
  )

  return UTF8_BOM + [header, ...rows].join('\n')
}

/**
 * Trigger a browser file download of orders as CSV.
 */
export function downloadOrdersCsv(
  orders: OrderRow[],
  filename = 'ordens.csv',
  prefs: CsvPreferences = {},
): void {
  const csv = buildOrdersCsv(orders, prefs)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
