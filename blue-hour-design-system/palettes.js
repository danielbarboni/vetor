/**
 * Blue Hour DS · palettes.js
 * Runtime de troca de tema. Requer tokens/tokens.css carregado.
 * Contrato: <html data-palette="..." data-theme="dark|light">
 *
 * Uso:
 *   import { PALETTES, setTheme, getTheme, initTheme } from './palettes.js';
 *   initTheme();                                // aplica preferência salva ou padrão
 *   setTheme({ palette: 'heritage-mode' });     // troca só a paleta
 *   setTheme({ mode: 'light' });                // troca só o modo
 */

export const PALETTES = [
  { id: 'blue-hour', label: 'Blue Hour (padrão)', swatchDark: '#8F7BFF', swatchLight: '#5B47E0' },
  { id: 'cosmos-candy', label: 'Cosmos Candy', swatchDark: '#F06CA8', swatchLight: '#C73E84' },
  { id: 'neon-circuit', label: 'Neon Circuit', swatchDark: '#5C82F2', swatchLight: '#2249AE' },
  { id: 'heritage-mode', label: 'Heritage Mode', swatchDark: '#EAB63E', swatchLight: '#A8761B' },
  { id: 'wisteria-soft', label: 'Wisteria Soft', swatchDark: '#A48BE8', swatchLight: '#735DA5' },
  { id: 'graphite-minimal', label: 'Graphite Minimal', swatchDark: '#8CA3CC', swatchLight: '#4A5C82' },
  { id: 'vermilion-studio', label: 'Vermilion Studio', swatchDark: '#8C8EDE', swatchLight: '#4D51A0' },
  { id: 'rose-tulip', label: 'Rose Tulip', swatchDark: '#EFCE76', swatchLight: '#926F12' },
  { id: 'teal-tangerine', label: 'Teal Tangerine', swatchDark: '#90D5C8', swatchLight: '#2B8070' },
  { id: 'prussian-retro', label: 'Prussian Retro', swatchDark: '#F6CA6F', swatchLight: '#996B0A' },
  { id: 'periwinkle-lime', label: 'Periwinkle Lime', swatchDark: '#7798EE', swatchLight: '#1949C7' },
  { id: 'summer-sky', label: 'Summer Sky', swatchDark: '#EEC077', swatchLight: '#9F6913' },
  { id: 'tulip-blonde', label: 'Tulip Blonde', swatchDark: '#F8E96D', swatchLight: '#847708' },
  { id: 'raspberry-cocoa', label: 'Raspberry Cocoa', swatchDark: '#D590AA', swatchLight: '#A83862' },
  { id: 'pine-sage', label: 'Pine Sage', swatchDark: '#C6D590', swatchLight: '#697A29' },
  { id: 'cobalt-mist', label: 'Cobalt Mist', swatchDark: '#6C9BF9', swatchLight: '#0D50D3' },
  { id: 'lilac-canary', label: 'Lilac Canary', swatchDark: '#E7C37E', swatchLight: '#966C1C' },
  { id: 'lilac-ember', label: 'Lilac Ember', swatchDark: '#E9A67C', swatchLight: '#BA5A1F' },
  { id: 'primary-twist', label: 'Primary Twist', swatchDark: '#F2DA73', swatchLight: '#87700D' },
  { id: 'sapphire-neon', label: 'Sapphire Neon', swatchDark: '#7E6CF9', swatchLight: '#270DD3' },
  { id: 'graystone-emerald', label: 'Graystone Emerald', swatchDark: '#90D4D5', swatchLight: '#2B7F80' },
  { id: 'azure-punch', label: 'Azure Punch', swatchDark: '#839DE2', swatchLight: '#2A51B6' },
  { id: 'desert-dusk', label: 'Desert Dusk', swatchDark: '#80B7E5', swatchLight: '#2676BA' },
  { id: 'apricot-vintage', label: 'Apricot Vintage', swatchDark: '#DFB686', swatchLight: '#9F6A2A' },
  { id: 'pop-mustard', label: 'Pop Mustard', swatchDark: '#F9E16C', swatchLight: '#8B7509' },
  { id: 'dune-blush', label: 'Dune Blush', swatchDark: '#D5AA90', swatchLight: '#A86338' },
  { id: 'alpine-moss', label: 'Alpine Moss', swatchDark: '#85B1E0', swatchLight: '#2D6DB3' },
  { id: 'clay-raspberry', label: 'Clay Raspberry', swatchDark: '#E77EA4', swatchLight: '#BD245B' },
  { id: 'walnut-aegean', label: 'Walnut Aegean', swatchDark: '#EDA578', swatchLight: '#BF591A' },
  { id: 'strawberry-mocha', label: 'Strawberry Mocha', swatchDark: '#83E2D9', swatchLight: '#1F847A' },
  { id: 'october-mist', label: 'October Mist', swatchDark: '#D5AB90', swatchLight: '#A86438' },
  { id: 'ruby-peach', label: 'Ruby Peach', swatchDark: '#E4A881', swatchLight: '#B35E26' },
  { id: 'dawn-papaya', label: 'Dawn Papaya', swatchDark: '#F1D174', swatchLight: '#8D6D0F' },
  { id: 'antique-brandy', label: 'Antique Brandy', swatchDark: '#E0C685', swatchLight: '#8F7124' },
  { id: 'autumn-beryl', label: 'Autumn Beryl', swatchDark: '#E5B480', swatchLight: '#A76722' },
  { id: 'retro-block', label: 'Retro Block 90s', swatchDark: '#75C0F0', swatchLight: '#147BBD' },
  { id: 'bohemian-sage', label: 'Bohemian Sage', swatchDark: '#D5B090', swatchLight: '#A36836' },
  { id: 'sky-fuchsia', label: 'Sky Fuchsia', swatchDark: '#F2DC73', swatchLight: '#87720D' },
  { id: 'disco-lime', label: 'Disco Lime', swatchDark: '#D590BC', swatchLight: '#A83880' },
  { id: 'beach-cyan', label: 'Beach Cyan', swatchDark: '#EC9D79', swatchLight: '#C5511B' },
  { id: 'school-recess', label: 'School Recess', swatchDark: '#E87DB1', swatchLight: '#BF216F' },
  { id: 'eggplant-sun', label: 'Eggplant Sun', swatchDark: '#F9ED6C', swatchLight: '#7D7208' },
  { id: 'behr-whisper', label: 'Behr Whisper', swatchDark: '#D5A690', swatchLight: '#A85C38' },
  { id: 'moroccan-teal', label: 'Moroccan Teal', swatchDark: '#F5D570', swatchLight: '#91710A' },
  { id: 'candy-neon', label: 'Candy Neon', swatchDark: '#E3F66F', swatchLight: '#6C7D08' },
  { id: 'kawaii-soft', label: 'Kawaii Soft', swatchDark: '#F96CBD', swatchLight: '#D30D7F' },
  { id: 'magenta-grape', label: 'Magenta Grape', swatchDark: '#EF76B1', swatchLight: '#CA176E' },
  { id: 'amethyst-butterscotch', label: 'Amethyst Butterscotch', swatchDark: '#F8D46D', swatchLight: '#926F09' },
  { id: 'citrus-pastel', label: 'Citrus Pastel', swatchDark: '#F1A774', swatchLight: '#BE5913' },
  { id: 'bubblegum-pop', label: 'Bubblegum Pop', swatchDark: '#C0EE77', swatchLight: '#578310' },
  { id: 'seafoam-chartreuse', label: 'Seafoam Chartreuse', swatchDark: '#76CEEF', swatchLight: '#147FA6' },
];

