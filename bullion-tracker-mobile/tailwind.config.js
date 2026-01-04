/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        'bg-primary': '#FFFBF8',
        'bg-secondary': '#FFF5EE',
        'bg-card': '#FFFFFF',

        // Section backgrounds
        'section-light': '#FAFAFA',
        'section-accent': '#FFE8D6',
        'section-gray': '#F5F5F5',
        'section-footer': '#FFFFFF',

        // Text colors
        'text-primary': '#2D1B1B',
        'text-secondary': '#8B6B61',
        'text-muted': '#A89186',

        // Accent colors
        'accent-primary': '#E76F51',
        'accent-secondary': '#F4A261',
        'accent-dark': '#D84315',

        // Border and divider
        'border': '#F5E6DC',

        // Metal colors
        'metal-gold': '#F59E0B',
        'metal-silver': '#9CA3AF',
        'metal-platinum': '#6B7280',
      },
      fontFamily: {
        'space': ['SpaceGrotesk-Regular'],
      },
    },
  },
  plugins: [],
}
