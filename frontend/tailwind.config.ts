import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'moss-green': '#4a5d23',
        'amber': '#ffbf00',
        'rust': '#b7410e',
      }
    },
  },
  plugins: [],
};
export default config;
