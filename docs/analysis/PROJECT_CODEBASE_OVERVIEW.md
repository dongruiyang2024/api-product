# api-product / Sub2API 代码总览

日期: 2026-05-28

## 一句话判断

api-product 当前代码实际是 Sub2API: 一个 AI API Gateway + 订阅额度分发平台。核心不是普通业务 API，而是把多种上游 AI 账号和模型能力包装成统一网关，同时管理用户、API Key、分组、计费、支付、额度、监控和后台运营。

## 技术栈

- 后端: Go, Gin, Ent ORM, Wire, PostgreSQL, Redis。
- 前端: Vue 3, Vite, TypeScript, Pinia, Vue Router, TailwindCSS, Vitest。
- 部署: Docker, docker-compose, GoReleaser, systemd install script。
- 主要数据存储: PostgreSQL 保存核心业务实体，Redis 承载缓存、限流、会话、队列和运行态计数。

## 顶层目录

- `backend/`: Go 后端、Ent schema、迁移、服务层、路由和网关逻辑。
- `frontend/`: Vue 管理端和用户端界面。
- `deploy/`: Docker Compose、安装脚本、示例配置和部署文档。
- `docs/`: 支付、外部对接和项目分析文档。
- `assets/`: README 和生态展示用素材。
- `tools/`: 辅助检查脚本。

## 后端架构心智图

后端启动入口是 `backend/cmd/server/main.go`。启动时先判断是否需要 setup wizard；完成配置后进入主服务模式。

主服务的路由装配在 `backend/internal/server/router.go`:

```text
cmd/server/main.go
  -> setup.NeedsSetup / AutoSetup
  -> initializeApplication
  -> server.SetupRouter
  -> routes.Register*Routes
  -> handler
  -> service
  -> repository / ent / redis / upstream providers
```

关键分层:

- `internal/server/routes`: HTTP 路由分组，决定 auth、admin、gateway、payment、user 等入口。
- `internal/server/middleware`: JWT、API Key、Admin API Key、CORS、CSP、request body limit、request id、后台模式保护。
- `internal/handler`: Gin handler，负责参数读取、响应格式、错误映射。
- `internal/service`: 业务核心层，承载网关调度、计费、支付、账号、认证、监控、风控、公告等逻辑。
- `internal/repository`: Ent/PostgreSQL、Redis cache、外部 HTTP、S3、GitHub release 等基础设施适配。
- `internal/pkg`: OpenAI/Claude/Gemini/Antigravity 兼容转换、OAuth、代理、TLS fingerprint、错误模型等底层工具。
- `ent/schema`: 数据模型定义，修改后需要重新生成 Ent 代码。
- `migrations`: SQL 迁移，覆盖历史版本演进。

## 核心业务模块

### API Gateway

路由集中在 `backend/internal/server/routes/gateway.go`。

支持的入口包括:

- Claude/Anthropic 兼容: `/v1/messages`, `/v1/messages/count_tokens`, `/v1/models`, `/v1/usage`。
- OpenAI 兼容: `/v1/chat/completions`, `/v1/responses`, `/chat/completions`, `/responses`, `/images/generations`, `/images/edits`。
- Gemini 原生兼容: `/v1beta/models`, `/v1beta/models/:model`, `/v1beta/models/*modelAction`。
- Codex alias: `/backend-api/codex/responses`。
- Antigravity 专用入口: `/antigravity/v1/*`, `/antigravity/v1beta/*`。

网关请求会经过 API Key 认证、分组限制、平台选择、账号调度、上游请求转换、流式/非流式转发、用量记录和计费。

### 账号、分组和调度

账号、分组、渠道和代理是网关调度的核心配置面。相关代码主要在:

- `backend/internal/service/account_service.go`
- `backend/internal/service/channel_service.go`
- `backend/internal/service/gateway_service.go`
- `backend/internal/repository/account_repo.go`
- `backend/internal/repository/channel_repo.go`

这个层面处理上游账号状态、模型映射、平台隔离、sticky session、并发限制、RPM、代理、账号健康、隐私模式和错误降级。

### 用户、认证和 API Key

用户路由在 `backend/internal/server/routes/auth.go` 与 `backend/internal/server/routes/user.go`。

能力包括:

- 邮箱注册登录、验证码、密码重置、refresh token、会话撤销。
- LinuxDo、GitHub、Google、WeChat、OIDC、DingTalk OAuth。
- TOTP 双因素认证。
- 用户 API Key 创建、更新、删除和用量查看。
- 用户可用分组、可用渠道、平台额度和订阅进度。

### 计费、订阅和支付

支付路由在 `backend/internal/server/routes/payment.go`，现有 docs 也主要围绕这个模块。

用户端入口:

- `/api/v1/payment/config`
- `/api/v1/payment/plans`
- `/api/v1/payment/channels`
- `/api/v1/payment/orders/*`

公开/回调入口:

- `/api/v1/payment/public/orders/*`
- `/api/v1/payment/webhook/easypay`
- `/api/v1/payment/webhook/alipay`
- `/api/v1/payment/webhook/wxpay`
- `/api/v1/payment/webhook/stripe`
- `/api/v1/payment/webhook/airwallex`

管理端入口:

- `/api/v1/admin/payment/dashboard`
- `/api/v1/admin/payment/config`
- `/api/v1/admin/payment/orders/*`
- `/api/v1/admin/payment/plans/*`
- `/api/v1/admin/payment/providers/*`

支付状态机和履约逻辑主要在 `backend/internal/service/payment_order_lifecycle.go`、`payment_order_expiry_service.go`、`payment_webhook_provider.go`、`payment_config_service.go`。

### 运营与监控

运营后台覆盖 dashboard、usage、ops errors、channel monitor、scheduled tests、runtime logs、alert settings、backup、data management 等。相关入口集中在 `backend/internal/server/routes/admin.go`，服务层分散在 `dashboard_*`, `ops_*`, `channel_monitor_*`, `scheduled_test_*`, `backup_service.go`。

## 数据模型

Ent schema 位于 `backend/ent/schema`。关键实体包括:

- 用户与认证: `user`, `auth_identity`, `pending_auth_session`, `identity_adoption_decision`, `user_attribute_*`。
- 网关分发: `api_key`, `account`, `group`, `account_group`, `proxy`, `channel_monitor_*`, `tls_fingerprint_profile`。
- 用量与计费: `usage_log`, `user_subscription`, `subscription_plan`, `user_platform_quota`, `redeem_code`, `promo_code`, `promo_code_usage`。
- 支付: `payment_order`, `payment_provider_instance`, `payment_audit_log`。
- 配置与运营: `setting`, `announcement`, `announcement_read`, `error_passthrough_rule`, `security_secret`, `usage_cleanup_task`。

修改 `ent/schema/*.go` 后需要运行 Ent 生成，并提交生成代码。

## 前端结构

前端入口在 `frontend/src/router/index.ts`，页面分为 setup、public、user、admin 多组。

主要目录:

- `frontend/src/views`: 页面级视图，例如登录、用户 dashboard、API Key、usage、payment、admin 页面。
- `frontend/src/components`: 通用组件、布局组件、账号管理、支付组件、后台组件。
- `frontend/src/api`: 和后端 API 对应的客户端封装，admin 子目录对应后台接口。
- `frontend/src/stores`: Pinia 状态。
- `frontend/src/i18n`: 中英文国际化文案。
- `frontend/src/composables`: 表格、导航、OAuth、剪贴板、表单等复用逻辑。

## 开发与验证命令

后端:

```bash
cd backend
go test -tags=unit ./...
go test -tags=integration ./...
go generate ./ent
```

前端:

```bash
cd frontend
pnpm install
pnpm typecheck
pnpm test:run
pnpm build
```

项目已有 `DEV_GUIDE.md`，里面记录了本地 PostgreSQL/Redis、CI、pnpm lock、Ent 生成和常见坑。

## 当前文档缺口建议

- `docs/analysis/API_ROUTE_MAP.md`: 按 auth/user/admin/gateway/payment 汇总路由、认证方式和 handler。
- `docs/analysis/PAYMENT_STATE_MACHINE.md`: 订单、webhook、查询补偿、履约、退款、审计日志状态流转。
- `docs/analysis/GATEWAY_REQUEST_FLOW.md`: 从 API Key 到账号调度、上游转发、用量记录、计费扣减的完整链路。
- `docs/analysis/DATA_MODEL_MAP.md`: Ent schema 之间的关系图和关键索引/迁移注意事项。
- `docs/product/PRODUCT_POSITIONING.md`: 面向部署者、API relay 运营者和终端用户的产品定位与套餐策略。
