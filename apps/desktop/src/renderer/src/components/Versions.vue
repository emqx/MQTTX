<script setup lang="ts">
import { reactive } from 'vue'
const versions = reactive({ ...window.electron.process.versions })
</script>

<template>
  <ul class="versions">
    <li class="electron-version text-8xl text-green-primary">Electron v{{ versions.electron }}</li>
    <li class="chrome-version text-5xl">Chromium v{{ versions.chrome }}</li>
    <li class="node-version">Node v{{ versions.node }}</li>
    <li class="v8-version">V8 v{{ versions.v8 }}</li>
  </ul>
</template>
