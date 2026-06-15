#!/usr/bin/env python3
"""Blue Hour DS · build-tokens.py · v2.1
Gera tokens.css, tokens.json e sincroniza palettes.js + styleguide.html.

Duas classes de paleta:
  HAND  — 7 paletas curadas à mão (valores verbatim, intocados).
  SEEDS — 44 paletas derivadas das combinações do artigo da Looka
          (https://looka.com/blog/color-combinations/). Cada entrada traz
          apenas os hex originais do artigo; o motor de derivação expande
          para os 20 tokens dark + 20 light aplicando as invariantes:
            · dark nunca preto (bg sempre com croma)
            · light nunca branco puro no fundo
            · primária/acento nunca em zona verde (P&L) nem vermelha pura
            · contraste WCAG forçado por iteração (>=4.5 texto, >=3.5 UI)
            · profit/loss/info com defaults fixos e seguros em toda paleta

Combinações 16–25 do artigo NÃO têm hex publicados (somente imagens/GIFs)
e ficam pendentes de extração manual. A nº 49 tem typo na fonte
(#CED8DO -> corrigido para #CED8D0).

Editar paletas: mexa em HAND ou SEEDS e rode `python3 build-tokens.py`.
Nunca edite tokens.css/tokens.json/arrays PALETTES manualmente.
"""
import colorsys
import json
import re

# ============================================================
# Utilidades de cor
# ============================================================

def h2rgb(h):
    return tuple(int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))

def rgb2hex(r, g, b):
    return '#%02X%02X%02X' % tuple(min(255, max(0, round(c * 255))) for c in (r, g, b))

def hls_of(hexc):
    r, g, b = h2rgb(hexc)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return h * 360.0, l, s

def from_hls(h, l, s):
    l = min(1.0, max(0.0, l))
    s = min(1.0, max(0.0, s))
    r, g, b = colorsys.hls_to_rgb((h % 360) / 360.0, l, s)
    return rgb2hex(r, g, b)

def mix(hex1, hex2, t):
    a = [int(hex1[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(hex2[i:i + 2], 16) for i in (1, 3, 5)]
    return '#%02X%02X%02X' % tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))

def rgba(hexc, a):
    r, g, b = (int(hexc[i:i + 2], 16) for i in (1, 3, 5))
    return f'rgba({r}, {g}, {b}, {a})'

def luminance(hexc):
    def f(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = h2rgb(hexc)
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)

# ============================================================
# Motor de derivação
# ============================================================

AUDIT = []  # avisos de contraste não atingido

def nudge_primary(h):
    """Afasta o matiz das zonas reservadas: verde (P&L lucro) e vermelho puro (P&L perda)."""
    h %= 360
    if 88 < h < 168:
        return 84.0 if (h - 88) < (168 - h) else 174.0
    if h < 14:
        return 18.0
    if h > 344:
        return 340.0
    return h

def nudge_accent(h):
    """Acento tolera teal/menta (precedente das paletas curadas); proíbe só verde puro e vermelho puro."""
    h %= 360
    if 95 < h < 150:
        return 91.0 if (h - 95) < (150 - h) else 156.0
    if h < 14:
        return 18.0
    if h > 344:
        return 340.0
    return h

def hue_dist(a, b):
    d = abs((a % 360) - (b % 360))
    return min(d, 360 - d)

def fit(name, h, s, l, bg, target, direction, lo=0.10, hi=0.94):
    """Ajusta a luminosidade até atingir o contraste alvo contra bg.
    direction +1 clareia (fundos escuros), -1 escurece (fundos claros)."""
    c = from_hls(h, l, s)
    for _ in range(70):
        if contrast(c, bg) >= target:
            return c
        l += 0.015 * direction
        if l > hi or l < lo:
            l = min(hi, max(lo, l))
            c = from_hls(h, l, s)
            if contrast(c, bg) < target:
                AUDIT.append(f'{name}: {contrast(c, bg):.2f} < {target} vs {bg}')
            return c
        c = from_hls(h, l, s)
    AUDIT.append(f'{name}: nao convergiu vs {bg}')
    return c

