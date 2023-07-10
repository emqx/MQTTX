import sandbox from '@/utils/sandbox'
import { checkProtobufInput } from './protobuf'

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
      const result = checkProtobufInput(script, inputValue, config.name, inputType)
      return !result ? '' : result.toString()
    default:
      return 'Test Error!'
  }
}
