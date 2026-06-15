import { useState, useEffect, useRef, useCallback } from "react";

/**
 * VETOR · PaletteSelector — Blue Hour DS v2
 *
 * Seletor de aparência para a tela de configurações: 7 paletas × 2 modos.
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
    label: "Blue Hour",
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

export default function PaletteSelector({ initialPalette, initialMode, onChange } = {}) {
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

      {/* Grid de paletas */}
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="Paleta de cores"
        onKeyDown={onKeyDown}
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
      >
        {PALETTES.map((p) => {
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
              </div>
              <p className="mt-1" style={{ fontSize: 11.5, lineHeight: 1.45, color: ui.mid }}>
                {p.desc}
              </p>
            </button>
          );
        })}
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
