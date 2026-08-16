import { defineConfig } from 'rolldown';

export default defineConfig([
  {
    input: 'server/index.ts',
    platform: 'node',
    external: ['sqlite3'],
    output: {
      format: 'esm',
      file: 'server-dist/index.js',
      sourcemap: true,
    },
    resolve: {
      alias: {
        '@server': './server',
      },
    },
  },
]);
