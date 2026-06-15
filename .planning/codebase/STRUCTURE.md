# Structure: Vetor Trading Platform

**Mapped:** 2026-06-15
**Focus:** Directory layout, key file locations, naming conventions

---

## Directory Layout

```
vetor/
├── Plataforma Vetor v3.dc.html     # Main prototype (entry point)
├── support.js                       # dc-runtime engine
├── PaletteSelector.jsx              # React theme selector component
├── PRD_Plataforma_Robos_Trading_v2.0.md  # Product requirements document
├── HANDOFF_TECH_LOG.md             # Technical handoff notes
├── README.md                        # Project overview
│
├── blue-hour-design-system/         # Design system package
│   ├── palettes.js                  # Color palette definitions (source of truth)
│   ├── build-tokens.py              # Token generation script
│   ├── tokens/                      # Generated token output directory
│   │   └── tokens.css               # Generated CSS custom properties (DO NOT EDIT)
│   └── [other design system files]
│
├── .interface-design/               # Interface design assets (non-rendered)
│   └── [design files, references]
│
├── .planning/                       # GSD project planning (this directory)
│   └── codebase/                    # Codebase map documents
│
└── .git/                            # Git repository
```

---

## Key File Locations

| Purpose | Path | Notes |
|---------|------|-------|
| Prototype entry point | `Plataforma Vetor v3.dc.html` | Open in browser to run prototype |
| Runtime engine | `support.js` | DCLogic, navigation, theme system |
| React component | `PaletteSelector.jsx` | Theme picker, mounted by runtime |
| Color palette source | `blue-hour-design-system/palettes.js` | Edit here to change colors |
| Token build script | `blue-hour-design-system/build-tokens.py` | Run to regenerate tokens.css |
| Generated tokens | `blue-hour-design-system/tokens/tokens.css` | Never edit — generated file |
| Product requirements | `PRD_Plataforma_Robos_Trading_v2.0.md` | Full feature spec v2.0 |
| Technical context | `HANDOFF_TECH_LOG.md` | Architecture decisions and notes |
| Design references | `.interface-design/` | Static design assets |

---

## Naming Conventions

### Files
- Prototype HTML: `Plataforma Vetor v[N].dc.html` — `dc` prefix = design-code prototype
- React components: `PascalCase.jsx`
- Runtime/utility JS: `lowercase.js`
- Design system Python: `kebab-case.py`
- Planning docs: `SCREAMING_SNAKE_CASE.md`

### CSS Classes (prototype convention)
- Screen state: `screen--[name]` (e.g. `screen--dashboard`, `screen--robots`)
- Theme state: `theme--[name]` (e.g. `theme--blue-hour`, `theme--dark`)
- Modal state: `modal--[name]`
- Component modifier: `[component]--[modifier]` (BEM-like)

### CSS Custom Properties (design tokens)
- Base color: `--color-[palette]-[shade]` (e.g. `--color-blue-500`)
- Semantic alias: `--[role]-[variant]` (e.g. `--profit-base`, `--loss-muted`)
- Component token: `--[component]-[property]`

### JavaScript (support.js / dc-runtime)
- State functions: `set[State]`, `toggle[State]`
- Navigation: `goTo[Screen]`
- DCLogic methods: camelCase

---

## Where to Add New Code

When building the **real React application** (not the prototype):

| What | Where |
|------|-------|
| New React components | `src/components/` (create this directory) |
| Application pages/screens | `src/pages/` or `src/app/` (Next.js convention) |
| API service layer | `src/services/` |
| State management | `src/store/` or alongside components |
| New color palettes | `blue-hour-design-system/palettes.js` |
| Design token changes | Edit `palettes.js`, run `build-tokens.py` |
| Test files | Co-located `*.test.tsx` or `tests/` directory |

**Do NOT add production code to:**
- `support.js` — prototype runtime only
- `Plataforma Vetor v3.dc.html` — prototype markup only
- `blue-hour-design-system/tokens/tokens.css` — generated file

---

## Special Directories

| Directory | Purpose | Notes |
|-----------|---------|-------|
| `.interface-design/` | Design reference assets | Not committed to main build |
| `blue-hour-design-system/tokens/` | Generated token output | gitignore this directory in production |
| `.planning/` | GSD planning documents | Project roadmap, requirements, codebase map |

---

## File Count Summary

| Type | Count | Notes |
|------|-------|-------|
| HTML prototype | 1 | Monolithic prototype file |
| JavaScript | 2 | `support.js`, `PaletteSelector.jsx` |
| Python | 1 | `build-tokens.py` |
| Markdown docs | 3 | PRD, handoff log, README |
| Design system | ~5+ | palettes, tokens, config |

Small codebase — nearly everything is in the prototype HTML and support.js.

---

*Last updated: 2026-06-15*
