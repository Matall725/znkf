import { config as loadDotenv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { type AppEnvironmentConfig, parseEnvironmentConfig } from './environment.ts';

const localExampleEnvironmentFile = fileURLToPath(
  new URL('../../../../config/env/.env.local.example', import.meta.url),
);

export function loadRuntimeEnvironmentConfig(): AppEnvironmentConfig {
  if (!process.env.APP_ENV) {
    loadDotenv({
      path: localExampleEnvironmentFile,
      override: false,
    });
  }

  return parseEnvironmentConfig(process.env);
}
