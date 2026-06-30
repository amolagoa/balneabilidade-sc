import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        propria: { DEFAULT: "#16a34a", light: "#dcfce7", text: "#14532d" },
        impropria: { DEFAULT: "#dc2626", light: "#fee2e2", text: "#7f1d1d" },
        indeterminado: { DEFAULT: "#6b7280", light: "#f3f4f6", text: "#374151" },
      },
    },
  },
  plugins: [],
};
export default config;
