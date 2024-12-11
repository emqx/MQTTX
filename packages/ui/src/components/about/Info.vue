<script setup lang="ts">
// TODO: Implement update function, and display data collection policy.
import type { PlatformType } from 'mqttx'

const { about } = useLinks()

const platformType = inject<PlatformType>('platformType', 'web')
</script>

<template>
  <div :class="$style.section">
    <div
      v-if="platformType === 'desktop'"
      role="button"
      tabindex="0"
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
    >
      {{ $t('about.dataCollectionPolicy') }}
    </div>
  </div>
</template>

<style module>
.section {
  @apply mb-6 flex divide-x divide-border-default text-sm text-main-green;
  > div,
  > a {
    @apply px-3 first:pl-0 last:pr-0;
  }
}
</style>