def derive(pid, seeds):
    """Expande 3–4 hex de referência em tema dark+light completo (20 tokens cada)."""
    info_seeds = [(hx, *hls_of(hx)) for hx in seeds]  # (hex, h, l, s)

    # --- papel de cada seed ---
    def primary_score(t):
        _, h, l, s = t
        pen = 0.0
        if 88 < h < 168 or h < 14 or h > 344:
            pen += 1.5
        if s < 0.12:
            pen += 1.2
        return s + (0.5 - abs(l - 0.5)) - pen
    prim = max(info_seeds, key=primary_score)
    ph = nudge_primary(prim[1])
    ps = min(0.92, max(prim[3], 0.45))

    others = [t for t in info_seeds if t[0] != prim[0]]
    def accent_score(t):
        _, h, l, s = t
        pen = 1.0 if s < 0.12 else 0.0
        return hue_dist(h, ph) / 180.0 + s * 0.4 - pen
    acc = max(others, key=accent_score) if others else prim
    ah = nudge_accent(acc[1])
    if hue_dist(ah, ph) < 25:
        ah = nudge_accent(ph + 45)
    asat = min(0.90, max(acc[3], 0.40))

    warm = [t for t in info_seeds if 25 <= t[1] <= 80 and t[3] > 0.25]
    amber_h = warm[0][1] if warm else 40.0
    blue = [t for t in info_seeds if 195 <= t[1] <= 260 and t[3] > 0.30]
    info_h = blue[0][1] if blue else None

    used = {prim[0], acc[0]}
    rest = [t for t in info_seeds if t[0] not in used and t[3] > 0.15]
    fifth_h = nudge_accent(max(rest, key=lambda t: t[3])[1]) if rest else nudge_accent(ph + 150)

    # --- base do fundo: seed mais escuro com croma; senão, matiz da primária ---
    darkest = min(info_seeds, key=lambda t: t[2])
    if darkest[3] >= 0.10 and darkest[2] < 0.55:
        bgh, bgs_seed = darkest[1], darkest[3]
    else:
        bgh, bgs_seed = ph, 0.40
    bgs = min(0.42, max(0.14, bgs_seed * 0.6))

    # ---------------- DARK ----------------
    bg = from_hls(bgh, 0.125, bgs)
    d = dict(
        bg=bg,
        surface=from_hls(bgh, 0.175, bgs * 0.95),
        s2=from_hls(bgh, 0.235, bgs * 0.90),
        border=from_hls(bgh, 0.305, bgs * 0.85),
        borderS=from_hls(bgh, 0.375, bgs * 0.80),
        hi=from_hls(bgh, 0.955, 0.55),
        mid=from_hls(bgh, 0.730, 0.28),
        low=from_hls(bgh, 0.520, 0.16),
        primary=fit(f'{pid}/d/primary', ph, ps, 0.70, bg, 4.5, +1),
        onP=bg,
        accent=fit(f'{pid}/d/accent', ah, asat, 0.72, bg, 3.5, +1),
        amber=fit(f'{pid}/d/amber', amber_h, 0.78, 0.68, bg, 3.5, +1),
        profit='#3FCB8E', loss='#F97084',
        info=fit(f'{pid}/d/info', info_h, 0.80, 0.72, bg, 3.5, +1) if info_h else '#6FB7FF',
    )
    d['chart'] = [d['accent'], d['primary'], d['amber'], d['info'],
                  from_hls(fifth_h, 0.70, 0.60)]

    # ---------------- LIGHT ----------------
    wbg = '#FFFFFF'
    l = dict(
        bg=from_hls(bgh, 0.967, min(0.50, max(0.25, bgs + 0.05))),
        surface='#FFFFFF',
        s2=from_hls(bgh, 0.930, min(0.40, max(0.18, bgs))),
        border=from_hls(bgh, 0.870, min(0.35, max(0.16, bgs * 0.9))),
        borderS=from_hls(bgh, 0.785, min(0.32, max(0.14, bgs * 0.8))),
        hi=from_hls(bgh, 0.180, 0.40),
        mid=from_hls(bgh, 0.410, 0.24),
        low=from_hls(bgh, 0.590, 0.20),
        primary=fit(f'{pid}/l/primary', ph, min(0.88, max(ps, 0.50)), 0.44, wbg, 4.5, -1),
        onP='#FFFFFF',
        accent=fit(f'{pid}/l/accent', ah, min(0.85, max(asat, 0.45)), 0.36, wbg, 4.5, -1),
        amber=fit(f'{pid}/l/amber', amber_h, 0.80, 0.38, wbg, 4.5, -1),
        profit='#0E9F6E', loss='#DC2B47',
        info=fit(f'{pid}/l/info', info_h, 0.80, 0.42, wbg, 4.5, -1) if info_h else '#2563EB',
    )
    l['chart'] = [l['accent'], l['primary'], l['amber'], l['info'],
                  fit(f'{pid}/l/chart5', fifth_h, 0.55, 0.42, wbg, 3.0, -1)]
    return {'d': d, 'l': l}

# ============================================================
# HAND — 7 paletas curadas (verbatim; NÃO derivar)
# ============================================================

