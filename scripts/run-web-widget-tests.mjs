import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';

const vitestEntrypoint = join(process.cwd(), 'node_modules', 'vitest', 'vitest.mjs');

for (const cachePath of [
  join(process.cwd(), 'node_modules', '.vite'),
  join(process.cwd(), 'apps', 'web-widget', 'node_modules', '.vite'),
]) {
  rmSync(cachePath, {
    force: true,
    recursive: true,
  });
}

const result = spawnSync(
  process.execPath,
  [
    vitestEntrypoint,
    'run',
    'apps/web-widget/tests/health.test.ts',
    '--environment',
    'jsdom',
    '--pool',
    'threads',
  ],
  {
    env: {
      ...process.env,
      INIT_CWD: process.cwd(),
    },
    stdio: 'inherit',
  },
);

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
