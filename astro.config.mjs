// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    base: process.env.PUBLIC_READ_ONLY === 'true' ? '/portfolio/' : '/',
    vite: {
        plugins: [tailwindcss()],
        server: {
            proxy: {
                // Use the public activity summary when previewing locally.
                '/api/activity': {
                    target: 'https://philippeho.dev',
                    changeOrigin: true,
                },
            },
        },
    },
    devToolbar: {
        enabled: false
    }
});
