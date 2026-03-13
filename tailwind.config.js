/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF6B47',
          red: '#F03030',
          dark: '#1A1A1A',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #FF6B47 0%, #F03030 100%)',
      },
    },
  },
  plugins: [],
}
