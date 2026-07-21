# api-product 差异化合并与上游同步计划

日期：2026-07-21

状态：代码实施完成，发布前环境验证待进行

目标版本：Sub2API `v0.1.162`

适用仓库：`dongruiyang2024/api-product`

上游仓库：`Wei-Shaw/sub2api`

## 1. 文档目的

本文用于指导 `api-product` 从当前定制版本安全同步到 Sub2API `v0.1.162`，并保留 oneAPI 的产品首页、品牌、登录入口和阿里云部署能力。

本文解决以下问题：

- 哪些定制需要保留、删除、改为配置或基于新版重新实现。
- 哪些文件会产生 Git 冲突，以及每个冲突应采用什么解决策略。
- 如何处理跨 29 个版本、50 个新增 SQL 迁移带来的数据库与部署风险。
- 如何拆分实施提交、执行回归、灰度上线和恢复。

本文包含方案与本次代码执行记录，但不授权直接更新生产环境。数据库迁移、预发布和生产发布仍必须在隔离环境验证后执行。

### 1.1 本次代码执行记录

执行分支：`codex/sync-upstream-v0.1.162`

恢复标签：`backup/pre-upstream-v0.1.162`

已完成：

- 通过标准 merge 纳入 `v0.1.162`，合并提交为 `a450a17b9`。
- 以上游新版结构处理 15 个文本冲突，并复核双方重叠文件；未恢复旧单文件语言包、旧静态资源永久缓存和 Updater 品牌替换。
- 将后端默认品牌集中到 `internal/branding`，持久化新安装实例的站点名称和副标题，并让邮件、TOTP、支付主题等路径优先使用系统设置。
- 将前端默认品牌集中到 `utils/branding.ts`，保留 oneAPI Logo、主题和企业首页。
- `LoginView` 与首页弹窗统一复用 `LoginPanel`；账户开通联系方式改为读取公开 `contact_info`，源码不再包含个人联系方式。
- 在新版 Dockerfile 上保留可选的 npm 与 Alpine 镜像参数；阿里云工作流改用不可变提交标签、版本化 Compose、显式安全配置检查和健康检查。
- 修复上游回滚 API 新增 15 分钟超时后遗留测试契约未同步的问题。

本地验证结果：

- `git merge-base --is-ancestor v0.1.162 HEAD`、`git diff --check`、冲突标记和个人联系方式扫描通过。
- 工作流 YAML、其中 3 段 Shell 和基础 Compose 配置静态校验通过。
- 前端 ESLint、TypeScript、生产构建通过。
- 前端全量测试通过：180 个测试文件、1238 项测试全部通过。
- 使用与 Dockerfile 一致的临时 Go 1.26.5 工具链完成 `go test ./...`；带 `unit` 标签的 `internal/service`、`internal/repository`、`internal/web`、`internal/setup` 也全部通过。
- 后端原生 arm64 二进制构建通过，产物约 134 MB；临时工具链、模块缓存和二进制均位于 `/private/tmp`，未进入仓库。
- Docker Desktop daemon 已启动；多次重试后已拉取 `docker/dockerfile:1.7`，但基础镜像 token/manifest 请求仍被 Docker Hub EOF 中断，尚未进入项目构建步骤。
- 工作流 YAML、其中 3 段 Shell、基础 Compose 配置、上游祖先关系、冲突标记和 `git diff --check` 静态校验通过。

仍需在发布前完成：

- 在网络可访问 Docker Hub 的 CI/预发布环境完成 amd64 镜像构建，并运行仓库配置的 `golangci-lint`。
- 使用生产数据副本演练 50 个新增迁移、备份恢复和回滚。
- 由发布负责人确认生产 `.env` 的 URL 安全默认值并执行预发布、灰度和观察。

## 2. 执行摘要

### 2.1 当前判断

这不是一次普通的小版本合并，而是一次跨多个发布版本的主线重新对齐：

- 当前项目提交：`b6d04167ff9db89e49630d779fbe33fac2dc8a81`。
- 当前项目版本：`0.1.133`。
- 上次同步上游的共同基线：`f18451e56f15b31ef602ab238037b56c3522b19f`。
- 共同基线时间：2026-05-29。
- 目标发布标签：`v0.1.162`，对应提交 `27f094e0960ebd8e52de7ff7e763c6fec2ff4057`。
- 分析时上游主线：`a978d56c7b03600101dd727446c2756c7f44f4c1`。
- `v0.1.162` 之后，上游主线另有 36 个提交。

当前项目相对共同基线有 15 个非合并定制提交。其最终树差异为：

- 86 个文件发生变化。
- 2055 行新增。
- 1396 行删除。
- 21 个后端文件。
- 60 个前端文件。
- 1 个 CI 文件。
- 2 个文档文件。
- 2 个其他文件。

上游从共同基线到分析时主线的变化为：

