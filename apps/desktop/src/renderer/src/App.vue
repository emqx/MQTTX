<script setup lang="ts">
import { ref } from 'vue'
import Versions from './components/Versions.vue'
import { MyComponent } from '@mqttx/ui'
import { add, AddFunc, SubtractFunc, subtract, getMessageId } from '@mqttx/utils'

const sum = ref(0)
const _add: AddFunc = add
sum.value = _add(1, 6)
const count = ref(0)
const _subtract: SubtractFunc = subtract
count.value = _subtract(6, 1)
const clientid = ref('clientid')
clientid.value = getMessageId()
</script>

<template>
  <div>
    <h1 class="text-2xl">From Desktop</h1>
    <el-input v-model="count" class="mb-5"></el-input>
    <div class="text-2xl">{{ clientid }} ===> {{ sum }} ===> {{ count }}</div>
    <el-button type="primary" class="w-12 rounded-2xl mb-12">Click</el-button>
    <MyComponent></MyComponent>
    <Versions></Versions>
  </div>
</template>
