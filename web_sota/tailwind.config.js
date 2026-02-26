/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // World Labs cosmic theme — deep space violets and electric indigo
                cosmos: {
                    50: '#f0f0ff',
                    100: '#e1e2ff',
                    200: '#c8caff',
                    300: '#a5a8ff',
                    400: '#7c7dff',
                    500: '#5c54ff',
                    600: '#4835f5',
                    700: '#3b26d8',
                    800: '#3121ae',
                    900: '#2b1f88',
                    950: '#1a1250',
                },
                void: {
                    50: '#f3f1ff',
                    100: '#e9e5ff',
                    200: '#d5cdff',
                    300: '#b8a7ff',
                    400: '#9676ff',
                    500: '#7444ff',
                    600: '#6320f7',
                    700: '#550fe3',
                    800: '#470dbe',
                    900: '#3c0d9a',
                    950: '#230870',
                },
                nebula: {
                    400: '#c084fc',
                    500: '#a855f7',
                    600: '#9333ea',
                },
                aurora: {
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                    950: '#022c22',   // deep green for modal background
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            animation: {
                'fade-in': 'fade-in 0.4s ease-out',
                'slide-in-left': 'slide-in-left 0.3s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'spin-slow': 'spin 8s linear infinite',
                'progress-slide': 'progress-slide 1.8s ease-in-out infinite',
            },
            keyframes: {
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-in-left': {
                    '0%': { opacity: '0', transform: 'translateX(-16px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(92,84,255,0.3)' },
                    '100%': { boxShadow: '0 0 20px rgba(92,84,255,0.7), 0 0 40px rgba(92,84,255,0.3)' },
                },
                'progress-slide': {
                    '0%':   { transform: 'translateX(-100%)' },
                    '60%':  { transform: 'translateX(250%)' },
                    '100%': { transform: 'translateX(400%)' },
                },
            },
            backdropBlur: { xs: '2px' },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
