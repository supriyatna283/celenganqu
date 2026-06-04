/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2BBF4B',
          light: '#7EDC3A',
          dark: '#006C35',
        },
        dark: {
          DEFAULT: '#1A1A2E', // DARK
          light: '#2E2E48',
        },
        success: {
          DEFAULT: '#1D6F42', // GREEN
          light: '#E8F5EE',
        },
        danger: {
          DEFAULT: '#C0392B', // RED
          light: '#FDECEA',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(180deg, #7EDC3A 0%, #2BBF4B 35%, #0E9A43 65%, #006C35 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
