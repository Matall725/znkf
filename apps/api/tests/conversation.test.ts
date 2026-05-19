import type {
  AiAnswerConfidenceLevel,
  AiAnswerLog,
  Conversation,
  ConversationListItem,
  ConversationMessage,
  MetricsOverview,
  SatisfactionRating,
} from '@znkfxt/contracts';
import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import { JwtAccessTokenIssuer } from '../src/auth/access-token';
import { ConversationService } from '../src/conversation/conversation.service';
import type {
  AcceptWaitingConversationInput,
  CloseAgentConversationInput,
  ConversationRepository,
  CreateConversationInput,
  CreateConversationMessageInput,
  CreateSatisfactionRatingInput,
  CreateAiAnswerLogInput,
  ListConversationsFilter,
  ListConversationMessagesFilter,
  ListWaitingConversationsFilter,
  MetricsFilter,
  UpdateConversationInput,
} from '../src/conversation/conversation.repository';
import { FeedbackService } from '../src/feedback/feedback.service';
import type { KnowledgeAnswerService } from '../src/knowledge/answer.service';
import type { AppLogger } from '../src/logging/logger';
import { MetricsService } from '../src/metrics/metrics.service';
import { createApiServer } from '../src/server';

const jwtSecret = 'conversation-test-secret-at-least-32-chars-long';
const agentAccountId = '00000000-0000-0000-0000-000000000001';
const conversationIds = [
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
] as const;

const noopLogger: AppLogger = {
  info() {
    return undefined;
  },
  error() {
    return undefined;
  },
};

