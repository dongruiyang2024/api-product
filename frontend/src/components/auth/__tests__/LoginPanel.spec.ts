import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import LoginPanel from '../LoginPanel.vue'

const mocks = vi.hoisted(() => ({
  clearAffiliateCodes: vi.fn(),
  getPublicSettings: vi.fn(),
  login: vi.fn(),
  login2FA: vi.fn(),
  push: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  showWarning: vi.fn(),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: { contact?: string }) =>
      params?.contact ? `${key}:${params.contact}` : key,
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    currentRoute: {
      value: {
        query: {},
      },
    },
    push: (...args: unknown[]) => mocks.push(...args),
  }),
}))

vi.mock('@/stores', () => ({
  useAuthStore: () => ({
    login: (...args: unknown[]) => mocks.login(...args),
    login2FA: (...args: unknown[]) => mocks.login2FA(...args),
  }),
  useAppStore: () => ({
    showError: (...args: unknown[]) => mocks.showError(...args),
    showSuccess: (...args: unknown[]) => mocks.showSuccess(...args),
    showWarning: (...args: unknown[]) => mocks.showWarning(...args),
  }),
}))

vi.mock('@/api/auth', () => ({
  getPublicSettings: (...args: unknown[]) => mocks.getPublicSettings(...args),
  isTotp2FARequired: (response: { requires_2fa?: boolean }) => response?.requires_2fa === true,
  isWeChatWebOAuthEnabled: () => false,
}))

vi.mock('@/utils/oauthAffiliate', () => ({
  clearAllAffiliateReferralCodes: () => mocks.clearAffiliateCodes(),
}))

const defaultSettings = {
  backend_mode_enabled: false,
  dingtalk_oauth_enabled: false,
  github_oauth_enabled: false,
  google_oauth_enabled: false,
  linuxdo_oauth_enabled: false,
  oidc_oauth_enabled: false,
  password_reset_enabled: false,
  turnstile_enabled: false,
  turnstile_site_key: '',
}

const mountOptions = {
  global: {
    stubs: {
      RouterLink: true,
    },
  },
}

describe('LoginPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    localStorage.clear()
    mocks.getPublicSettings.mockResolvedValue(defaultSettings)
    mocks.login.mockResolvedValue({ access_token: 'token' })
    mocks.push.mockResolvedValue(undefined)
  })

  it('仅在公开设置配置联系方式时显示账户开通提示', async () => {
    mocks.getPublicSettings.mockResolvedValue({
      ...defaultSettings,
      contact_info: '  support@example.com  ',
    })

    const wrapper = shallowMount(LoginPanel, mountOptions)
    await flushPromises()

    expect(wrapper.get('[data-testid="account-opening-contact"]').text()).toBe(
      'auth.accountOpeningContact:support@example.com',
    )
  })

  it('公开设置未配置联系方式时不渲染账户开通提示', async () => {
    const wrapper = shallowMount(LoginPanel, mountOptions)
    await flushPromises()

    expect(wrapper.find('[data-testid="account-opening-contact"]').exists()).toBe(false)
  })

  it('成功登录后使用传入重定向并发出 success 事件', async () => {
    const wrapper = shallowMount(LoginPanel, {
      ...mountOptions,
      props: {
        redirectTo: '/keys',
      },
    })
    await flushPromises()

    await wrapper.get('#email').setValue('user@example.com')
    await wrapper.get('#password').setValue('secret-123')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(mocks.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret-123',
      turnstile_token: undefined,
    })
    expect(mocks.push).toHaveBeenCalledWith('/keys')
    expect(mocks.clearAffiliateCodes).toHaveBeenCalledOnce()
    expect(wrapper.emitted('success')).toEqual([['/keys']])
  })

  it('后端模式下不暴露账户开通联系方式', async () => {
    mocks.getPublicSettings.mockResolvedValue({
      ...defaultSettings,
      backend_mode_enabled: true,
      contact_info: 'support@example.com',
    })

    const wrapper = shallowMount(LoginPanel, mountOptions)
    await flushPromises()

    expect(wrapper.find('[data-testid="account-opening-contact"]').exists()).toBe(false)
  })

  it('仅在调用方启用且非后端模式时显示注册链接', async () => {
    const wrapper = shallowMount(LoginPanel, {
      ...mountOptions,
      props: {
        showRegistrationLink: true,
      },
    })
    await flushPromises()

    expect(wrapper.get('[data-testid="registration-link"]').find('router-link-stub').attributes('to')).toBe(
      '/register',
    )

    mocks.getPublicSettings.mockResolvedValue({
      ...defaultSettings,
      backend_mode_enabled: true,
    })
    const backendWrapper = shallowMount(LoginPanel, {
      ...mountOptions,
      props: {
        showRegistrationLink: true,
      },
    })
    await flushPromises()

    expect(backendWrapper.find('[data-testid="registration-link"]').exists()).toBe(false)
  })
})
