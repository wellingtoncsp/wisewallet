/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': {
            opacity: 1,
          },
          '50%': {
            opacity: .8,
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};