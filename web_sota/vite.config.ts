import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
            allowedHosts: ['goliath'],
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:10865',
                changeOrigin: true,
            },
        },
    },
});
