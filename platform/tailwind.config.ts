import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography'; // Import the plugin

// No need to import defaultTheme for basic extension

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-base': '#0D0D0D',
        'light-text': '#E0E0E0',
        'hacker-green': '#00FF00',
        'dark-green': '#008F11',
        'medium-gray': '#333333',
      },
      fontFamily: {
        // Assuming 'var(--font-sans)' is defined elsewhere (e.g., layout.tsx)
        // Provide a basic fallback stack. Tailwind merges this with its defaults.
        sans: ['var(--font-sans)', 'sans-serif'],
        // Define the 'philosopher' font family with a basic serif fallback.
        philosopher: ['Philosopher', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    typography, // Add the typography plugin
  ],
};

export default config;