import { readFileSync } from 'node:fs';

const documentPath = new URL('../docs/module-boundaries.md', import.meta.url);
const content = readFileSync(documentPath, 'utf8');

const requiredBackendModules = [
  'conversation',
  'message',
  'knowledge',
  'retrieval',
  'ai-orchestration',
  'handoff',
  'agent',
  'auth',
  'metrics',
  'audit',
];

const requiredFrontendAreas = [
  'web-widget',
  'agent-console',
  'admin-console',
  'shared-ui',
  'contracts',
];

const forbiddenStandaloneModules = ['`common-business`', '`business-common`', '`万能服务`'];

const missing = [...requiredBackendModules, ...requiredFrontendAreas].filter(
  (name) => !content.includes(`\`${name}\``),
);

const forbidden = forbiddenStandaloneModules.filter((name) => content.includes(name));

if (missing.length > 0 || forbidden.length > 0) {
  if (missing.length > 0) {
    console.error(`Missing module boundary entries: ${missing.join(', ')}`);
  }

  if (forbidden.length > 0) {
    console.error(`Forbidden catch-all module entries found: ${forbidden.join(', ')}`);
  }

  process.exitCode = 1;
} else {
  console.log('[boundaries] module boundary checklist is complete.');
}
