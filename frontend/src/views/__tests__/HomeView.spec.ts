import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import HomeView from '../HomeView.vue'

const { checkAuth, fetchPublicSettings } = vi.hoisted(() => ({
  checkAuth: vi.fn(),
  fetchPublicSettings: vi.fn(),
}))

const messages: Record<string, string> = {
  'home.docs': '文档',
  'home.switchToLight': '切换到浅色模式',
  'home.switchToDark': '切换到深色模式',
  'home.dashboard': '控制台',
  'home.login': '登录',
  'home.enterprise.nav.models': '模型能力',
  'home.enterprise.nav.workflow': '开通流程',
  'home.enterprise.nav.pricing': '套餐价格',
  'home.enterprise.nav.docs': '服务文档',
  'home.enterprise.nav.keyUsage': '用量查询',
  'home.enterprise.badge': '面向每个人、团队和企业的 AI 服务',
  'home.enterprise.headline': '让每个人都可以自由地享受 AI 服务',
  'home.enterprise.description': '把 GPT、Claude、Gemini 等顶级模型统一放到一个简单服务里，无论个人、团队还是企业，都可以更快开通、更清楚地查看费用，并在使用过程中获得支持。',
  'home.enterprise.primaryCta': '立即开通服务',
  'home.enterprise.secondaryCta': '查看服务介绍',
  'home.enterprise.metrics.models.title': '顶级模型聚合',
  'home.enterprise.metrics.models.desc': '覆盖 GPT、Claude、Gemini 等能力，一个服务入口即可使用。',
  'home.enterprise.metrics.reliability.title': '稳定服务体验',
  'home.enterprise.metrics.reliability.desc': '持续维护可用性、额度与服务状态，降低使用门槛。',
  'home.enterprise.metrics.management.title': '透明用量管理',
  'home.enterprise.metrics.management.desc': '费用、套餐、订单和使用情况清晰可查。',
  'home.enterprise.serviceBrief.title': '平台能提供什么',
  'home.enterprise.serviceBrief.subtitle': '面向个人、团队和企业，把模型能力、服务保障和使用管理整合为可持续使用的 AI 模型服务。',
  'home.enterprise.serviceBrief.tag': '产品能力',
  'home.enterprise.serviceBrief.sceneLabel': '模型能力',
  'home.enterprise.serviceBrief.sceneValue': 'GPT、Claude、Gemini 等顶级模型统一使用',
  'home.enterprise.serviceBrief.modelLabel': '使用场景',
  'home.enterprise.serviceBrief.modelValue': '创作、研发、客服、自动化和 AI 产品接入',
  'home.enterprise.serviceBrief.helpLabel': '服务保障',
  'home.enterprise.serviceBrief.helpValue': '稳定性维护、用量记录、套餐管理和接入支持',
  'home.enterprise.sectionLabel.platform': '平台能力',
  'home.enterprise.sectionLabel.models': '模型覆盖',
  'home.enterprise.sectionLabel.workflow': '开通流程',
  'home.enterprise.sectionLabel.trust': '长期服务',
  'home.enterprise.capabilities.title': '团队真正关心的是稳定、好管、有人支持',
  'home.enterprise.capabilities.unified.title': '统一服务入口',
  'home.enterprise.capabilities.unified.desc': '不用分别处理多个海外平台账号，团队从一个入口使用常用模型。',
  'home.enterprise.capabilities.governance.title': '费用和用量清楚',
  'home.enterprise.capabilities.governance.desc': '充值、套餐、订单和使用情况集中查看，团队预算更容易管理。',
  'home.enterprise.capabilities.reliability.title': '稳定可用',
  'home.enterprise.capabilities.reliability.desc': '平台持续维护模型服务可用性，减少业务中断带来的影响。',
  'home.enterprise.capabilities.support.title': '有人支持',
  'home.enterprise.capabilities.support.desc': '从开通到日常使用问题，都可以获得持续协助。',
  'home.enterprise.models.title': '覆盖团队常用 AI 模型场景',
  'home.enterprise.models.description': '适合 AI 产品、客服、内容生产、自动化流程和研发效率提升等场景。',
  'home.enterprise.models.ready': '可用',
  'home.enterprise.models.gptName': 'GPT 系列',
  'home.enterprise.models.claudeName': 'Claude',
  'home.enterprise.models.geminiName': 'Gemini',
  'home.enterprise.models.devName': '开发辅助',
  'home.enterprise.models.openai': '适合问答、写作、总结和知识库等常见产品场景。',
  'home.enterprise.models.claude': '适合长文档理解、复杂任务协作和高质量内容处理。',
  'home.enterprise.models.gemini': '适合多模态理解、内容生成和更丰富的业务场景。',
  'home.enterprise.models.codex': '适合研发团队做代码理解、文档整理和自动化辅助。',
  'home.enterprise.flow.title': '四步完成上线前准备',
  'home.enterprise.flow.register.title': '提交需求',
  'home.enterprise.flow.register.desc': '说明团队规模、使用场景和希望优先使用的模型。',
  'home.enterprise.flow.plan.title': '确认方案和费用',
  'home.enterprise.flow.plan.desc': '根据使用方式选择合适套餐或充值方式，费用提前说明。',
  'home.enterprise.flow.key.title': '开通团队账号',
  'home.enterprise.flow.key.desc': '为团队准备账号、额度和基础设置。',
  'home.enterprise.flow.call.title': '接入并试用',
  'home.enterprise.flow.call.desc': '完成试用和检查后，再逐步放到真实业务中使用。',
  'home.enterprise.trust.title': '适合长期运营的团队服务',
  'home.enterprise.trust.billing': '费用、套餐和订单可追踪',
  'home.enterprise.trust.status': '服务状态和使用情况可查看',
  'home.enterprise.trust.security': '成员登录和安全设置可管理',
  'home.enterprise.finalCta.title': '让 AI 模型服务更稳定地进入你的业务',
  'home.enterprise.finalCta.description': '适合 AI 产品团队、自动化团队，以及需要稳定使用全球模型能力的企业客户。',
  'home.footer.allRightsReserved': '保留所有权利。',
}

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => messages[key] ?? key,
    }),
  }
})

