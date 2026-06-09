/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '10px',
        button: '10px',
      },
      colors: {
        brand: {
          DEFAULT: '#2563EB',
          dark: '#3B82F6',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F7F7F8',
          dark: '#191919',
          'dark-secondary': '#252525',
        },
        border: {
          DEFAULT: '#E5E5E5',
          dark: '#333333',
        },
        text: {
          DEFAULT: '#111111',
          secondary: '#666666',
          muted: '#999999',
          dark: '#F5F5F5',
          'dark-secondary': '#A3A3A3',
        },
        status: {
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.08)',
        fab: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
};
