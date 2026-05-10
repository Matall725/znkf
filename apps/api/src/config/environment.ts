import { parse as parseDotenv } from 'dotenv';
import { readFileSync } from 'node:fs';
import { z } from 'zod';

export type AppEnvironment = 'local' | 'test' | 'production';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface AppEnvironmentConfig {
  appEnv: AppEnvironment;
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  ai: {
    provider: string;
    apiBaseUrl: string;
    apiKey: string;
    chatModel: string;
    embeddingModel: string;
  };
  auth: {
    jwtSecret: string;
  };
  frontend: {
    apiBaseUrl: string;
  };
  logging: {
    level: LogLevel;
  };
}

export class EnvironmentConfigError extends Error {
  public readonly issues: string[];

  constructor(issues: string[]) {
    super(
      `Environment configuration is invalid:\n${issues.map((issue) => `- ${issue}`).join('\n')}`,
    );
    this.name = 'EnvironmentConfigError';
    this.issues = issues;
  }
}

const requiredText = (name: string) =>
  z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : ''),
    z.string().min(1, `${name} is required`),
  );

const requiredUrl = (name: string) =>
  requiredText(name).refine(
    (value) => value.length === 0 || URL.canParse(value),
    `${name} must be a valid URL`,
  );

const rawEnvironmentSchema = z.object({
  APP_ENV: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : ''),
    z.enum(['local', 'test', 'production'], {
      error: 'APP_ENV must be one of local, test, production',
    }),
  ),
  DATABASE_URL: requiredText('DATABASE_URL').refine(
    (value) =>
      value.length === 0 || value.startsWith('postgresql://') || value.startsWith('postgres://'),
    'DATABASE_URL must start with postgresql:// or postgres://',
  ),
  REDIS_URL: requiredText('REDIS_URL').refine(
    (value) => value.length === 0 || value.startsWith('redis://') || value.startsWith('rediss://'),
    'REDIS_URL must start with redis:// or rediss://',
  ),
  AI_PROVIDER: requiredText('AI_PROVIDER'),
  AI_API_BASE_URL: requiredUrl('AI_API_BASE_URL'),
  AI_API_KEY: requiredText('AI_API_KEY'),
  AI_CHAT_MODEL: requiredText('AI_CHAT_MODEL'),
  AI_EMBEDDING_MODEL: requiredText('AI_EMBEDDING_MODEL'),
  JWT_SECRET: requiredText('JWT_SECRET').refine(
    (value) => value.length === 0 || value.length >= 32,
    'JWT_SECRET must contain at least 32 characters',
  ),
  VITE_API_BASE_URL: requiredUrl('VITE_API_BASE_URL'),
  LOG_LEVEL: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : ''),
    z.enum(['debug', 'info', 'warn', 'error'], {
      error: 'LOG_LEVEL must be one of debug, info, warn, error',
    }),
  ),
});

export type RawEnvironmentConfig = Record<string, unknown>;

export function loadEnvironmentFile(filePath: string): Record<string, string> {
  return parseDotenv(readFileSync(filePath));
}

export function parseEnvironmentConfig(input: RawEnvironmentConfig): AppEnvironmentConfig {
  const parsed = rawEnvironmentSchema.safeParse(input);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => {
      const path = issue.path.join('.') || 'environment';
      return `${path}: ${issue.message}`;
    });
    throw new EnvironmentConfigError(issues);
  }

  const env = parsed.data;

  return {
    appEnv: env.APP_ENV,
    database: {
      url: env.DATABASE_URL,
    },
    redis: {
      url: env.REDIS_URL,
    },
    ai: {
      provider: env.AI_PROVIDER,
      apiBaseUrl: env.AI_API_BASE_URL,
      apiKey: env.AI_API_KEY,
      chatModel: env.AI_CHAT_MODEL,
      embeddingModel: env.AI_EMBEDDING_MODEL,
    },
    auth: {
      jwtSecret: env.JWT_SECRET,
    },
    frontend: {
      apiBaseUrl: env.VITE_API_BASE_URL,
    },
    logging: {
      level: env.LOG_LEVEL,
    },
  };
}
