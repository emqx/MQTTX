<script setup lang="ts">
import type { Settings } from 'mqttx'

const settings = defineModel<Settings>({ required: true })
</script>

<template>
  <div>
    <pre>
      {{ settings }}
    </pre>
    <!-- change lang -->
    <div>
      <label for="lang">Language</label>
      <select id="lang" v-model="settings.currentLang">
        <option value="en">
          English
        </option>
        <option value="zh">
          中文
        </option>
      </select>
    </div>
  </div>
</template>