- 1724 个文件发生变化。
- 331124 行新增。
- 65120 行删除。
- 新增 50 个 SQL 数据库迁移。
- 服务版本从 `0.1.133` 演进到 `0.1.162`。

其中，本次第一阶段目标 `v0.1.162` 相对共同基线的准确变化为：

- 1707 个文件发生变化。
- 329123 行新增。
- 64672 行删除。
- 与当前项目定制同时修改的文件为 54 个。
- 三方合并产生 15 个明确冲突。

### 2.2 核心决策

采用以下总体策略：

1. 以已发布的 `v0.1.162` 作为第一阶段固定目标，不直接跟随浮动的 `upstream/main`。
2. 从当前 `main` 创建同步分支，通过一次标准 merge 保留双方历史。
3. 以上游新版代码为结构骨架，不机械保留全部旧补丁。
4. 删除已被上游覆盖或修正的本地实现。
5. 将散落的品牌硬编码收敛为配置或少量集中式扩展。
6. 首页与登录弹窗按新版认证能力重新移植，禁止继续复制一整份登录页实现。
7. 数据库迁移必须先在生产数据副本上验证；镜像回滚与数据库恢复作为两个不同动作管理。
8. `v0.1.162` 稳定上线后，再单独评估升级到后续发布标签；不在同一次合并中追逐上游新增提交。

### 2.3 成功标准

同步完成必须同时满足：

- 代码树包含 `v0.1.162` 的全部上游功能与安全修复。
- oneAPI 首页、Logo、主色、登录弹窗和账户开通联系方式可用。
- oneAPI 品牌不再依赖跨数十个文件替换 `Sub2API` 字符串。
- 前端恢复 `vue-tsc` 类型检查，构建不绕过类型错误。
- 新版 Dockerfile、Compose 配置和阿里云部署链路保持一致。
- 50 个新增 SQL 迁移在生产数据副本上成功执行。
- 全量自动化测试、关键业务回归和部署冒烟通过。
- 上线前具备可验证的数据库恢复方案，而不只是旧镜像。

## 3. 范围与非目标

### 3.1 本次范围

- 合并 Sub2API `v0.1.162`。
- 处理所有文本冲突和语义冲突。
- 重新移植 oneAPI 差异功能。
- 升级构建、数据库和部署配置。
- 补齐差异功能的测试。
- 建立预发布、灰度、回滚和恢复流程。

### 3.2 本次非目标

- 不同时重做支付、计费、调度等与合并无直接关系的业务。
- 不在同步分支中引入新的视觉设计方向。
- 不直接升级到浮动的上游 `main`。
- 不清理所有历史文档或一次性重命名整个项目。
- 不把生产数据迁移与代码合并放在同一个不可逆步骤中。
- 不通过全局搜索替换的方式再次硬编码 oneAPI 品牌。

## 4. 差异能力清单与处置决策

### 4.1 必须保留的业务差异

| 能力 | 当前实现 | 目标处置 | 验收重点 |
| --- | --- | --- | --- |
| oneAPI 产品首页 | `frontend/src/views/HomeView.vue` | 基于新版首页和安全工具重新移植 | 首页内容、响应式、文档链接、登录入口 |
| 首页登录弹窗 | `frontend/src/components/auth/LoginPanel.vue` | 抽取新版共享登录表单，首页弹窗和登录页复用 | 密码、OAuth、Turnstile、登录协议、TOTP、重定向 |
| 账户开通联系方式 | `LoginPanel.vue` 中硬编码微信号 | 复用新版公开站点设置 `contact_info` | 管理端可配置、前端无硬编码、空值时不显示 |
| oneAPI Logo | `frontend/public/logo.svg` | 保留视觉资产，适配新版 Logo/Favicon 注入和 URL 清洗 | 首屏、浏览器标签、深浅色背景、缓存刷新 |
| oneAPI 主色与圆角 | `style.css`、`tailwind.config.js` | 收敛为品牌 token 或独立样式层 | 不覆盖上游新版暗色修复和组件可访问性 |
| 阿里云自动部署 | `.github/workflows/deploy.yml` | 保留并升级为版本化镜像与配置发布 | GHCR、SSH 重试、Compose 配置同步、健康检查 |
| 国内依赖镜像 | `Dockerfile` | 以新版 Dockerfile 为基础保留可选镜像参数 | 默认可用、国内环境可覆盖、不破坏 BuildKit 缓存 |

### 4.2 应删除的旧补丁

| 旧补丁 | 删除原因 | 上游替代 |
| --- | --- | --- |
| 本地静态资源永久缓存实现 | 会把 Logo、Favicon 等非指纹文件也设为 immutable，资源更新后可能长期不刷新 | 上游已实现仅对指纹资源启用长期缓存，并补充测试 |
| `Sub2API-Updater` 改为 `oneAPI-Updater` | User-Agent 不是用户可见品牌，保留只会制造无价值冲突 | 接受上游实现 |
| 各服务中的 `Sub2API` fallback 全量替换 | 新版多数路径读取 `site_name`，散落硬编码会持续与上游冲突 | 以持久化系统设置和集中式默认值为准 |
| 在 `frontend/package.json` 中移除 `vue-tsc` | 会隐藏类型错误，降低构建可信度 | 恢复 `vue-tsc -b && vite build` |
| 继续维护旧的 `zh.ts`、`en.ts` 单文件语言包 | 上游已拆分语言包，保留旧文件会造成 modify/delete 冲突 | 将差异键迁入新版模块 |

