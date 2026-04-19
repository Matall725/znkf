import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = ['docker-compose.yml', 'infra/local/nginx.conf', 'infra/local/README.md'];

const missingFiles = requiredFiles.filter((path) => !existsSync(path));

if (missingFiles.length > 0) {
  console.error(`Missing local service files: ${missingFiles.join(', ')}`);
  process.exit(1);
}

const compose = readFileSync('docker-compose.yml', 'utf8');
const nginx = readFileSync('infra/local/nginx.conf', 'utf8');

const composeChecks = [
  ['postgres service', /\n\s{2}postgres:\r?\n/],
  ['pgvector image', /image:\s*pgvector\/pgvector:pg16/],
  ['postgres healthcheck', /pg_isready/],
  ['postgres named volume', /postgres-data:\/var\/lib\/postgresql\/data/],
  ['redis service', /\n\s{2}redis:\r?\n/],
  ['redis image', /image:\s*redis:7-alpine/],
  ['redis healthcheck', /redis-cli', 'ping'|redis-cli"\s*,\s*"ping"/],
  ['redis named volume', /redis-data:\/data/],
  ['api service', /\n\s{2}api:\r?\n/],
  ['api local profile', /\n\s{4}profiles:\r?\n\s{6}- app/],
  ['api postgres dependency', /api:[\s\S]*postgres:[\s\S]*condition:\s*service_healthy/],
  ['api redis dependency', /api:[\s\S]*redis:[\s\S]*condition:\s*service_healthy/],
  ['api database url override', /api:[\s\S]*DATABASE_URL:\s*postgresql:\/\//],
  ['api redis url override', /api:[\s\S]*REDIS_URL:\s*redis:\/\/redis:6379/],
  ['worker service', /\n\s{2}worker:\r?\n/],
  ['worker local profile', /worker:[\s\S]*profiles:\r?\n\s{6}- app/],
  ['worker postgres dependency', /worker:[\s\S]*postgres:[\s\S]*condition:\s*service_healthy/],
  ['worker redis dependency', /worker:[\s\S]*redis:[\s\S]*condition:\s*service_healthy/],
  ['static service', /\n\s{2}static:\r?\n/],
  ['nginx static image', /image:\s*nginx:1\.27-alpine/],
  ['static profile', /static:[\s\S]*profiles:\r?\n\s{6}- static/],
  [
    'static nginx config mount',
    /infra\/local\/nginx\.conf:\/etc\/nginx\/conf\.d\/default\.conf:ro/,
  ],
];

const nginxChecks = [
  ['web-widget static location', /location \/web-widget\//],
  ['agent-console static location', /location \/agent-console\//],
  ['admin-console static location', /location \/admin-console\//],
];

const failed = [
  ...composeChecks.filter(([, pattern]) => !pattern.test(compose)).map(([name]) => name),
  ...nginxChecks.filter(([, pattern]) => !pattern.test(nginx)).map(([name]) => name),
];

if (failed.length > 0) {
  console.error(`Local service configuration checks failed: ${failed.join(', ')}`);
  process.exit(1);
}

console.log('[local-services] local service configuration is complete.');
