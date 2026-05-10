import type { AccountStatus, BackendRoleCode } from '@znkfxt/contracts';
import { accountStatuses, backendRoleCodes } from '@znkfxt/contracts';
import { Pool } from 'pg';

export interface AuthAccountRecord {
  id: string;
  loginName: string;
  displayName: string;
  passwordHash: string;
  status: AccountStatus;
  roles: BackendRoleCode[];
}

export interface AuthAccountRepository {
  findByLoginName(loginName: string): Promise<AuthAccountRecord | null>;
}

interface AccountRow {
  id: string;
  login_name: string;
  display_name: string;
  password_hash: string;
  status: string;
  roles: unknown;
}

const accountStatusSet = new Set<string>(accountStatuses);
const backendRoleCodeSet = new Set<string>(backendRoleCodes);

function toAccountStatus(status: string): AccountStatus {
  if (!accountStatusSet.has(status)) {
    throw new Error(`Unknown account status loaded from database: ${status}`);
  }

  return status as AccountStatus;
}

function toBackendRoleCodes(roles: unknown): BackendRoleCode[] {
  const rawRoles = Array.isArray(roles) ? roles : [];

  return rawRoles.map((role) => {
    if (typeof role !== 'string' || !backendRoleCodeSet.has(role)) {
      throw new Error(`Unknown backend role code loaded from database: ${String(role)}`);
    }

    return role as BackendRoleCode;
  });
}

export class PgAuthAccountRepository implements AuthAccountRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  static fromConnectionString(connectionString: string): PgAuthAccountRepository {
    return new PgAuthAccountRepository(
      new Pool({
        connectionString,
      }),
    );
  }

  async findByLoginName(loginName: string): Promise<AuthAccountRecord | null> {
    const result = await this.pool.query<AccountRow>(
      `
        SELECT
          accounts.id::text,
          accounts.login_name,
          accounts.display_name,
          accounts.password_hash,
          accounts.status,
          COALESCE(
            ARRAY_AGG(roles.code ORDER BY roles.code)
              FILTER (WHERE roles.code IS NOT NULL),
            ARRAY[]::text[]
          ) AS roles
        FROM app.accounts AS accounts
        LEFT JOIN app.account_roles AS account_roles
          ON account_roles.account_id = accounts.id
        LEFT JOIN app.roles AS roles
          ON roles.id = account_roles.role_id
        WHERE accounts.login_name = $1
        GROUP BY
          accounts.id,
          accounts.login_name,
          accounts.display_name,
          accounts.password_hash,
          accounts.status
        LIMIT 1
      `,
      [loginName],
    );
    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      loginName: row.login_name,
      displayName: row.display_name,
      passwordHash: row.password_hash,
      status: toAccountStatus(row.status),
      roles: toBackendRoleCodes(row.roles),
    };
  }
}