### 4.3 应改为配置的差异

以下内容不应继续散落在代码中：

- 站点名称 `oneAPI`。
- 站点 Logo。
- 站点副标题。
- 账户开通联系方式。
- 文档地址。
- 首页自定义内容或首页模式。
- 支付订单的品牌前缀。
- 邮件显示名称。

优先使用现有系统设置：

- `site_name`
- `site_logo`
- `site_subtitle`
- `doc_url`
- `home_content`

目标版本已包含持久化设置 `contact_info`，并通过公开设置接口返回。此次直接复用该字段，不新增数据库迁移：

- 管理员在站点设置中维护联系方式。
- `LoginPanel` 只读取公开设置，去除首尾空白后展示。
- 空值、后端模式或组件显式关闭展示时不渲染入口。
- 源码不再保存个人微信号。

如果后续需要多渠道联系卡片，可再把单一文本升级为以下结构化字段：

```text
account_contact_enabled
account_contact_label
account_contact_value
account_contact_url
```

若本次不希望扩展数据库，可退而使用明确的构建或部署变量，但必须做到：

- 不把具体个人联系方式提交到公开源码。
- 空配置时不渲染入口。
- 前端只消费公开配置，不读取服务端秘密环境变量。

## 5. Git 合并策略

### 5.1 推荐分支模型

在开始前确认当前 `main` 与 `origin/main` 一致，工作区无未提交文件。建议执行：

```bash
git fetch upstream --tags
git switch main
git pull --ff-only origin main
git tag backup/pre-upstream-v0.1.162
git switch -c codex/sync-upstream-v0.1.162
git merge --no-ff --no-commit v0.1.162
```

说明：

- `backup/pre-upstream-v0.1.162` 只是代码恢复点，不替代数据库备份。
- 使用 merge 而不是把已发布的定制提交全部 rebase，避免重写公共历史。
- 使用 `--no-commit`，先完成冲突和语义审计，再生成明确的合并提交。
- 不建议逐个 cherry-pick 15 个旧提交，因为其中包含已经失效、已被上游覆盖和应重构的实现。

### 5.2 提交拆分建议

由于 Git merge 的冲突解决会形成一个合并提交，建议在 merge 后继续用独立提交完成重构与补强：

1. `merge: sync upstream v0.1.162`
2. `refactor(branding): centralize oneAPI public branding settings`
3. `feat(frontend): port oneAPI landing page to modular locales`
4. `refactor(auth): share login form between page and home modal`
5. `build: adapt upstream Dockerfile for configurable domestic mirrors`
6. `ci: align Aliyun deployment with versioned image and compose config`
7. `test: cover branded landing and modal login flows`

如果冲突解决本身无法在一个可审查提交中解释，可以先提交纯上游合并结果，再用后续提交恢复差异功能。每个提交必须保持可构建或在提交说明中明确暂时不可构建的原因与后续提交边界。

## 6. 明确冲突文件处置矩阵

对 `v0.1.162` 的三方合并预演得到 15 个明确冲突。处理策略如下。

