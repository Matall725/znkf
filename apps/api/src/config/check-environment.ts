import { resolve } from 'node:path';
import process from 'node:process';
import {
  EnvironmentConfigError,
  loadEnvironmentFile,
  parseEnvironmentConfig,
} from './environment.ts';

interface CliOptions {
  envFile?: string;
}

function parseArgs(args: string[]): CliOptions {
  const envFileIndex = args.indexOf('--env-file');

  if (envFileIndex === -1) {
    return {};
  }

  const envFile = args[envFileIndex + 1];

  if (!envFile) {
    throw new Error('Missing value for --env-file');
  }

  return { envFile };
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const source = options.envFile ? loadEnvironmentFile(resolve(options.envFile)) : process.env;
  const config = parseEnvironmentConfig(source);

  console.log(`[config] ${config.appEnv} environment configuration is valid.`);
}

try {
  main();
} catch (error) {
  if (error instanceof EnvironmentConfigError) {
    console.error(error.message);
  } else if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Unknown configuration validation error.');
  }

  process.exitCode = 1;
}
