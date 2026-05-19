# 智能客服系统

基于知识库增强的网站 / H5 智能客服系统，支持 AI 自动问答、转人工、坐席接待、知识库管理和会话评价。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 后端 | Node.js + TypeScript + Express |
| 前端 | React + TypeScript + Vite |
| 数据库 | PostgreSQL + pgvector |
| 缓存 | Redis |
| 测试 | Vitest + Supertest + Testing Library + Playwright |
| 代码质量 | TypeScript strict + Prettier + 模块边界检查 |

## 项目结构

```
znkfxt/
├── apps/
│   ├── api/                # 后端 API 服务
│   ├── web-widget/         # 访客端聊天组件（可嵌入网站）
│   ├── agent-console/      # 坐席工作台
│   └── admin-console/      # 管理后台
├── packages/
│   ├── contracts/          # 前后端共享类型与 API 契约
│   └── shared-ui/          # 前端共享 UI 组件
├── config/                 # 环境变量配置
├── docs/                   # 工程文档
├── e2e/                    # 端到端测试
├── infra/                  # 基础设施配置
├── memory/                 # 实施计划与架构记录
└── scripts/                # 工程脚本
```

## 已实现功能

### 后端（apps/api）

- 健康检查与统一错误响应
- 请求关联日志（Pino）
- JWT 登录与 RBAC 权限校验
- 知识分类管理（CRUD）
- 知识条目创建 / 编辑 / 查询
- 会话创建、状态流转、消息管理
- 转人工请求与排队
- 满意度评价
- 数据库迁移（PostgreSQL）
- Redis 缓存集成
- 环境配置校验
- 模块边界约束

### 访客端（apps/web-widget）

- 可嵌入聊天组件（ChatEntry / ChatPanel）
- 访客匿名标识管理（localStorage 持久化）
- 会话自动初始化
- AI 对话与消息收发
- 转人工入口与等待状态
- 会话评价（表情 + 文字评论）

### 坐席工作台（apps/agent-console）

- 坐席登录页
- 会话列表与接待

### 管理后台（apps/admin-console）

- 管理员登录
- 知识库管理
- 仪表盘

### 共享层

- `packages/contracts`：前后端共享类型定义
- `packages/shared-ui`：Button、Card、Input、Loading、Modal、StatusBadge、Table 等通用组件

## 快速开始

### 环境要求

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp config/env/.env.local.example config/env/.env.local
# 编辑 .env.local 填入数据库、Redis 等配置
```

### 数据库迁移

```bash
npm run db:migrate
```

### 启动开发服务

```bash
# 后端 API
npm run dev:api

# 访客聊天组件
npm run dev:web-widget

# 坐席工作台
npm run dev:agent-console

# 管理后台
npm run dev:admin-console
```

### 构建

```bash
npm run build:web-widget
npm run build:agent-console
npm run build:admin-console
```

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run format:check` | Prettier 格式检查 |
| `npm run test` | 运行全部测试 |
| `npm run test:api` | 后端单元测试 |
| `npm run test:web-widget` | 访客组件测试 |
| `npm run test:e2e` | 端到端测试 |
| `npm run check:boundaries` | 模块边界检查 |
| `npm run db:migrate` | 执行数据库迁移 |
| `npm run db:migrate:down` | 回滚数据库迁移 |
| `npm run config:check:local` | 校验本地环境配置 |

## 文档

- `docs/` — 工程说明文档
- `memory/system-design.md` — 系统设计
- `memory/tech-stack.md` — 技术栈设计
- `memory/architecture.md` — 架构记录
- `memory/implementation-plan.md` — 实施计划
- `memory/progress.md` — 实施进度
