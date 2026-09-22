import { defineComponent } from 'vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import LoginPanel from '../LoginPanel.vue'

const mocks = vi.hoisted(() => ({
  clearAffiliateCodes: vi.fn(),
  getPublicSettings: vi.fn(),
  login: vi.fn(),
  login2FA: vi.fn(),
  loginWithPasskey: vi.fn(),
  verifyAction: vi.fn(),
  resetCaptcha: vi.fn(),
  startOAuthLogin: vi.fn(),
  buildOAuthLoginStartURL: vi.fn(),
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
    loginWithPasskey: (...args: unknown[]) => mocks.loginWithPasskey(...args),
  }),
  useAppStore: () => ({
    showError: (...args: unknown[]) => mocks.showError(...args),
    showSuccess: (...args: unknown[]) => mocks.showSuccess(...args),
    showWarning: (...args: unknown[]) => mocks.showWarning(...args),
  }),
}))

vi.mock('@/api/auth', () => ({
  startOAuthLogin: (...args: unknown[]) => mocks.startOAuthLogin(...args),
  buildOAuthLoginStartURL: (...args: unknown[]) => mocks.buildOAuthLoginStartURL(...args),
  getPublicSettings: (...args: unknown[]) => mocks.getPublicSettings(...args),
  isTotp2FARequired: (response: { requires_2fa?: boolean }) => response?.requires_2fa === true,
  isWeChatWebOAuthEnabled: () => false,
}))

vi.mock('@/utils/oauthAffiliate', () => ({
  clearAllAffiliateReferralCodes: () => mocks.clearAffiliateCodes(),
}))

const defaultSettings = {
  registration_enabled: true,
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
      TotpLoginModal: defineComponent({
        name: 'TotpLoginModal',
        emits: ['verify', 'cancel'],
        setup(_, { expose }) {
          expose({ setVerifying: vi.fn(), setError: vi.fn() })
          return () => null
        },
      }),
      TurnstileWidget: defineComponent({
        name: 'CaptchaChallenge',
        emits: ['verify', 'expire', 'error'],
        setup(_, { expose }) {
          expose({ verifyAction: mocks.verifyAction, reset: mocks.resetCaptcha })
          return () => null
        },
      }),
    },
  },
}

