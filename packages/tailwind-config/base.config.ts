import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'
import plugin from 'tailwindcss/plugin'
import colors from './colors'

const config: Config = {
  darkMode: 'class',
  content: [],
  theme: {
    colors,
    extend: {
      backgroundImage: () => ({
        'gradient-card': 'var(--color-bg-card-gradient)',
        'gradient-btn': 'var(--color-bg-btn-gradient)',
      }),
      typography: {
        DEFAULT: {
          css: {
            'color': 'var(--color-text-default)',
            'strong': {
              color: 'var(--color-text-title)',
            },
            'a': {
              'color': 'var(--color-main-green)',
              '&:hover': {
                color: 'var(--color-minor-green)',
              },
            },
            'h1': {
              color: 'var(--color-text-title)',
            },
            'h2': {
              color: 'var(--color-text-title)',
            },
            'h3': {
              color: 'var(--color-text-title)',
            },
            'h4': {
              color: 'var(--color-text-title)',
            },
            'ol > li::marker': {
              color: 'var(--color-text-default)',
            },
            'ul > li::marker': {
              color: 'var(--color-text-default)',
            },
            'blockquote': {
              color: 'var(--color-text-default)',
              borderInlineStartColor: 'var(--color-main-green)',
              backgroundColor: 'var(--color-bg-primary)',
              paddingInlineEnd: '1.1111111em',
              paddingTop: '0.1em',
              paddingBottom: '0.1em',
            },
          },
        },
        sm: {
          css: {
            h1: {
              fontSize: '1.5em',
            },
          },
        },
      },
    },
  },
  plugins: [
    typography,
    plugin(({ addBase }) => {
      addBase({
        body: {
          fontSize: '14px',
        },
      })
    }),
  ],
}

export default config
