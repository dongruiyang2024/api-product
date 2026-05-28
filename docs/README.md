# api-product / Sub2API Docs

这个目录作为 api-product 项目的产品、集成和代码分析文档入口。当前代码仓库实际项目名是 Sub2API，是一个面向 AI API 中转、订阅额度分发、计费和管理后台的网关平台。

## 文档索引

- [项目代码总览](analysis/PROJECT_CODEBASE_OVERVIEW.md)
- [Payment Guide](PAYMENT.md)
- [支付配置指南](PAYMENT_CN.md)
- [Admin Payment Integration API](ADMIN_PAYMENT_INTEGRATION_API.md)

## 文档放置规则

- `analysis/`: 代码走读、架构判断、产品分析、模块关系和后续改造建议。
- `PAYMENT*.md`: 支付配置、支付提供商、订单和充值相关说明。
- `ADMIN_*`: 管理端或外部系统对接 API 文档。

后续如果继续补产品规划，建议新增 `docs/product/`；如果补运维部署专题，建议新增 `docs/ops/`，避免和支付集成文档混在一起。

## 维护约定

- 代码现状分析放在 `analysis/`，需求共识或产品策略放在未来的 `product/`。
- 涉及支付、认证、计费、网关转发和风控的文档，需要写清楚入口、权限、状态流转和失败重试语义。
- 文档引用代码时优先标出目录或关键文件，避免只写抽象模块名。