HAND = {
 'blue-hour': {'label': 'Blue Hour (padrão)',
  'd': dict(bg='#14182B', surface='#1C2138', s2='#262C4A', border='#323A5E', borderS='#424B73',
            hi='#EDEFFA', mid='#A6ADCF', low='#6E7699', primary='#8F7BFF', onP='#14182B',
            accent='#3EE6C8', amber='#FFB454', profit='#34D399', loss='#FB7185', info='#6FB7FF',
            chart=['#3EE6C8', '#8F7BFF', '#FFB454', '#6FB7FF', '#F47BD2']),
  'l': dict(bg='#F5F6FB', surface='#FFFFFF', s2='#ECEEF8', border='#DCE0F0', borderS='#C3C9E4',
            hi='#1B2040', mid='#515A80', low='#8189AC', primary='#5B47E0', onP='#FFFFFF',
            accent='#0E9E87', amber='#C97912', profit='#0E9F6E', loss='#E11D48', info='#2563EB',
            chart=['#0E9E87', '#5B47E0', '#C97912', '#2563EB', '#C2419F'])},
 'cosmos-candy': {'label': 'Cosmos Candy',
  'd': dict(bg='#1E1F4B', surface='#27295A', s2='#32346E', border='#3C3E7E', borderS='#4C4E96',
            hi='#F0F0FC', mid='#ACAFDD', low='#7B7EB5', primary='#F06CA8', onP='#1E1F4B',
            accent='#8FE3CC', amber='#F5C26B', profit='#3FD68F', loss='#FF6B81', info='#6FB7FF',
            chart=['#8FE3CC', '#F06CA8', '#9D7BE0', '#6FB7FF', '#F5C26B']),
  'l': dict(bg='#F6F5FB', surface='#FFFFFF', s2='#EEECF8', border='#DEDCF0', borderS='#C6C3E2',
            hi='#22235F', mid='#565893', low='#8B8DBA', primary='#C73E84', onP='#FFFFFF',
            accent='#2E9C82', amber='#B0791D', profit='#0E9F6E', loss='#E11D48', info='#2563EB',
            chart=['#2E9C82', '#C73E84', '#6F44B8', '#2563EB', '#B0791D'])},
 'neon-circuit': {'label': 'Neon Circuit',
  'd': dict(bg='#16204A', surface='#1D2A5E', s2='#283672', border='#334181', borderS='#42519B',
            hi='#EEF1FC', mid='#A4AEDA', low='#7480B2', primary='#5C82F2', onP='#10183A',
            accent='#F5EE8A', amber='#F5EE8A', profit='#7EE05F', loss='#FF6E7C', info='#5BD8E8',
            chart=['#5C82F2', '#F5EE8A', '#5BD8E8', '#9D7BE0', '#F08AB4']),
  'l': dict(bg='#F4F6FC', surface='#FFFFFF', s2='#EAEEF9', border='#D8DEF2', borderS='#BFC8E6',
            hi='#172B66', mid='#4A5890', low='#7E89B6', primary='#2249AE', onP='#FFFFFF',
            accent='#9C8F00', amber='#9C8F00', profit='#3FA52C', loss='#DC2638', info='#1581A0',
            chart=['#2249AE', '#9C8F00', '#1581A0', '#6F44B8', '#C2419F'])},
 'heritage-mode': {'label': 'Heritage Mode',
  'd': dict(bg='#15221F', surface='#1D2C29', s2='#273835', border='#324440', borderS='#41564F',
            hi='#F2EFE3', mid='#A9B5A9', low='#74827A', primary='#EAB63E', onP='#15221F',
            accent='#5FA89B', amber='#ECC368', profit='#4CC38A', loss='#E37769', info='#7FA8C9',
            chart=['#5FA89B', '#EAB63E', '#E37769', '#7FA8C9', '#9CC09A']),
  'l': dict(bg='#FAF6E7', surface='#FFFFFF', s2='#F1ECD9', border='#E2DCC5', borderS='#CFC7A8',
            hi='#22332F', mid='#5C6B60', low='#8B9489', primary='#A8761B', onP='#FFFFFF',
            accent='#355952', amber='#B0791D', profit='#1F8A5F', loss='#CC4733', info='#2F6B9E',
            chart=['#355952', '#A8761B', '#CC4733', '#2F6B9E', '#5E8C5A'])},
 'wisteria-soft': {'label': 'Wisteria Soft',
  'd': dict(bg='#241F3D', surface='#2D274E', s2='#393161', border='#453C72', borderS='#564C8A',
            hi='#F1EEFA', mid='#B3ABD3', low='#837BA9', primary='#A48BE8', onP='#241F3D',
            accent='#8EC9BC', amber='#E8C95A', profit='#5BD6A2', loss='#F2839B', info='#8FB8F2',
            chart=['#8EC9BC', '#A48BE8', '#E8C95A', '#8FB8F2', '#E8A0C8']),
  'l': dict(bg='#F7F5FB', surface='#FFFFFF', s2='#EFEAF8', border='#DFD7EE', borderS='#C9BEE0',
            hi='#2E2547', mid='#5F5683', low='#8F87B0', primary='#735DA5', onP='#FFFFFF',
            accent='#3F9E89', amber='#A38A12', profit='#15935F', loss='#D6336C', info='#3B6FD4',
            chart=['#3F9E89', '#735DA5', '#A38A12', '#3B6FD4', '#BA4E92'])},
 'graphite-minimal': {'label': 'Graphite Minimal',
  'd': dict(bg='#242128', surface='#2D2A31', s2='#38343D', border='#443F4A', borderS='#544E5B',
            hi='#ECEAEE', mid='#A9A5B0', low='#7B7683', primary='#8CA3CC', onP='#242128',
            accent='#CAD4DF', amber='#D9A95C', profit='#57C49B', loss='#E07785', info='#9DB7D6',
            chart=['#8CA3CC', '#CAD4DF', '#A78BBA', '#D9A95C', '#7FB8A8']),
  'l': dict(bg='#F2F2F4', surface='#FFFFFF', s2='#E8E8EB', border='#D8D7DB', borderS='#C2C0C7',
            hi='#2C2930', mid='#5C5864', low='#8B8792', primary='#4A5C82', onP='#FFFFFF',
            accent='#656E77', amber='#A07423', profit='#1E8A66', loss='#C2424F', info='#4C6E96',
            chart=['#4A5C82', '#656E77', '#7B5E96', '#A07423', '#3E8C77'])},
 'vermilion-studio': {'label': 'Vermilion Studio',
  'd': dict(bg='#232548', surface='#2C2E58', s2='#383A6B', border='#43457D', borderS='#545695',
            hi='#EFEFF9', mid='#A9ABD6', low='#797CAF', primary='#8C8EDE', onP='#1E2040',
            accent='#E0A546', amber='#E0A546', profit='#3FBF8F', loss='#F25444', info='#7FA0E8',
            chart=['#8C8EDE', '#E0A546', '#6FCBD6', '#7FA0E8', '#D98BC4']),
  'l': dict(bg='#F4F7F7', surface='#FFFFFF', s2='#E9EEEE', border='#D6DEDE', borderS='#BECACA',
            hi='#23254A', mid='#54568A', low='#888AB2', primary='#4D51A0', onP='#FFFFFF',
            accent='#B0791D', amber='#B0791D', profit='#0E8F66', loss='#CE2C20', info='#3056C4',
            chart=['#4D51A0', '#B0791D', '#1B8A99', '#3056C4', '#B0488E'])},
}