vi.mock('@/stores', () => ({
  useAuthStore: () => ({
    checkAuth,
    isAuthenticated: false,
    isAdmin: false,
    user: null,
  }),
  useAppStore: () => ({
    cachedPublicSettings: null,
    siteName: 'oneAPI',
    siteLogo: '',
    docUrl: 'https://docs.example.com',
    publicSettingsLoaded: true,
    fetchPublicSettings,
  }),
}))

describe('HomeView enterprise landing page', () => {
  beforeEach(() => {
    checkAuth.mockReset()
    fetchPublicSettings.mockReset()
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders a bright, plain-language enterprise homepage', () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { props: ['to'], template: '<a><slot /></a>' },
          LocaleSwitcher: true,
          Icon: true,
        },
      },
    })

    const text = wrapper.text()
    expect(text).toContain('oneAPI')
    expect(text).not.toContain('API 服务')
    expect(text).not.toContain('面向每个人、团队和企业的 AI 服务')
    expect(text).toContain('让每个人都可以自由地享受 AI 服务')
    expect(text).not.toContain('让每个人都可以享受顶级 AI 服务')
    const headline = wrapper.find('[data-testid="home-headline"]')
    expect(headline.exists()).toBe(true)
    expect(headline.attributes('class')).toContain('whitespace-nowrap')
    expect(text).toContain('无论个人、团队还是企业')
    expect(text).toContain('统一服务入口')
    expect(text).toContain('费用和用量清楚')
    expect(text).toContain('稳定可用')
    expect(text).toContain('有人支持')
    expect(text).toContain('四步完成上线前准备')
    expect(text).toContain('提交需求')
    expect(text).toContain('确认方案和费用')
    expect(text).toContain('开通团队账号')
    expect(text).toContain('接入并试用')
    expect(text).toContain('立即开通服务')
    expect(text).toContain('查看服务介绍')
    expect(text).toContain('顶级模型聚合')
    expect(text).toContain('稳定服务体验')
    expect(text).toContain('透明用量管理')
    expect(text).toContain('平台能提供什么')
    expect(text).toContain('模型能力')
    expect(text).toContain('使用场景')
    expect(text).toContain('服务保障')

    const html = wrapper.html()
    expect(html).toContain('bg-[#f8fbff]')
    expect(html).toContain('bg-sky-600')
    const logo = wrapper.find('[data-testid="oneapi-logo"]')
    expect(logo.exists()).toBe(true)
    const logoShellClass = logo.element.parentElement?.getAttribute('class') || ''
    expect(logoShellClass).not.toContain('border')
    expect(logoShellClass).not.toContain('bg-white')
    expect(logoShellClass).not.toContain('shadow')
    expect(html).toContain('/logo.svg')
    expect(html).not.toContain('/logo.png')
    expect(html).not.toContain('name="moon"')
    expect(html).not.toContain('name="sun"')
    expect(html).not.toContain('切换到深色模式')
    expect(html).not.toContain('emerald')
    expect(html).not.toContain('bg-[#191826]')
    expect(html).not.toContain('bg-[#11111b]')
    expect(html).not.toContain('bg-[#171823]')
    expect(text).not.toContain('POST /v1')
    expect(text).not.toContain('Base URL')
    expect(text).not.toContain('API Key')
    expect(text).not.toContain('账号池')
    expect(text).not.toContain('失败降级')
    expect(text).not.toContain('开通前，我们先确认这些信息')
    expect(text).not.toContain('专人协助开通')
    expect(text).not.toContain('团队场景')
    expect(text).not.toContain('协助内容')
  })
})
