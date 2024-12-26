<script setup lang="ts">
import { useSettingsStore } from '../stores'

defineProps<{
  log: string
}>()

const { settings } = useSettingsStore()

const logLevelOptions = [
  { label: 'DEBUG', value: 'debug' },
  { label: 'INFO', value: 'info' },
  { label: 'WARN', value: 'warn' },
  { label: 'ERROR', value: 'error' },
]
</script>

<template>
  <div id="log-view" class="bg-primary min-h-full select-none">
    <div class="p-4">
      <div class="mx-auto max-w-screen-lg">
        <div class="mb-4 flex justify-between items-center">
          <h1 class="text-lg text-title font-semibold">
            {{ $t('log.log') }}
          </h1>
          <div>
            <ElSelect v-model="settings!.logLevel" class="!w-40">
              <ElOption
                v-for="{ label, value } in logLevelOptions"
                :key="value"
                :label="label"
                :value="value"
              />
            </ElSelect>
          </div>
        </div>
        <div class="h-[calc(100vh-84px)] bg-normal border px-0.5 pb-0.5 pt-3 border-border-default rounded">
          <MonacoEditor
            :value="log"
            language="log"
            :options="{ readOnly: true, lineNumbers: 'on' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
