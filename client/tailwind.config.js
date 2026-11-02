/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Prototype Dark Theme Tokens
        bg: "#0D121A",
        surface: {
          DEFAULT: "#151C27",
          2: "#111823",
        },
        side: {
          bg: "#0A0F17",
          ink: "#B9C5DA",
          active: "#18263D",
          muted: "#66748C",
        },
        sidebar: {
          bg: "#0A0F17",
          ink: "#B9C5DA",
          active: "#18263D",
          muted: "#66748C",
        },
        line: {
          DEFAULT: "#243042",
          strong: "#33425A",
        },
        accent: {
          DEFAULT: "#6E9CF0",
          ink: "#0B1424",
          soft: "#18273F",
          hover: "#8FB3F5",
        },
        ink: {
          DEFAULT: "#E5EAF2",
          muted: "#9AA6BA",
          faint: "#6F7B90",
        },
        ok: {
          DEFAULT: "#5CC58C",
          soft: "#13291D",
        },
        warn: {
          DEFAULT: "#E3A54A",
          soft: "#2C2112",
        },
        bad: {
          DEFAULT: "#F07A70",
          soft: "#2E1614",
        },
        danger: {
          DEFAULT: "#F07A70",
          soft: "#2E1614",
        },
        info: {
          DEFAULT: "#7EA6F0",
          soft: "#18273F",
        },
        neutral: {
          soft: "#1C2533",
        },

        // Semantic Compatibility Aliases (mapped 1:1 to new dark theme)
        "bg-base": "#0D121A",
        "bg-surface": "#151C27",
        "bg-subtle": "#111823",
        "border-strong": "#33425A",
        "border-subtle": "#243042",
        "text-primary": "#E5EAF2",
        "text-muted": "#9AA6BA",
        "text-faint": "#6F7B90",
        "danger-soft": "#2E1614",
        "ok-soft": "#13291D",
        "warn-soft": "#2C2112",
        "accent-hover": "#8FB3F5",
        "accent-soft": "#18273F",
      },
      fontFamily: {
        ui: ['"IBM Plex Sans"', "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
        num: ['"IBM Plex Mono"', "ui-monospace", '"SFMono-Regular"', "Menlo", "monospace"],
        doc: ["Questrial", '"Century Gothic"', '"Avenir Next"', "sans-serif"],
        "doc-title": ["Poppins", '"Century Gothic"', "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        DEFAULT: "8px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};
