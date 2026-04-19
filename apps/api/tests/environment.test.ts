import { describe, expect, it } from 'vitest';
import { EnvironmentConfigError, parseEnvironmentConfig } from '../src/config/environment';

const completeLocalEnvironment = {
  APP_ENV: 'local',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/znkfxt_local',
  REDIS_URL: 'redis://localhost:6379/0',
  AI_PROVIDER: 'local-mock',
  AI_API_BASE_URL: 'http://localhost:8000/v1',
  AI_API_KEY: 'local-development-ai-key',
  AI_CHAT_MODEL: 'local-chat',
  AI_EMBEDDING_MODEL: 'local-embedding',
  JWT_SECRET: 'local-development-jwt-secret-change-before-shared-use',
  VITE_API_BASE_URL: 'http://localhost:3000/api',
  LOG_LEVEL: 'debug',
};

describe('environment configuration', () => {
  it('parses a complete local environment into grouped configuration', () => {
    expect(parseEnvironmentConfig(completeLocalEnvironment)).toMatchObject({
      appEnv: 'local',
      database: {
        url: completeLocalEnvironment.DATABASE_URL,
      },
      redis: {
        url: completeLocalEnvironment.REDIS_URL,
      },
      ai: {
        provider: 'local-mock',
        chatModel: 'local-chat',
        embeddingModel: 'local-embedding',
      },
      frontend: {
        apiBaseUrl: completeLocalEnvironment.VITE_API_BASE_URL,
      },
      logging: {
        level: 'debug',
      },
    });
  });

  it('reports clear missing required configuration keys', () => {
    expect(() =>
      parseEnvironmentConfig({
        APP_ENV: 'local',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/znkfxt_local',
        LOG_LEVEL: 'debug',
      }),
    ).toThrow(EnvironmentConfigError);
  });
});