# Mapeamento das curadas que já vieram do artigo (para rastreabilidade):
# 41 -> graphite-minimal · 47 -> heritage-mode · 48 -> vermilion-studio
# 51 -> wisteria-soft · 52 -> cosmos-candy · 53 -> neon-circuit

# ============================================================
# SEEDS — 44 paletas derivadas do artigo da Looka (nº do artigo)
# ============================================================

SEEDS = {
 'rose-tulip':            {'label': 'Rose Tulip',            'src': 1,  'seeds': ['#C7395F', '#DED4E8', '#E8BA40']},
 'teal-tangerine':        {'label': 'Teal Tangerine',        'src': 2,  'seeds': ['#EDCBD2', '#80C4B7', '#E3856B']},
 'prussian-retro':        {'label': 'Prussian Retro',        'src': 3,  'seeds': ['#3B5BA5', '#E87A5D', '#F3B941']},
 'periwinkle-lime':       {'label': 'Periwinkle Lime',       'src': 4,  'seeds': ['#678CEC', '#D49BAE', '#BBCB50']},
 'summer-sky':            {'label': 'Summer Sky',            'src': 5,  'seeds': ['#4AAFD5', '#91B187', '#E7A339']},
 'tulip-blonde':          {'label': 'Tulip Blonde',          'src': 6,  'seeds': ['#F9EC7E', '#E3CCB2', '#E26274']},
 'raspberry-cocoa':       {'label': 'Raspberry Cocoa',       'src': 7,  'seeds': ['#B2456E', '#FBEAE7', '#552619']},
 'pine-sage':             {'label': 'Pine Sage',             'src': 8,  'seeds': ['#EDF4F2', '#7C8363', '#31473A']},
 'cobalt-mist':           {'label': 'Cobalt Mist',           'src': 9,  'seeds': ['#CADCFC', '#8AB6F9', '#00246B']},
 'lilac-canary':          {'label': 'Lilac Canary',          'src': 10, 'seeds': ['#D3CAE2', '#E6C17A', '#F6EDE3', '#404041']},
 'lilac-ember':           {'label': 'Lilac Ember',           'src': 11, 'seeds': ['#D5CAE4', '#E1E5EB', '#E59462']},
 'primary-twist':         {'label': 'Primary Twist',         'src': 12, 'seeds': ['#81CAD6', '#EDCD44', '#DC3E26']},
 'sapphire-neon':         {'label': 'Sapphire Neon',         'src': 13, 'seeds': ['#F2EC9B', '#96FFBD', '#1803A5']},
 'graystone-emerald':     {'label': 'Graystone Emerald',     'src': 14, 'seeds': ['#D9DAD9', '#68A4A5', '#4C8055']},
 'azure-punch':           {'label': 'Azure Punch',           'src': 15, 'seeds': ['#DF3C5F', '#224193', '#6F9BD1']},
 'desert-dusk':           {'label': 'Desert Dusk',           'src': 26, 'seeds': ['#E17888', '#AE3B8B', '#1C5789', '#341514']},
 'apricot-vintage':       {'label': 'Apricot Vintage',       'src': 27, 'seeds': ['#3988A4', '#67C2D4', '#D0944D', '#CB625F']},
 'pop-mustard':           {'label': 'Pop Mustard',           'src': 28, 'seeds': ['#1D71BA', '#EDC400', '#B25690', '#71B379']},
 'dune-blush':            {'label': 'Dune Blush',            'src': 29, 'seeds': ['#D4B8B1', '#866C69', '#CD8C8C', '#53331F']},
 'alpine-moss':           {'label': 'Alpine Moss',           'src': 30, 'seeds': ['#2963A2', '#4CAABC', '#72C2C9', '#9FA65A']},
 'clay-raspberry':        {'label': 'Clay Raspberry',        'src': 31, 'seeds': ['#D8D0CD', '#B46543', '#DF5587', '#C83F5F']},
 'walnut-aegean':         {'label': 'Walnut Aegean',         'src': 32, 'seeds': ['#4D181C', '#144058', '#E58D2E', '#DD671E']},
 'strawberry-mocha':      {'label': 'Strawberry Mocha',      'src': 33, 'seeds': ['#D2385A', '#DE9DC2', '#9EE8E1', '#573C33']},
 'october-mist':          {'label': 'October Mist',          'src': 34, 'seeds': ['#B7B9A8', '#D1B5A3', '#E36858', '#0C0D0D']},
 'ruby-peach':            {'label': 'Ruby Peach',            'src': 35, 'seeds': ['#CEE6F2', '#E9B796', '#E3867D', '#962E2A']},
 'dawn-papaya':           {'label': 'Dawn Papaya',           'src': 36, 'seeds': ['#EECCD3', '#80C4B7', '#EEC95C', '#E3856B']},
 'antique-brandy':        {'label': 'Antique Brandy',        'src': 37, 'seeds': ['#B6818B', '#57BBBC', '#B8912E', '#802621']},
 'autumn-beryl':          {'label': 'Autumn Beryl',          'src': 38, 'seeds': ['#CF9032', '#CD7E2A', '#6C3622', '#6FA1BB']},
 'retro-block':           {'label': 'Retro Block 90s',       'src': 39, 'seeds': ['#B6E696', '#A95EA3', '#DC3A79', '#1686CD']},
 'bohemian-sage':         {'label': 'Bohemian Sage',         'src': 40, 'seeds': ['#507B6A', '#6A513C', '#A4998E', '#4B1816']},
 'sky-fuchsia':           {'label': 'Sky Fuchsia',           'src': 42, 'seeds': ['#6FC7E1', '#EABDCF', '#EFD557', '#CE6EA3']},
 'disco-lime':            {'label': 'Disco Lime',            'src': 43, 'seeds': ['#BD5598', '#82BB42', '#BFCF6E', '#DF3C5F']},
 'beach-cyan':            {'label': 'Beach Cyan',            'src': 44, 'seeds': ['#E88659', '#D8BF58', '#D1BAA2', '#56C1E1']},
 'school-recess':         {'label': 'School Recess',         'src': 45, 'seeds': ['#3B5BA5', '#E87A5C', '#469E48', '#DE418E']},
 'eggplant-sun':          {'label': 'Eggplant Sun',          'src': 46, 'seeds': ['#FAEF7C', '#E3CCB2', '#E26274', '#78589F']},
 'behr-whisper':          {'label': 'Behr Whisper',          'src': 49, 'seeds': ['#F4F2EE', '#DCC2B6', '#CED8D0', '#DDE1E3']},
 'moroccan-teal':         {'label': 'Moroccan Teal',         'src': 50, 'seeds': ['#3A6D80', '#F3CD53', '#D56729', '#9D402D']},
 'candy-neon':            {'label': 'Candy Neon',            'src': 54, 'seeds': ['#F4B0F7', '#9CFAD4', '#EDF9A2', '#F8B0B3']},
 'kawaii-soft':           {'label': 'Kawaii Soft',           'src': 55, 'seeds': ['#78FFC4', '#DCAAE4', '#FDC2E4', '#FAF3DE']},
 'magenta-grape':         {'label': 'Magenta Grape',         'src': 56, 'seeds': ['#E8338B', '#C13979', '#5C2C90', '#2A2E74']},
 'amethyst-butterscotch': {'label': 'Amethyst Butterscotch', 'src': 57, 'seeds': ['#020202', '#5351A2', '#A254A1', '#F6C845']},
 'citrus-pastel':         {'label': 'Citrus Pastel',         'src': 58, 'seeds': ['#EC6D67', '#F2AE7F', '#FBF5AE', '#CEE4B3']},
 'bubblegum-pop':         {'label': 'Bubblegum Pop',         'src': 59, 'seeds': ['#EFC6D4', '#D950AE', '#AAE847', '#EEEDEE']},
 'seafoam-chartreuse':    {'label': 'Seafoam Chartreuse',    'src': 60, 'seeds': ['#59C4EB', '#5ADFDF', '#77EFBD', '#ECF8BA']},
}

