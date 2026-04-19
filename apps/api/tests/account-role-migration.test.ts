import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL('../src/database/migrations/202604190002_create_accounts_and_roles.sql', import.meta.url),
  'utf8',
);

describe('account and role migration contract', () => {
  it('defines backend accounts with enabled and disabled states', () => {
    expect(migration).toMatch(/CREATE TABLE app\.accounts/i);
    expect(migration).toMatch(/status varchar\(20\) NOT NULL DEFAULT 'enabled'/i);
    expect(migration).toMatch(
      /accounts_status_known CHECK \(status IN \('enabled', 'disabled'\)\)/i,
    );
    expect(migration).toMatch(/accounts_login_name_unique UNIQUE \(login_name\)/i);
  });

  it('defines the three MVP backend roles', () => {
    expect(migration).toMatch(/CREATE TABLE app\.roles/i);
    expect(migration).toMatch(
      /roles_code_known CHECK \(code IN \('admin', 'knowledge_operator', 'agent'\)\)/i,
    );
    expect(migration).toMatch(/'admin'/i);
    expect(migration).toMatch(/'knowledge_operator'/i);
    expect(migration).toMatch(/'agent'/i);
  });

  it('allows one account to hold multiple backend roles through a join table', () => {
    expect(migration).toMatch(/CREATE TABLE app\.account_roles/i);
    expect(migration).toMatch(
      /account_id uuid NOT NULL REFERENCES app\.accounts \(id\) ON DELETE CASCADE/i,
    );
    expect(migration).toMatch(
      /role_id uuid NOT NULL REFERENCES app\.roles \(id\) ON DELETE RESTRICT/i,
    );
    expect(migration).toMatch(/PRIMARY KEY \(account_id, role_id\)/i);
    expect(migration).not.toMatch(/UNIQUE \(account_id\)/i);
  });
});
