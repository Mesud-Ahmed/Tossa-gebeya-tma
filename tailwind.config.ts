import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        mist: "#f4f6f3",
        leaf: "#2f6f5e",
        ember: "#d75f32",
        gold: "#f3b33d"
      },
      boxShadow: {
        sheet: "0 -24px 60px rgba(21, 21, 21, 0.24)"
      }
    }
  },
  plugins: []
};

export default config;
