import type { AuditAction, AuditActorRoleCode, AuditLog, AuditTargetType } from '@znkfxt/contracts';
import { Pool } from 'pg';

export interface CreateAuditLogInput {
  actorAccountId: string | null;
  actorRoleCode: AuditActorRoleCode | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  metadata?: Record<string, unknown> | undefined;
}

export interface AuditLogRepository {
  createAuditLog(input: CreateAuditLogInput): Promise<AuditLog>;
}

interface AuditLogRow {
  id: string;
  actor_account_id: string | null;
  actor_role_code: AuditActorRoleCode | null;
  action: AuditAction;
  target_type: AuditTargetType;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: Date;
}

const auditLogSelectColumns = `
  id::text,
  actor_account_id::text,
  actor_role_code,
  action,
  target_type,
  target_id::text,
  metadata,
  created_at
`;

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toAuditLog(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    actorAccountId: row.actor_account_id,
    actorRoleCode: row.actor_role_code,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    metadata: row.metadata,
    createdAt: toIsoString(row.created_at),
  };
}

export class PgAuditLogRepository implements AuditLogRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  static fromConnectionString(connectionString: string): PgAuditLogRepository {
    return new PgAuditLogRepository(
      new Pool({
        connectionString,
      }),
    );
  }

  async createAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
    const result = await this.pool.query<AuditLogRow>(
      `
        INSERT INTO app.audit_logs (
          actor_account_id,
          actor_role_code,
          action,
          target_type,
          target_id,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING ${auditLogSelectColumns}
      `,
      [
        input.actorAccountId,
        input.actorRoleCode,
        input.action,
        input.targetType,
        input.targetId,
        input.metadata ?? {},
      ],
    );

    return toAuditLog(result.rows[0] as AuditLogRow);
  }
}
