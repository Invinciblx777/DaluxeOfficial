module.exports = {
    content: [
        "./App.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}"
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                skeleton: "var(--skeleton)",
                border: "var(--btn-border)",
                input: "var(--input)",
                /* Luxury Login Colors */
                "primary-container": "#524000",
                "on-secondary-fixed-variant": "#4f4629",
                "tertiary-container": "#004b49",
                "surface-dim": "#0a1515",
                "surface-variant": "#2c3737",
                "surface-container-lowest": "#061010",
                "surface": "#0a1515",
                "error": "#ffb4ab",
                "tertiary": "#95d1ce",
                "surface-container-low": "#121d1d",
                "on-secondary-container": "#c5b892",
                "on-surface": "#d9e5e4",
                "on-secondary-fixed": "#221b03",
                "secondary": "#d4c69f",
                "primary-fixed-dim": "#e9c349",
                "on-secondary": "#383015",
                "error-container": "#93000a",
                "on-tertiary-fixed": "#00201f",
                "on-surface-variant": "#bfc8c7",
                "inverse-surface": "#d9e5e4",
                "on-primary-fixed-variant": "#574500",
                "primary-fixed": "#ffe088",
                "on-tertiary-fixed-variant": "#084f4d",
                "on-primary-fixed": "#241a00",
                "surface-container-high": "#212c2c",
                "on-background": "#d9e5e4",
                "inverse-primary": "#735c00",
                "outline-variant": "#3f4948",
                "on-tertiary-container": "#7ebab7",
                "on-primary": "#3c2f00",
                "secondary-fixed": "#f0e2ba",
                "on-error": "#690005",
                "outline": "#899391",
                "on-primary-container": "#d0ab33",
                "surface-container-highest": "#2c3737",
                "inverse-on-surface": "#273232",
                "tertiary-fixed-dim": "#95d1ce",
                "on-tertiary": "#003735",
                "surface-tint": "#e9c349",
                "surface-container": "#172222",
                "surface-bright": "#303b3b",
                "secondary-container": "#52482b",
                "tertiary-fixed": "#b1eeea",
                "primary": "#e9c349",
                "secondary-fixed-dim": "#d4c69f",
                "on-error-container": "#ffdad6"
            },
            fontFamily: {
                "headline": ["Noto Serif"],
                "body": ["Manrope"],
                "label": ["Manrope"]
            },
            borderRadius: {
                DEFAULT: "0.5rem",
            },
            boxShadow: {
                input: [
                    "0px 2px 3px -1px rgba(0, 0, 0, 0.1)",
                    "0px 1px 0px 0px rgba(25, 28, 33, 0.02)",
                    "0px 0px 0px 1px rgba(25, 28, 33, 0.08)",
                ].join(", "),
            },
            animation: {
                ripple: "ripple 2s ease calc(var(--i, 0) * 0.2s) infinite",
                orbit: "orbit calc(var(--duration) * 1s) linear infinite",
            },
            keyframes: {
                ripple: {
                    "0%, 100%": { transform: "translate(-50%, -50%) scale(1)" },
                    "50%": { transform: "translate(-50%, -50%) scale(0.9)" },
                },
                orbit: {
                    "0%": {
                        transform:
                            "rotate(0deg) translateY(calc(var(--radius) * 1px)) rotate(0deg)",
                    },
                    "100%": {
                        transform:
                            "rotate(360deg) translateY(calc(var(--radius) * 1px)) rotate(-360deg)",
                    },
                }
            },
        },
    },
};
