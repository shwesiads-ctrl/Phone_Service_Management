const esbuild = require('esbuild');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve, delimiter } = require('node:path');
const { spawnSync } = require('node:child_process');

(async () => {
  const directory = mkdtempSync(join(tmpdir(), 'fixflow-notification-ui-'));
  const outfile = join(directory, 'test.cjs');
  try {
    await esbuild.build({
      entryPoints: [resolve(process.argv[2] || 'scripts/test-notification-ui.tsx')], outfile,
      bundle: true, platform: 'node', format: 'cjs', packages: 'external',
      plugins: [{ name: 'isolated-app-context', setup(build) {
        build.onResolve({ filter: /context\/AppContext$/ }, () => ({ path: 'test-context', namespace: 'fixture' }));
        build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export function useApp() { return globalThis.__testApp; }', loader: 'js' }));
      } }],
    });
    const result = spawnSync(process.execPath, [outfile], {
      stdio: 'inherit', timeout: 30000,
      env: { ...process.env, NODE_PATH: resolve('node_modules') + (process.env.NODE_PATH ? delimiter + process.env.NODE_PATH : '') },
    });
    if (result.error) throw result.error;
    process.exitCode = result.status || 0;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
