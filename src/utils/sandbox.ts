import { VM } from 'vm2'

const executeScript = (
  script: string,
  payloadType: PayloadType,
  input: string,
  msgType: MessageType,
  index?: number,
): string => {
  const vm = new VM({
    timeout: 10000,
    allowAsync: false,
    eval: false,
    wasm: false,
  })

  // The helper and the inputs run inside the VM; no host callbacks or objects are exposed.
  vm.run(`
    const __mqttxString = String;
    globalThis.execute = (callback) => {
      const input = ${JSON.stringify(input)};
      const value = ${payloadType === 'JSON' ? 'JSON.parse(input)' : 'input'};
      return __mqttxString(callback(value, ${JSON.stringify(msgType)}, ${JSON.stringify(index)}));
    };
  `)

  let output: unknown
  try {
    output = vm.run(script)
  } catch (error) {
    // Convert the thrown value inside the VM so its toString stays under the timeout.
    let message = 'Script execution failed or exceeded the time limit.'
    vm.setGlobal('__mqttxError', error)
    try {
      message = vm.run('__mqttxString(__mqttxError)')
    } catch (conversionError) {
      // Keep the generic message when the VM cannot convert the thrown value.
    }
    throw new Error(message)
  }
  if ((typeof output === 'object' && output !== null) || typeof output === 'function') {
    throw new Error('Scripts must return a primitive value. Use execute(callback) to transform a payload.')
  }
  return String(output)
}

export default { executeScript }
