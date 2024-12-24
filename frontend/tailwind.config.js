/** @type {import('tailwindcss').Config} */
export default {
	darkMode: "class",
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		keyframes: {
			pulse: {
				"0%, 100%": { transform: "scale(1)" },
				"50%": { transform: "scale(1.05)" },
			},
			spin: {
				"0%": { transform: "rotate(0deg)" },
				"100%": { transform: "rotate(360deg)" },
			},
		},
		animation: {
			"slow-pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
			"spin-slow": "spin 2s linear infinite",
		},
	},
	plugins: [],
};
