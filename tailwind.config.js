/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Enable Tailwind CSS for the following files
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderColor: {
        border: 'hsl(var(--border))',
      },
      colors: {
        background: 'hsl(var(--background))',
      },
    },
  },
  plugins: [],
};
