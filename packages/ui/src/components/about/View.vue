<script setup lang="ts">
import logoDark from '../../assets/images/about/mqttx-dark.png'
import logoLight from '../../assets/images/about/mqttx-light.png'
import { useSettingsStore } from '../../stores'

const { settings } = useSettingsStore()
const logo = computed(() => settings!.currentTheme === 'light' ? logoDark : logoLight)

const { t } = useI18n()
const version = computed(() => `${t('common.version')} v${import.meta.env.__APP_VERSION__}`)
</script>

<template>
  <ElScrollbar id="help-view" class="bg-primary min-h-full select-none">
    <div class="px-4 pt-4 pb-12">
      <div class="mx-auto max-w-screen-lg">
        <h1 class="mb-12 text-lg text-title font-semibold">
          {{ $t('about.about') }}
        </h1>
        <div class="px-6 flex flex-col items-center justify-center min-h-[calc(100vh-140px)]">
          <div class="flex gap-20 items-center">
            <img :src="logo" alt="MQTTX" width="200" height="192">
            <div>
              <div class="mb-4 font-semibold text-2xl text-title">
                {{ version }}
              </div>
              <AboutInfo />
              <AboutFooter />
            </div>
          </div>
        </div>
      </div>
    </div>
  </ElScrollbar>
</template>
