/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lifecraft-bot/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ==========================================================================
       * Terra Editorial Design System
       * Warm Earth Tones + Magazine Typography
       * ========================================================================== */

      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",

        /* Primary: Terracotta - Warm, earthy, grounding */
        primary: {
          50: '#fef7f4',
          100: '#fdeee8',
          200: '#fad8ca',
          300: '#f5b89d',
          400: '#ed8f6a',
          500: '#e26b42',  /* Main terracotta */
          600: '#d04f2a',
          700: '#ae3d22',
          800: '#8d3422',
          900: '#742f21',
          950: '#3f150d',
        },

        /* Secondary: Olive - Natural, sophisticated */
        secondary: {
          50: '#f8f9f4',
          100: '#eff2e6',
          200: '#dde4cc',
          300: '#c4d0a7',
          400: '#a6b77e',
          500: '#889c5c',  /* Main olive */
          600: '#6b7e47',
          700: '#536239',
          800: '#444f31',
          900: '#3a432b',
          950: '#1d2414',
        },

        /* Accent: Sand - Warm neutral, elegant */
        accent: {
          50: '#fdfcfa',
          100: '#faf8f3',
          200: '#f4efe4',
          300: '#ebe2d0',
          400: '#ddd0b5',
          500: '#cbba96',  /* Main sand */
          600: '#b8a07a',
          700: '#9d8464',
          800: '#816c54',
          900: '#6a5946',
          950: '#382e23',
        },

        /* Neutral: Charcoal - Deep, editorial */
        neutral: {
          50: '#f7f7f6',
          100: '#e5e4e2',
          200: '#cbc9c5',
          300: '#a9a6a0',
          400: '#89857d',
          500: '#6e6a62',
          600: '#57544d',
          700: '#474440',
          800: '#3b3936',
          900: '#33312f',
          950: '#1a1918',  /* Deep charcoal for text */
        },

        /* Surface colors for cards and backgrounds */
        surface: {
          cream: '#fdfbf7',
          warm: '#f9f6f1',
          muted: '#f3efe8',
          paper: '#fffef9',
        },

        /* Semantic colors */
        success: {
          light: '#e8f5e3',
          DEFAULT: '#5a9a4a',
          dark: '#3d6834',
        },
        warning: {
          light: '#fef3e2',
          DEFAULT: '#d4870f',
          dark: '#9a6209',
        },
        error: {
          light: '#fde8e8',
          DEFAULT: '#c53030',
          dark: '#9b2c2c',
        },
        info: {
          light: '#e6f0f5',
          DEFAULT: '#2b6cb0',
          dark: '#1e4e7e',
        },
      },

      /* Typography - Editorial System */
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'var(--font-ibm-plex)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        body: ['var(--font-ibm-plex)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        /* Display sizes - Dramatic headlines */
        'display-2xl': ['5rem', { lineHeight: '0.95', letterSpacing: '-0.04em', fontWeight: '700' }],
        'display-xl': ['4rem', { lineHeight: '0.95', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-lg': ['3rem', { lineHeight: '1', letterSpacing: '-0.025em', fontWeight: '600' }],
        'display-md': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-sm': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '600' }],

        /* Body sizes */
        'body-xl': ['1.25rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'body-md': ['1rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        'body-xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.02em' }],

        /* Label/Caption */
        'label': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.08em', fontWeight: '600' }],
        'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],
      },

      /* Spacing - Editorial rhythm (8px base) */
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '38': '9.5rem',
        '42': '10.5rem',
        '128': '32rem',
        '144': '36rem',
      },

      /* Border radius - Sharp or fully round, no in-between */
      borderRadius: {
        'none': '0',
        'subtle': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'full': '9999px',
      },

      /* Box shadows - Layered, directional, warm */
      boxShadow: {
        'subtle': '0 1px 2px rgba(26, 25, 24, 0.04)',
        'soft': '0 2px 8px rgba(26, 25, 24, 0.06), 0 1px 2px rgba(26, 25, 24, 0.04)',
        'medium': '0 4px 16px rgba(26, 25, 24, 0.08), 0 2px 4px rgba(26, 25, 24, 0.04)',
        'elevated': '0 8px 32px rgba(26, 25, 24, 0.1), 0 4px 8px rgba(26, 25, 24, 0.06)',
        'dramatic': '0 16px 48px rgba(26, 25, 24, 0.12), 0 8px 16px rgba(26, 25, 24, 0.08)',
        'inner-soft': 'inset 0 2px 4px rgba(26, 25, 24, 0.04)',
        'glow-primary': '0 0 24px rgba(226, 107, 66, 0.2)',
        'glow-secondary': '0 0 24px rgba(136, 156, 92, 0.2)',
      },

      /* Animation - Sophisticated, editorial */
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-down': 'fadeDown 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-left': 'slideLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-right': 'slideRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'reveal': 'reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        'float': 'float 8s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 4s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'typing': 'typing 1.5s steps(30) infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(40px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        typing: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },

      /* Background patterns and gradients */
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-warm': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'gradient-editorial': 'linear-gradient(180deg, var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        'dots': "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23e5e4e2'/%3E%3C/svg%3E\")",
        'grid-subtle': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0M0 0L40 40' stroke='%23e5e4e2' stroke-width='0.5' fill='none'/%3E%3C/svg%3E\")",
      },

      /* Transitions */
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },

      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
        '600': '600ms',
      },

      /* Z-index scale */
      zIndex: {
        '1': '1',
        '2': '2',
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },

      /* Aspect ratios */
      aspectRatio: {
        'editorial': '3 / 4',
        'wide': '16 / 9',
        'ultrawide': '21 / 9',
      },

      /* Max widths for editorial layouts */
      maxWidth: {
        'prose': '65ch',
        'prose-wide': '75ch',
        'editorial': '1200px',
        'editorial-wide': '1400px',
      },
    },
  },
  plugins: [],
};
