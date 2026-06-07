/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: '#1a7a4a',
          light: '#e8f5ee',
          mid: '#2ea866',
        },
        gold: {
          DEFAULT: '#c9920a',
          light: '#fdf3dc',
        },
        surface: '#f7f9f8',
        surface2: '#eef2ef',
        border: '#d4ddd7',
        text: '#1a2420',
        'text-muted': '#5a7065',
        danger: '#c0392b',
        'danger-light': '#fdecea',
        black: '#0f1410',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '10px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(10,40,20,0.08)',
      },
    },
  },
  plugins: [],
}
