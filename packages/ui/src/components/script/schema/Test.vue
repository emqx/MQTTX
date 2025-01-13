<script setup lang="ts">
import type { ScriptSchema } from 'mqttx'
import { convertPayloadForDisplay, encodePayloadForSend, payloadCodec } from '@mqttx/core'

const props = defineProps<{
  currentCodec: ScriptSchema['codec']
  currentSchemaContent: ScriptSchema['content']
}>()

const { currentCodec, currentSchemaContent } = toRefs(props)
const { payloadTypeList, payloadType, payloadString, monacoEditorLangugage } = usePayloadConverter()

const {
  payloadType: resultPayloadType,
  payloadString: resultString,
  monacoEditorLangugage: resultMonacoEditorLangugage,
} = usePayloadConverter()

const messageName = ref('')

const defaultInput: Record<ScriptSchema['codec'], string> = {
  protobuf: JSON.stringify({ id: 123, name: 'John Doe' }, null, 2),
  avro: JSON.stringify({ id: 123, name: 'John Doe' }, null, 2),
}

watch(currentCodec, (value) => {
  payloadString.value = defaultInput[value]
  resultString.value = ''
  messageName.value = ''
}, { immediate: true })

function resetResults() {
  resultString.value = ''
  resultPayloadType.value = 'JSON'
}

resetResults()

const { t } = useI18n()

function handleTest(payload: string) {
  resetResults()
  try {
    if (currentCodec.value === 'protobuf' && messageName.value === '') {
      ElMessage({
        message: t('script.mustProtoName'),
        type: 'error',
        plain: true,
      })
      return
    }
    const { decode, encode } = payloadCodec[currentCodec.value]
    const buffer = decode({
      payload: encode({
        payload: encodePayloadForSend(payload, payloadType.value),
        schema: currentSchemaContent.value,
        messageName: messageName.value,
      }),
      schema: currentSchemaContent.value,
      messageName: messageName.value,
    })
    resultString.value = convertPayloadForDisplay(buffer.toString(), 'Plaintext', 'JSON')
  } catch (error) {
    if (error instanceof Error) {
      ElMessage({
        message: error.message,
        type: 'error',
        plain: true,
      })
    }
  }
}
</script>

<template>
  <section>
    <div class="my-3 flex justify-between items-center">
      <label class="text-title">{{ $t('script.input') }}</label>
      <div class="flex items-center gap-3">
        <ElInput
          v-if="currentCodec === 'protobuf'"
          v-model.trim="messageName"
          :placeholder="$t('script.protoName')"
          :label="$t('script.protoName')"
        />
        <ElButton
          type="primary"
          @click="handleTest(payloadString)"
        >
          {{ $t('script.test') }}
        </ElButton>
      </div>
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
