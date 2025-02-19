<script setup lang="ts">
import type { ConnectionForm } from 'mqttx'

withDefaults(defineProps<{
  title: string
  mode?: 'readOnly' | 'edit'
  maxHeight?: string
}>(), {
  mode: 'edit',
})

const userProperties = defineModel<ConnectionForm['properties']['userProperties']>()

const dataList = ref<{ key: string, value: string }[]>([])

userPropertiesToDataList()

watch(dataList, dataListToUserProperties, { deep: true })

function userPropertiesToDataList() {
  if (!userProperties.value || Object.keys(userProperties.value).length === 0) {
    dataList.value = [{ key: '', value: '' }]
    return
  }
  dataList.value = []
  for (const [key, value] of Object.entries(userProperties.value)) {
    if (typeof value === 'string') {
      dataList.value.push({ key, value })
    } else {
      value.forEach((item) => {
        dataList.value.push({ key, value: item })
      })
    }
  }
}

function dataListToUserProperties() {
  if (dataList.value.length === 0 || dataList.value.every(({ key }) => key === '')) {
    userProperties.value = undefined
    return
  }
  const obj: ConnectionForm['properties']['userProperties'] = {}
  dataList.value.forEach(({ key, value }) => {
    if (key === '') return
    if (obj[key]) {
      if (Array.isArray(obj[key])) {
        obj[key].push(value)
      } else {
        obj[key] = [obj[key], value]
      }
    } else {
      obj[key] = value
    }
  })
  userProperties.value = obj
}

function addItem() {
  const lastItem = dataList.value[dataList.value.length - 1]
  if (lastItem.key === '' && lastItem.value === '') return
  dataList.value.push({ key: '', value: '' })
}

function deleteItem(_index: number) {
  if (dataList.value.length === 1) {
    dataList.value = [{ key: '', value: '' }]
    return
  }
  dataList.value.splice(_index, 1)
}
</script>

<template>
  <div>
    {{ userProperties }}
    <div class="mb-4 flex items-center justify-between">
      <span class="text-default">{{ title }}</span>
      <ElButton
        v-if="mode === 'edit'"
        link
        @click="addItem"
      >
        <ElIconPlus class="text-main-green" width="14" height="14" />
      </ElButton>
    </div>
    <ElScrollbar>
      <div class="grid gap-3" :style="{ maxHeight }">
        <div v-for="(item, index) in dataList" :key="index" class="grid gap-3 grid-cols-[1fr_1fr_32px]">
          <ElInput
            :ref="`KeyRef${index}`"
            v-model="item.key"
            :placeholder="mode === 'readOnly' ? '' : 'Key'"
            type="textarea"
            resize="none"
            :autosize="{ minRows: 1, maxRows: 3 }"
            :disabled="mode === 'readOnly'"
          />
          <ElInput
            :ref="`ValueRef${index}`"
            v-model="item.value"
            :placeholder="mode === 'readOnly' ? '' : 'Value'"
            type="textarea"
            resize="none"
            :autosize="{ minRows: 1, maxRows: 3 }"
            :disabled="mode === 'readOnly'"
          />
          <ElButton
            v-if="mode === 'edit'"
            class="mr-4"
            link
            @click="deleteItem(index)"
          >
            <ElIconDelete class="text-main-green" width="14" height="14" />
          </ElButton>
        </div>
      </div>
    </ElScrollbar>
  </div>
</template>
