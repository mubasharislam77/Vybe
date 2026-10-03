import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#F4F0E8',
        ink: {
          DEFAULT: '#171717',
          50: '#F4F0E8',
          100: '#E7E2D6',
          400: '#8A8578',
          600: '#3F3C35',
          900: '#171717',
        },
        lime: {
          DEFAULT: '#D8F36A',
          dark: '#A8C23E',
        },
        burgundy: {
          DEFAULT: '#6B2438',
          light: '#8C3650',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        marquee: 'marquee 26s linear infinite',
      },
      letterSpacing: {
        widest2: '0.22em',
      },
    },
  },
  plugins: [],
};

export default config;