const DEFAULTS = { palette: 'blue-hour', mode: 'dark' };
const KEY = 'bh-theme';
let memory = { ...DEFAULTS }; // fallback quando storage não está disponível

function readStore() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...memory };
  } catch { return { ...memory }; }
}

function writeStore(state) {
  memory = state;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* in-memory only */ }
}

export function getTheme() {
  const el = document.documentElement;
  return {
    palette: el.getAttribute('data-palette') || DEFAULTS.palette,
    mode: el.getAttribute('data-theme') || DEFAULTS.mode,
  };
}

export function setTheme({ palette, mode } = {}) {
  const current = getTheme();
  const next = {
    palette: palette && PALETTES.some(p => p.id === palette) ? palette : current.palette,
    mode: mode === 'light' || mode === 'dark' ? mode : current.mode,
  };
  const el = document.documentElement;
  el.setAttribute('data-palette', next.palette);
  el.setAttribute('data-theme', next.mode);
  writeStore(next);
  return next;
}

/** Aplica preferência salva (ou padrão + prefers-color-scheme) antes do primeiro paint. */
export function initTheme() {
  const saved = readStore();
  if (!localStorageHas() && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    saved.mode = 'light';
  }
  return setTheme(saved);
}

function localStorageHas() {
  try { return localStorage.getItem(KEY) !== null; } catch { return false; }
}