# ============================================================
# Montagem do catálogo final
# ============================================================

P = {}
for k, v in HAND.items():
    P[k] = {'label': v['label'], 'd': v['d'], 'l': v['l'], 'origin': 'hand'}
for k, v in SEEDS.items():
    if k in P:
        raise SystemExit(f'id duplicado: {k}')
    th = derive(k, v['seeds'])
    P[k] = {'label': v['label'], 'd': th['d'], 'l': th['l'],
            'origin': f"looka-{v['src']}", 'seeds': v['seeds']}

N = len(P)

STATIC = f"""/* ============================================================
   BLUE HOUR DESIGN SYSTEM · v2.1 · MULTI-TEMA
   {N} paletas x 2 modos ({N * 2} temas). Contrato de uso no HTML:
   <html data-palette="blue-hour" data-theme="dark">
   Componentes referenciam APENAS tokens semanticos (--color-*).
   Invariantes em todas as paletas: profit/loss exclusivos de P&L;
   dark nunca preto; light nunca branco puro no fundo.
   7 paletas curadas a mao + {N - 7} derivadas do artigo da Looka
   (combinacoes 16-25 sem hex publicado: pendentes).
   Gerado por build-tokens.py — nao editar manualmente.
   ============================================================ */

:root {{
  /* ---------- Tipografia ---------- */
  --font-display: 'Sora', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --text-xs: 12px; --text-sm: 14px; --text-base: 16px; --text-lg: 20px;
  --text-xl: 24px; --text-2xl: 32px; --text-3xl: 48px;
  --leading-tight: 1.15; --leading-body: 1.55;
  --tracking-display: -0.02em; --tracking-caps: 0.06em;
  --weight-regular: 400; --weight-medium: 500; --weight-semibold: 600; --weight-bold: 700;
  /* ---------- Espaçamento (grid 4px) ---------- */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px; --space-24: 96px;
  /* ---------- Raio ---------- */
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 20px; --radius-full: 999px;
  /* ---------- Movimento ---------- */
  --motion-fast: 150ms; --motion-base: 250ms; --motion-slow: 400ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1); --ease-in: cubic-bezier(0.7, 0, 0.84, 0);
  --stagger: 60ms;
  /* ---------- Iconografia (Lucide) ---------- */
  --icon-size-sm: 16px; --icon-size-md: 20px; --icon-size-lg: 24px; --icon-stroke: 1.75;
}}
"""