function createConversation(id: string, overrides: Partial<Conversation> = {}): Conversation {
  const timestamp = new Date().toISOString();
  return {
    id,
    visitorId: 'test-visitor',
    source: 'web',
    status: 'bot_serving',
    assignedAgentAccountId: null,
    handoffRequestedAt: null,
    closedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function createMessage(
  id: string,
  overrides: Partial<ConversationMessage> = {},
): ConversationMessage {
  return {
    id,
    conversationId: conversationIds[0],
    senderType: 'visitor',
    senderId: null,
    messageType: 'text',
    content: 'Test message',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

class TestKnowledgeAnswerService implements KnowledgeAnswerService {
  private shouldMatch = false;
  private shouldHandoff = false;

  setAnswer(matched: boolean, handoff: boolean): void {
    this.shouldMatch = matched;
    this.shouldHandoff = handoff;
  }

  async evaluateQuestion(_request: { question: string }): Promise<{
    answer: string;
    matched: boolean;
    needsHandoff: boolean;
    confidenceLevel: AiAnswerConfidenceLevel;
    failureReason: string | null;
    sourceArticle: unknown;
  }> {
    if (this.shouldHandoff) {
      return {
        answer: '转人工客服处理。',
        matched: false,
        needsHandoff: true,
        confidenceLevel: 'low',
        failureReason: null,
        sourceArticle: null,
      };
    }

    if (this.shouldMatch) {
      return {
        answer: '这是一个自动回答。',
        matched: true,
        needsHandoff: false,
        confidenceLevel: 'high',
        failureReason: null,
        sourceArticle: {
          article: { id: 'article-1', title: 'Test Article' },
          matched: true,
        },
      };
    }

    return {
      answer: '无法回答该问题。',
      matched: false,
      needsHandoff: false,
      confidenceLevel: 'low',
      failureReason: 'no_matching_article',
      sourceArticle: null,
    };
  }
}

class TestConversationRepository implements ConversationRepository {
  readonly conversations = new Map<string, Conversation>();
  readonly messages = new Map<string, ConversationMessage>();
  readonly ratings = new Map<string, SatisfactionRating>();
  readonly aiAnswerLogs: AiAnswerLog[] = [];
  private messageIdCounter = 0;

  addConversation(conversation: Conversation): void {
    this.conversations.set(conversation.id, { ...conversation });
  }

  async createConversation(input: CreateConversationInput): Promise<Conversation> {
    const id = `conv-${this.conversations.size + 1}`;
    const timestamp = new Date().toISOString();
    const conversation: Conversation = {
      id,
      visitorId: input.visitorId,
      source: input.source,
      status: 'bot_serving',
      assignedAgentAccountId: null,
      handoffRequestedAt: null,
      closedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async findConversationById(id: string): Promise<Conversation | null> {
    return this.conversations.get(id) ?? null;
  }

  async findLatestOpenConversationByVisitor(
    visitorId: string,
    _source: string,
  ): Promise<Conversation | null> {
    const openConversations = [...this.conversations.values()]
      .filter((c) => c.visitorId === visitorId && c.status !== 'closed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return openConversations[0] ?? null;
  }

  async updateConversation(input: UpdateConversationInput): Promise<Conversation | null> {
    const existing = this.conversations.get(input.id);

    if (!existing) {
      return null;
    }

    const updated: Conversation = {
      ...existing,
      ...(input.status === undefined ? {} : { status: input.status }),
      ...(input.assignedAgentAccountId === undefined
        ? {}
        : { assignedAgentAccountId: input.assignedAgentAccountId }),
      ...(input.setHandoffRequestedAt
        ? {
            handoffRequestedAt:
              input.handoffRequestedAt !== undefined ? input.handoffRequestedAt : null,
          }
        : {}),
      ...(input.setClosedAt
        ? { closedAt: input.closedAt !== undefined ? input.closedAt : null }
        : {}),
      ...(input.setAssignedAgentAccountId
        ? {
            assignedAgentAccountId:
              input.assignedAgentAccountId !== undefined ? input.assignedAgentAccountId : null,
          }
        : {}),
      updatedAt: new Date().toISOString(),
    };

    this.conversations.set(input.id, updated);
    return updated;
  }

  async acceptWaitingConversation(
    input: AcceptWaitingConversationInput,
  ): Promise<Conversation | null> {
    const existing = this.conversations.get(input.id);

    if (!existing || existing.status !== 'waiting_agent') {
      return null;
    }

    const updated: Conversation = {
      ...existing,
      status: 'agent_serving',
      assignedAgentAccountId: input.agentAccountId,
      updatedAt: new Date().toISOString(),
    };

    this.conversations.set(input.id, updated);
    return updated;
  }

  async closeAgentConversation(input: CloseAgentConversationInput): Promise<Conversation | null> {
    const existing = this.conversations.get(input.id);

    if (
      !existing ||
      existing.status !== 'agent_serving' ||
      existing.assignedAgentAccountId !== input.agentAccountId
    ) {
      return null;
    }

    const updated: Conversation = {
      ...existing,
      status: 'closed',
      closedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.conversations.set(input.id, updated);
    return updated;
  }

  async listConversations(filter: ListConversationsFilter): Promise<{
    conversations: ConversationListItem[];
    total: number;
  }> {
    let result = [...this.conversations.values()].map((c) => ({
      id: c.id,
      visitorId: c.visitorId,
      source: c.source,
      status: c.status,
      assignedAgentAccountId: c.assignedAgentAccountId,
      handoffRequestedAt: c.handoffRequestedAt,
      closedAt: c.closedAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    if (filter.status) {
      result = result.filter((c) => c.status === filter.status);
    }

    const total = result.length;
    const sliced = result.slice(filter.offset, filter.offset + filter.limit);

    return {
      conversations: sliced,
      total,
    };
  }

  async listWaitingConversations(filter: ListWaitingConversationsFilter): Promise<{
    conversations: ConversationListItem[];
    total: number;
  }> {
    const waiting = [...this.conversations.values()]
      .filter((c) => c.status === 'waiting_agent')
      .map((c) => ({
        id: c.id,
        visitorId: c.visitorId,
        source: c.source,
        status: c.status,
        assignedAgentAccountId: c.assignedAgentAccountId,
        handoffRequestedAt: c.handoffRequestedAt,
        closedAt: c.closedAt,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

    const total = waiting.length;
    const sliced = waiting.slice(filter.offset, filter.offset + filter.limit);

    return {
      conversations: sliced,
      total,
    };
  }

  async createMessage(input: CreateConversationMessageInput): Promise<ConversationMessage> {
    this.messageIdCounter += 1;
    const id = `msg-${this.messageIdCounter}`;
    const timestamp = new Date().toISOString();
    const message: ConversationMessage = {
      id,
      conversationId: input.conversationId,
      senderType: input.senderType,
      senderId: input.senderId ?? null,
      messageType: input.messageType ?? 'text',
      content: input.content,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.messages.set(id, message);
    return message;
  }

  async listMessages(filter: ListConversationMessagesFilter): Promise<{
    messages: ConversationMessage[];
    total: number;
  }> {
    const result = [...this.messages.values()]
      .filter((m) => m.conversationId === filter.conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const total = result.length;
    const sliced = result.slice(filter.offset, filter.offset + filter.limit);

    return {
      messages: sliced,
      total,
    };
  }

  async createAiAnswerLog(input: CreateAiAnswerLogInput): Promise<AiAnswerLog> {
    const timestamp = new Date().toISOString();
    const log: AiAnswerLog = {
      id: `log-${this.aiAnswerLogs.length + 1}`,
      ...input,
      createdAt: timestamp,
    };
    this.aiAnswerLogs.push(log);
    return log;
  }

  async listAiAnswerLogsByConversationId(_conversationId: string): Promise<AiAnswerLog[]> {
    return [...this.aiAnswerLogs];
  }

  async createSatisfactionRating(
    input: CreateSatisfactionRatingInput,
  ): Promise<SatisfactionRating> {
    const existingRating = [...this.ratings.values()].find(
      (r) => r.conversationId === input.conversationId,
    );

    if (existingRating) {
      throw new (class extends Error {
        constructor() {
          super('Satisfaction rating already exists.');
          this.name = 'SatisfactionRatingAlreadyExistsError';
        }
      })();
    }

    const timestamp = new Date().toISOString();
    const rating: SatisfactionRating = {
      id: `rating-${this.ratings.size + 1}`,
      conversationId: input.conversationId,
      visitorId: input.visitorId,
      score: input.score,
      comment: input.comment,
      createdAt: timestamp,
    };
    this.ratings.set(rating.id, rating);
    return rating;
  }

  async findSatisfactionRatingByConversationId(
    conversationId: string,
  ): Promise<SatisfactionRating | null> {
    return [...this.ratings.values()].find((r) => r.conversationId === conversationId) ?? null;
  }

  async getMetricsOverview(_filter: MetricsFilter): Promise<MetricsOverview> {
    const conversations = [...this.conversations.values()];
    const closedConversations = conversations.filter((c) => c.status === 'closed');
    const handoffConversations = conversations.filter((c) => c.handoffRequestedAt !== null);
    const ratings = [...this.ratings.values()];
    const averageScore =
      ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length : null;

    return {
      consultationCount: conversations.length,
      handoffConversationCount: handoffConversations.length,
      handoffRate:
        conversations.length > 0 ? handoffConversations.length / conversations.length : 0,
      autoResolvedConversationCount: closedConversations.filter(
        (c) => c.handoffRequestedAt === null,
      ).length,
      autoResolutionRate:
        closedConversations.length > 0
          ? closedConversations.filter((c) => c.handoffRequestedAt === null).length /
            closedConversations.length
          : 0,
      ratingCount: ratings.length,
      averageSatisfactionScore: averageScore,
    };
  }
}

function createApp(repo: ConversationRepository, answerService?: KnowledgeAnswerService) {
  const conversationService = new ConversationService({
    conversationRepository: repo,
    knowledgeAnswerService: answerService,
  });
  const feedbackService = new FeedbackService({
    conversationRepository: repo,
  });
  const metricsService = new MetricsService({
    conversationRepository: repo,
  });

  return createApiServer({
    conversationService,
    feedbackService,
    metricsService,
    accessTokenVerifier: new (class {
      verifyToken(token: string) {
        const decoded = JSON.parse(
          Buffer.from(token.split('.')[1] as string, 'base64url').toString(),
        );
        return {
          id: decoded.sub ?? agentAccountId,
          loginName: decoded.loginName ?? 'agent',
          displayName: decoded.displayName ?? 'Agent User',
          status: decoded.status ?? 'enabled',
          roles: decoded.roles ?? ['agent'],
        };
      }
    })(),
    authService: undefined,
    healthService: undefined,
    logger: noopLogger,
    knowledgeAnswerService: answerService,
  });
}

function issueToken(roles: string[]): string {
  return new JwtAccessTokenIssuer(jwtSecret, 3600).issueToken({
    id: agentAccountId,
    loginName: 'agent@test.com',
    displayName: 'Test Agent',
    status: 'enabled',
    roles: roles as any,
  });
}

describe('conversation lifecycle', () => {
  let repo: TestConversationRepository;

  beforeEach(() => {
    repo = new TestConversationRepository();
  });

  // ===== Visitor API =====

  it('creates a new conversation for a first-time visitor', async () => {
    const app = createApp(repo);
    const response = await request(app)
      .post('/api/visitor/conversations')
      .send({ visitorId: 'visitor-1', source: 'web' })
      .expect(201);

    expect(response.body).toMatchObject({
      conversation: {
        visitorId: 'visitor-1',
        source: 'web',
        status: 'bot_serving',
      },
      reusedExistingConversation: false,
    });
  });

  it('reuses an existing open conversation for the same visitor', async () => {
    const app = createApp(repo);
    repo.addConversation(
      createConversation(conversationIds[0], {
        visitorId: 'visitor-1',
        status: 'bot_serving',
      }),
    );

    const response = await request(app)
      .post('/api/visitor/conversations')
      .send({ visitorId: 'visitor-1', source: 'web' })
      .expect(201);

    expect(response.body).toMatchObject({
      conversation: { id: conversationIds[0] },
      reusedExistingConversation: true,
    });
  });

  it('rejects invalid create conversation requests', async () => {
    const app = createApp(repo);

    await request(app)
      .post('/api/visitor/conversations')
      .send({ visitorId: '', source: 'web' })
      .expect(400);
  });

  it('sends a visitor message and gets bot reply', async () => {
    const answerService = new TestKnowledgeAnswerService();
    answerService.setAnswer(true, false);
    const app = createApp(repo, answerService);
    repo.addConversation(createConversation(conversationIds[0]));

    const response = await request(app)
      .post(`/api/visitor/conversations/${conversationIds[0]}/messages`)
      .send({ content: '你好' })
      .expect(200);

    expect(response.body).toMatchObject({
      visitorMessage: {
        senderType: 'visitor',
        content: '你好',
      },
      botMessage: {
        senderType: 'bot',
      },
    });
  });

  it('suggests handoff when answer service detects handoff needed', async () => {
    const answerService = new TestKnowledgeAnswerService();
    answerService.setAnswer(false, true);
    const app = createApp(repo, answerService);
    repo.addConversation(createConversation(conversationIds[0]));

    const response = await request(app)
      .post(`/api/visitor/conversations/${conversationIds[0]}/messages`)
      .send({ content: '需要人工' })
      .expect(200);

    expect(response.body).toMatchObject({
      visitorMessage: {
        senderType: 'visitor',
        content: '需要人工',
      },
    });
    // Should not have bot message, but should update conversation status
    expect(response.body.botMessage).toBeUndefined();
  });

  it('sends visitor message without bot answer when in agent serving mode', async () => {
    const answerService = new TestKnowledgeAnswerService();
    answerService.setAnswer(true, false);
    const app = createApp(repo, answerService);
    repo.addConversation(
      createConversation(conversationIds[0], {
        status: 'agent_serving',
        assignedAgentAccountId: agentAccountId,
      }),
    );

    const response = await request(app)
      .post(`/api/visitor/conversations/${conversationIds[0]}/messages`)
      .send({ content: 'hello' })
      .expect(200);

    expect(response.body).toMatchObject({
      visitorMessage: { content: 'hello' },
    });
    expect(response.body.botMessage).toBeUndefined();
  });

  it('rejects messages to closed conversations', async () => {
    const app = createApp(repo);
    repo.addConversation(
      createConversation(conversationIds[0], {
        status: 'closed',
        closedAt: new Date().toISOString(),
      }),
    );

    await request(app)
      .post(`/api/visitor/conversations/${conversationIds[0]}/messages`)
      .send({ content: 'hello' })
      .expect(400);
  });

  it('rejects empty visitor messages', async () => {
    const app = createApp(repo);
    repo.addConversation(createConversation(conversationIds[0]));

    await request(app)
      .post(`/api/visitor/conversations/${conversationIds[0]}/messages`)
      .send({ content: '   ' })
      .expect(400);
  });

  it('lists messages for a conversation', async () => {
    const app = createApp(repo);
    repo.addConversation(createConversation(conversationIds[0]));
    await repo.createMessage({
      conversationId: conversationIds[0],
      senderType: 'visitor',
      content: '你好',
    });
    await repo.createMessage({
      conversationId: conversationIds[0],
      senderType: 'bot',
      content: '你好！有什么可以帮助您的？',
    });

    const response = await request(app)
      .get(`/api/visitor/conversations/${conversationIds[0]}/messages`)
      .expect(200);

    expect(response.body).toMatchObject({
      total: 2,
      messages: [
        expect.objectContaining({ senderType: 'visitor', content: '你好' }),
        expect.objectContaining({ senderType: 'bot', content: '你好！有什么可以帮助您的？' }),
      ],
    });
  });

  it('returns 404 for messages of non-existent conversation', async () => {
    const app = createApp(repo);

    await request(app)
      .get(`/api/visitor/conversations/00000000-0000-4000-8000-000000000000/messages`)
      .expect(404);
  });

  it('closes a conversation by visitor', async () => {
    const app = createApp(repo);
    repo.addConversation(createConversation(conversationIds[0]));

    const response = await request(app)
      .post(`/api/visitor/conversations/${conversationIds[0]}/close`)
      .expect(200);

    expect(response.body).toMatchObject({
      conversation: {
        id: conversationIds[0],
        status: 'closed',
      },
      systemMessage: {
        senderType: 'system',
        content: '访客已关闭会话。',
      },
    });
  });

  it('rejects closing an already closed conversation', async () => {
    const app = createApp(repo);
    repo.addConversation(
      createConversation(conversationIds[0], {
        status: 'closed',
        closedAt: new Date().toISOString(),
      }),
    );

    await request(app).post(`/api/visitor/conversations/${conversationIds[0]}/close`).expect(400);
  });

  it('requests handoff successfully', async () => {
    const app = createApp(repo);
    repo.addConversation(createConversation(conversationIds[0]));

    const response = await request(app)
      .post(`/api/visitor/conversations/${conversationIds[0]}/handoff`)
      .expect(200);

    expect(response.body).toMatchObject({
      conversation: {
        id: conversationIds[0],
        status: 'waiting_agent',
      },
      systemMessage: {
        senderType: 'system',
        content: '访客已请求转人工客服。',
      },
    });
  });

  it('rejects handoff if already processed', async () => {
    const app = createApp(repo);
    repo.addConversation(
      createConversation(conversationIds[0], {
        status: 'agent_serving',
        assignedAgentAccountId: agentAccountId,
      }),
    );

    await request(app).post(`/api/visitor/conversations/${conversationIds[0]}/handoff`).expect(400);
  });

  // ===== Agent API =====

  it('lists waiting conversations for agents', async () => {
    const app = createApp(repo);
    const token = issueToken(['agent']);
    repo.addConversation(createConversation(conversationIds[0], { status: 'waiting_agent' }));
    repo.addConversation(createConversation(conversationIds[1], { status: 'bot_serving' }));
    repo.addConversation(createConversation(conversationIds[2], { status: 'waiting_agent' }));

    const response = await request(app)
      .get('/api/agent/conversations/waiting')
      .set('authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      total: 2,
    });
  });

  it('requires authentication for agent routes', async () => {
    const app = createApp(repo);

    await request(app).get('/api/agent/conversations/waiting').expect(401);
  });

  it('accepts a waiting conversation', async () => {
    const app = createApp(repo);
    const token = issueToken(['agent']);
    repo.addConversation(createConversation(conversationIds[0], { status: 'waiting_agent' }));

    const response = await request(app)
      .post(`/api/agent/conversations/${conversationIds[0]}/accept`)
      .set('authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      conversation: {
        id: conversationIds[0],
        status: 'agent_serving',
        assignedAgentAccountId: agentAccountId,
      },
    });
  });

  it('rejects accepting a non-waiting conversation', async () => {
    const app = createApp(repo);
    const token = issueToken(['agent']);
    repo.addConversation(createConversation(conversationIds[0], { status: 'bot_serving' }));

    await request(app)
      .post(`/api/agent/conversations/${conversationIds[0]}/accept`)
      .set('authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('sends an agent message', async () => {
    const app = createApp(repo);
    const token = issueToken(['agent']);
    repo.addConversation(
      createConversation(conversationIds[0], {
        status: 'agent_serving',
        assignedAgentAccountId: agentAccountId,
      }),
    );

    const response = await request(app)
      .post(`/api/agent/conversations/${conversationIds[0]}/messages`)
      .set('authorization', `Bearer ${token}`)
      .send({ content: '您好，我是客服小张' })
      .expect(200);

    expect(response.body).toMatchObject({
      message: {
        senderType: 'agent',
        senderId: agentAccountId,
        content: '您好，我是客服小张',
      },
    });
  });

  it('rejects agent message from non-assigned agent', async () => {
    const app = createApp(repo);
    const otherAgent = '00000000-0000-0000-0000-000000000099';
    const otherToken = new JwtAccessTokenIssuer(jwtSecret, 3600).issueToken({
      id: otherAgent,
      loginName: 'other@test.com',
      displayName: 'Other Agent',
      status: 'enabled',
      roles: ['agent'],
    });
    repo.addConversation(
      createConversation(conversationIds[0], {
        status: 'agent_serving',
        assignedAgentAccountId: agentAccountId,
      }),
    );

    await request(app)
      .post(`/api/agent/conversations/${conversationIds[0]}/messages`)
      .set('authorization', `Bearer ${otherToken}`)
      .send({ content: 'Hello' })
      .expect(400);
  });

  it('closes an agent conversation', async () => {
    const app = createApp(repo);
    const token = issueToken(['agent']);
    repo.addConversation(
      createConversation(conversationIds[0], {
        status: 'agent_serving',
        assignedAgentAccountId: agentAccountId,
      }),
    );

    const response = await request(app)
      .post(`/api/agent/conversations/${conversationIds[0]}/close`)
      .set('authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      conversation: {
        id: conversationIds[0],
        status: 'closed',
      },
    });
  });

  // ===== Admin API =====

  it('lists conversations as admin', async () => {
    const app = createApp(repo);
    const token = issueToken(['admin']);
    repo.addConversation(createConversation(conversationIds[0]));

    const response = await request(app)
      .get('/api/admin/conversations')
      .set('authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      total: 1,
    });
  });

  it('filters conversations by status as admin', async () => {
    const app = createApp(repo);
    const token = issueToken(['admin']);
    repo.addConversation(createConversation(conversationIds[0], { status: 'bot_serving' }));
    repo.addConversation(
      createConversation(conversationIds[1], {
        status: 'closed',
        closedAt: new Date().toISOString(),
      }),
    );

    const response = await request(app)
      .get('/api/admin/conversations')
      .query({ status: 'closed' })
      .set('authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      total: 1,
    });
  });

  // ===== Metrics API =====

  it('returns metrics overview for admin', async () => {
    const app = createApp(repo);
    const token = issueToken(['admin']);
    repo.addConversation(createConversation(conversationIds[0], { status: 'bot_serving' }));
    repo.addConversation(
      createConversation(conversationIds[1], {
        status: 'closed',
        closedAt: new Date().toISOString(),
      }),
    );

    const response = await request(app)
      .get('/api/admin/metrics/overview')
      .set('authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      consultationCount: 2,
      handoffConversationCount: 0,
      ratingCount: 0,
      averageSatisfactionScore: null,
    });
  });

  it('requires admin role for metrics endpoint', async () => {
    const app = createApp(repo);
    const token = issueToken(['agent']);

    await request(app)
      .get('/api/admin/metrics/overview')
      .set('authorization', `Bearer ${token}`)
      .expect(403);
  });
});
