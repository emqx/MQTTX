import type { OutputFormat } from 'mqttx'
import { payloadConverter } from '@mqttx/core'

export function usePayloadConverter() {
  const payloadTypeList: OutputFormat[] = ['Plaintext', 'Base64', 'JSON', 'Hex']
  const payloadType = ref<OutputFormat>('JSON')
  const payloadString = ref<string>(JSON.stringify({ msg: 'hello' }, null, 2))
  const isReverting = ref(false)

  const payloadBuffer = computed(() => {
    try {
      return payloadConverter.toBuffer({
        payload: payloadString.value,
        payloadType: payloadType.value,
      })
    } catch (error) {
      if (error instanceof Error) {
        ElMessage({
          message: error.message,
          type: 'error',
          plain: true,
        })
      }
      return Buffer.alloc(0)
    }
  })

  const monacoEditorLangugage = computed(() => {
    if (['JSON'].includes(payloadType.value)) {
      return 'json'
    }
    return 'plaintext'
  })

  watch(payloadType, (newType, oldType) => {
    if (isReverting.value) {
      isReverting.value = false
      return
    }
    try {
      payloadString.value = payloadConverter.formatPayload({
        payload: payloadString.value,
        from: oldType,
        to: newType,
      })
    } catch (error) {
      if (error instanceof Error) {
        ElMessage({
          message: error.message,
          type: 'error',
          plain: true,
        })
      }
      isReverting.value = true
      payloadType.value = oldType
    }
  })

  return {
    payloadTypeList,
    payloadType,
    payloadString,
    payloadBuffer,
    monacoEditorLangugage,
  }
}
