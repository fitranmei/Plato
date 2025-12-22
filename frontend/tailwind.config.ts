import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
        
      colors: {
        'blue-dark': '#233468', 
        'brand': {
          100: '#D6E4FF', // brand-100
          500: '#3366FF', // brand-500 (warna utama)
          900: '#1939B7', // brand-900
        }
      },
      // -------------------------
    },
  },
  plugins: [],
};
export default config;