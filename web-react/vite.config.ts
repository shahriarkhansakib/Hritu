import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            // Proxy all /api/* calls to the FastAPI backend
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
            '/health': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: '../web/dist', // FastAPI serves from web/dist when built
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    maplibre: ['maplibre-gl'],
                    echarts: ['echarts'],
                    vendor: ['react', 'react-dom', '@turf/turf']
                }
            }
        }
    },
})
