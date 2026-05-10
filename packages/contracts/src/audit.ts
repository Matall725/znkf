export const auditActorRoleCodes = ['admin', 'knowledge_operator', 'agent'] as const;
export type AuditActorRoleCode = (typeof auditActorRoleCodes)[number];

export const auditActions = [
  'knowledge_article_created',
  'knowledge_article_updated',
  'knowledge_article_enabled',
  'knowledge_article_disabled',
  'agent_conversation_closed',
] as const;
export type AuditAction = (typeof auditActions)[number];

export const auditTargetTypes = ['knowledge_article', 'conversation'] as const;
export type AuditTargetType = (typeof auditTargetTypes)[number];

export interface AuditLog {
  id: string;
  actorAccountId: string | null;
  actorRoleCode: AuditActorRoleCode | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
