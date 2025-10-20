/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      scrollbar: {
        thin: 'thin',
      },
      colors: {
        scrollbar: {
          thumb: '#4B5563',
          track: '#1F2937',
        }
      }
    },
  },
  plugins: [],
}
