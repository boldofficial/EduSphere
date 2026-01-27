/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts}",
    ],
    theme: {
        extend: {
            brand: {
                50: 'var(--color-brand-50)',
                100: 'var(--color-brand-100)',
                200: 'var(--color-brand-200)',
                300: 'var(--color-brand-300)',
                400: 'var(--color-brand-400)',
                500: 'var(--color-brand-500)',
                600: 'var(--color-brand-600)',
                700: 'var(--color-brand-700)',
                800: 'var(--color-brand-800)',
                900: 'var(--color-brand-900)',
                950: 'var(--color-brand-950)',
            },
            accent: {
                50: 'var(--color-accent-50)',
                100: 'var(--color-accent-100)',
                200: 'var(--color-accent-200)',
                300: 'var(--color-accent-300)',
                400: 'var(--color-accent-400)',
                500: 'var(--color-accent-500)',
                600: 'var(--color-accent-600)',
                700: 'var(--color-accent-700)',
                800: 'var(--color-accent-800)',
                900: 'var(--color-accent-900)',
                950: 'var(--color-accent-950)',
                red: 'var(--color-accent-red)',
                amber: 'var(--color-accent-amber)',
            },
            screens: {
                'print': { 'raw': 'print' },
            }
        },
    },
    plugins: [
        function({ addUtilities }) {
            addUtilities({
                '.scrollbar-hide': {
                    /* IE and Edge */
                    '-ms-overflow-style': 'none',
                    /* Firefox */
                    'scrollbar-width': 'none',
                    /* Safari and Chrome */
                    '&::-webkit-scrollbar': {
                        display: 'none'
                    }
                }
            })
        }
    ],
}
