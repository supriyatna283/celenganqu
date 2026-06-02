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
          DEFAULT: '#1A56A0', // BLUE from PRD
          light: '#D6E4F7', // LIGHT_BLUE
          dark: '#164882',
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
    },
  },
  plugins: [],
}