| 冲突文件 | 冲突类型 | 目标处置 | 禁止做法 | 验证方式 |
| --- | --- | --- | --- | --- |
| `Dockerfile` | 内容冲突 | 采用上游多阶段构建主体，再补可选国内镜像参数 | 直接选择本地旧版本 | amd64 镜像构建、无镜像参数构建、国内参数构建 |
| `backend/internal/repository/github_release_service.go` | 内容冲突 | 接受上游；不保留 User-Agent 品牌替换 | 仅为品牌选择本地版本 | 更新检查单测 |
| `backend/internal/service/setting_service.go` | 内容冲突 | 接受上游重构，再在新版设置模块集中处理品牌默认值 | 把旧文件整段复制回去 | 公共设置、初始化设置、后台保存测试 |
| `backend/internal/web/embed_on.go` | 内容冲突 | 接受上游的安全注入、路由绕过和缓存逻辑 | 保留旧的 `logo.svg/logo.png` 永久缓存 | embed 测试、Logo 更新、API 路由不被 SPA 截获 |
| `backend/internal/web/embed_test.go` | 内容冲突 | 采用上游测试并补 oneAPI Logo/标题用例 | 仅解决编译不校验行为 | `go test ./internal/web` |
| `frontend/public/logo.svg` | add/add | 保留 oneAPI 资产，确认尺寸、可访问性和 Favicon 注入 | 不审查直接选择任一版本 | 首页、首屏、浏览器标签、缓存刷新 |
| `frontend/src/components/layout/AppHeader.vue` | 内容冲突 | 采用上游结构和安全处理，保留配置化 Logo/品牌 | 复制旧组件覆盖新版 | 导航、Logo、移动端、深浅色 |
| `frontend/src/components/layout/AppSidebar.vue` | 内容冲突 | 采用上游导航结构，保留站点名展示 | 固定字符串替换 | 管理端、用户端、权限菜单 |
| `frontend/src/i18n/locales/en.ts` | modify/delete | 接受删除，把差异键迁到新版 `en/*` 模块 | 恢复旧单文件 | locale 编译和键冲突测试 |
| `frontend/src/i18n/locales/zh.ts` | modify/delete | 接受删除，把差异键迁到新版 `zh/*` 模块 | 恢复旧单文件 | locale 编译和键冲突测试 |
| `frontend/src/router/index.ts` | 内容冲突 | 采用上游路由与权限守卫，核对 `/home`、登录重定向 | 只保留旧路由表 | 路由、权限、微信回调、标题测试 |
| `frontend/src/views/HomeView.vue` | 内容冲突 | 以新版安全 URL、配置注入为基础重建 oneAPI 首页 | 选择本地旧文件覆盖上游 | 首页单测、XSS/URL 清洗、移动端、登录弹窗 |
| `frontend/src/views/KeyUsageView.vue` | 内容冲突 | 优先接受上游，品牌从 `site_name` 获取 | 固定 `oneAPI` fallback 到页面 | Key 查询、站点名、响应式 |
| `frontend/src/views/auth/LoginView.vue` | 内容冲突 | 采用上游登录页，并抽取共享登录表单 | 继续维护 LoginView 与 LoginPanel 两份 500 行逻辑 | 密码、OAuth、Turnstile、协议、TOTP |
| `frontend/src/views/public/LegalDocumentView.vue` | 内容冲突 | 采用上游文档加载与 URL 安全逻辑，品牌读取设置 | 恢复旧版硬编码 | 法律文档、站点名、非法 URL |

## 7. 无文本冲突但必须语义审查的区域

Git 自动合并成功不代表业务正确。以下重叠区域必须逐文件审查：

### 7.1 认证与登录

- `frontend/src/components/auth/*OAuthSection.vue`
- `frontend/src/views/auth/EmailVerifyView.vue`
- `frontend/src/views/auth/RegisterView.vue`
- `backend/internal/service/auth_*.go`
- `backend/internal/service/totp_service.go`

重点确认：

- OAuth 是否保留正确的 `redirectTo`。
- 首页弹窗登录后是否回到预期页面。
- Turnstile、登录协议和 TOTP 是否与新版一致。
- 注册关闭时是否显示配置化联系方式。
- 不出现绕过协议确认、风控或二次验证的独立登录路径。

### 7.2 品牌与公开设置

- `frontend/src/stores/app.ts`
- `frontend/src/router/title.ts`
- `frontend/src/main.ts`
- `frontend/index.html`
- `backend/internal/service/setting_*`

重点确认：

- 服务端注入的 `site_name`、`site_logo` 在 Vue 启动前即可生效，避免品牌闪烁。
- `site_logo`、`doc_url` 使用新版 URL 清洗函数。
- 站点名进入 HTML 时经过转义，不能形成注入。
- 数据库已有 `oneAPI` 设置时升级后保持不变。
- 新安装实例如何获得 oneAPI 默认值有明确方案。

### 7.3 支付、邮件与通知

- `backend/internal/service/payment_order.go`
- `backend/internal/service/balance_notify_service.go`
- `backend/internal/service/notification_email_service.go`
- `backend/internal/service/content_moderation.go`

重点确认：

- 邮件与通知优先使用 `site_name`。
- 支付商品名称是否需要 oneAPI 前缀，应由产品设置决定。
- 无设置时的 fallback 是否会直接暴露 Sub2API 品牌。
- 不为品牌目的覆盖上游新增的计费、审计或安全逻辑。

### 7.4 全局样式

- `frontend/src/style.css`
- `frontend/tailwind.config.js`
- `frontend/src/styles/onboarding.css`

重点确认：

- 主色变更不覆盖上游新增的暗色 slate 调整。
- 全局圆角变化不会破坏移动端、弹窗和数据表。
- 尽量新增 `brand` token，避免反复修改基础组件规则。
- 对比登录、设置、支付、表格、弹窗和 Toast 等高频界面。

## 8. 分阶段实施计划

### 阶段 0：冻结与证据留存

目标：在任何合并前得到可复现基线。

任务：

- 确认 `main` 与 `origin/main` 一致。
- 记录当前镜像 digest、部署提交和运行版本。
- 导出生产 `.env`、Compose 文件和反向代理配置，安全保存且不提交仓库。
- 备份 PostgreSQL、Redis 和应用数据目录。
- 记录当前公开设置，至少包括站点名、Logo、文档地址、支付设置、OAuth、邮件和安全设置。
- 对现网关键流程保存截图或自动化基线。
- 建立代码恢复标签和同步分支。