def block(t, mode):
    dark = mode == 'd'
    ta = 0.15 if dark else 0.10
    pstrong = mix(t['primary'], '#FFFFFF', 0.18) if dark else mix(t['primary'], '#000000', 0.18)
    shadow = '0 8px 28px rgba(0, 0, 0, 0.42)' if dark else '0 10px 30px rgba(20, 24, 50, 0.08)'
    modal = '0 24px 64px rgba(0, 0, 0, 0.55)' if dark else '0 24px 64px rgba(20, 24, 50, 0.16)'
    grid_a = 0.10 if dark else 0.12
    lines = [
        f"  color-scheme: {'dark' if dark else 'light'};",
        f"  --color-bg: {t['bg']};",
        f"  --color-surface: {t['surface']};",
        f"  --color-surface-2: {t['s2']};",
        f"  --color-border: {t['border']};",
        f"  --color-border-strong: {t['borderS']};",
        f"  --color-text-hi: {t['hi']};",
        f"  --color-text-mid: {t['mid']};",
        f"  --color-text-low: {t['low']};",
        f"  --color-primary: {t['primary']};",
        f"  --color-primary-strong: {pstrong};",
        f"  --color-on-primary: {t['onP']};",
        f"  --color-accent: {t['accent']};",
        f"  --color-aqua: {t['accent']}; /* alias legado v1 */",
        f"  --color-amber: {t['amber']};",
        f"  --color-warning: {t['amber']};",
        f"  --color-profit: {t['profit']};",
        f"  --color-loss: {t['loss']};",
        f"  --color-info: {t['info']};",
        f"  --tint-primary: {rgba(t['primary'], ta)};",
        f"  --tint-accent: {rgba(t['accent'], ta)};",
        f"  --tint-aqua: {rgba(t['accent'], ta)};",
        f"  --tint-amber: {rgba(t['amber'], ta)};",
        f"  --tint-profit: {rgba(t['profit'], ta)};",
        f"  --tint-loss: {rgba(t['loss'], max(ta - 0.02, 0.08))};",
        f"  --tint-info: {rgba(t['info'], ta)};",
        f"  --gradient-brand: linear-gradient(92deg, {t['primary']} 0%, {t['accent']} 100%);",
    ]
    for i, c in enumerate(t['chart'], 1):
        lines.append(f"  --chart-{i}: {c};")
    lines += [
        f"  --chart-grid: {rgba(t['mid'], grid_a)};",
        f"  --shadow-card: {shadow};",
        f"  --shadow-modal: {modal};",
    ]
    return '\n'.join(lines)

# ---------- tokens.css ----------
css = [STATIC]
for key, p in P.items():
    css.append(f"/* ============ {p['label'].upper()} ============ */")
    if key == 'blue-hour':
        css.append(f":root, [data-palette=\"{key}\"][data-theme=\"dark\"], [data-palette=\"{key}\"]:not([data-theme=\"light\"]) {{\n{block(p['d'], 'd')}\n}}")
        css.append(f"[data-theme=\"light\"]:not([data-palette]), [data-palette=\"{key}\"][data-theme=\"light\"] {{\n{block(p['l'], 'l')}\n}}")
    else:
        css.append(f"[data-palette=\"{key}\"][data-theme=\"dark\"], [data-palette=\"{key}\"]:not([data-theme=\"light\"]) {{\n{block(p['d'], 'd')}\n}}")
        css.append(f"[data-palette=\"{key}\"][data-theme=\"light\"] {{\n{block(p['l'], 'l')}\n}}")
    css.append("")

