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
      colors: {
        background: 'hsl(var(--background))',
      },
    },
  },
  plugins: [],
};
