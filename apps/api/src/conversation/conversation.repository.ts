import type {
  AiAnswerConfidenceLevel,
  AiAnswerLog,
  Conversation,
  ConversationListItem,
  ConversationMessage,
  ConversationSource,
  ConversationStatus,
  MessageSenderType,
  MessageType,
  MetricsOverview,
  SatisfactionRating,
  SatisfactionRatingScore,
} from '@znkfxt/contracts';
import { Pool, type PoolClient } from 'pg';

export interface CreateConversationInput {
  visitorId: string;
  source: ConversationSource;
}

export interface UpdateConversationInput {
  id: string;
  status?: ConversationStatus | undefined;
  assignedAgentAccountId?: string | null | undefined;
  setAssignedAgentAccountId?: boolean | undefined;
  handoffRequestedAt?: string | null | undefined;
  setHandoffRequestedAt?: boolean | undefined;
  closedAt?: string | null | undefined;
  setClosedAt?: boolean | undefined;
}

export interface AcceptWaitingConversationInput {
  id: string;
  agentAccountId: string;
}

export interface CloseAgentConversationInput {
  id: string;
  agentAccountId: string;
}

export interface ListConversationsFilter {
  status?: ConversationStatus | undefined;
  visitorId?: string | undefined;
  createdFrom?: string | undefined;
  createdTo?: string | undefined;
  limit: number;
  offset: number;
}

export interface ListWaitingConversationsFilter {
  limit: number;
  offset: number;
}

export interface CreateConversationMessageInput {
  conversationId: string;
  senderType: MessageSenderType;
  senderId?: string | null | undefined;
  messageType?: MessageType | undefined;
  content: string;
}

export interface ListConversationMessagesFilter {
  conversationId: string;
  limit: number;
  offset: number;
}

export interface CreateAiAnswerLogInput {
  conversationId: string;
  visitorMessageId: string;
  botMessageId: string | null;
  matchedKnowledgeArticleId: string | null;
  matched: boolean;
  needsHandoff: boolean;
  confidenceLevel: AiAnswerConfidenceLevel;
  failureReason: string | null;
}

export interface CreateSatisfactionRatingInput {
  conversationId: string;
  visitorId: string;
  score: SatisfactionRatingScore;
  comment: string | null;
}

export interface MetricsFilter {
  createdFrom?: string | undefined;
  createdTo?: string | undefined;
}

export class SatisfactionRatingAlreadyExistsError extends Error {
  constructor() {
    super('Satisfaction rating already exists.');
    this.name = 'SatisfactionRatingAlreadyExistsError';
  }
}

export interface ConversationRepository {
  createConversation(input: CreateConversationInput): Promise<Conversation>;
  findConversationById(id: string): Promise<Conversation | null>;
  findLatestOpenConversationByVisitor(
    visitorId: string,
    source: ConversationSource,
  ): Promise<Conversation | null>;
  updateConversation(input: UpdateConversationInput): Promise<Conversation | null>;
  acceptWaitingConversation(input: AcceptWaitingConversationInput): Promise<Conversation | null>;
  closeAgentConversation(input: CloseAgentConversationInput): Promise<Conversation | null>;
  listConversations(
    filter: ListConversationsFilter,
  ): Promise<{ conversations: ConversationListItem[]; total: number }>;
  listWaitingConversations(
    filter: ListWaitingConversationsFilter,
  ): Promise<{ conversations: ConversationListItem[]; total: number }>;
  createMessage(input: CreateConversationMessageInput): Promise<ConversationMessage>;
  listMessages(
    filter: ListConversationMessagesFilter,
  ): Promise<{ messages: ConversationMessage[]; total: number }>;
  createAiAnswerLog(input: CreateAiAnswerLogInput): Promise<AiAnswerLog>;
  listAiAnswerLogsByConversationId(conversationId: string): Promise<AiAnswerLog[]>;
  createSatisfactionRating(input: CreateSatisfactionRatingInput): Promise<SatisfactionRating>;
  findSatisfactionRatingByConversationId(conversationId: string): Promise<SatisfactionRating | null>;
  getMetricsOverview(filter: MetricsFilter): Promise<MetricsOverview>;
}

