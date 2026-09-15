/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0E3A5D',       // Primary Government Navy
          darkNavy: '#0B2C47',   // Dark Navy (hover, contrast, header gradient start)
          deep: '#11446E',       // Navy Accent (gradient end)
          secondary: '#11446E',  // Secondary Navy
          gold: '#D9A736',       // Gold Accent
          amber: '#EAB308',      // Pending / Warning Status
          warning: '#EAB308',    // Pending / Warning Status
          green: '#16A34A',      // Success / Resolved Status
          success: '#16A34A',    // Success / Resolved Status
          red: '#DC2626',        // Critical / Emergency / Error Status
          error: '#DC2626',      // Critical / Emergency / Error Status
          textMain: '#0D1D2D',   // Dark Text
          textMuted: '#6B7280',  // Muted Text
          cardBg: '#FFFFFF',     // White card background
          lightBg: '#F3F4F6',    // Light Gray page background
          lightBlue: '#EAF2F8',  // Light Blue secondary highlight / info panels
          border: '#E5E7EB',     // Subtle borders
        },
      },
      backgroundImage: {
        'gov-gradient': 'linear-gradient(135deg, #0B2C47 0%, #0E3A5D 50%, #11446E 100%)',
        'gov-hero': 'linear-gradient(to right, #0B2C47, #0E3A5D, #11446E)',
      },
    },
  },
  plugins: [],
}
