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
            '/api/logs': {
                target: 'http://127.0.0.1:11061',
                changeOrigin: true,
            },
            '/api': {
                target: 'http://localhost:10865',
                changeOrigin: true,
            },
        },
    },
});