interface ConversationRow {
  id: string;
  visitor_id: string;
  source: ConversationSource;
  status: ConversationStatus;
  assigned_agent_account_id: string | null;
  handoff_requested_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  closed_at: Date | string | null;
}

interface ConversationListRow extends ConversationRow {
  latest_message_preview: string | null;
  latest_message_at: Date | string | null;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_type: MessageSenderType;
  sender_id: string | null;
  message_type: MessageType;
  content: string;
  created_at: Date | string;
}

interface AiAnswerLogRow {
  id: string;
  conversation_id: string;
  visitor_message_id: string;
  bot_message_id: string | null;
  matched_knowledge_article_id: string | null;
  matched: boolean;
  needs_handoff: boolean;
  confidence_level: AiAnswerConfidenceLevel;
  failure_reason: string | null;
  created_at: Date | string;
}

interface SatisfactionRatingRow {
  id: string;
  conversation_id: string;
  visitor_id: string;
  score: SatisfactionRatingScore;
  comment: string | null;
  created_at: Date | string;
}

const conversationSelectColumns = `
  id::text,
  visitor_id,
  source,
  status,
  assigned_agent_account_id::text,
  handoff_requested_at,
  created_at,
  updated_at,
  closed_at
`;

const messageSelectColumns = `
  id::text,
  conversation_id::text,
  sender_type,
  sender_id,
  message_type,
  content,
  created_at
`;

const aiAnswerLogSelectColumns = `
  id::text,
  conversation_id::text,
  visitor_message_id::text,
  bot_message_id::text,
  matched_knowledge_article_id::text,
  matched,
  needs_handoff,
  confidence_level,
  failure_reason,
  created_at
`;

const satisfactionRatingSelectColumns = `
  id::text,
  conversation_id::text,
  visitor_id,
  score,
  comment,
  created_at
`;

function toIsoString(value: Date | string | null): string | null {
  if (value === null) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    visitorId: row.visitor_id,
    source: row.source,
    status: row.status,
    assignedAgentAccountId: row.assigned_agent_account_id,
    handoffRequestedAt: toIsoString(row.handoff_requested_at),
    createdAt: toIsoString(row.created_at) as string,
    updatedAt: toIsoString(row.updated_at) as string,
    closedAt: toIsoString(row.closed_at),
  };
}

function toConversationListItem(row: ConversationListRow): ConversationListItem {
  return {
    conversation: toConversation(row),
    latestMessagePreview: row.latest_message_preview,
    latestMessageAt: toIsoString(row.latest_message_at),
  };
}

function toMessage(row: MessageRow): ConversationMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderType: row.sender_type,
    senderId: row.sender_id,
    messageType: row.message_type,
    content: row.content,
    createdAt: toIsoString(row.created_at) as string,
  };
}

function toAiAnswerLog(row: AiAnswerLogRow): AiAnswerLog {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    visitorMessageId: row.visitor_message_id,
    botMessageId: row.bot_message_id,
    matchedKnowledgeArticleId: row.matched_knowledge_article_id,
    matched: row.matched,
    needsHandoff: row.needs_handoff,
    confidenceLevel: row.confidence_level,
    failureReason: row.failure_reason,
    createdAt: toIsoString(row.created_at) as string,
  };
}

function toSatisfactionRating(row: SatisfactionRatingRow): SatisfactionRating {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    visitorId: row.visitor_id,
    score: row.score,
    comment: row.comment,
    createdAt: toIsoString(row.created_at) as string,
  };
}

function isUniqueViolation(error: unknown, constraint: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'constraint' in error &&
    (error as { code?: string }).code === '23505' &&
    (error as { constraint?: string }).constraint === constraint
  );
}