退出条件：

- 可以从备份恢复一套隔离环境。
- 可以定位当前生产镜像和代码提交。
- 工作区干净，差异证据已归档。

### 阶段 1：合并上游发布版

目标：把 `v0.1.162` 完整引入同步分支。

任务：

- 获取上游标签。
- 执行 `--no-commit` merge。
- 按第 6 节处理 15 个冲突。
- 对 54 个双方都修改过的文件执行语义审查。
- 确认旧的 `zh.ts`、`en.ts` 不再存在。
- 确认本地静态缓存补丁未覆盖上游修复。
- 确认 `frontend/package.json` 恢复带 `vue-tsc` 的 build。

退出条件：

- `git diff --check` 通过。
- 无冲突标记和未合并文件。
- 上游标签是合并提交的祖先。
- 基础前后端可以编译；若暂时失败，失败仅来自尚未移植的 oneAPI 定制并已记录。

### 阶段 2：收敛品牌配置

目标：从跨文件硬编码转向可维护的配置。

任务：

- 清点现有数据库中 `site_name`、`site_logo`、`site_subtitle`、`doc_url`。
- 决定新安装实例的 oneAPI 默认品牌来源。
- 新增账户开通联系方式的公开配置，或确定受控的部署配置方案。
- 删除不必要的后端 fallback 字符串替换。
- 统一站点名、Logo、支付显示名、邮件名的读取优先级。
- 添加 HTML 转义、URL 清洗和空配置测试。

推荐优先级：

```text
管理员持久化设置 > 明确部署默认值 > 上游内置默认值
```

退出条件：

- 源码不包含具体个人微信号。
- 日常换 Logo、站点名、联系方式不需要重新构建镜像。
- 现有数据库升级后仍显示 oneAPI。
- 新安装行为有测试和文档。

### 阶段 3：重新移植首页与登录弹窗

目标：保留 oneAPI 产品体验，同时继承新版认证安全能力。

任务：

- 以新版 `LoginView.vue` 为准抽取共享登录表单组件。
- 登录页使用共享组件并保留 `AuthLayout`。
- 首页弹窗复用同一共享组件，不复制业务逻辑。
- 统一登录成功、OAuth 回调、TOTP 和 redirect 行为。
- 将 `home.enterprise.*` 迁入新版 `zh/landing.ts` 和 `en/landing.ts`。
- 将账户联系方式文案迁入正确语言模块。
- 在首页使用新版 `sanitizeUrl` 处理 Logo 和文档地址。
- 修复弹窗焦点、Esc 关闭、滚动锁定和可访问性。

退出条件：

- LoginView 与首页弹窗不存在两份独立登录状态机。
- 所有登录方式通过同一套认证、协议和风控逻辑。
- 首页中英文键完整，无重复键和编译错误。
- 桌面端与移动端均通过回归。

### 阶段 4：构建与部署适配

目标：使用新版构建链路，同时保留国内网络和阿里云部署能力。

任务：

- 以新版 Dockerfile 为基础。
- 保留 `NPM_CONFIG_REGISTRY` 可选参数。
- 如仍需要 Alpine 国内镜像，新增单一可选参数，不改变默认上游行为。
- GitHub Actions 变量 `NPM_CONFIG_REGISTRY` 应填写完整 registry URL；`ALPINE_MIRROR` 应填写完整 Alpine 仓库基址，例如 `https://mirrors.aliyun.com/alpine`。变量留空时继续使用上游默认源。
- 保留 BuildKit pnpm、Go module 和 Go build 缓存。
- 保留 `TARGETOS`、`TARGETARCH` 跨架构构建。
- 保留 `docs/legal` 构建上下文。
- CI 镜像版本改为具体版本和提交，不再使用含义模糊的 `VERSION=main`。
- 让部署流程同步版本化 Compose 配置，或明确 Compose 由另一套基础设施流程维护。
- 发布后增加 `/health` 检查、容器状态检查和关键日志检查。

建议镜像标签：

```text
ghcr.io/dongruiyang2024/api-product:0.1.162-oneapi.<short-sha>
ghcr.io/dongruiyang2024/api-product:<full-sha>
```

退出条件：

- 本地和 CI 都能构建 `linux/amd64` 镜像。
- 不设置国内镜像参数时仍能使用官方默认源。
- 服务器 Compose 与镜像所需环境变量一致。
- 部署失败不会删除旧镜像或数据库备份。

### 阶段 5：数据库迁移演练

目标：在生产数据副本上证明迁移可执行且业务数据不丢失。

任务：

