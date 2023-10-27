<script setup lang="ts">
console.log('MQTTX Web App init...')
</script>

<template>
  <h1 class="m-3">MQTTX Web App init</h1>
  <div class="layout">
    <left-bar />
    <div class="main-view">
      <router-view></router-view>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