export class PgConversationRepository implements ConversationRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  static fromConnectionString(connectionString: string): PgConversationRepository {
    return new PgConversationRepository(
      new Pool({
        connectionString,
      }),
    );
  }

  async createConversation(input: CreateConversationInput): Promise<Conversation> {
    const result = await this.pool.query<ConversationRow>(
      `
        INSERT INTO app.conversations (visitor_id, source, status)
        VALUES ($1, $2, 'bot_serving')
        RETURNING ${conversationSelectColumns}
      `,
      [input.visitorId, input.source],
    );

    return toConversation(result.rows[0] as ConversationRow);
  }

  async findConversationById(id: string): Promise<Conversation | null> {
    const result = await this.pool.query<ConversationRow>(
      `
        SELECT ${conversationSelectColumns}
        FROM app.conversations
        WHERE id = $1
        LIMIT 1
      `,
      [id],
    );

    return result.rows[0] ? toConversation(result.rows[0]) : null;
  }

  async findLatestOpenConversationByVisitor(
    visitorId: string,
    source: ConversationSource,
  ): Promise<Conversation | null> {
    const result = await this.pool.query<ConversationRow>(
      `
        SELECT ${conversationSelectColumns}
        FROM app.conversations
        WHERE visitor_id = $1
          AND source = $2
          AND status <> 'closed'
        ORDER BY updated_at DESC, id DESC
        LIMIT 1
      `,
      [visitorId, source],
    );

    return result.rows[0] ? toConversation(result.rows[0]) : null;
  }

  async updateConversation(input: UpdateConversationInput): Promise<Conversation | null> {
    const result = await this.pool.query<ConversationRow>(
      `
        UPDATE app.conversations
        SET
          status = COALESCE($2, status),
          assigned_agent_account_id = CASE
            WHEN $3::boolean THEN $4::uuid
            ELSE assigned_agent_account_id
          END,
          handoff_requested_at = CASE
            WHEN $5::boolean THEN $6::timestamptz
            ELSE handoff_requested_at
          END,
          closed_at = CASE
            WHEN $7::boolean THEN $8::timestamptz
            ELSE closed_at
          END,
          updated_at = now()
        WHERE id = $1
        RETURNING ${conversationSelectColumns}
      `,
      [
        input.id,
        input.status ?? null,
        input.setAssignedAgentAccountId ?? false,
        input.assignedAgentAccountId ?? null,
        input.setHandoffRequestedAt ?? false,
        input.handoffRequestedAt ?? null,
        input.setClosedAt ?? false,
        input.closedAt ?? null,
      ],
    );

    return result.rows[0] ? toConversation(result.rows[0]) : null;
  }

  async acceptWaitingConversation(input: AcceptWaitingConversationInput): Promise<Conversation | null> {
    const result = await this.pool.query<ConversationRow>(
      `
        UPDATE app.conversations
        SET
          status = 'agent_serving',
          assigned_agent_account_id = $2,
          updated_at = now()
        WHERE id = $1
          AND status = 'waiting_agent'
          AND assigned_agent_account_id IS NULL
        RETURNING ${conversationSelectColumns}
      `,
      [input.id, input.agentAccountId],
    );

    return result.rows[0] ? toConversation(result.rows[0]) : null;
  }

  async closeAgentConversation(input: CloseAgentConversationInput): Promise<Conversation | null> {
    const result = await this.pool.query<ConversationRow>(
      `
        UPDATE app.conversations
        SET
          status = 'closed',
          closed_at = now(),
          updated_at = now()
        WHERE id = $1
          AND status = 'agent_serving'
          AND assigned_agent_account_id = $2
        RETURNING ${conversationSelectColumns}
      `,
      [input.id, input.agentAccountId],
    );

    return result.rows[0] ? toConversation(result.rows[0]) : null;
  }

  async listConversations(
    filter: ListConversationsFilter,
  ): Promise<{ conversations: ConversationListItem[]; total: number }> {
    const queryValues = [
      filter.status ?? null,
      filter.visitorId ?? null,
      filter.createdFrom ?? null,
      filter.createdTo ?? null,
      filter.limit,
      filter.offset,
    ];
    const [countResult, rowsResult] = await Promise.all([
      this.pool.query<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM app.conversations conversations
          WHERE ($1::text IS NULL OR conversations.status = $1)
            AND ($2::text IS NULL OR conversations.visitor_id = $2)
            AND ($3::timestamptz IS NULL OR conversations.created_at >= $3)
            AND ($4::timestamptz IS NULL OR conversations.created_at <= $4)
        `,
        queryValues.slice(0, 4),
      ),
      this.pool.query<ConversationListRow>(
        `
          SELECT
            ${conversationSelectColumns},
            latest_messages.content AS latest_message_preview,
            latest_messages.created_at AS latest_message_at
          FROM app.conversations conversations
          LEFT JOIN LATERAL (
            SELECT content, created_at
            FROM app.messages
            WHERE conversation_id = conversations.id
            ORDER BY created_at DESC, id DESC
            LIMIT 1
          ) latest_messages ON true
          WHERE ($1::text IS NULL OR conversations.status = $1)
            AND ($2::text IS NULL OR conversations.visitor_id = $2)
            AND ($3::timestamptz IS NULL OR conversations.created_at >= $3)
            AND ($4::timestamptz IS NULL OR conversations.created_at <= $4)
          ORDER BY conversations.created_at DESC, conversations.id DESC
          LIMIT $5
          OFFSET $6
        `,
        queryValues,
      ),
    ]);

    return {
      conversations: rowsResult.rows.map((row) => toConversationListItem(row)),
      total: Number(countResult.rows[0]?.count ?? 0),
    };
  }

  async listWaitingConversations(
    filter: ListWaitingConversationsFilter,
  ): Promise<{ conversations: ConversationListItem[]; total: number }> {
    const [countResult, rowsResult] = await Promise.all([
      this.pool.query<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM app.conversations
          WHERE status = 'waiting_agent'
        `,
      ),
      this.pool.query<ConversationListRow>(
        `
          SELECT
            ${conversationSelectColumns},
            latest_messages.content AS latest_message_preview,
            latest_messages.created_at AS latest_message_at
          FROM app.conversations conversations
          LEFT JOIN LATERAL (
            SELECT content, created_at
            FROM app.messages
            WHERE conversation_id = conversations.id
            ORDER BY created_at DESC, id DESC
            LIMIT 1
          ) latest_messages ON true
          WHERE conversations.status = 'waiting_agent'
          ORDER BY conversations.handoff_requested_at ASC NULLS LAST, conversations.id ASC
          LIMIT $1
          OFFSET $2
        `,
        [filter.limit, filter.offset],
      ),
    ]);

    return {
      conversations: rowsResult.rows.map((row) => toConversationListItem(row)),
      total: Number(countResult.rows[0]?.count ?? 0),
    };
  }

  async createMessage(input: CreateConversationMessageInput): Promise<ConversationMessage> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await client.query<MessageRow>(
        `
          INSERT INTO app.messages (
            conversation_id,
            sender_type,
            sender_id,
            message_type,
            content
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING ${messageSelectColumns}
        `,
        [
          input.conversationId,
          input.senderType,
          input.senderId ?? null,
          input.messageType ?? 'text',
          input.content,
        ],
      );
      await client.query(
        `
          UPDATE app.conversations
          SET updated_at = now()
          WHERE id = $1
        `,
        [input.conversationId],
      );
      await client.query('COMMIT');

      return toMessage(result.rows[0] as MessageRow);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listMessages(
    filter: ListConversationMessagesFilter,
  ): Promise<{ messages: ConversationMessage[]; total: number }> {
    const [countResult, rowsResult] = await Promise.all([
      this.pool.query<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM app.messages
          WHERE conversation_id = $1
        `,
        [filter.conversationId],
      ),
      this.pool.query<MessageRow>(
        `
          SELECT ${messageSelectColumns}
          FROM app.messages
          WHERE conversation_id = $1
          ORDER BY created_at ASC, id ASC
          LIMIT $2
          OFFSET $3
        `,
        [filter.conversationId, filter.limit, filter.offset],
      ),
    ]);

    return {
      messages: rowsResult.rows.map((row) => toMessage(row)),
      total: Number(countResult.rows[0]?.count ?? 0),
    };
  }

  async createAiAnswerLog(input: CreateAiAnswerLogInput): Promise<AiAnswerLog> {
    const result = await this.pool.query<AiAnswerLogRow>(
      `
        INSERT INTO app.ai_answer_logs (
          conversation_id,
          visitor_message_id,
          bot_message_id,
          matched_knowledge_article_id,
          matched,
          needs_handoff,
          confidence_level,
          failure_reason
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING ${aiAnswerLogSelectColumns}
      `,
      [
        input.conversationId,
        input.visitorMessageId,
        input.botMessageId,
        input.matchedKnowledgeArticleId,
        input.matched,
        input.needsHandoff,
        input.confidenceLevel,
        input.failureReason,
      ],
    );

    return toAiAnswerLog(result.rows[0] as AiAnswerLogRow);
  }

  async listAiAnswerLogsByConversationId(conversationId: string): Promise<AiAnswerLog[]> {
    const result = await this.pool.query<AiAnswerLogRow>(
      `
        SELECT ${aiAnswerLogSelectColumns}
        FROM app.ai_answer_logs
        WHERE conversation_id = $1
        ORDER BY created_at ASC, id ASC
      `,
      [conversationId],
    );

    return result.rows.map((row) => toAiAnswerLog(row));
  }

  async createSatisfactionRating(
    input: CreateSatisfactionRatingInput,
  ): Promise<SatisfactionRating> {
    try {
      const result = await this.pool.query<SatisfactionRatingRow>(
        `
          INSERT INTO app.satisfaction_ratings (
            conversation_id,
            visitor_id,
            score,
            comment
          )
          VALUES ($1, $2, $3, $4)
          RETURNING ${satisfactionRatingSelectColumns}
        `,
        [input.conversationId, input.visitorId, input.score, input.comment],
      );

      return toSatisfactionRating(result.rows[0] as SatisfactionRatingRow);
    } catch (error) {
      if (isUniqueViolation(error, 'satisfaction_ratings_conversation_unique')) {
        throw new SatisfactionRatingAlreadyExistsError();
      }

      throw error;
    }
  }

  async findSatisfactionRatingByConversationId(
    conversationId: string,
  ): Promise<SatisfactionRating | null> {
    const result = await this.pool.query<SatisfactionRatingRow>(
      `
        SELECT ${satisfactionRatingSelectColumns}
        FROM app.satisfaction_ratings
        WHERE conversation_id = $1
        LIMIT 1
      `,
      [conversationId],
    );

    return result.rows[0] ? toSatisfactionRating(result.rows[0]) : null;
  }

  async getMetricsOverview(filter: MetricsFilter): Promise<MetricsOverview> {
    const conversationParams = [filter.createdFrom ?? null, filter.createdTo ?? null];
    const ratingParams = [filter.createdFrom ?? null, filter.createdTo ?? null];
    const [conversationMetrics, ratingMetrics] = await Promise.all([
      this.pool.query<{
        consultation_count: string;
        handoff_conversation_count: string;
        auto_resolved_conversation_count: string;
      }>(
        `
          SELECT
            COUNT(*)::text AS consultation_count,
            COUNT(*) FILTER (WHERE handoff_requested_at IS NOT NULL)::text AS handoff_conversation_count,
            COUNT(*) FILTER (
              WHERE status = 'closed'
                AND handoff_requested_at IS NULL
            )::text AS auto_resolved_conversation_count
          FROM app.conversations
          WHERE ($1::timestamptz IS NULL OR created_at >= $1)
            AND ($2::timestamptz IS NULL OR created_at <= $2)
        `,
        conversationParams,
      ),
      this.pool.query<{ rating_count: string; average_score: string | null }>(
        `
          SELECT
            COUNT(*)::text AS rating_count,
            AVG(score)::text AS average_score
          FROM app.satisfaction_ratings
          WHERE ($1::timestamptz IS NULL OR created_at >= $1)
            AND ($2::timestamptz IS NULL OR created_at <= $2)
        `,
        ratingParams,
      ),
    ]);
    const consultationCount = Number(conversationMetrics.rows[0]?.consultation_count ?? 0);
    const handoffConversationCount = Number(
      conversationMetrics.rows[0]?.handoff_conversation_count ?? 0,
    );
    const autoResolvedConversationCount = Number(
      conversationMetrics.rows[0]?.auto_resolved_conversation_count ?? 0,
    );
    const ratingCount = Number(ratingMetrics.rows[0]?.rating_count ?? 0);

    return {
      consultationCount,
      handoffConversationCount,
      handoffRate: consultationCount === 0 ? 0 : handoffConversationCount / consultationCount,
      autoResolvedConversationCount,
      autoResolutionRate:
        consultationCount === 0 ? 0 : autoResolvedConversationCount / consultationCount,
      ratingCount,
      averageSatisfactionScore:
        ratingMetrics.rows[0]?.average_score === null
          ? null
          : Number(ratingMetrics.rows[0]?.average_score),
    };
  }
}