describe('LoginPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    mocks.verifyAction.mockResolvedValue({ token: 'proof', randstr: 'random' })
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
      tencent_captcha_ticket: undefined,
      tencent_captcha_randstr: undefined,
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
  it.each([
    ['腾讯', { tencent_captcha_enabled: true, tencent_captcha_app_id: 'app' }, { tencent_captcha_ticket: 'proof', tencent_captcha_randstr: 'random' }],
    ['阿里云', { aliyun_captcha_enabled: true, aliyun_captcha_scene_id: 'scene', aliyun_captcha_prefix: 'prefix' }, { turnstile_token: 'proof' }],
  ])('%s 验证成功后提交凭证，取消后不登录', async (_, settings, proof) => {
    mocks.getPublicSettings.mockResolvedValue({ ...defaultSettings, ...settings })
    const wrapper = shallowMount(LoginPanel, mountOptions)
    await flushPromises()
    await wrapper.get('#email').setValue('user@example.com')
    await wrapper.get('#password').setValue('secret-123')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()
    expect(mocks.login).toHaveBeenCalledWith(expect.objectContaining(proof))
    expect(mocks.resetCaptcha).toHaveBeenCalled()
    mocks.login.mockClear()
    mocks.verifyAction.mockResolvedValue(null)
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()
    expect(mocks.login).not.toHaveBeenCalled()
  })

  it('Passkey 使用共享重定向并发出成功事件', async () => {
    vi.stubGlobal('PublicKeyCredential', class {})
    mocks.getPublicSettings.mockResolvedValue({ ...defaultSettings, passkey_enabled: true })
    const wrapper = shallowMount(LoginPanel, { ...mountOptions, props: { redirectTo: '/keys' } })
    await flushPromises()
    const button = wrapper.findAll('button').find(item => item.text().includes('auth.passkeySignIn'))!
    await button.trigger('click')
    await flushPromises()
    expect(mocks.loginWithPasskey).toHaveBeenCalledWith(undefined)
    expect(mocks.push).toHaveBeenCalledWith('/keys')
    expect(wrapper.emitted('success')).toEqual([['/keys']])
  })

  it('浏览器不支持 Passkey 时不显示入口', async () => {
    vi.stubGlobal('PublicKeyCredential', undefined)
    mocks.getPublicSettings.mockResolvedValue({ ...defaultSettings, passkey_enabled: true })
    const wrapper = shallowMount(LoginPanel, mountOptions)
    await flushPromises()
    expect(wrapper.text()).not.toContain('auth.passkeySignIn')
  })

  it('OAuth 验证取消时不启动第三方授权，组件保留指定回跳地址', async () => {
    mocks.getPublicSettings.mockResolvedValue({ ...defaultSettings, github_oauth_enabled: true, tencent_captcha_enabled: true, tencent_captcha_app_id: 'app' })
    mocks.verifyAction.mockResolvedValue(null)
    const wrapper = shallowMount(LoginPanel, { ...mountOptions, props: { redirectTo: '/keys' } })
    await flushPromises()
    const oauth = wrapper.findComponent({ name: 'EmailOAuthButtons' })
    expect(oauth.props('redirectTo')).toBe('/keys')
    oauth.vm.$emit('start', { provider: 'github', params: { redirect: '/keys' } })
    await flushPromises()
    expect(mocks.verifyAction).toHaveBeenCalledOnce()
    expect(mocks.startOAuthLogin).not.toHaveBeenCalled()
  })

  it('2FA 完成后沿用共享登录成功流程', async () => {
    mocks.login.mockResolvedValue({ requires_2fa: true, temp_token: 'temporary', user_email_masked: 'u***@example.com' })
    const wrapper = shallowMount(LoginPanel, { ...mountOptions, props: { redirectTo: '/keys' } })
    await flushPromises()
    await wrapper.get('#email').setValue('user@example.com')
    await wrapper.get('#password').setValue('secret-123')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()
    expect(mocks.push).not.toHaveBeenCalled()
    wrapper.findComponent({ name: 'TotpLoginModal' }).vm.$emit('verify', '123456')
    await flushPromises()
    expect(mocks.login2FA).toHaveBeenCalledWith('temporary', '123456')
    expect(wrapper.emitted('success')).toEqual([['/keys']])
  })

  it('登录协议未接受时阻止密码与 Passkey 登录', async () => {
    vi.stubGlobal('PublicKeyCredential', class {})
    mocks.getPublicSettings.mockResolvedValue({ ...defaultSettings, passkey_enabled: true, login_agreement_enabled: true, login_agreement_mode: 'checkbox', login_agreement_documents: [{ id: 'terms', title: 'Terms' }] })
    const wrapper = shallowMount(LoginPanel, mountOptions)
    await flushPromises()
    expect(wrapper.get('#email').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    const passkey = wrapper.findAll('button').find(item => item.text().includes('auth.passkeySignIn'))!
    expect(passkey.attributes('disabled')).toBeDefined()
    expect(mocks.login).not.toHaveBeenCalled()
    expect(mocks.loginWithPasskey).not.toHaveBeenCalled()
    wrapper.findComponent({ name: 'LoginAgreementPrompt' }).vm.$emit('accept')
    await flushPromises()
    expect(wrapper.get('#email').attributes('disabled')).toBeUndefined()
  })

  it('Turnstile 过期后再次阻止密码提交', async () => {
    mocks.getPublicSettings.mockResolvedValue({ ...defaultSettings, turnstile_enabled: true, turnstile_site_key: 'site' })
    const wrapper = shallowMount(LoginPanel, mountOptions)
    await flushPromises()
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    wrapper.findComponent({ name: 'CaptchaChallenge' }).vm.$emit('verify', 'proof')
    await flushPromises()
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
    wrapper.findComponent({ name: 'CaptchaChallenge' }).vm.$emit('expire')
    await flushPromises()
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('OAuth 启动提交验证码凭证及指定回跳地址，服务失败明确提示', async () => {
    mocks.getPublicSettings.mockResolvedValue({ ...defaultSettings, github_oauth_enabled: true, tencent_captcha_enabled: true, tencent_captcha_app_id: 'app' })
    mocks.startOAuthLogin.mockRejectedValue(new Error('OAuth unavailable'))
    const wrapper = shallowMount(LoginPanel, { ...mountOptions, props: { redirectTo: '/keys' } })
    await flushPromises()
    wrapper.findComponent({ name: 'EmailOAuthButtons' }).vm.$emit('start', { provider: 'github', params: { redirect: '/keys' } })
    await flushPromises()
    expect(mocks.startOAuthLogin).toHaveBeenCalledWith({ provider: 'github', params: { redirect: '/keys' } }, { tencent_captcha_ticket: 'proof', tencent_captcha_randstr: 'random' })
    expect(mocks.showError).toHaveBeenCalled()
    expect(mocks.resetCaptcha).toHaveBeenCalled()
  })

})
