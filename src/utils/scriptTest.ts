import sandbox from '@/utils/sandbox'
import { checkProtobufInput } from './protobuf'
import { checkAvroInput } from './avro'

export const scriptTest = (
  script: string,
  scriptType: SchemaType | FunctionType,
  inputValue: string,
  inputType: PayloadType,
  config?: any,
): string => {
  switch (scriptType) {
    case 'javascript':
      return sandbox.executeScript(script, inputType, inputValue, 'publish')
    case 'protobuf':
      const protobufResult = checkProtobufInput(script, inputValue, config.name, inputType)
      return protobufResult
    case 'avro':
      const avroResult = checkAvroInput(script, inputValue, inputType)
      return avroResult
    default:
      return 'Test Error: Unsupported script type.'
  }
}
