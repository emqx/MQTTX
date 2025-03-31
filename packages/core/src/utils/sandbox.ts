import type { MessageType } from 'mqttx'
// eslint-disable-next-line unicorn/prefer-node-protocol
import { Buffer } from 'buffer'
import uvm from 'uvm'
import { jsonStringify } from './jsonUtils'

/**
 * Executes JavaScript code in a secure sandboxed environment
 *
 * Uses UVM to create an isolated execution environment to prevent potential security risks.
 * The sandbox restricts the script's execution context, providing access only to necessary message data.
 *
 * @throws Rejects the Promise with an error message if script execution fails
 */
export function executeScript(args: {
  script: string
  payload: string
  payloadRaw: Buffer
  messageType: MessageType
  sendCounter?: number
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    uvm.spawn(
      {
        bootCode: `
          bridge.on('runScript', function ({ script, payload, payloadRaw, messageType, sendCounter }) {
            try {
              function execute(callback) {
                const params = {
                  payload,
                  payloadRaw,
                  messageType,
                  sendCounter
                };
                return callback(params);
              };
              bridge.dispatch(
                'scriptResult', 
                Function('execute', 'params', script)(execute, {
                  payload,
                  payloadRaw,
                  messageType,
                  sendCounter
                })
              );
            } catch (error) {
              bridge.dispatch('scriptError', error.message);
            }
          });
        `,
        bootTimeout: 1000,
        dispatchTimeout: 1000,
      },
      (err: any, context: any) => {
        if (err) reject(err)

        context.on('scriptResult', (result: any) => {
          // Handle different types of results and ensure we return a proper Buffer
          if (Buffer.isBuffer(result)) {
            resolve(result)
          } else if (
            result
            && result.type === 'Buffer'
            && Array.isArray(result.data)
            // Check if object has only type and data properties (is pure Buffer)
            && Object.keys(result).length === 2
          ) {
            // Handle JSON serialized Buffer format
            resolve(Buffer.from(result.data))
          } else if (result instanceof Uint8Array) {
            // Handle Uint8Array result
            resolve(Buffer.from(result))
          } else {
            // Convert other types to string and then to Buffer
            let resultStr: string
            if (typeof result === 'object') {
              resultStr = jsonStringify(result, null, 2)
            } else {
              resultStr = String(result)
            }
            resolve(Buffer.from(resultStr))
          }
        })

        context.on('scriptError', (error?: string) => {
          reject(new Error(error))
        })

        context.dispatch('runScript', args)
      },
    )
  })
}
