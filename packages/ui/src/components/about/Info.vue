<script setup lang="ts">
import type { PlatformType } from 'mqttx'
import IconFaq from '~icons/custom/faq'
import IconGithub from '~icons/custom/github'
import IconWebsite from '~icons/custom/website'

const { about } = useLinks()

const platformType = inject<PlatformType>('platformType', 'web')

const { t } = useI18n()
const btns = computed(() => [
  {
    icon: IconGithub,
    text: 'GitHub',
    link: 'https://github.com/emqx/MQTTX',
  },
  {
    icon: IconWebsite,
    text: t('about.web'),
    link: 'https://mqttx.app',
  },
  {
    icon: IconFaq,
    text: 'FAQ',
    link: 'https://mqttx.app/faq',
  },
])

const dialogVisible = ref(false)

const checkForUpdates = inject<Window['api']['checkForUpdates']>('checkForUpdates')
</script>

<template>
  <div class="mb-16">
    <div :class="$style.section">
      <div
        v-if="platformType === 'desktop'"
        role="button"
        tabindex="0"
        @click="checkForUpdates"
      >
        {{ $t('about.update') }}
      </div>
      <a :href="about.releases" target="_blank" rel="noopener">
        {{ $t('about.releases') }}
      </a>
      <a href="https://github.com/emqx/MQTTX/issues" target="_blank" rel="noopener">
        {{ $t('about.support') }}
      </a>
      <div
        v-if="platformType === 'web'"
        role="button"
        tabindex="0"
        @click="dialogVisible = !dialogVisible"
      >
        {{ $t('about.dataCollectionPolicy') }}
      </div>
    </div>
    <p class="mb-6 max-w-xl text-sm text-default">
      {{ platformType === 'desktop' ? $t('about.mqttxDesc') : $t('about.mqttxWebDesc') }}
    </p>
    <div class="mb-16 inline-grid grid-cols-3 gap-6">
      <a
        v-for="{ icon, text, link } in btns"
        :key="link"
        class="inline-flex gap-1.5 items-center justify-center min-w-40 rounded-lg px-6 py-3 bg-card-normal text-main-green text-sm font-medium"
        :href="link"
        target="_blank"
        rel="noopener"
      >
        <component :is="icon" class="text-xl text-card-icon" />
        {{ text }}
        <ElIconRight width="16" height="16" />
      </a>
    </div>
    <div :class="$style.cloud">
      <h2 class="mb-4 text-title text-lg font-semibold">
        {{ $t('about.cloudTitle') }}
      </h2>
      <p class="mb-4 text-default text-sm">
        {{ $t('about.cloudSummary') }}
      </p>
      <a
        class="inline-flex gap-1.5 items-center justify-center min-w-40 rounded-lg px-4 py-2 bg-gradient-btn text-main-white text-sm font-medium"
        :href="about.EMQXCloud"
        target="_blank"
        rel="noopener"
      >
        {{ $t('about.tryCloud') }}
        <ElIconRight width="16" height="16" />
      </a>
    </div>
  </div>

  <AboutDataCollectionPolicy
    v-if="platformType === 'web'"
    v-model="dialogVisible"
  />
</template>

<style module>
.section {
  @apply mb-6 flex divide-x divide-border-default text-sm text-main-green;
  > div,
  > a {
    @apply px-3 first:pl-0 last:pr-0;
  }
}

.cloud {
  @apply text-center px-10 py-5 bg-gradient-card rounded-lg;
}
</style>
