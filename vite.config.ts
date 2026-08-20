import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/karma-clicker/',
  plugins: [
    svelte(),
    tsconfigPaths(),
  ],
  // A worker is its own build and inherits none of the above. The sim's worker
  // pulls in `.svelte.ts` runes and the `$lib` aliases, so it needs both.
  worker: {
    format: 'es',
    plugins: () => [
      svelte(),
      tsconfigPaths(),
    ],
  },
})
