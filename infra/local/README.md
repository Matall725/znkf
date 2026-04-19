# 本地基础服务

本目录记录步骤 6 的本地运行配置。默认只启动基础依赖，应用进程通过 Docker Compose profile 在后续业务服务脚本落地后启用。

## 基础依赖

```powershell
docker compose up -d postgres redis
```

- `postgres` 使用 `pgvector/pgvector:pg16`，用于 PostgreSQL 与后续 pgvector 能力。
- `redis` 使用 `redis:7-alpine`，用于缓存、队列和后续 BullMQ worker。
- 两个基础依赖都定义了 Docker healthcheck。

## 应用进程配置

`docker-compose.yml` 已为后续本地运行保留三个服务：

- `api`：后端 API 进程，依赖 PostgreSQL 与 Redis 健康后启动。
- `worker`：异步任务进程，依赖 PostgreSQL 与 Redis 健康后启动。
- `static`：前端静态资源服务，通过 Nginx 暴露 `web-widget`、`agent-console` 和 `admin-console` 构建产物。

应用进程使用 profile 启动：

```powershell
docker compose --profile app --profile static up
```

当前步骤只建立本地服务编排。`api`、`worker` 的实际开发脚本会在后续后端与任务模块实现时补齐，后端依赖健康检查会在步骤 12 实现。

## 静态配置校验

```powershell
npm.cmd run check:local-services
```

该命令检查本地服务编排是否包含 PostgreSQL、Redis、API、worker、静态服务、基础健康检查和依赖关系。