with open('tokens/tokens.css', 'w') as f:
    f.write('\n'.join(css))

# ---------- tokens.json (W3C) ----------
def jblock(t):
    out = {k2: {"$type": "color", "$value": v} for k2, v in [
        ('bg', t['bg']), ('surface', t['surface']), ('surface2', t['s2']),
        ('border', t['border']), ('borderStrong', t['borderS']),
        ('textHi', t['hi']), ('textMid', t['mid']), ('textLow', t['low']),
        ('primary', t['primary']), ('onPrimary', t['onP']), ('accent', t['accent']),
        ('warning', t['amber']), ('profit', t['profit']), ('loss', t['loss']), ('info', t['info'])]}
    out['chart'] = {str(i + 1): {"$type": "color", "$value": c} for i, c in enumerate(t['chart'])}
    return out

doc = {
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "name": "Blue Hour Design System", "version": "2.1.0",
  "description": f"Multi-tema: {N} paletas x 2 modos ({N * 2} temas). 7 curadas a mao + {N - 7} derivadas do artigo de combinacoes da Looka (16-25 pendentes: sem hex publicado). Tokens semanticos identicos em todas; profit/loss exclusivos de P&L.",
  "palettes": {k: {"label": p['label'], "origin": p['origin'],
                   **({"seeds": p['seeds']} if 'seeds' in p else {}),
                   "dark": jblock(p['d']), "light": jblock(p['l'])} for k, p in P.items()}
}
with open('tokens/tokens.json', 'w') as f:
    json.dump(doc, f, indent=2, ensure_ascii=False)

# ---------- sincronizar palettes.js ----------
entries = ',\n'.join(
    f"  {{ id: '{k}', label: '{p['label'].replace(chr(39), chr(92) + chr(39))}', swatchDark: '{p['d']['primary']}', swatchLight: '{p['l']['primary']}' }}"
    for k, p in P.items())
with open('palettes.js') as f:
    pjs = f.read()
pjs = re.sub(r'export const PALETTES = \[.*?\n\];',
             f'export const PALETTES = [\n{entries},\n];', pjs, flags=re.S)
with open('palettes.js', 'w') as f:
    f.write(pjs)

# ---------- sincronizar styleguide.html ----------
sg_entries = ',\n'.join(
    f"  {{id:'{k}',label:'{p['label']}',d:'{p['d']['primary']}',l:'{p['l']['primary']}'}}"
    for k, p in P.items())
with open('styleguide.html') as f:
    sg = f.read()
sg = re.sub(r'const PALETTES=\[.*?\n\];',
            f'const PALETTES=[\n{sg_entries}\n];', sg, flags=re.S)
with open('styleguide.html', 'w') as f:
    f.write(sg)


