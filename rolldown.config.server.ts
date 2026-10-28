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
      banner: (info) => {
        const fileName = info.fileName;

        if (/index\.js$/.test(fileName)) {
          return `/*!
 * @name hamlog-manager
 * @package @kuankuan/hamlog-manager
 * @license MulanPSL-2.0
 * @copyright (c) ${new Date().getFullYear()} kuankuan2007
 * @author KUANKUAN <2163826131@qq.com>
 * @source https://github.com/kuankuan2007/hamlog-manager
 * @build ${new Date().toISOString()}
 */`;
        }
        return `/*!
 * @source https://github.com/kuankuan2007/hamlog-manager
 * @copyright (c) ${new Date().getFullYear()} kuankuan2007
 * @file ${fileName}
 */`;
      },
    },
    resolve: {
      alias: {
        '@server': './server',
        '@util': './util',
        '@config': './config',
      },
    },
  },
]);