- 恢复最近生产备份到隔离 PostgreSQL。
- 使用与生产一致的 Redis、对象存储和数据目录配置启动目标镜像。
- 执行全部待应用迁移。
- 检查 `schema_migrations` 文件名和 checksum。
- 重点检查新增或变化的用户、分组、订阅、用量、审计、批量生图、提示词审计相关表。
- 对核心表执行迁移前后行数与关键约束抽样。
- 记录迁移耗时、锁等待、磁盘增长和启动时间。
- 进行一次从备份恢复回旧版本环境的演练。

退出条件：

- 50 个新增 SQL 迁移全部成功或按迁移框架规则正确记录。
- 无 checksum 不一致。
- 无长时间阻塞生产级表的未评估迁移。
- 数据抽样一致。
- 恢复演练成功并记录耗时。

### 阶段 6：测试与验收

目标：证明上游功能和 oneAPI 差异都可用。

任务详见第 11 节。

退出条件：

- 静态检查、前端测试、后端测试、镜像构建全部通过。
- 差异功能验收通过。
- 迁移后预发布环境稳定运行至少一个完整业务观察窗口。
- 无未解释的错误率、计费或用量差异。

### 阶段 7：灰度发布与观察

目标：以可控方式替换生产版本。

任务：

- 冻结发布窗口内的数据库结构和关键后台配置变更。
- 再次执行发布前数据库、Redis 和配置备份。
- 固定目标镜像 digest，不使用浮动标签作为唯一依据。
- 先在单实例或低流量实例灰度。
- 检查迁移、健康、登录、网关请求、计费和异步任务。
- 再扩大流量或替换剩余实例。
- 保留旧镜像和备份，直到观察窗口结束。

退出条件：

- 关键 API 成功率、首 Token 延迟、错误分类、用量与计费无异常。
- 登录、支付、后台和定时任务无回归。
- 无新增数据库错误、迁移错误和 Redis 兼容错误。
- 发布负责人明确确认完成。

## 9. 数据库与数据安全计划

### 9.1 风险说明

从 `0.1.133` 到 `0.1.162` 新增 50 个 SQL 迁移，涉及：

- 调度索引与 outbox。
- 用户平台额度。
- 批量生图任务与计费。
- Grok 视频和渠道能力。
- 用量日志、长上下文和图片输入计费。
- 审计日志和提示词审计。
- 认证缓存失效 outbox。

这些迁移是前向迁移。旧镜像可能无法理解迁移后的表、列、约束和业务数据。任何“回滚”计划如果只包含重新启动旧镜像，均视为不完整。

### 9.2 必备备份

- PostgreSQL 一致性备份，建议同时保留自定义格式和校验结果。
- Redis RDB/AOF 或与部署方式匹配的持久化快照。
- 应用 `data` 目录。
- 对象存储配置和必要的对象清单。
- `.env`、Compose、反向代理和证书引用配置。
- 当前镜像 digest。

备份文件不得提交 Git，也不得出现在 CI 日志中。

### 9.3 迁移验证指标

- 应用迁移总耗时。
- 单条迁移最大耗时。
- 数据库锁等待。
- 数据库体积变化。
- 启动就绪时间。
- 核心表行数变化。
- `schema_migrations` 条目与 checksum。
- 迁移后后台列表、统计和网关读写是否正常。

## 10. 配置与安全差异

新版部署配置引入或调整了以下选项：

- `REDIS_USERNAME`
- `SETUP_MIGRATION_TIMEOUT_SECONDS`
- `ENABLE_SERVER_TIMING`
- `UPDATE_GITHUB_TOKEN`
- PostgreSQL 调优参数
- 图片非流式 keepalive
- OpenAI compact model

必须特别审查两个默认值变化：

```env
SECURITY_URL_ALLOWLIST_ALLOW_INSECURE_HTTP=true
SECURITY_URL_ALLOWLIST_ALLOW_PRIVATE_HOSTS=true
```

当前项目原有部署默认更严格。生产环境应根据真实网络拓扑显式设置，不允许依赖升级后的默认值。若业务不要求 HTTP 上游或私网主机，建议保持：

```env
SECURITY_URL_ALLOWLIST_ALLOW_INSECURE_HTTP=false
SECURITY_URL_ALLOWLIST_ALLOW_PRIVATE_HOSTS=false
```

同时检查：

- `trusted_proxies` 与客户端 IP 请求头配置。
- 反向代理是否只信任明确代理网段。
- Redis 使用 ACL 时用户名与密码是否同时下发。
- GitHub update token 是否只用于 API 检查，不泄漏到资产下载或日志。
- `SERVER_MODE`、`RUN_MODE`、JWT、TOTP 和加密密钥是否保持原值。

## 11. 测试与验收矩阵

### 11.1 静态检查与构建

```bash
git diff --check

pnpm --dir frontend install --frozen-lockfile
pnpm --dir frontend run lint:check
pnpm --dir frontend run typecheck
pnpm --dir frontend run test:run
pnpm --dir frontend run build

make -C backend test
make -C backend build
make test-datamanagementd
make secret-scan

docker build --platform linux/amd64 \
  --build-arg VERSION=0.1.162-oneapi.local \
  -t api-product:0.1.162-oneapi-local .
```

