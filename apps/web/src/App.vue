<script setup lang="ts">
import { ref } from 'vue'
import HelloWorld from '@/components/HelloWorld.vue'
import { MyComponent } from '@mqttx/ui'
import { add } from '@mqttx/utils'

const sum = ref(0)
sum.value = add(1, 2)
</script>

<template>
  <h1 class="text-2xl text-green-primary mb-2">From Web</h1>
  <div class="text-2xl mb-4 w-12 h-12 text-center rounded-3xl bg-green-primary">{{ sum }}</div>
  <el-button type="primary" class="rounded-2xl mb-12">Hello</el-button>
  <MyComponent class="mb-12" />
  <HelloWorld msg="Hello World" />
</template>

<style lang="scss" scoped></style>
