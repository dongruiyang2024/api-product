<template>
  <div v-if="homeContent" class="min-h-screen">
    <iframe
      v-if="isHomeContentUrl"
      :src="homeContent.trim()"
      class="h-screen w-full border-0"
      allowfullscreen
    ></iframe>
    <div v-else v-html="homeContent"></div>
  </div>

  <div v-else class="min-h-screen bg-[#f8fbff] text-stone-950">
    <header class="sticky top-0 z-30 border-b border-stone-200/80 bg-[#f8fbff]/95 px-5 py-3 backdrop-blur">
      <nav class="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <router-link to="/home" class="flex min-w-0 items-center gap-3" aria-label="oneAPI home">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden">
            <img
              data-testid="oneapi-logo"
              :src="siteLogo || '/logo.svg'"
              alt="oneAPI Logo"
              class="h-full w-full object-contain"
            />
          </span>
          <span class="truncate text-lg font-semibold tracking-tight text-slate-950">{{ siteName }}</span>
        </router-link>

        <div class="hidden items-center gap-6 text-sm font-medium text-stone-600 md:flex">
          <a href="#models" class="transition-colors hover:text-stone-950">{{ t('home.enterprise.nav.models') }}</a>
          <a href="#workflow" class="transition-colors hover:text-stone-950">{{ t('home.enterprise.nav.workflow') }}</a>
          <router-link to="/purchase" class="transition-colors hover:text-stone-950">{{ t('home.enterprise.nav.pricing') }}</router-link>
          <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="transition-colors hover:text-stone-950">{{ t('home.enterprise.nav.docs') }}</a>
        </div>

        <div class="flex items-center gap-2">
          <LocaleSwitcher />
          <router-link
            :to="isAuthenticated ? dashboardPath : '/login'"
            class="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-800 transition-colors hover:border-stone-300 hover:text-stone-950"
          >
            {{ isAuthenticated ? t('home.dashboard') : t('home.login') }}
          </router-link>
        </div>
      </nav>
    </header>

    <main>
      <section class="relative overflow-hidden border-b border-sky-100 bg-[#f8fbff] text-slate-950">
        <div class="pointer-events-none absolute inset-0 opacity-25" aria-hidden="true">
          <div class="absolute left-6 top-10 hidden w-[36rem] rotate-[-8deg] space-y-3 text-xs font-medium text-sky-700/70 md:block">
            <div class="rounded-lg border border-sky-100 bg-white/80 px-4 py-3 shadow-sm">顶级模型统一服务</div>
            <div class="ml-16 rounded-lg border border-sky-100 bg-white/80 px-4 py-3 shadow-sm">用量与费用清晰管理</div>
            <div class="ml-8 rounded-lg border border-sky-100 bg-white/80 px-4 py-3 shadow-sm">接入与使用持续支持</div>
          </div>
          <div class="absolute bottom-8 right-8 hidden w-[32rem] rotate-[7deg] space-y-3 text-xs font-medium text-orange-700/70 lg:block">
            <div class="rounded-lg border border-sky-100 bg-white/80 px-4 py-3 shadow-sm">个人、团队、企业都可使用</div>
            <div class="mr-20 rounded-lg border border-sky-100 bg-white/80 px-4 py-3 shadow-sm">服务能力持续维护</div>
            <div class="mr-8 rounded-lg border border-sky-100 bg-white/80 px-4 py-3 shadow-sm">预算、套餐、订单透明可见</div>
          </div>
        </div>

        <div class="relative mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:py-24">
          <div class="max-w-4xl">
            <h1 data-testid="home-headline" class="max-w-full whitespace-nowrap text-3xl font-bold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
              {{ t('home.enterprise.headline') }}
            </h1>
            <p class="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              {{ t('home.enterprise.description') }}
            </p>
            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <router-link
                :to="isAuthenticated ? dashboardPath : '/register'"
                class="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
              >
                {{ t('home.enterprise.primaryCta') }}
              </router-link>
              <a
                :href="docUrl || '#integration'"
                :target="docUrl ? '_blank' : undefined"
                :rel="docUrl ? 'noopener noreferrer' : undefined"
                class="inline-flex items-center justify-center rounded-lg border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-50"
              >
                {{ t('home.enterprise.secondaryCta') }}
              </a>
            </div>
          </div>

          <div class="mt-12 grid gap-4 md:grid-cols-3">
            <article v-for="metric in heroMetrics" :key="metric.title" class="rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
              <p class="text-base font-semibold text-slate-950">{{ metric.title }}</p>
              <p class="mt-2 text-sm leading-6 text-slate-600">{{ metric.desc }}</p>
            </article>
          </div>

          <div id="integration" class="mt-10 max-w-3xl rounded-lg border border-sky-100 bg-white p-5 shadow-xl shadow-sky-100/80">
            <div class="mb-4 flex items-start justify-between gap-3 border-b border-sky-100 pb-4">
              <div>
                <p class="text-sm font-semibold text-slate-950">{{ t('home.enterprise.serviceBrief.title') }}</p>
                <p class="mt-1 text-xs leading-5 text-slate-500">{{ t('home.enterprise.serviceBrief.subtitle') }}</p>
              </div>
              <span class="rounded-lg bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">{{ t('home.enterprise.serviceBrief.tag') }}</span>
            </div>
            <div class="grid gap-3 sm:grid-cols-3">
              <div v-for="item in serviceBriefItems" :key="item.label" class="rounded-lg border border-sky-100 bg-sky-50/60 p-3">
                <p class="text-xs font-medium text-slate-500">{{ item.label }}</p>
                <p class="mt-2 text-sm leading-6 text-slate-800">{{ item.value }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="border-b border-stone-200 bg-white px-5 py-16">
        <div class="mx-auto max-w-7xl">
          <div class="max-w-2xl">
            <p class="text-sm font-semibold text-sky-700">{{ t('home.enterprise.sectionLabel.platform') }}</p>
            <h2 class="mt-3 text-3xl font-bold text-stone-950">{{ t('home.enterprise.capabilities.title') }}</h2>
          </div>
          <div class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <article v-for="item in capabilities" :key="item.title" class="rounded-lg border border-stone-200 bg-[#fbfdff] p-5">
              <p class="text-base font-semibold text-stone-950">{{ item.title }}</p>
              <p class="mt-3 text-sm leading-6 text-stone-600">{{ item.desc }}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="models" class="px-5 py-16">
        <div class="mx-auto max-w-7xl">
          <div class="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p class="text-sm font-semibold text-sky-700">{{ t('home.enterprise.sectionLabel.models') }}</p>
              <h2 class="mt-3 text-3xl font-bold text-stone-950">{{ t('home.enterprise.models.title') }}</h2>
              <p class="mt-4 text-base leading-7 text-stone-600">{{ t('home.enterprise.models.description') }}</p>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div v-for="model in models" :key="model.name" class="rounded-lg border border-stone-200 bg-white p-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-semibold text-stone-950">{{ model.name }}</p>
                    <p class="mt-2 text-sm leading-6 text-stone-600">{{ model.desc }}</p>
                  </div>
                  <span class="shrink-0 rounded-lg bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">{{ t('home.enterprise.models.ready') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" class="border-y border-stone-200 bg-white px-5 py-16">
        <div class="mx-auto max-w-7xl">
          <div class="max-w-2xl">
            <p class="text-sm font-semibold text-sky-700">{{ t('home.enterprise.sectionLabel.workflow') }}</p>
            <h2 class="mt-3 text-3xl font-bold text-stone-950">{{ t('home.enterprise.flow.title') }}</h2>
          </div>
          <div class="mt-8 grid gap-4 md:grid-cols-4">
            <article v-for="(step, index) in flowSteps" :key="step.title" class="rounded-lg border border-stone-200 bg-[#fbfdff] p-5">
              <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-sm font-bold text-white">{{ index + 1 }}</span>
              <p class="mt-4 font-semibold text-stone-950">{{ step.title }}</p>
              <p class="mt-2 text-sm leading-6 text-stone-600">{{ step.desc }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="px-5 py-16">
        <div class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p class="text-sm font-semibold text-sky-700">{{ t('home.enterprise.sectionLabel.trust') }}</p>
            <h2 class="mt-3 text-3xl font-bold text-stone-950">{{ t('home.enterprise.trust.title') }}</h2>
          </div>
          <div class="space-y-3">
            <div v-for="item in trustItems" :key="item" class="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700">
              {{ item }}
            </div>
          </div>
        </div>
      </section>

      <section class="px-5 pb-16">
        <div class="mx-auto max-w-7xl rounded-lg border border-stone-200 bg-[#eef6ff] px-6 py-10 text-slate-950">
          <div class="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 class="text-2xl font-bold text-slate-950">{{ t('home.enterprise.finalCta.title') }}</h2>
              <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{{ t('home.enterprise.finalCta.description') }}</p>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <router-link :to="isAuthenticated ? dashboardPath : '/register'" class="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700">
                {{ t('home.enterprise.primaryCta') }}
              </router-link>
              <router-link to="/purchase" class="inline-flex items-center justify-center rounded-lg border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-50">
                {{ t('home.enterprise.nav.pricing') }}
              </router-link>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t border-stone-200 bg-white px-5 py-8">
      <div class="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {{ currentYear }} {{ siteName }}. {{ t('home.footer.allRightsReserved') }}</p>
        <div class="flex flex-wrap items-center gap-4">
          <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="hover:text-stone-900">{{ t('home.docs') }}</a>
          <router-link to="/key-usage" class="hover:text-stone-900">{{ t('home.enterprise.nav.keyUsage') }}</router-link>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useAppStore } from '@/stores'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'

const { t } = useI18n()

const authStore = useAuthStore()
const appStore = useAppStore()

const siteName = computed(() => appStore.cachedPublicSettings?.site_name || appStore.siteName || 'oneAPI')
const siteLogo = computed(() => appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '')
const docUrl = computed(() => appStore.cachedPublicSettings?.doc_url || appStore.docUrl || '')
const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')

const isHomeContentUrl = computed(() => {
  const content = homeContent.value.trim()
  return content.startsWith('http://') || content.startsWith('https://')
})


const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.isAdmin)
const dashboardPath = computed(() => (isAdmin.value ? '/admin/dashboard' : '/dashboard'))
const currentYear = computed(() => new Date().getFullYear())

const heroMetrics = computed(() => [
  {
    title: t('home.enterprise.metrics.models.title'),
    desc: t('home.enterprise.metrics.models.desc'),
  },
  {
    title: t('home.enterprise.metrics.reliability.title'),
    desc: t('home.enterprise.metrics.reliability.desc'),
  },
  {
    title: t('home.enterprise.metrics.management.title'),
    desc: t('home.enterprise.metrics.management.desc'),
  },
])

const capabilities = computed(() => [
  {
    title: t('home.enterprise.capabilities.unified.title'),
    desc: t('home.enterprise.capabilities.unified.desc'),
  },
  {
    title: t('home.enterprise.capabilities.governance.title'),
    desc: t('home.enterprise.capabilities.governance.desc'),
  },
  {
    title: t('home.enterprise.capabilities.reliability.title'),
    desc: t('home.enterprise.capabilities.reliability.desc'),
  },
  {
    title: t('home.enterprise.capabilities.support.title'),
    desc: t('home.enterprise.capabilities.support.desc'),
  },
])

const serviceBriefItems = computed(() => [
  { label: t('home.enterprise.serviceBrief.sceneLabel'), value: t('home.enterprise.serviceBrief.sceneValue') },
  { label: t('home.enterprise.serviceBrief.modelLabel'), value: t('home.enterprise.serviceBrief.modelValue') },
  { label: t('home.enterprise.serviceBrief.helpLabel'), value: t('home.enterprise.serviceBrief.helpValue') },
])

const models = computed(() => [
  { name: t('home.enterprise.models.gptName'), desc: t('home.enterprise.models.openai') },
  { name: t('home.enterprise.models.claudeName'), desc: t('home.enterprise.models.claude') },
  { name: t('home.enterprise.models.geminiName'), desc: t('home.enterprise.models.gemini') },
  { name: t('home.enterprise.models.devName'), desc: t('home.enterprise.models.codex') },
])

const flowSteps = computed(() => [
  {
    title: t('home.enterprise.flow.register.title'),
    desc: t('home.enterprise.flow.register.desc'),
  },
  {
    title: t('home.enterprise.flow.plan.title'),
    desc: t('home.enterprise.flow.plan.desc'),
  },
  {
    title: t('home.enterprise.flow.key.title'),
    desc: t('home.enterprise.flow.key.desc'),
  },
  {
    title: t('home.enterprise.flow.call.title'),
    desc: t('home.enterprise.flow.call.desc'),
  },
])

const trustItems = computed(() => [
  t('home.enterprise.trust.billing'),
  t('home.enterprise.trust.status'),
  t('home.enterprise.trust.security'),
])


onMounted(() => {
  authStore.checkAuth()
  if (!appStore.publicSettingsLoaded) {
    appStore.fetchPublicSettings()
  }
})
</script>
