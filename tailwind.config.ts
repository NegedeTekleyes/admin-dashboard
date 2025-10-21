import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors:{
        NegeSky:"#33adee",
        NegeSkyLight:"#33eec9",
        NegePurple: "#bc33ee",
        NegePurpleLight:"#c16ce0",
        NegeYellow: "#e6d849",
        NegeYellowLight: "#f2e122"

      }
    },
  },
  plugins: [],
};
export default config;
