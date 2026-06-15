/* Adaptado para o runtime do protótipo: React global + module.exports (conteúdo original v2.1 intacto; grid agrupado em Curadas/Galeria). */
const { useState, useEffect, useRef, useCallback } = React;

/**
 * VETOR · PaletteSelector — Blue Hour DS v2
 *
 * Seletor de aparência para a tela de configurações: 51 paletas × 2 modos (7 curadas + 44 galeria).
 * Cada paleta é renderizada como uma miniatura viva do dashboard (sidebar,
 * sparkline, KPI, botão), para o usuário ver a consequência real da escolha.
 *
 * Integração com o design system:
 *   - Aplica <html data-palette="..." data-theme="..."> (contrato do tokens.css)
 *   - No app real, importe também initTheme()/setTheme() de palettes.js para
 *     persistência; este componente cuida da UI e dos atributos.
 *
 * Props (todas opcionais):
 *   initialPalette  id inicial (default: lê do <html> ou "blue-hour")
 *   initialMode     "dark" | "light" (default: lê do <html> ou "dark")
 *   onChange        ({ palette, mode }) => void
 */

const PALETTES = [
  {
    id: "blue-hour",
    label: "Blue Hour (padrão)",
    tag: "Padrão",
    desc: "Equilibrada e tech-premium. Índigo profundo com íris e aqua.",
    dark: { bg: "#14182B", surface: "#1C2138", s2: "#262C4A", border: "#323A5E", hi: "#EDEFFA", mid: "#A6ADCF", low: "#6E7699", primary: "#8F7BFF", onP: "#14182B", accent: "#3EE6C8", profit: "#34D399", loss: "#FB7185" },
    light: { bg: "#F5F6FB", surface: "#FFFFFF", s2: "#ECEEF8", border: "#DCE0F0", hi: "#1B2040", mid: "#515A80", low: "#8189AC", primary: "#5B47E0", onP: "#FFFFFF", accent: "#0E9E87", profit: "#0E9F6E", loss: "#E11D48" },
  },
  {
    id: "cosmos-candy",
    label: "Cosmos Candy",
    tag: "Vibrante",
    desc: "Maximalismo organizado. Azul-espacial, rosa candy e menta.",
    dark: { bg: "#1E1F4B", surface: "#27295A", s2: "#32346E", border: "#3C3E7E", hi: "#F0F0FC", mid: "#ACAFDD", low: "#7B7EB5", primary: "#F06CA8", onP: "#1E1F4B", accent: "#8FE3CC", profit: "#3FD68F", loss: "#FF6B81" },
    light: { bg: "#F6F5FB", surface: "#FFFFFF", s2: "#EEECF8", border: "#DEDCF0", hi: "#22235F", mid: "#565893", low: "#8B8DBA", primary: "#C73E84", onP: "#FFFFFF", accent: "#2E9C82", profit: "#0E9F6E", loss: "#E11D48" },
  },
  {
    id: "neon-circuit",
    label: "Neon Circuit",
    tag: "Energia",
    desc: "Energia de terminal. Navy, azul-royal e canário — lucro em verde-neon.",
    dark: { bg: "#16204A", surface: "#1D2A5E", s2: "#283672", border: "#334181", hi: "#EEF1FC", mid: "#A4AEDA", low: "#7480B2", primary: "#5C82F2", onP: "#10183A", accent: "#F5EE8A", profit: "#7EE05F", loss: "#FF6E7C" },
    light: { bg: "#F4F6FC", surface: "#FFFFFF", s2: "#EAEEF9", border: "#D8DEF2", hi: "#172B66", mid: "#4A5890", low: "#7E89B6", primary: "#2249AE", onP: "#FFFFFF", accent: "#9C8F00", profit: "#3FA52C", loss: "#DC2638" },
  },
  {
    id: "heritage-mode",
    label: "Heritage Mode",
    tag: "Sofisticada",
    desc: "Old money terminal. Verde-petróleo, ouro e coral; claro em creme.",
    dark: { bg: "#15221F", surface: "#1D2C29", s2: "#273835", border: "#324440", hi: "#F2EFE3", mid: "#A9B5A9", low: "#74827A", primary: "#EAB63E", onP: "#15221F", accent: "#5FA89B", profit: "#4CC38A", loss: "#E37769" },
    light: { bg: "#FAF6E7", surface: "#FFFFFF", s2: "#F1ECD9", border: "#E2DCC5", hi: "#22332F", mid: "#5C6B60", low: "#8B9489", primary: "#A8761B", onP: "#FFFFFF", accent: "#355952", profit: "#1F8A5F", loss: "#CC4733" },
  },
  {
    id: "wisteria-soft",
    label: "Wisteria Soft",
    tag: "Calma",
    desc: "Soft-tech acolhedora. Glicínia sobre ameixa, menta-melão nos dados.",
    dark: { bg: "#241F3D", surface: "#2D274E", s2: "#393161", border: "#453C72", hi: "#F1EEFA", mid: "#B3ABD3", low: "#837BA9", primary: "#A48BE8", onP: "#241F3D", accent: "#8EC9BC", profit: "#5BD6A2", loss: "#F2839B" },
    light: { bg: "#F7F5FB", surface: "#FFFFFF", s2: "#EFEAF8", border: "#DFD7EE", hi: "#2E2547", mid: "#5F5683", low: "#8F87B0", primary: "#735DA5", onP: "#FFFFFF", accent: "#3F9E89", profit: "#15935F", loss: "#D6336C" },
  },
  {
    id: "graphite-minimal",
    label: "Graphite Minimal",
    tag: "Dados em foco",
    desc: "Brutalismo contido. Quase monocromática — o P&L é a única cor viva.",
    dark: { bg: "#242128", surface: "#2D2A31", s2: "#38343D", border: "#443F4A", hi: "#ECEAEE", mid: "#A9A5B0", low: "#7B7683", primary: "#8CA3CC", onP: "#242128", accent: "#CAD4DF", profit: "#57C49B", loss: "#E07785" },
    light: { bg: "#F2F2F4", surface: "#FFFFFF", s2: "#E8E8EB", border: "#D8D7DB", hi: "#2C2930", mid: "#5C5864", low: "#8B8792", primary: "#4A5C82", onP: "#FFFFFF", accent: "#656E77", profit: "#1E8A66", loss: "#C2424F" },
  },
  {
    id: "vermilion-studio",
    label: "Vermilion Studio",
    tag: "Assertiva",
    desc: "Editorial e direta. Periwinkle e ocre; o vermelhão só aparece na perda.",
    dark: { bg: "#232548", surface: "#2C2E58", s2: "#383A6B", border: "#43457D", hi: "#EFEFF9", mid: "#A9ABD6", low: "#797CAF", primary: "#8C8EDE", onP: "#1E2040", accent: "#E0A546", profit: "#3FBF8F", loss: "#F25444" },
    light: { bg: "#F4F7F7", surface: "#FFFFFF", s2: "#E9EEEE", border: "#D6DEDE", hi: "#23254A", mid: "#54568A", low: "#888AB2", primary: "#4D51A0", onP: "#FFFFFF", accent: "#B0791D", profit: "#0E8F66", loss: "#CE2C20" },
  },
  {
    id: "rose-tulip",
    label: "Rose Tulip",
    desc: "Tulipas de primavera: rosa profundo e dourado solar.",
    dark: { bg: "#2B151B", surface: "#3B1E26", s2: "#4E2A34", border: "#643843", hi: "#FAEDF1", mid: "#CDA7B1", low: "#98717B", primary: "#EFCE76", onP: "#2B151B", accent: "#B89BD4", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#FAF3F5", surface: "#FFFFFF", s2: "#F3E7EA", border: "#E8D4D9", hi: "#401C25", mid: "#824F5D", low: "#AB828D", primary: "#926F12", onP: "#FFFFFF", accent: "#5C3285", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "teal-tangerine",
    label: "Teal Tangerine",
    tag: "Fresca",
    desc: "Tangerina e teal complementares. Fresca e equilibrada.",
    dark: { bg: "#182825", surface: "#223733", s2: "#2F4944", border: "#3E5E58", hi: "#EDFAF7", mid: "#A7CDC6", low: "#719891", primary: "#90D5C8", onP: "#182825", accent: "#DA95AC", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F4F9F8", surface: "#FFFFFF", s2: "#E9F1F0", border: "#D7E5E2", hi: "#1C4039", mid: "#4F8278", low: "#82ABA3", primary: "#2B8070", onP: "#FFFFFF", accent: "#882F4D", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "prussian-retro",
    label: "Prussian Retro",
    desc: "Retrô moderno em azul prussiano, laranja e mostarda.",
    dark: { bg: "#171C29", surface: "#212839", s2: "#2D364B", border: "#3B4661", hi: "#EDF1FA", mid: "#A7B3CD", low: "#717D98", primary: "#F6CA6F", onP: "#171C29", accent: "#96AAD9", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F4F5F9", surface: "#FFFFFF", s2: "#E8EBF2", border: "#D5DAE6", hi: "#1C2740", mid: "#4F5F82", low: "#828EAB", primary: "#996B0A", onP: "#FFFFFF", accent: "#304B87", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "periwinkle-lime",
    label: "Periwinkle Lime",
    desc: "Periwinkle ousado com toques de rosa e lima.",
    dark: { bg: "#181C28", surface: "#222837", s2: "#2F3649", border: "#3E475E", hi: "#EDF1FA", mid: "#A7B2CD", low: "#717C98", primary: "#7798EE", onP: "#181C28", accent: "#D4DE91", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F4F6F9", surface: "#FFFFFF", s2: "#E9EBF1", border: "#D7DBE5", hi: "#1C2640", mid: "#4F5D82", low: "#828DAB", primary: "#1949C7", onP: "#FFFFFF", accent: "#717C25", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "summer-sky",
    label: "Summer Sky",
    desc: "Dia claro de verão: azul, verde-folha e laranja madura.",
    dark: { bg: "#282218", surface: "#372F22", s2: "#493F2F", border: "#5E513E", hi: "#FAF5ED", mid: "#CDBEA7", low: "#988971", primary: "#EEC077", onP: "#282218", accent: "#8BCCE4", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F9F7F4", surface: "#FFFFFF", s2: "#F1EEE9", border: "#E5DFD7", hi: "#40321C", mid: "#826E4F", low: "#AB9B82", primary: "#9F6913", onP: "#FFFFFF", accent: "#237695", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "tulip-blonde",
    label: "Tulip Blonde",
    desc: "Doce e delicada: amarelo-claro, bege e rosa-tulipa.",
    dark: { bg: "#282618", surface: "#373522", s2: "#49462F", border: "#5E5A3E", hi: "#FAF9ED", mid: "#CDC9A7", low: "#989471", primary: "#F8E96D", onP: "#282618", accent: "#E986A7", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F9F9F4", surface: "#FFFFFF", s2: "#F1F1E9", border: "#E5E3D7", hi: "#403C1C", mid: "#827C4F", low: "#ABA782", primary: "#847708", onP: "#FFFFFF", accent: "#9B1D47", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "raspberry-cocoa",
    label: "Raspberry Cocoa",
    desc: "Framboesa sobre chocolate. Rica, luxuosa, sensual.",
    dark: { bg: "#2A1A15", surface: "#3A251F", s2: "#4E322A", border: "#634238", hi: "#FAF0ED", mid: "#CDAFA7", low: "#987A71", primary: "#D590AA", onP: "#2A1A15", accent: "#EBA385", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#FAF5F3", surface: "#FFFFFF", s2: "#F3EAE7", border: "#E8D8D4", hi: "#40231C", mid: "#825A4F", low: "#AB8B82", primary: "#A83862", onP: "#FFFFFF", accent: "#9D421A", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "pine-sage",
    label: "Pine Sage",
    desc: "Bosque sereno: sálvia, pinho e neutros esverdeados.",
    dark: { bg: "#1B241F", surface: "#27332C", s2: "#34433B", border: "#45574C", hi: "#EDFAF2", mid: "#A7CDB7", low: "#719881", primary: "#C6D590", onP: "#1B241F", accent: "#9BD4C4", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F4F9F6", surface: "#FFFFFF", s2: "#EAF0ED", border: "#D9E3DD", hi: "#1C402B", mid: "#4F8264", low: "#82AB93", primary: "#697A29", onP: "#FFFFFF", accent: "#308069", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "cobalt-mist",
    label: "Cobalt Mist",
    desc: "Azuis análogos e calmos, do céu claro ao cobalto.",
    dark: { bg: "#121B2D", surface: "#1B273E", s2: "#253553", border: "#32456A", hi: "#EDF1FA", mid: "#A7B4CD", low: "#717E98", primary: "#6C9BF9", onP: "#121B2D", accent: "#AC77F8", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F3F5FB", surface: "#FFFFFF", s2: "#E6EBF4", border: "#D2DAE9", hi: "#1C2840", mid: "#4F6082", low: "#8290AB", primary: "#0D50D3", onP: "#FFFFFF", accent: "#4E0EAA", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "lilac-canary",
    label: "Lilac Canary",
    desc: "Lilás e canário em gradiente surreal e suave.",
    dark: { bg: "#282218", surface: "#373022", s2: "#49402F", border: "#5E533E", hi: "#FAF6ED", mid: "#CDC0A7", low: "#988B71", primary: "#E7C37E", onP: "#282218", accent: "#B09BD4", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F9F7F4", surface: "#FFFFFF", s2: "#F1EEE9", border: "#E5E0D7", hi: "#40341C", mid: "#82704F", low: "#AB9D82", primary: "#966C1C", onP: "#FFFFFF", accent: "#513285", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "lilac-ember",
    label: "Lilac Ember",
    desc: "Lilás sereno aceso por uma brasa laranja.",
    dark: { bg: "#281E18", surface: "#372A22", s2: "#49392F", border: "#5E4A3E", hi: "#FAF2ED", mid: "#CDB6A7", low: "#988071", primary: "#E9A67C", onP: "#281E18", accent: "#9BB2D4", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F9F6F4", surface: "#FFFFFF", s2: "#F1ECE9", border: "#E5DCD7", hi: "#402A1C", mid: "#82634F", low: "#AB9282", primary: "#BA5A1F", onP: "#FFFFFF", accent: "#325485", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "primary-twist",
    label: "Primary Twist",
    desc: "Primárias com torção: teal, citrino e vermelhão.",
    dark: { bg: "#2D1612", surface: "#3E201B", s2: "#532B25", border: "#6A3932", hi: "#FAEFED", mid: "#CDACA7", low: "#987671", primary: "#F2DA73", onP: "#2D1612", accent: "#93D2DC", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#FBF4F3", surface: "#FFFFFF", s2: "#F4E8E6", border: "#E9D5D2", hi: "#40201C", mid: "#82564F", low: "#AB8782", primary: "#87700D", onP: "#FFFFFF", accent: "#2D7D8B", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "sapphire-neon",
    label: "Sapphire Neon",
    desc: "Safira elétrica com neon e amarelo pálido.",
    dark: { bg: "#16122D", surface: "#1F1B3E", s2: "#2B2553", border: "#39326A", hi: "#EFEDFA", mid: "#ACA7CD", low: "#767198", primary: "#7E6CF9", onP: "#16122D", accent: "#EFE781", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F4F3FB", surface: "#FFFFFF", s2: "#E8E6F4", border: "#D5D2E9", hi: "#201C40", mid: "#564F82", low: "#8782AB", primary: "#270DD3", onP: "#FFFFFF", accent: "#7A7310", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "graystone-emerald",
    label: "Graystone Emerald",
    desc: "Pedra e rio: cinzas minerais com esmeralda.",
    dark: { bg: "#1B251D", surface: "#263328", s2: "#344437", border: "#445847", hi: "#EDFAEF", mid: "#A7CDAE", low: "#719878", primary: "#90D4D5", onP: "#1B251D", accent: "#9BA8D4", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F4F9F5", surface: "#FFFFFF", s2: "#EAF0EB", border: "#D9E3DA", hi: "#1C4022", mid: "#4F8258", low: "#82AB89", primary: "#2B7F80", onP: "#FFFFFF", accent: "#324685", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "azure-punch",
    label: "Azure Punch",
    desc: "Azul royal com soco de rosa elétrico. Anos 90.",
    dark: { bg: "#141A2C", surface: "#1D253D", s2: "#283350", border: "#354367", hi: "#EDF1FA", mid: "#A7B1CD", low: "#717C98", primary: "#839DE2", onP: "#141A2C", accent: "#EB84A7", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F3F5FA", surface: "#FFFFFF", s2: "#E6EAF4", border: "#D3D9E9", hi: "#1C2640", mid: "#4F5D82", low: "#828DAB", primary: "#2A51B6", onP: "#FFFFFF", accent: "#9E1A46", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "desert-dusk",
    label: "Desert Dusk",
    desc: "Crepúsculo no deserto: fúcsia, cobalto e terra.",
    dark: { bg: "#281817", surface: "#382221", s2: "#4A2E2E", border: "#5F3D3C", hi: "#FAEEED", mid: "#CDA8A7", low: "#987271", primary: "#80B7E5", onP: "#281817", accent: "#E58AA8", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F9F4F4", surface: "#FFFFFF", s2: "#F2E9E8", border: "#E6D6D6", hi: "#401D1C", mid: "#82514F", low: "#AB8382", primary: "#2676BA", onP: "#FFFFFF", accent: "#962148", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "apricot-vintage",
    label: "Apricot Vintage",
    desc: "Vintage borbulhante: damasco, azul e vermelho-poeira.",
    dark: { bg: "#172429", surface: "#203239", s2: "#2C434C", border: "#3B5761", hi: "#EDF7FA", mid: "#A7C3CD", low: "#718E98", primary: "#DFB686", onP: "#172429", accent: "#95C8DA", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F4F8F9", surface: "#FFFFFF", s2: "#E8F0F2", border: "#D5E2E7", hi: "#1C3740", mid: "#4F7582", low: "#82A0AB", primary: "#9F6A2A", onP: "#FFFFFF", accent: "#2F7188", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "pop-mustard",
    label: "Pop Mustard",
    desc: "Pop eletrizante: azul, mostarda, malva e verde.",
    dark: { bg: "#12212D", surface: "#1B2E3E", s2: "#253E53", border: "#32506A", hi: "#EDF4FA", mid: "#A7BCCD", low: "#718698", primary: "#F9E16C", onP: "#12212D", accent: "#83BBEC", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F3F7FB", surface: "#FFFFFF", s2: "#E6EEF4", border: "#D2DFE9", hi: "#1C2F40", mid: "#4F6A82", low: "#8298AB", primary: "#8B7509", onP: "#FFFFFF", accent: "#19609F", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "dune-blush",
    label: "Dune Blush",
    desc: "Dunas ao entardecer: areia, blush e espresso.",
    dark: { bg: "#291E17", surface: "#382A21", s2: "#4B392D", border: "#604A3C", hi: "#FAF2ED", mid: "#CDB6A7", low: "#988071", primary: "#D5AA90", onP: "#291E17", accent: "#CCD49B", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F9F6F4", surface: "#FFFFFF", s2: "#F2ECE8", border: "#E6DCD6", hi: "#402A1C", mid: "#82634F", low: "#AB9282", primary: "#A86338", onP: "#FFFFFF", accent: "#707A2E", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "alpine-moss",
    label: "Alpine Moss",
    desc: "Lagos alpinos: azuis glaciais e musgo fresco.",
    dark: { bg: "#141F2B", surface: "#1D2C3C", s2: "#293B4F", border: "#364D65", hi: "#EDF3FA", mid: "#A7B9CD", low: "#718498", primary: "#85B1E0", onP: "#141F2B", accent: "#CFD49B", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F3F6FA", surface: "#FFFFFF", s2: "#E7EDF4", border: "#D3DDE9", hi: "#1C2D40", mid: "#4F6882", low: "#8296AB", primary: "#2D6DB3", onP: "#FFFFFF", accent: "#737A2E", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "clay-raspberry",
    label: "Clay Raspberry",
    desc: "Confeitaria: framboesa, argila e cinza quente.",
    dark: { bg: "#291C17", surface: "#382821", s2: "#4B362D", border: "#60473C", hi: "#FAF1ED", mid: "#CDB2A7", low: "#987D71", primary: "#E77EA4", onP: "#291C17", accent: "#D8AB97", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F9F5F4", surface: "#FFFFFF", s2: "#F2EBE8", border: "#E6DBD6", hi: "#40271C", mid: "#825F4F", low: "#AB8E82", primary: "#BD245B", onP: "#FFFFFF", accent: "#864B32", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "walnut-aegean",
    label: "Walnut Aegean",
    desc: "Anos 70: nogueira, azul Egeu, mel e caqui.",
    dark: { bg: "#2A1617", surface: "#3A1F21", s2: "#4D2B2E", border: "#63393C", hi: "#FAEDEE", mid: "#CDA7AA", low: "#987174", primary: "#EDA578", onP: "#2A1617", accent: "#8BC5E5", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#FAF4F4", surface: "#FFFFFF", s2: "#F3E8E8", border: "#E7D4D6", hi: "#401C1E", mid: "#824F53", low: "#AB8285", primary: "#BF591A", onP: "#FFFFFF", accent: "#226D96", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "strawberry-mocha",
    label: "Strawberry Mocha",
    desc: "Morango com mocha e um twist de azul neon.",
    dark: { bg: "#251D1B", surface: "#332926", s2: "#443833", border: "#584943", hi: "#FAF0ED", mid: "#CDB1A7", low: "#987B71", primary: "#83E2D9", onP: "#251D1B", accent: "#E58BA9", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F9F6F4", surface: "#FFFFFF", s2: "#F0ECEA", border: "#E3DBD9", hi: "#40251C", mid: "#825C4F", low: "#AB8C82", primary: "#1F847A", onP: "#FFFFFF", accent: "#962248", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "october-mist",
    label: "October Mist",
    desc: "Névoa de outubro: neutros frios e tangerina.",
    dark: { bg: "#281E18", surface: "#372A22", s2: "#49392F", border: "#5E4A3E", hi: "#FAF2ED", mid: "#CDB6A7", low: "#988071", primary: "#D5AB90", onP: "#281E18", accent: "#DCEA85", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F9F6F4", surface: "#FFFFFF", s2: "#F1ECE9", border: "#E5DCD7", hi: "#402A1C", mid: "#82634F", low: "#AB9282", primary: "#A86438", onP: "#FFFFFF", accent: "#6E7C15", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "ruby-peach",
    label: "Ruby Peach",
    desc: "Pêssego e céu com profundidade de rubi.",
    dark: { bg: "#2B1615", surface: "#3B1F1E", s2: "#4E2B2A", border: "#643937", hi: "#FAEEED", mid: "#CDA8A7", low: "#987271", primary: "#E4A881", onP: "#2B1615", accent: "#8EC5E1", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#FAF4F3", surface: "#FFFFFF", s2: "#F3E8E7", border: "#E8D5D4", hi: "#401D1C", mid: "#82514F", low: "#AB8382", primary: "#B35E26", onP: "#FFFFFF", accent: "#266E91", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "dawn-papaya",
    label: "Dawn Papaya",
    desc: "Amanhecer de verão: rosa, teal, manteiga e papaia.",
    dark: { bg: "#282418", surface: "#373222", s2: "#49422F", border: "#5E563E", hi: "#FAF7ED", mid: "#CDC4A7", low: "#988E71", primary: "#F1D174", onP: "#282418", accent: "#9BD4C9", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F9F8F4", surface: "#FFFFFF", s2: "#F1EFE9", border: "#E5E1D7", hi: "#40371C", mid: "#82754F", low: "#ABA182", primary: "#8D6D0F", onP: "#FFFFFF", accent: "#308070", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "antique-brandy",
    label: "Antique Brandy",
    desc: "Antiquário: brandy, mostarda velha e azul vivo.",
    dark: { bg: "#2B1615", surface: "#3C1F1E", s2: "#4F2B29", border: "#653936", hi: "#FAEEED", mid: "#CDA9A7", low: "#987371", primary: "#E0C685", onP: "#2B1615", accent: "#99D6D6", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#FAF4F3", surface: "#FFFFFF", s2: "#F3E7E7", border: "#E8D4D3", hi: "#401D1C", mid: "#82524F", low: "#AB8482", primary: "#8F7124", onP: "#FFFFFF", accent: "#307F80", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "autumn-beryl",
    label: "Autumn Beryl",
    desc: "Outono terroso com berilo azul de contraste.",
    dark: { bg: "#2A1B16", surface: "#3A271F", s2: "#4D342B", border: "#624439", hi: "#FAF1ED", mid: "#CDB1A7", low: "#987C71", primary: "#E5B480", onP: "#2A1B16", accent: "#9BC1D4", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#FAF5F4", surface: "#FFFFFF", s2: "#F3EBE8", border: "#E7DAD5", hi: "#40251C", mid: "#825D4F", low: "#AB8D82", primary: "#A76722", onP: "#FFFFFF", accent: "#326985", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "retro-block",
    label: "Retro Block 90s",
    desc: "Color-block 90s: rosa, roxo e azul radiantes.",
    dark: { bg: "#12232D", surface: "#1B313E", s2: "#254153", border: "#32546A", hi: "#EDF5FA", mid: "#A7BECD", low: "#718998", primary: "#75C0F0", onP: "#12232D", accent: "#E986AD", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F3F7FB", surface: "#FFFFFF", s2: "#E6EFF4", border: "#D2E0E9", hi: "#1C3240", mid: "#4F6E82", low: "#829BAB", primary: "#147BBD", onP: "#FFFFFF", accent: "#9C1C4E", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "bohemian-sage",
    label: "Bohemian Sage",
    desc: "Boêmia escura: sálvia, couro e mogno.",
    dark: { bg: "#2A1615", surface: "#3B201F", s2: "#4E2C2A", border: "#633A38", hi: "#FAEEED", mid: "#CDA8A7", low: "#987271", primary: "#D5B090", onP: "#2A1615", accent: "#9BD4BE", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#FAF4F3", surface: "#FFFFFF", s2: "#F3E8E7", border: "#E8D5D4", hi: "#401D1C", mid: "#82514F", low: "#AB8382", primary: "#A36836", onP: "#FFFFFF", accent: "#308060", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "sky-fuchsia",
    label: "Sky Fuchsia",
    desc: "Lúdica: céu, fúcsia e amarelo brincalhão.",
    dark: { bg: "#282518", surface: "#373322", s2: "#49442F", border: "#5E583E", hi: "#FAF8ED", mid: "#CDC7A7", low: "#989171", primary: "#F2DC73", onP: "#282518", accent: "#89D1E6", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F9F8F4", surface: "#FFFFFF", s2: "#F1F0E9", border: "#E5E3D7", hi: "#403A1C", mid: "#82794F", low: "#ABA482", primary: "#87720D", onP: "#FFFFFF", accent: "#207D98", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "disco-lime",
    label: "Disco Lime",
    desc: "Disco: roxo, pink e lima fora da zona de conforto.",
    dark: { bg: "#202917", surface: "#2D3920", s2: "#3D4B2C", border: "#4F613B", hi: "#F4FAED", mid: "#BBCDA7", low: "#869871", primary: "#D590BC", onP: "#202917", accent: "#BADA95", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F7F9F4", surface: "#FFFFFF", s2: "#EDF2E8", border: "#DEE6D5", hi: "#2F401C", mid: "#6A824F", low: "#98AB82", primary: "#A83880", onP: "#FFFFFF", accent: "#567C2C", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "beach-cyan",
    label: "Beach Cyan",
    desc: "Praia quente: tigre, milho, areia e ciano.",
    dark: { bg: "#281D18", surface: "#372922", s2: "#49372F", border: "#5E483E", hi: "#FAF1ED", mid: "#CDB3A7", low: "#987D71", primary: "#EC9D79", onP: "#281D18", accent: "#86D3E9", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F9F6F4", surface: "#FFFFFF", s2: "#F1ECE9", border: "#E5DBD7", hi: "#40271C", mid: "#825F4F", low: "#AB8F82", primary: "#C5511B", onP: "#FFFFFF", accent: "#1C7E9C", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "school-recess",
    label: "School Recess",
    desc: "Tríade escolar: azul, laranja e rosa vibrantes.",
    dark: { bg: "#171C29", surface: "#212839", s2: "#2D364B", border: "#3B4661", hi: "#EDF1FA", mid: "#A7B3CD", low: "#717D98", primary: "#E87DB1", onP: "#171C29", accent: "#B7D49B", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F4F5F9", surface: "#FFFFFF", s2: "#E8EBF2", border: "#D5DAE6", hi: "#1C2740", mid: "#4F5F82", low: "#828EAB", primary: "#BF216F", onP: "#FFFFFF", accent: "#578030", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "eggplant-sun",
    label: "Eggplant Sun",
    desc: "Sol e berinjela: leve com base roxa profunda.",
    dark: { bg: "#1F1A25", surface: "#2C2534", s2: "#3B3345", border: "#4D4259", hi: "#F3EDFA", mid: "#B8A7CD", low: "#837198", primary: "#F9ED6C", onP: "#1F1A25", accent: "#B59BD4", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F6F4F9", surface: "#FFFFFF", s2: "#EDEAF0", border: "#DDD9E3", hi: "#2C1C40", mid: "#664F82", low: "#9482AB", primary: "#7D7208", onP: "#FFFFFF", accent: "#583285", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "behr-whisper",
    label: "Behr Whisper",
    desc: "Sussurro Behr: pastéis arquitetônicos suaves.",
    dark: { bg: "#281D18", surface: "#372922", s2: "#49372F", border: "#5E483E", hi: "#FAF1ED", mid: "#CDB3A7", low: "#987D71", primary: "#D5A690", onP: "#281D18", accent: "#D0D49B", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F9F6F4", surface: "#FFFFFF", s2: "#F1ECE9", border: "#E5DBD7", hi: "#40271C", mid: "#825F4F", low: "#AB8F82", primary: "#A85C38", onP: "#FFFFFF", accent: "#757A2E", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "moroccan-teal",
    label: "Moroccan Teal",
    desc: "Marrocos: teal profundo, âmbar e abóbora.",
    dark: { bg: "#192327", surface: "#233136", s2: "#304148", border: "#3F555D", hi: "#EDF6FA", mid: "#A7C3CD", low: "#718E98", primary: "#F5D570", onP: "#192327", accent: "#9BC5D4", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F4F8F9", surface: "#FFFFFF", s2: "#E9EFF1", border: "#D7E1E5", hi: "#1C3640", mid: "#4F7482", low: "#82A0AB", primary: "#91710A", onP: "#FFFFFF", accent: "#326F85", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "candy-neon",
    label: "Candy Neon",
    desc: "Neon doce: rosa, menta e limão fluorescentes.",
    dark: { bg: "#252818", surface: "#343722", s2: "#45492F", border: "#595E3E", hi: "#F8FAED", mid: "#C8CDA7", low: "#939871", primary: "#E3F66F", onP: "#252818", accent: "#ED7DF2", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F8F9F4", surface: "#FFFFFF", s2: "#F0F1E9", border: "#E3E5D7", hi: "#3B401C", mid: "#7B824F", low: "#A6AB82", primary: "#6C7D08", onP: "#FFFFFF", accent: "#A011A7", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "kawaii-soft",
    label: "Kawaii Soft",
    desc: "Kawaii: menta, lavanda e rosa-algodão.",
    dark: { bg: "#281821", surface: "#37222E", s2: "#492F3E", border: "#5E3E50", hi: "#FAEDF4", mid: "#CDA7BD", low: "#987188", primary: "#F96CBD", onP: "#281821", accent: "#77F8C0", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F9F4F7", surface: "#FFFFFF", s2: "#F1E9EE", border: "#E5D7DF", hi: "#401C31", mid: "#824F6C", low: "#AB829A", primary: "#D30D7F", onP: "#FFFFFF", accent: "#0B8650", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "magenta-grape",
    label: "Magenta Grape",
    desc: "Magenta à uva: gradiente vívido de rosa e roxo.",
    dark: { bg: "#171829", surface: "#212239", s2: "#2D2E4B", border: "#3B3D60", hi: "#EDEEFA", mid: "#A7A9CD", low: "#717398", primary: "#EF76B1", onP: "#171829", accent: "#969AD9", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F4F4F9", surface: "#FFFFFF", s2: "#E8E9F2", border: "#D5D6E6", hi: "#1C1E40", mid: "#4F5282", low: "#8284AB", primary: "#CA176E", onP: "#FFFFFF", accent: "#313587", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "amethyst-butterscotch",
    label: "Amethyst Butterscotch",
    desc: "Ametista e caramelo sobre quase-preto.",
    dark: { bg: "#282418", surface: "#373222", s2: "#49422F", border: "#5E553E", hi: "#FAF7ED", mid: "#CDC3A7", low: "#988E71", primary: "#F8D46D", onP: "#282418", accent: "#9C9BD4", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F9F8F4", surface: "#FFFFFF", s2: "#F1EFE9", border: "#E5E1D7", hi: "#40371C", mid: "#82754F", low: "#ABA082", primary: "#926F09", onP: "#FFFFFF", accent: "#353285", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "citrus-pastel",
    label: "Citrus Pastel",
    desc: "Cítricos pastéis: coral, salmão e menta.",
    dark: { bg: "#281E18", surface: "#372B22", s2: "#493A2F", border: "#5E4B3E", hi: "#FAF2ED", mid: "#CDB7A7", low: "#988171", primary: "#F1A774", onP: "#281E18", accent: "#BBDA96", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F9F6F4", surface: "#FFFFFF", s2: "#F1ECE9", border: "#E5DDD7", hi: "#402B1C", mid: "#82644F", low: "#AB9382", primary: "#BE5913", onP: "#FFFFFF", accent: "#587C2C", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "bubblegum-pop",
    label: "Bubblegum Pop",
    desc: "Chiclete pop com lima neon e neutros rosados.",
    dark: { bg: "#222818", surface: "#2F3722", s2: "#3F492F", border: "#515E3E", hi: "#F5FAED", mid: "#BFCDA7", low: "#899871", primary: "#C0EE77", onP: "#222818", accent: "#E68AC9", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F7F9F4", surface: "#FFFFFF", s2: "#EEF1E9", border: "#DFE5D7", hi: "#32401C", mid: "#6E824F", low: "#9BAB82", primary: "#578310", onP: "#FFFFFF", accent: "#972172", profit: "#0E9F6E", loss: "#DC2B47" },
  },
  {
    id: "seafoam-chartreuse",
    label: "Seafoam Chartreuse",
    desc: "Mar análogo: ciano, espuma e chartreuse.",
    dark: { bg: "#182328", surface: "#223137", s2: "#2F4249", border: "#3E555E", hi: "#EDF6FA", mid: "#A7C3CD", low: "#718E98", primary: "#76CEEF", onP: "#182328", accent: "#DBF27D", profit: "#3FCB8E", loss: "#F97084" },
    light: { bg: "#F4F8F9", surface: "#FFFFFF", s2: "#E9EFF1", border: "#D7E1E5", hi: "#1C3640", mid: "#4F7482", low: "#82A0AB", primary: "#147FA6", onP: "#FFFFFF", accent: "#677D0D", profit: "#0E9F6E", loss: "#DC2B47" },
  },
];

const UP = [40, 44, 42, 47, 50, 48, 53, 56, 54, 60, 63, 61, 67, 70, 75, 80];

function tint(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function sparkPath(pts, w, h) {
  const mn = Math.min(...pts) - 4;
  const mx = Math.max(...pts) + 4;
  const X = (i) => (i * w) / (pts.length - 1);
  const Y = (v) => h - ((v - mn) / (mx - mn)) * h;
  return pts.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
}

/* Miniatura viva do dashboard — a consequência da escolha, não um swatch. */
function MiniDashboard({ t }) {
  const line = sparkPath(UP, 150, 34);
  return (
    <div
      aria-hidden="true"
      className="rounded-lg overflow-hidden flex"
      style={{ background: t.bg, border: `1px solid ${t.border}`, height: 116 }}
    >
      {/* mini sidebar */}
      <div className="flex flex-col gap-1.5 p-2" style={{ width: 44, background: t.surface, borderRight: `1px solid ${t.border}` }}>
        <div className="rounded" style={{ width: 14, height: 14, background: t.primary }} />
        <div className="rounded-sm mt-1.5" style={{ height: 5, background: tint(t.primary, 0.35) }} />
        <div className="rounded-sm" style={{ height: 5, width: "75%", background: t.s2 }} />
        <div className="rounded-sm" style={{ height: 5, width: "85%", background: t.s2 }} />
        <div className="rounded-sm" style={{ height: 5, width: "65%", background: t.s2 }} />
      </div>
      {/* mini conteúdo */}
      <div className="flex-1 p-2 flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="rounded-sm" style={{ height: 6, width: 52, background: t.hi, opacity: 0.9 }} />
          <div className="ml-auto rounded-full" style={{ height: 10, width: 34, background: tint(t.accent, 0.28) }} />
        </div>
        <div className="flex gap-1.5">
          {/* card do gráfico */}
          <div className="rounded-md p-1.5 flex-1 min-w-0" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: t.profit }}>+R$ 96,40</div>
            <svg width="100%" height="34" viewBox="0 0 150 34" preserveAspectRatio="none" className="block mt-0.5">
              <path d={`${line} L150,34 L0,34 Z`} fill={tint(t.profit, 0.2)} />
              <path d={line} fill="none" stroke={t.profit} strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          {/* card de KPIs */}
          <div className="rounded-md p-1.5 flex flex-col justify-between" style={{ width: 64, background: t.surface, border: `1px solid ${t.border}` }}>
            <div>
              <div className="rounded-sm" style={{ height: 4, width: 28, background: t.low, opacity: 0.7 }} />
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, fontWeight: 700, color: t.loss, marginTop: 3 }}>−6,8%</div>
            </div>
            <div className="rounded text-center" style={{ background: t.primary, color: t.onP, fontSize: 7, fontWeight: 700, padding: "3px 0", letterSpacing: "0.04em" }}>
              CRIAR ROBÔ
            </div>
          </div>
        </div>
        {/* mini tabela */}
        <div className="flex items-center gap-1.5 rounded-md px-1.5 py-1" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
          <div className="rounded-full" style={{ width: 5, height: 5, background: t.profit }} />
          <div className="rounded-sm flex-1" style={{ height: 4, background: t.s2 }} />
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, color: t.profit }}>+82,4%</div>
        </div>
      </div>
    </div>
  );
}

function Check({ color }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PaletteSelector({ initialPalette, initialMode, onChange } = {}) {
  const readAttr = (attr, fallback) =>
    (typeof document !== "undefined" && document.documentElement.getAttribute(attr)) || fallback;

  const [palette, setPalette] = useState(() => {
    const candidate = initialPalette || readAttr("data-palette", "blue-hour");
    return PALETTES.some((p) => p.id === candidate) ? candidate : "blue-hour";
  });
  const [mode, setMode] = useState(() => {
    const candidate = initialMode || readAttr("data-theme", "dark");
    return candidate === "light" ? "light" : "dark";
  });

  const groupRef = useRef(null);

  /* Contrato do design system: os atributos no <html> trocam o tema inteiro. */
  useEffect(() => {
    document.documentElement.setAttribute("data-palette", palette);
    document.documentElement.setAttribute("data-theme", mode);
    onChange?.({ palette, mode });
  }, [palette, mode, onChange]);

  /* Navegação por setas no radiogroup */
  const onKeyDown = useCallback(
    (e) => {
      const idx = PALETTES.findIndex((p) => p.id === palette);
      let next = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % PALETTES.length;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + PALETTES.length) % PALETTES.length;
      if (next >= 0) {
        e.preventDefault();
        setPalette(PALETTES[next].id);
        groupRef.current?.querySelector(`[data-pid="${PALETTES[next].id}"]`)?.focus();
      }
    },
    [palette]
  );

  const sel = PALETTES.find((p) => p.id === palette) ?? PALETTES[0];
  const ui = sel[mode]; // o próprio painel se retematiza com a escolha

  return (
    <section
      className="rounded-2xl p-6"
      style={{
        background: ui.bg,
        border: `1px solid ${ui.border}`,
        color: ui.hi,
        fontFamily: "'Inter', sans-serif",
        transition: "background .35s ease, border-color .35s ease, color .35s ease",
        maxWidth: 880,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700&display=swap');
        @media (prefers-reduced-motion: reduce) {
          .ps-card, .ps-card *, .ps-mode { transition: none !important; transform: none !important; }
        }
        .ps-card:hover { transform: translateY(-3px); }
        .ps-card:focus-visible { outline: 2px solid ${ui.accent}; outline-offset: 3px; }
        .ps-mode:focus-visible { outline: 2px solid ${ui.accent}; outline-offset: 2px; }
      `}</style>

      {/* Cabeçalho: título + toggle de modo */}
      <header className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 19, letterSpacing: "-0.01em" }}>
            Aparência
          </h2>
          <p className="mt-1" style={{ fontSize: 13.5, color: ui.mid, maxWidth: 460 }}>
            Escolha a paleta da sua plataforma. Em todas elas, verde e vermelho continuam exclusivos do P&L — sua leitura de mercado nunca muda.
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label="Modo de cor"
          className="flex rounded-full p-1"
          style={{ background: ui.surface, border: `1px solid ${ui.border}` }}
        >
          {[
            { id: "dark", label: "☾ Escuro" },
            { id: "light", label: "☀ Claro" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              onClick={() => setMode(m.id)}
              className="ps-mode rounded-full"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                padding: "7px 15px",
                border: "none",
                cursor: "pointer",
                transition: "background .25s, color .25s",
                background: mode === m.id ? ui.primary : "transparent",
                color: mode === m.id ? ui.onP : ui.mid,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </header>

      {/* Grid de paletas — agrupado em Curadas e Galeria */}
      <div ref={groupRef} role="radiogroup" aria-label="Paleta de cores" onKeyDown={onKeyDown}>
        {[
          { titulo: "Curadas", sub: "Desenhadas para a plataforma, com intenção descrita.", list: PALETTES.filter((p) => p.tag) },
          { titulo: "Galeria", sub: "Derivadas das mesmas regras — contraste e P&L garantidos.", list: PALETTES.filter((p) => !p.tag) },
        ].map((g) => (
          <div key={g.titulo} style={{ marginBottom: 20 }}>
            <div className="flex items-center gap-2" style={{ margin: "2px 0 10px" }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase", color: ui.hi }}>{g.titulo}</span>
              <span style={{ fontSize: 11.5, color: ui.mid }}>{g.sub}</span>
              <span style={{ flex: 1, height: 1, background: ui.border }} aria-hidden="true" />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700, color: ui.low }}>{g.list.length}</span>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {g.list.map((p) => {
                const t = p[mode];
                const active = p.id === palette;
                return (
                  <button
                    key={p.id}
                    type="button"
                    data-pid={p.id}
                    role="radio"
                    aria-checked={active}
                    tabIndex={active ? 0 : -1}
                    onClick={() => setPalette(p.id)}
                    className="ps-card text-left rounded-xl p-3 cursor-pointer"
                    style={{
                      background: ui.surface,
                      border: `1px solid ${active ? t.primary : ui.border}`,
                      boxShadow: active ? `0 0 0 3px ${tint(t.primary, 0.22)}` : "none",
                      transition: "transform .18s ease, border-color .2s, box-shadow .2s",
                    }}
                  >
                    <MiniDashboard t={t} />
                    <div className="flex items-center gap-2 mt-2.5">
                      <span
                        className="inline-flex items-center justify-center rounded-full flex-shrink-0"
                        style={{
                          width: 17,
                          height: 17,
                          background: active ? t.primary : "transparent",
                          border: `1.5px solid ${active ? t.primary : ui.border}`,
                          transition: "background .2s, border-color .2s",
                        }}
                      >
                        {active && <Check color={t.onP} />}
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: ui.hi }}>{p.label}</span>
                      {p.tag && (
                        <span
                          className="ml-auto rounded-full"
                          style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            padding: "3px 8px",
                            background: tint(t.primary, mode === "dark" ? 0.18 : 0.12),
                            color: t.primary,
                          }}
                        >
                          {p.tag}
                        </span>
                      )}
                    </div>
                    <p className="mt-1" style={{ fontSize: 11.5, lineHeight: 1.45, color: ui.mid }}>
                      {p.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé de confirmação */}
      <footer className="flex items-center gap-2.5 mt-5 flex-wrap" style={{ fontSize: 12.5, color: ui.mid }}>
        <span
          className="rounded"
          style={{ width: 12, height: 12, background: ui.primary, display: "inline-block" }}
          aria-hidden="true"
        />
        Paleta atual: <b style={{ color: ui.hi }}>{sel.label}</b> · modo {mode === "dark" ? "escuro" : "claro"}.
        A escolha é aplicada na hora em toda a plataforma.
      </footer>
    </section>
  );
}


module.exports = { PaletteSelector };
