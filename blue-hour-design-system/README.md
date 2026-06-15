# Blue Hour Design System · v2.1 · Multi-tema

Pacote completo de design system para **plataforma de trading automatizado com robôs**, pronto para importação no **Claude Design** — agora **multi-tema**: o usuário final escolhe entre 51 paletas, cada uma com modo claro e escuro (102 combinações): 7 curadas à mão + 44 derivadas pelo motor do build-tokens.py a partir das combinações do artigo da Looka.

## Conteúdo

```
blue-hour-design-system/
├── README.md              ← este arquivo
├── design-system.md       ← especificação completa (princípios, cor, tipo, ícones, componentes, voz)
├── styleguide.html        ← referência visual interativa (toggle dark/light)
├── tailwind.config.js     ← tokens mapeados para Tailwind (agnóstico de paleta)
├── build-tokens.py        ← gerador: fonte única de dados → tokens.css + tokens.json
├── palettes.js            ← runtime: setTheme()/initTheme() com persistência
├── PaletteSelector.jsx    ← componente React pronto: seletor de paleta com mini-previews
├── tokens/
│   ├── tokens.css         ← fonte de verdade · CSS variables (dark + light)
│   └── tokens.json        ← formato W3C Design Tokens (portável p/ qualquer ferramenta)
└── icons/
    └── bot.svg            ← exemplo do padrão de ícone (Lucide, stroke 1.75)
```

## Como importar no Claude Design

1. No onboarding (ou em *Design systems*), escolha importar a partir de uma **pasta local / codebase** e anexe esta pasta inteira — o Claude Design lê o CSS e os demais arquivos para extrair cores, tipografia, espaçamento e componentes.
2. Alternativa: abra `styleguide.html` no navegador e use a ferramenta de **web capture** para capturar os elementos visuais diretamente.
3. Publique o design system antes de gerar projetos — sem sistema publicado, o output sai genérico.
4. Em prompts, referencie os nomes dos tokens (`primary`, `aqua`, `profit`, `surface-2`...) — todos estão documentados em `design-system.md`.

## Como funciona a customização

```html
<html data-palette="wisteria-soft" data-theme="light">
```

Componentes usam só tokens semânticos; trocar os atributos troca o tema inteiro sem tocar em nenhum componente. `palettes.js` exporta `PALETTES` (para montar o seletor na UI), `setTheme()` e `initTheme()`.

## Resumo do sistema

- **Temas**: 51 paletas × dark/light (7 curadas + 44 derivadas via seeds da Looka; combinações 16–25 do artigo sem hex publicado, pendentes). Padrão: Blue Hour (dark índigo `#14182B`). O PaletteSelector expõe todas as 51 (curadas primeiro), sincronizado automaticamente pelo build-tokens.py.
- **Marca**: Íris (violeta `#8F7BFF` / `#5B47E0`) + Aqua (`#3EE6C8` / `#0E9E87`). Gradiente Íris→Aqua só em logo e avatares de robô — nunca em botões.
- **Regra de ouro**: verde e vermelho são exclusivos de P&L e sinais de mercado.
- **Fontes**: Sora (display) · Inter (corpo) · JetBrains Mono (dados financeiros). Google Fonts.
- **Ícones**: Lucide, grid 24px, stroke 1.75.
- **Grid**: base 4px · raios 8/12/16/20/full · contraste WCAG AA nos dois temas.
