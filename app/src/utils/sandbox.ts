import { VM, VMScript } from 'vm2'

const executeScript = (input: string | number, script: string, type: PayloadType): string => {
  let output = ''
  try {
    const vm = new VM({
      timeout: 10000,
      sandbox: {
        execute(callback: (value: any) => any) {
          let _inputValue = input
          if (type === 'JSON' && typeof input === 'string') {
            _inputValue = JSON.parse(input)
          }
          let _output = callback(_inputValue)
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
    output = error.toString()
    return output
  }
}

export default { executeScript }
