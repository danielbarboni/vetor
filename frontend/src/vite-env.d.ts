/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Allow importing CSS files
declare module '*.css' {
  const content: string
  export default content
}

// Declarations for blue-hour-design-system JS modules (relative paths from src files)
interface PaletteEntry {
  id: string
  label: string
  swatchDark: string
  swatchLight: string
}
interface ThemeState {
  palette: string
  mode: string
}

declare module '../../blue-hour-design-system/palettes.js' {
  export const PALETTES: PaletteEntry[]
  export function getTheme(): ThemeState
  export function setTheme(opts: { palette?: string; mode?: string }): ThemeState
  export function initTheme(): ThemeState
}

declare module '../../../blue-hour-design-system/palettes.js' {
  export const PALETTES: PaletteEntry[]
  export function getTheme(): ThemeState
  export function setTheme(opts: { palette?: string; mode?: string }): ThemeState
  export function initTheme(): ThemeState
}