# ---------- sincronizar PaletteSelector.jsx ----------
# tag/desc por paleta (curadas preservam o texto original; derivadas ganham descrição própria)
META = {
 'blue-hour':        ('Padrão',        'Equilibrada e tech-premium. Índigo profundo com íris e aqua.'),
 'cosmos-candy':     ('Vibrante',      'Maximalismo organizado. Azul-espacial, rosa candy e menta.'),
 'neon-circuit':     ('Energia',       'Energia de terminal. Navy, azul-royal e canário — lucro em verde-neon.'),
 'heritage-mode':    ('Sofisticada',   'Old money terminal. Verde-petróleo, ouro e coral; claro em creme.'),
 'wisteria-soft':    ('Calma',         'Soft-tech acolhedora. Glicínia sobre ameixa, menta-melão nos dados.'),
 'graphite-minimal': ('Dados em foco', 'Brutalismo contido. Quase monocromática — o P&L é a única cor viva.'),
 'vermilion-studio': ('Assertiva',     'Editorial e direta. Periwinkle e ocre; o vermelhão só aparece na perda.'),
 'rose-tulip':            (None, 'Tulipas de primavera: rosa profundo e dourado solar.'),
 'teal-tangerine':        (None, 'Tangerina e teal complementares. Fresca e equilibrada.'),
 'prussian-retro':        (None, 'Retrô moderno em azul prussiano, laranja e mostarda.'),
 'periwinkle-lime':       (None, 'Periwinkle ousado com toques de rosa e lima.'),
 'summer-sky':            (None, 'Dia claro de verão: azul, verde-folha e laranja madura.'),
 'tulip-blonde':          (None, 'Doce e delicada: amarelo-claro, bege e rosa-tulipa.'),
 'raspberry-cocoa':       (None, 'Framboesa sobre chocolate. Rica, luxuosa, sensual.'),
 'pine-sage':             (None, 'Bosque sereno: sálvia, pinho e neutros esverdeados.'),
 'cobalt-mist':           (None, 'Azuis análogos e calmos, do céu claro ao cobalto.'),
 'lilac-canary':          (None, 'Lilás e canário em gradiente surreal e suave.'),
 'lilac-ember':           (None, 'Lilás sereno aceso por uma brasa laranja.'),
 'primary-twist':         (None, 'Primárias com torção: teal, citrino e vermelhão.'),
 'sapphire-neon':         (None, 'Safira elétrica com neon e amarelo pálido.'),
 'graystone-emerald':     (None, 'Pedra e rio: cinzas minerais com esmeralda.'),
 'azure-punch':           (None, 'Azul royal com soco de rosa elétrico. Anos 90.'),
 'desert-dusk':           (None, 'Crepúsculo no deserto: fúcsia, cobalto e terra.'),
 'apricot-vintage':       (None, 'Vintage borbulhante: damasco, azul e vermelho-poeira.'),
 'pop-mustard':           (None, 'Pop eletrizante: azul, mostarda, malva e verde.'),
 'dune-blush':            (None, 'Dunas ao entardecer: areia, blush e espresso.'),
 'alpine-moss':           (None, 'Lagos alpinos: azuis glaciais e musgo fresco.'),
 'clay-raspberry':        (None, 'Confeitaria: framboesa, argila e cinza quente.'),
 'walnut-aegean':         (None, 'Anos 70: nogueira, azul Egeu, mel e caqui.'),
 'strawberry-mocha':      (None, 'Morango com mocha e um twist de azul neon.'),
 'october-mist':          (None, 'Névoa de outubro: neutros frios e tangerina.'),
 'ruby-peach':            (None, 'Pêssego e céu com profundidade de rubi.'),
 'dawn-papaya':           (None, 'Amanhecer de verão: rosa, teal, manteiga e papaia.'),
 'antique-brandy':        (None, 'Antiquário: brandy, mostarda velha e azul vivo.'),
 'autumn-beryl':          (None, 'Outono terroso com berilo azul de contraste.'),
 'retro-block':           (None, 'Color-block 90s: rosa, roxo e azul radiantes.'),
 'bohemian-sage':         (None, 'Boêmia escura: sálvia, couro e mogno.'),
 'sky-fuchsia':           (None, 'Lúdica: céu, fúcsia e amarelo brincalhão.'),
 'disco-lime':            (None, 'Disco: roxo, pink e lima fora da zona de conforto.'),
 'beach-cyan':            (None, 'Praia quente: tigre, milho, areia e ciano.'),
 'school-recess':         (None, 'Tríade escolar: azul, laranja e rosa vibrantes.'),
 'eggplant-sun':          (None, 'Sol e berinjela: leve com base roxa profunda.'),
 'behr-whisper':          (None, 'Sussurro Behr: pastéis arquitetônicos suaves.'),
 'moroccan-teal':         (None, 'Marrocos: teal profundo, âmbar e abóbora.'),
 'candy-neon':            (None, 'Neon doce: rosa, menta e limão fluorescentes.'),
 'kawaii-soft':           (None, 'Kawaii: menta, lavanda e rosa-algodão.'),
 'magenta-grape':         (None, 'Magenta à uva: gradiente vívido de rosa e roxo.'),
 'amethyst-butterscotch': (None, 'Ametista e caramelo sobre quase-preto.'),
 'citrus-pastel':         (None, 'Cítricos pastéis: coral, salmão e menta.'),
 'bubblegum-pop':         (None, 'Chiclete pop com lima neon e neutros rosados.'),
 'seafoam-chartreuse':    (None, 'Mar análogo: ciano, espuma e chartreuse.'),
}

def jsx_mode(t):
    pairs = [('bg','bg'),('surface','surface'),('s2','s2'),('border','border'),('hi','hi'),
             ('mid','mid'),('low','low'),('primary','primary'),('onP','onP'),
             ('accent','accent'),('profit','profit'),('loss','loss')]
    return ', '.join(f'{k}: "{t[v]}"' for k, v in pairs)

jsx_entries = []
for k, p in P.items():
    tag, desc = META.get(k, (None, p['label'] + '.'))
    tagline = f'\n    tag: "{tag}",' if tag else ''
    jsx_entries.append(
        f'  {{\n    id: "{k}",\n    label: "{p["label"]}",{tagline}\n'
        f'    desc: "{desc}",\n'
        f'    dark: {{ {jsx_mode(p["d"])} }},\n'
        f'    light: {{ {jsx_mode(p["l"])} }},\n  }},')

with open('PaletteSelector.jsx') as f:
    jsx = f.read()
jsx = re.sub(r'const PALETTES = \[.*?\n\];',
             'const PALETTES = [\n' + '\n'.join(jsx_entries) + '\n];', jsx, flags=re.S)
with open('PaletteSelector.jsx', 'w') as f:
    f.write(jsx)
print(f'PaletteSelector.jsx sincronizado: {len(P)} paletas no seletor')

# ---------- relatório ----------
print(f'ok: {N} paletas x 2 modos = {N * 2} temas gerados (7 curadas + {N - 7} derivadas)')
print('sincronizados: tokens/tokens.css, tokens/tokens.json, palettes.js, styleguide.html')
if AUDIT:
    print(f'\nAVISOS DE CONTRASTE ({len(AUDIT)}):')
    for a in AUDIT:
        print('  -', a)
else:
    print('auditoria de contraste: todos os alvos atingidos (texto >=4.5, UI >=3.5)')
