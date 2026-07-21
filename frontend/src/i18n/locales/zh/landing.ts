export default {
  batchImageGuide: {
    title: '图片批量生成',
    description: '一次提交多条提示词，任务完成后可统一下载图片结果'
  },
  // Home Page
  home: {
    viewOnGithub: '在 GitHub 上查看',
    viewDocs: '查看文档',
    docs: '文档',
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式',
    dashboard: '控制台',
    login: '登录',
    getStarted: '立即开始',
    goToDashboard: '进入控制台',
    // 新增：面向用户的价值主张
    heroSubtitle: '一个密钥，畅用多个 AI 模型',
    heroDescription: '无需管理多个订阅账号，一站式接入 Claude、GPT、Gemini 等主流 AI 服务',
    tags: {
      subscriptionToApi: '订阅转 API',
      stickySession: '会话保持',
      realtimeBilling: '按量计费'
    },
    // 用户痛点区块
    painPoints: {
      title: '你是否也遇到这些问题？',
      items: {
        expensive: {
          title: '订阅费用高',
          desc: '每个 AI 服务都要单独订阅，每月支出越来越多'
        },
        complex: {
          title: '多账号难管理',
          desc: '不同平台的账号、密钥分散各处，管理起来很麻烦'
        },
        unstable: {
          title: '服务不稳定',
          desc: '单一账号容易触发限制，影响正常使用'
        },
        noControl: {
          title: '用量无法控制',
          desc: '不知道钱花在哪了，也无法限制团队成员的使用'
        }
      }
    },
    // 解决方案区块
    solutions: {
      title: '我们帮你解决',
      subtitle: '简单三步，开始省心使用 AI'
    },
    features: {
      unifiedGateway: '一键接入',
      unifiedGatewayDesc: '获取一个 API 密钥，即可调用所有已接入的 AI 模型，无需分别申请。',
      multiAccount: '稳定可靠',
      multiAccountDesc: '智能调度多个上游账号，自动切换和负载均衡，告别频繁报错。',
      balanceQuota: '用多少付多少',
      balanceQuotaDesc: '按实际使用量计费，支持设置配额上限，团队用量一目了然。'
    },
    // 优势对比
    comparison: {
      title: '为什么选择我们？',
      headers: {
        feature: '对比项',
        official: '官方订阅',
        us: '本平台'
      },
      items: {
        pricing: {
          feature: '付费方式',
          official: '固定月费，用不完也付',
          us: '按量付费，用多少付多少'
        },
        models: {
          feature: '模型选择',
          official: '单一服务商',
          us: '多模型随意切换'
        },
        management: {
          feature: '账号管理',
          official: '每个服务单独管理',
          us: '统一密钥，一站管理'
        },
        stability: {
          feature: '服务稳定性',
          official: '单账号易触发限制',
          us: '多账号池，自动切换'
        },
        control: {
          feature: '用量控制',
          official: '无法限制',
          us: '可设配额、查明细'
        }
      }
    },
    providers: {
      title: '已支持的 AI 模型',
      description: '一个 API，多种选择',
      supported: '已支持',
      soon: '即将推出',
      claude: 'Claude',
      gemini: 'Gemini',
      antigravity: 'Antigravity',
      more: '更多'
    },
    // CTA 区块
    cta: {
      title: '准备好开始了吗？',
      description: '注册即可获得免费试用额度，体验一站式 AI 服务',
      button: '免费注册'
    },
    enterprise: {
      nav: {
        models: '模型能力',
        workflow: '开通流程',
        pricing: '套餐价格',
        docs: '服务文档',
        keyUsage: '用量查询'
      },
      badge: '面向每个人、团队和企业的 AI 服务',
      headline: '让每个人都可以自由地享受 AI 服务',
      description: '把 GPT、Claude、Gemini 等顶级模型统一放到一个简单服务里，无论个人、团队还是企业，都可以更快开通、更清楚地查看费用，并在使用过程中获得支持。',
      primaryCta: '立即开通服务',
      secondaryCta: '查看服务介绍',
      metrics: {
        models: {
          title: '顶级模型聚合',
          desc: '覆盖 GPT、Claude、Gemini 等能力，一个服务入口即可使用。'
        },
        reliability: {
          title: '稳定服务体验',
          desc: '持续维护可用性、额度与服务状态，降低使用门槛。'
        },
        management: {
          title: '透明用量管理',
          desc: '费用、套餐、订单和使用情况清晰可查。'
        }
      },
      serviceBrief: {
        title: '平台能提供什么',
        subtitle: '面向个人、团队和企业，把模型能力、服务保障和使用管理整合为可持续使用的 AI 模型服务。',
        tag: '产品能力',
        sceneLabel: '模型能力',
        sceneValue: 'GPT、Claude、Gemini 等顶级模型统一使用',
        modelLabel: '使用场景',
        modelValue: '创作、研发、客服、自动化和 AI 产品接入',
        helpLabel: '服务保障',
        helpValue: '稳定性维护、用量记录、套餐管理和接入支持'
      },
      sectionLabel: {
        platform: '平台能力',
        models: '模型覆盖',
        workflow: '开通流程',
        trust: '长期服务'
      },
      capabilities: {
        title: '团队真正关心的是稳定、好管、有人支持',
        unified: {
          title: '统一服务入口',
          desc: '不用分别处理多个海外平台账号，团队从一个入口使用常用模型。'
        },
        governance: {
          title: '费用和用量清楚',
          desc: '充值、套餐、订单和使用情况集中查看，团队预算更容易管理。'
        },
        reliability: {
          title: '稳定可用',
          desc: '平台持续维护模型服务可用性，减少业务中断带来的影响。'
        },
        support: {
          title: '有人支持',
          desc: '从开通到日常使用问题，都可以获得持续协助。'
        }
      },
      models: {
        title: '覆盖团队常用 AI 模型场景',
        description: '适合 AI 产品、客服、内容生产、自动化流程和研发效率提升等场景。',
        ready: '可用',
        gptName: 'GPT 系列',
        claudeName: 'Claude',
        geminiName: 'Gemini',
        devName: '开发辅助',
        openai: '适合问答、写作、总结和知识库等常见产品场景。',
        claude: '适合长文档理解、复杂任务协作和高质量内容处理。',
        gemini: '适合多模态理解、内容生成和更丰富的业务场景。',
        codex: '适合研发团队做代码理解、文档整理和自动化辅助。'
      },
      flow: {
        title: '四步完成上线前准备',
        register: { title: '提交需求', desc: '说明团队规模、使用场景和希望优先使用的模型。' },
        plan: { title: '确认方案和费用', desc: '根据使用方式选择合适套餐或充值方式，费用提前说明。' },
        key: { title: '开通团队账号', desc: '为团队准备账号、额度和基础设置。' },
        call: { title: '接入并试用', desc: '完成试用和检查后，再逐步放到真实业务中使用。' }
      },
      trust: {
        title: '适合长期运营的团队服务',
        billing: '费用、套餐和订单可追踪',
        status: '服务状态和使用情况可查看',
        security: '成员登录和安全设置可管理'
      },
      finalCta: {
        title: '让 AI 模型服务更稳定地进入你的业务',
        description: '适合 AI 产品团队、自动化团队，以及需要稳定使用全球模型能力的企业客户。'
      }
    },

    footer: {
      allRightsReserved: '保留所有权利。'
    }
  },

  // Key Usage Query Page
  keyUsage: {
    title: 'API Key 用量查询',
    subtitle: '输入您的 API Key 以查看实时消费金额与使用状态',
    placeholder: 'sk-ant-mirror-xxxxxxxxxxxx',
    query: '查询',
    querying: '查询中...',
    privacyNote: '您的 Key 仅在浏览器本地处理，不会被存储',
    dateRange: '统计范围:',
    dateRangeToday: '今日',
    dateRange7d: '7 天',
    dateRange30d: '30 天',
    dateRange90d: '90 天',
    dateRangeCustom: '自定义',
    apply: '应用',
    used: '已使用',
    detailInfo: '详细信息',
    tokenStats: 'Token 统计',
    dailyDetail: '按日明细',
    modelStats: '模型用量统计',
    // Table headers
    date: '日期',
    model: '模型',
    requests: '请求数',
    inputTokens: '输入 Tokens',
    outputTokens: '输出 Tokens',
    cacheCreationTokens: '缓存创建',
    cacheReadTokens: '缓存读取',
    cacheWriteTokens: '缓存写入',
    totalTokens: '总 Tokens',
    cost: '费用',
    // Status
    quotaMode: 'Key 限额模式',
    walletBalance: '钱包余额',
    // Ring card titles
    totalQuota: '总额度',
    limit5h: '5 小时限额',
    limitDaily: '日限额',
    limit7d: '7 天限额',
    limitWeekly: '周限额',
    limitMonthly: '月限额',
    // Detail rows
    remainingQuota: '剩余额度',
    expiresAt: '过期时间',
    todayExpires: '(今日到期)',
    daysLeft: '({days} 天)',
    usedQuota: '已用额度',
    resetNow: '即将重置',
    subscriptionType: '订阅类型',
    subscriptionExpires: '订阅到期',
    // Usage stat cells
    todayRequests: '今日请求',
    todayInputTokens: '今日输入',
    todayOutputTokens: '今日输出',
    todayTokens: '今日 Tokens',
    todayCacheCreation: '今日缓存创建',
    todayCacheRead: '今日缓存读取',
    todayCost: '今日费用',
    rpmTpm: 'RPM / TPM',
    totalRequests: '累计请求',
    totalInputTokens: '累计输入',
    totalOutputTokens: '累计输出',
    totalTokensLabel: '累计 Tokens',
    totalCacheCreation: '累计缓存创建',
    totalCacheRead: '累计缓存读取',
    totalCost: '累计费用',
    avgDuration: '平均耗时',
    // Messages
    enterApiKey: '请输入 API Key',
    querySuccess: '查询成功',
    queryFailed: '查询失败',
    queryFailedRetry: '查询失败，请稍后重试',
    noDailyUsage: '暂无按日用量数据',
  },

  // Setup Wizard
  setup: {
    title: 'Sub2API 安装向导',
    description: '配置您的 Sub2API 实例',
    database: {
      title: '数据库配置',
      description: '连接到您的 PostgreSQL 数据库',
      host: '主机',
      port: '端口',
      username: '用户名',
      password: '密码',
      databaseName: '数据库名称',
      sslMode: 'SSL 模式',
      passwordPlaceholder: '密码',
      ssl: {
        disable: '禁用',
        require: '要求',
        verifyCa: '验证 CA',
        verifyFull: '完全验证'
      }
    },
    redis: {
      title: 'Redis 配置',
      description: '连接到您的 Redis 服务器',
      host: '主机',
      port: '端口',
      password: '密码（可选）',
      database: '数据库',
      passwordPlaceholder: '密码',
      enableTls: '启用 TLS',
      enableTlsHint: '连接 Redis 时使用 TLS（公共 CA 证书）'
    },
    admin: {
      title: '管理员账户',
      description: '创建您的管理员账户',
      email: '邮箱',
      password: '密码',
      confirmPassword: '确认密码',
      passwordPlaceholder: '至少 8 个字符',
      confirmPasswordPlaceholder: '确认密码',
      passwordMismatch: '密码不匹配'
    },
    ready: {
      title: '准备安装',
      description: '检查您的配置并完成安装',
      database: '数据库',
      redis: 'Redis',
      adminEmail: '管理员邮箱'
    },
    status: {
      testing: '测试中...',
      success: '连接成功',
      testConnection: '测试连接',
      installing: '安装中...',
      completeInstallation: '完成安装',
      completed: '安装完成！',
      redirecting: '正在跳转到登录页面...',
      restarting: '服务正在重启，请稍候...',
      timeout: '服务重启时间超出预期，请手动刷新页面。'
    }
  },

  // Common
}
