/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'neubrutalism': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
        'neubrutalism-lg': '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.3)',
        'glow-lime': '0 0 20px rgba(163, 230, 53, 0.3)',
      },
    },
  },
  plugins: [],
};
