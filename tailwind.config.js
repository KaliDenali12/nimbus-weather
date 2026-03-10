/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        body: ['Figtree', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['64px', { lineHeight: '1', fontWeight: '800', letterSpacing: '-1.5px' }],
        'display-lg': ['36px', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.5px' }],
        'heading-1': ['26px', { lineHeight: '1.2', fontWeight: '800', letterSpacing: '-0.5px' }],
        'heading-2': ['20px', { lineHeight: '1.25', fontWeight: '700' }],
        'heading-3': ['16px', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
        'caption': ['11px', { lineHeight: '1.3', fontWeight: '500' }],
        'label': ['13px', { lineHeight: '1.2', fontWeight: '600' }],
      },
      borderRadius: {
        'card': '16px',
        'btn': '10px',
        'search': '14px',
        'chip': '20px',
        'dropdown': '12px',
      },
      spacing: {
        'card': '20px',
      },
      maxWidth: {
        'app': '900px',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '600ms',
        'xslow': '800ms',
      },
    },
  },
  plugins: [],
}
