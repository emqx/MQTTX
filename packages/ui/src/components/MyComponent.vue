<script lang="ts" setup>
import { ref } from 'vue'
import { ElButton } from 'element-plus'

const num = ref(100)

const handleClick = () => {
  alert('Button from @mqttx/ui clicked!' + num.value)
}
</script>

<template>
  <div>
    <h1 class="text-green-primary text-sm">From UI pkgs</h1>
    <div class="mb-6 text-2xl bg-green-primary">{{ num }}</div>
    <el-input v-model="num" class="mb-12" />
    <el-button size="small" type="primary" class="rounded-xl" @click="handleClick">Click MQTTX!</el-button>
  </div>
</template>
