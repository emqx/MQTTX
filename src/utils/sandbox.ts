import { VM, VMScript } from 'vm2'

const executeScript = (
  script: string,
  payloadType: PayloadType,
  input: string,
  msgType: MessageType,
  index?: number,
): string => {
  // Validate the original program before embedding it in the error boundary below.
  new VMScript(script).compile()
  const vm = new VM({
    timeout: 10000,
    allowAsync: false,
    sandbox: { Promise: undefined },
    eval: false,
    wasm: false,
  })

  // Create the helper and parse inputs inside the VM; no host callbacks or objects are exposed.
  vm.run(
    new VMScript(`
      const __mqttxString = String;
      globalThis.execute = (callback) => {
        const input = ${JSON.stringify(input)};
        const value = ${payloadType === 'JSON' ? 'JSON.parse(input)' : 'input'};
        return __mqttxString(callback(value, ${JSON.stringify(msgType)}, ${JSON.stringify(index)}));
      };
    `),
  )
  // Catch user-thrown values while the timeout still applies. Only primitive errors cross out.
  const compiled = new VMScript(`
    try {
      ${script}
    } catch (__mqttxError) {
      throw __mqttxString(__mqttxError);
    }
  `).compile()

  let output: unknown
  try {
    output = vm.run(compiled)
  } catch (error) {
    // A timeout or a VM error is a host object; do not inspect arbitrary VM-thrown objects here.
    throw new Error(typeof error === 'string' ? error : 'Script execution failed or exceeded the time limit.')
  }
  if ((typeof output === 'object' && output !== null) || typeof output === 'function') {
    throw new Error('Scripts must return a primitive value. Use execute(callback) to transform a payload.')
  }
  return String(output)
}

export default { executeScript }
