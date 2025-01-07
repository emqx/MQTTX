import type { PayloadType } from 'mqttx'
import { convertPayloadForDisplay, encodePayloadForSend } from '@mqttx/core'

export function usePayloadConverter() {
  const payloadTypeList: PayloadType[] = ['Plaintext', 'Base64', 'JSON', 'Hex', 'CBOR', 'MsgPack']
  const payloadType = ref<PayloadType>('JSON')
  const payloadString = ref<string>(JSON.stringify({ msg: 'hello' }, null, 2))
  const isReverting = ref(false)

  const monacoEditorLangugage = computed(() => {
    if (['CBOR', 'JSON', 'MsgPack'].includes(payloadType.value)) {
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
      payloadString.value = convertPayloadForDisplay(payloadString.value, oldType, newType)
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
    monacoEditorLangugage,
    convertPayloadForDisplay,
    encodePayloadForSend,
  }
}
