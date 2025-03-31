<script setup lang="ts">
import type { ScriptFunction } from 'mqttx'
import { executeScript } from '@mqttx/core'

const props = defineProps<{
  currentLang: ScriptFunction['lang']
  currentFunctionContent: ScriptFunction['content']
}>()

const { currentLang, currentFunctionContent } = toRefs(props)
const { payloadTypeList, payloadType, payloadString, payloadBuffer, monacoEditorLangugage } = usePayloadConverter()

const {
  payloadType: resultPayloadType,
  payloadString: resultString,
  monacoEditorLangugage: resultMonacoEditorLangugage,
} = usePayloadConverter()

function resetResults() {
  resultString.value = ''
  resultPayloadType.value = 'Plaintext'
}

resetResults()

function handleTest() {
  resetResults()
  if (currentLang.value === 'javascript') {
    executeScript({
      script: currentFunctionContent.value,
      payload: payloadString.value,
      payloadRaw: payloadBuffer.value,
      messageType: 'publish',
    })
      .then((data) => {
        console.log(data)
        console.log(data.toString())

        resultString.value = data.toString()
      })
      .catch((error) => {
        if (error instanceof Error) {
          ElMessage({
            message: error.toString(),
            type: 'error',
            plain: true,
          })
        }
      })
  }
}
</script>

<template>
  <section>
    <div class="my-3 flex justify-between items-center">
      <label class="text-title">{{ $t('script.input') }}</label>
      <ElButton
        type="primary"
        @click="handleTest"
      >
        {{ $t('script.test') }}
      </ElButton>
    </div>
    <section class="h-40 bg-normal border border-b-0 px-0.5 pb-0.5 pt-3 border-border-default rounded-t">
      <MonacoEditor
        :value="payloadString"
        :language="monacoEditorLangugage"
        :options="{ lineNumbers: 'on' }"
        @update="payloadString = $event"
      />
    </section>
    <div class="px-3 text-right bg-select-lang border border-t-0 border-border-default rounded-b">
      <ElRadioGroup v-model="payloadType">
        <ElRadio v-for="item in payloadTypeList" :key="item" :value="item">
          {{ item }}
        </ElRadio>
      </ElRadioGroup>
    </div>
  </section>
  <section>
    <div class="my-3 flex justify-between items-center">
      <label class="text-title">{{ $t('script.output') }}</label>
    </div>
    <section class="h-40 bg-normal border border-b-0 px-0.5 pb-0.5 pt-3 border-border-default rounded-t">
      <MonacoEditor
        :value="resultString"
        :language="resultMonacoEditorLangugage"
        :options="{ lineNumbers: 'on', readOnly: true }"
        @update="resultString = $event"
      />
    </section>
    <div class="px-3 text-right bg-select-lang border border-t-0 border-border-default rounded-b">
      <ElRadioGroup v-model="resultPayloadType">
        <ElRadio v-for="item in payloadTypeList" :key="item" :value="item">
          {{ item }}
        </ElRadio>
      </ElRadioGroup>
    </div>
  </section>
</template>
