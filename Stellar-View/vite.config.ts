import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tailwindcss from '@tailwindcss/vite';
import cesium from 'vite-plugin-cesium';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react(),
        tailwindcss(),
    cesium()],
    server:{
        proxy:{
            '/gibs': {
                target: 'https://gibs.earthdata.nasa.gov',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/gibs/, ''),
            }
        }
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    optimizeDeps: {
        exclude: ['cesium'],
        include: [
            'mersenne-twister',
            'urijs',
            'urijs/src/URI',
            'grapheme-splitter',
            'pako',
            'draco3d',
            'ktx-parse',
            'bitmap-sdf',
            'lerc',
            'nosleep.js',
        ],
        esbuildOptions: {
            target: 'esnext'
        }
    },
    define: {
        // Define relative base path in cesium for loading assets
        CESIUM_BASE_URL: JSON.stringify('./cesium/')
    },
    build: {
        commonjsOptions: {
            transformMixedEsModules: true,
        },
        rollupOptions: {
            external: ['cesium'],
            output: {
                manualChunks: {
                    react: ['react', 'react-dom']
                },
                globals: {
                    cesium: 'Cesium'
                }
            }
        },
        chunkSizeWarningLimit: 3000,
        sourcemap: false // Reduces build size significantly
    }

})