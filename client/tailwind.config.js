/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#000100',
        'bg-surface': '#111C15',
        'bg-subtle': '#0C1610',
        'border-strong': '#213328',
        'border-subtle': '#18241C',
        'accent': '#1fbf55',
        'accent-hover': '#199e46',
        'text-primary': '#E8F3EB',
        'text-muted': '#8FA396',
        'text-faint': '#5C7063',
        'danger': '#b3261e',
        'danger-soft': '#2e1614',
        'ok': '#17784a',
        'ok-soft': '#13291d',
        'warn': '#9a5b00',
        'warn-soft': '#2c2112',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}