禁止把 `vue-tsc` 从 build 中移除来绕过失败。类型错误必须修复或以明确的上游问题记录。

### 11.2 前端差异功能

- 首页默认内容正常显示。
- `home_content` 为 HTML 或 URL 时仍按新版规则生效。
- Logo、站点名、文档链接均来自配置。
- 非法 Logo/文档 URL 被拒绝或清洗。
- 首页登录弹窗支持键盘、焦点管理、Esc 和遮罩关闭。
- 密码登录、全部启用的 OAuth、Turnstile、登录协议和 TOTP 正常。
- 注册关闭时显示配置化联系方式。
- 中文和英文首页无缺失键、重复键或退回原始 key。
- 桌面端、平板和移动端布局正常。
- 深色模式下 Logo、文字和表单可读。

### 11.3 后端与网关

- `/health`。
- 管理员登录和用户登录。
- API Key 创建、编辑、删除、权限与 IP 限制。
- OpenAI Chat Completions、Responses、Models、Images。
- Anthropic Messages、count_tokens。
- Gemini 原生入口。
- 流式和非流式请求。
- 上游失败后的账号切换。
- 用量日志、缓存 Token、图片 Token、计费和余额扣减。
- 调度、配额、暂停和恢复。
- 更新检查。
- 静态资源缓存只作用于指纹资源。
- `/models`、`/responses`、`/images`、`/videos` 等 API 路由不被前端 SPA 接管。

### 11.4 支付与通知

- 套餐、订单、支付回调和履约。
- 支付商品名和站点品牌。
- 邮箱验证码、密码重置、余额、订阅和风控通知。
- 邮件模板中的 `site_name`。
- 支付与通知失败不会因品牌配置为空而 panic。

### 11.5 部署冒烟

- GHCR 登录、构建、推送。
- 阿里云 SSH 密钥解析。
- SSH 重试和失败码传播。
- Compose 拉取精确镜像。
- 数据库迁移完成后服务才进入健康状态。
- `docker compose ps` 状态正常。
- 新旧镜像、Compose 和 `.env` 可追踪。
- 发布日志不输出密钥、Token 或完整 `.env`。

## 12. 上线观察指标

发布前记录旧版本基线，发布后至少比较：

- HTTP 总请求量与 2xx/4xx/5xx 比例。
- OpenAI、Anthropic、Gemini 各协议成功率。
- 首 Token 延迟和总耗时。
- 并发获取失败、无可用账号、配额和限流错误。
- usage log 写入量和计费金额。
- Redis 错误、数据库连接和慢查询。
- 登录失败率、OAuth 回调失败率和 TOTP 失败率。
- 支付回调、履约和通知队列失败。
- 容器重启次数、内存和 CPU。
- 后台异步 flusher、outbox 和定时任务积压。

出现以下任一情况应停止扩大发布：

- 核心协议成功率明显低于基线。
- 用量或计费出现不可解释偏差。
- 数据库迁移失败或 checksum 不一致。
- 登录、支付或管理员入口不可用。
- 持续出现数据写入失败、重复扣费或重复履约。
- 回滚/恢复条件尚未满足。

## 13. 回滚与恢复边界

### 13.1 仅应用层回滚

仅当以下条件全部满足时，可以只切回旧镜像：

- 数据库迁移尚未开始，或已证明迁移对旧版本完全兼容。
- 新版本没有写入旧版本无法解释的新字段或新状态。
- Compose 和环境变量仍兼容旧镜像。

动作：

- 将服务指向发布前记录的旧镜像 digest。
- 恢复旧 Compose 配置。
- 检查健康、登录、网关与计费。

### 13.2 数据库恢复

一旦新迁移已执行并产生新数据，默认采用数据库恢复流程：

1. 停止写流量和后台任务。
2. 保留故障现场与日志。
3. 恢复发布前 PostgreSQL 备份。
4. 按需要恢复 Redis 与应用数据。
5. 恢复旧 Compose、`.env` 和旧镜像 digest。
6. 验证 schema、核心表、登录、网关、计费和支付。
7. 经负责人确认后恢复流量。

回滚会丢失备份时间点之后的新写入。发布窗口应提前决定是否允许短暂停写，以及如何处理窗口内订单、余额、用量和通知数据。

## 14. 风险登记表

