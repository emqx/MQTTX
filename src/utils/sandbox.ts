import { VM, VMScript } from 'vm2'

const executeScript = (
  script: string,
  payloadType: PayloadType,
  input: string,
  msgType: MessageType,
  index?: number,
): string => {
  let output = ''
  try {
    const vm = new VM({
      timeout: 10000,
      sandbox: {
        execute(callback: (value: any, msgType: MessageType, index?: number) => any) {
          let _inputValue = input
          if (payloadType === 'JSON' && typeof input === 'string') {
            _inputValue = JSON.parse(input)
          }
          let _output = callback(_inputValue, msgType, index)
          if (_output === undefined) {
            _output = 'undefined'
          } else if (_output === null) {
            _output = 'null'
          } else {
            _output = _output.toString()
          }
          return _output
        },
      },
      eval: false,
      wasm: false,
    })
    const _script = new VMScript(script)
    output = vm.run(_script)
    return output
  } catch (error) {
    // @ts-ignore
    output = error.toString()
    return output
  }
}

export default { executeScript }
