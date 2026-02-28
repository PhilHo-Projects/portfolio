// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    base: process.env.PUBLIC_READ_ONLY === 'true' ? '/portfolio/' : '/',
    vite: {
        plugins: [tailwindcss()],
    },
    devToolbar: {
        enabled: false
    }
});
