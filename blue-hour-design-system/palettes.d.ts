export interface PaletteEntry {
  id: string
  label: string
  swatchDark: string
  swatchLight: string
}

export interface ThemeState {
  palette: string
  mode: string
}

export const PALETTES: PaletteEntry[]
export function getTheme(): ThemeState
export function setTheme(opts: { palette?: string; mode?: string }): ThemeState
export function initTheme(): ThemeState
