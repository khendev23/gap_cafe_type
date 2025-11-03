/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class', // 혹은 'media' (시스템 다크모드 자동 적용)
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};
