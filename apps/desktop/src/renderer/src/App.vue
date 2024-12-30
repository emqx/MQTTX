<script setup lang="ts">
import type { Lang } from 'mqttx'
import { ElementI18nMap } from '@mqttx/ui/i18n'

const { locale } = useI18n()

const { logger } = useLog4()

logger.info('MQTTX Desktop App init...')
</script>

<template>
  <ElConfigProvider :locale="ElementI18nMap[locale as Lang]">
    <ElContainer>
      <CommonLeftMenu />
      <CommonMainView />
      <UpdateView />
    </ElContainer>
  </ElConfigProvider>
</template>
