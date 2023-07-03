import sandbox from '@/utils/sandbox'
import { checkProtobufInput } from './protobuf'

export const scriptTest = async (
  script: string,
  scriptType: SchemaType | FunctionType,
  inputValue: string,
  inputType: PayloadType,
  config?: any,
): Promise<string> => {
  switch (scriptType) {
    case 'javascript':
      return sandbox.executeScript(script, inputType, inputValue, 'publish')
    case 'protobuf':
      return await checkProtobufInput(script, inputValue, config.name, inputType, config.ctx)
    default:
      return 'Test Error!'
  }
}