| 风险 | 概率 | 影响 | 控制措施 | 阻断上线条件 |
| --- | --- | --- | --- | --- |
| 旧 LoginPanel 漏掉新版认证逻辑 | 高 | 高 | 抽取共享登录表单，完整认证回归 | 两套登录状态机仍独立存在 |
| 50 个 SQL 迁移导致锁或不可逆数据变化 | 中 | 高 | 生产副本演练、记录耗时、备份恢复 | 未完成恢复演练 |
| Compose 未同步导致新镜像和配置不匹配 | 高 | 高 | 版本化 Compose 或独立 IaC 发布 | 服务器配置版本不可追踪 |
| 品牌硬编码在上游更新中反复冲突 | 高 | 中 | 收敛为设置和品牌 token | 仍跨大量文件替换字符串 |
| Logo 被 immutable 缓存 | 中 | 中 | 接受上游指纹缓存实现 | 非指纹 Logo 仍为永久缓存 |
| 跳过 TypeScript 类型错误 | 高 | 中 | 恢复 `vue-tsc`，CI 阻断 | build 不含类型检查 |
| 安全配置默认值变宽松 | 中 | 高 | `.env` 显式固定并审查 | 生产安全值未确认 |
| `VERSION=main` 无法追踪运行版本 | 高 | 中 | 使用语义版本加提交、记录 digest | 运行版本无法映射提交 |
| 联系方式泄漏或难以维护 | 高 | 中 | 移出源码，使用公开配置 | 源码仍含具体个人联系方式 |
| 自动合并掩盖语义冲突 | 高 | 高 | 审查 54 个重叠文件和业务矩阵 | 只处理 15 个文本冲突 |

## 15. 交付物

实施完成应至少产生：

- 一个包含 `v0.1.162` 的上游合并提交。
- 一组按职责拆分的 oneAPI 差异提交。
- 新版模块化 i18n 文案。
- 共享登录表单及首页弹窗测试。
- 集中式品牌和账户联系方式配置。
- 适配新版的 Dockerfile 与阿里云部署工作流。
- 配置差异说明和生产 `.env` 检查清单。
- 数据库迁移演练记录。
- 自动化测试结果。
- 灰度发布记录与观察结论。
- 回滚/恢复演练记录。

## 16. 完成定义

只有全部满足以下条件，才能将上游同步标记为完成：

- [x] `v0.1.162` 是当前分支祖先。
- [x] 无未解决冲突、冲突标记和 `git diff --check` 错误。
- [x] 15 个明确冲突均按矩阵处理并审查。
- [x] 54 个重叠文件完成语义审查。
- [x] 静态资源缓存采用上游指纹资源策略。
- [x] 品牌和联系方式不再大范围硬编码。
- [x] LoginView 与首页弹窗共享认证核心。
- [x] 旧的单文件语言包未被恢复。
- [x] `vue-tsc` 类型检查已恢复并通过。
- [x] 前端 lint、typecheck、测试和 build 通过。
- [x] 后端全量测试和 build 通过。
- [ ] 后端 `golangci-lint` 通过。
- [ ] Docker amd64 镜像构建通过。
- [ ] 生产数据副本完成全部迁移。
- [ ] 数据库恢复演练通过。
- [ ] 安全默认值已由发布负责人确认。
- [ ] 预发布业务回归通过。
- [ ] 灰度指标无异常。
- [ ] 旧镜像、数据库备份和配置备份仍可用。

## 17. 后续版本策略

完成 `v0.1.162` 同步后，建议把上游同步改为持续维护工作：

- 每个上游发布标签在 3 至 7 天内完成差异评估。
- 品牌、首页和部署定制保持少量、边界清晰的提交。
- 每次上游同步都运行三方合并预演和重叠文件清单。
- 不长期维护复制自上游的大型组件。
- 不跟随浮动 `main` 直接部署生产。
- 对必须提前采用的主线修复，固定具体提交并记录原因，待正式标签发布后重新对齐。
- 定期检查 `upstream` 远端只用于拉取，避免误推送到原项目。

通过以上约束，后续同步应从当前的“大版本追赶”降低为小批量、可审查、可回滚的常规维护。

## 18. 差异证据复现

在已获取 `origin/main`、`upstream` 标签和当前 fork 分支的仓库中，可以使用以下只读命令复现本文核心数字：

```bash
# 共同基线
git merge-base fork/main v0.1.162

# 双方提交数量
git rev-list --left-right --count fork/main...v0.1.162

# 当前定制最终树差异
git diff --shortstat f18451e5..fork/main
git diff --name-status f18451e5..fork/main

# 目标发布版差异
git diff --shortstat f18451e5..v0.1.162

# 双方同时修改的文件
comm -12 \
  <(git diff --name-only f18451e5..fork/main | sort) \
  <(git diff --name-only f18451e5..v0.1.162 | sort)

# 不修改工作区的三方合并预演
git merge-tree --write-tree --messages fork/main v0.1.162

# 新增 SQL 迁移数量
git diff --name-only --diff-filter=A \
  f18451e5..v0.1.162 -- backend/migrations \
  | rg '\\.sql$' \
  | wc -l
```

其中 `fork/main` 是在临时分析仓库中为 `dongruiyang2024/api-product` 当前主线设置的远端引用。直接在本仓库复现时，可把 `fork/main` 替换为当前 `main` 或 `origin/main`。
