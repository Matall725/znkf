# 环境配置规范

环境配置由 `apps/api/src/config/environment.ts` 定义和校验。当前覆盖本地开发、测试和生产三类环境。

## 示例文件

- `config/env/.env.local.example`
- `config/env/.env.test.example`
- `config/env/.env.production.example`

真实 `.env` 文件不得提交到仓库。

## 必填配置

| 变量                 | 说明                                                                |
| -------------------- | ------------------------------------------------------------------- |
| `APP_ENV`            | 运行环境，允许 `local`、`test`、`production`。                      |
| `DATABASE_URL`       | PostgreSQL 连接地址，必须以 `postgresql://` 或 `postgres://` 开头。 |
| `REDIS_URL`          | Redis 连接地址，必须以 `redis://` 或 `rediss://` 开头。             |
| `AI_PROVIDER`        | AI 服务供应商标识。                                                 |
| `AI_API_BASE_URL`    | AI 服务基础地址。                                                   |
| `AI_API_KEY`         | AI 服务访问密钥。                                                   |
| `AI_CHAT_MODEL`      | 对话模型名称。                                                      |
| `AI_EMBEDDING_MODEL` | 向量化模型名称。                                                    |
| `JWT_SECRET`         | JWT 密钥，至少 32 个字符。                                          |
| `VITE_API_BASE_URL`  | 前端调用后端 API 的基础地址。                                       |
| `LOG_LEVEL`          | 日志级别，允许 `debug`、`info`、`warn`、`error`。                   |

## 校验命令

```powershell
npm.cmd run config:check:local
npm.cmd run config:check:test
npm.cmd run config:check:production
```
