/** Blue Hour Design System · tailwind.config.js
 *  Copied from blue-hour-design-system/tailwind.config.js.
 *  Tailwind is installed ONLY for token→utility mapping.
 *  NEVER use Tailwind utility classes in component code — use inline styles + CSS custom properties.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: { DEFAULT: 'var(--color-surface)', 2: 'var(--color-surface-2)' },
        border: { DEFAULT: 'var(--color-border)', strong: 'var(--color-border-strong)' },
        text: {
          hi: 'var(--color-text-hi)',
          mid: 'var(--color-text-mid)',
          low: 'var(--color-text-low)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          strong: 'var(--color-primary-strong)',
          on: 'var(--color-on-primary)',
        },
        aqua: 'var(--color-aqua)',
        amber: 'var(--color-amber)',
        profit: 'var(--color-profit)',
        loss: 'var(--color-loss)',
        info: 'var(--color-info)',
        warning: 'var(--color-warning)',
        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)',
        },
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.55' }],
        base: ['16px', { lineHeight: '1.55' }],
        lg: ['20px', { lineHeight: '1.4' }],
        xl: ['24px', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        '2xl': ['32px', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        '3xl': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      spacing: {
        1: '4px', 2: '8px', 3: '12px', 4: '16px',
        6: '24px', 8: '32px', 12: '48px', 16: '64px', 24: '96px',
      },
      borderRadius: {
        sm: '8px', md: '12px', lg: '16px', xl: '20px', full: '999px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        modal: 'var(--shadow-modal)',
      },
      backgroundImage: {
        brand: 'var(--gradient-brand)',
      },
      transitionDuration: {
        fast: '150ms', base: '250ms', slow: '400ms',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        in: 'cubic-bezier(0.7, 0, 0.84, 0)',
      },
    },
  },
};
